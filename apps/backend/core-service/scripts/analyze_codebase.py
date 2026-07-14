#!/usr/bin/env python3
"""
Production-Quality Codebase Analysis Tool
==========================================
Scans src/main and src/test separately, generates timestamped Markdown
reports grouped in a single directory, and JS data files consumed by the
interactive web dashboard at reports/analyze-codebase/index.html.

Architecture:
  Config            – language map, comment patterns, configurable exclusions
  LanguageDetector  – maps file extensions to human-readable language names
  LineClassifier    – stateful per-file line classifier (code/comment/blank)
  FileScanner       – reads and classifies every line of a single file
  DirectoryScanner  – walks a directory tree, prunes excluded dirs
  Aggregator        – merges raw per-file results into dir/lang/total buckets
  MarkdownReporter  – produces three Markdown documents (main, test, summary)
  JsExporter        – writes JS variable files for the web dashboard
  main()            – orchestration entry-point
"""

from __future__ import annotations
import json, os, re, sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any


# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
class Config:
    """Central configuration — extend here to support more languages."""

    EXCLUDED_DIRS: set[str] = {
        "node_modules", "build", "dist", ".git", "target", "__pycache__",
        ".gradle", ".idea", ".vscode",
        "generated-sources", "generated-test-sources",
    }
    EXCLUDE_HIDDEN_DIRS: bool = True

    LANGUAGE_MAP: dict[str, str] = {
        ".java": "Java", ".kt": "Kotlin", ".kts": "Kotlin",
        ".scala": "Scala", ".groovy": "Groovy",
        ".py": "Python",
        ".js": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
        ".ts": "TypeScript", ".tsx": "TypeScript", ".jsx": "JavaScript",
        ".html": "HTML", ".htm": "HTML",
        ".css": "CSS", ".scss": "SCSS", ".sass": "SCSS", ".less": "LESS",
        ".xml": "XML", ".yml": "YAML", ".yaml": "YAML",
        ".json": "JSON", ".sql": "SQL",
        ".properties": "Properties", ".cfg": "Config",
        ".conf": "Config", ".ini": "Config", ".toml": "TOML",
        ".gradle": "Gradle",
        ".sh": "Shell", ".bash": "Shell",
        ".bat": "Batch", ".cmd": "Batch", ".ps1": "PowerShell",
        ".rb": "Ruby", ".rs": "Rust", ".go": "Go",
        ".c": "C", ".cpp": "C++", ".cc": "C++",
        ".h": "C/C++ Header", ".hpp": "C/C++ Header",
        ".cs": "C#", ".php": "PHP", ".swift": "Swift",
        ".md": "Markdown", ".markdown": "Markdown",
        ".txt": "Text", ".iml": "XML",
    }

    # Comment syntax families
    COMMENT_PATTERNS: dict[str, dict] = {
        "__c_style__": {"line": "//",  "block_start": r"/\*", "block_end": r"\*/"},
        "__hash__":    {"line": "#"},
        "__sql__":     {"line": "--",  "block_start": r"/\*", "block_end": r"\*/"},
        "__xml__":     {               "block_start": r"<!--", "block_end": r"-->"},
    }

    COMMENT_FAMILY: dict[str, str] = {
        **{e: "__c_style__" for e in [
            ".java", ".kt", ".kts", ".scala", ".groovy",
            ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
            ".css", ".scss", ".sass", ".less",
            ".c", ".cpp", ".cc", ".h", ".hpp",
            ".cs", ".php", ".swift", ".go", ".rs", ".gradle",
        ]},
        **{e: "__hash__" for e in [
            ".py", ".sh", ".bash", ".rb", ".yml", ".yaml",
            ".properties", ".cfg", ".conf", ".ini", ".toml", ".ps1",
        ]},
        ".sql": "__sql__",
        **{e: "__xml__" for e in [".xml", ".html", ".htm", ".iml"]},
    }

    BINARY_EXTENSIONS: set[str] = {
        ".class", ".jar", ".war", ".ear", ".zip", ".tar", ".gz", ".rar",
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".exe", ".dll", ".so", ".dylib",
        ".ttf", ".otf", ".woff", ".woff2",
        ".mp3", ".mp4", ".avi", ".mov",
    }


# ─────────────────────────────────────────────
# LanguageDetector
# ─────────────────────────────────────────────
class LanguageDetector:
    def __init__(self, lmap: dict[str, str] = Config.LANGUAGE_MAP):
        self._m = lmap

    def detect(self, p: Path) -> str | None:
        return self._m.get(p.suffix.lower())

    def is_binary(self, p: Path) -> bool:
        return p.suffix.lower() in Config.BINARY_EXTENSIONS


# ─────────────────────────────────────────────
# LineClassifier
# ─────────────────────────────────────────────
class LineClassifier:
    """
    Stateful per-file classifier with multi-line block-comment tracking.

    Handles:
      - Single-line and block comments across all supported languages
      - Inline trailing comments (rest-of-line): line counted as code
      - Python triple-quoted docstrings treated as comment lines
      - Heuristic string-literal awareness to avoid false positives
    """
    def __init__(self, ext: str):
        self._ext = ext.lower()
        fam = Config.COMMENT_FAMILY.get(self._ext, "")
        self._pat = Config.COMMENT_PATTERNS.get(fam, {})
        self._in_block   = False
        self._in_pydoc   = False
        self._pydoc_delim = ""

    def classify(self, raw: str) -> str:
        """Return 'blank', 'comment', or 'code'."""
        s = raw.strip()
        if not s:
            return "blank"
        return self._py(s) if self._ext == ".py" else self._generic(s)

    def _py(self, s: str) -> str:
        if self._in_pydoc:
            if self._pydoc_delim in s:
                self._in_pydoc = False
            return "comment"
        for d in ('"""', "'''"):
            i = s.find(d)
            if i != -1:
                if s.find(d, i + 3) == -1:
                    self._in_pydoc = True
                    self._pydoc_delim = d
                return "comment"
        return "comment" if s.startswith("#") else "code"

    def _generic(self, s: str) -> str:
        bs = self._pat.get("block_start", "")
        be = self._pat.get("block_end",   "")
        lt = self._pat.get("line",        "")
        if self._in_block:
            if be and re.search(be, s):
                self._in_block = False
            return "comment"
        if bs:
            m = re.search(bs, s)
            if m and not self._instr(s, m.start()):
                if be and re.search(be, s[m.start():]):
                    return "comment"
                self._in_block = True
                return "comment"
        if lt:
            m = re.search(re.escape(lt), s)
            if m and not self._instr(s, m.start()):
                return "comment" if not s[: m.start()].strip() else "code"
        return "code"

    @staticmethod
    def _instr(line: str, pos: int) -> bool:
        """Heuristic: is position inside a string literal?"""
        seg = line[:pos].replace('\\"', "XX").replace("\\'", "XX")
        return (seg.count('"') % 2 == 1) or (seg.count("'") % 2 == 1)


# ─────────────────────────────────────────────
# FileScanner
# ─────────────────────────────────────────────
class FileScanner:
    def __init__(self, det: LanguageDetector):
        self._det = det

    def scan(self, fp: Path, base: Path) -> dict[str, Any] | None:
        if self._det.is_binary(fp):
            return None
        lang = self._det.detect(fp)
        if lang is None:
            return None
        try:
            text = fp.read_text(encoding="utf-8", errors="replace")
        except Exception as exc:
            print(f"  [WARN] {fp}: {exc}", file=sys.stderr)
            return None
        clf   = LineClassifier(fp.suffix.lower())
        blank = code = comment = 0
        lines = text.splitlines(keepends=True)
        for raw in lines:
            k = clf.classify(raw)
            if k == "blank":     blank   += 1
            elif k == "comment": comment += 1
            else:                code    += 1
        return {
            "path":          str(fp.relative_to(base)).replace("\\", "/"),
            "language":      lang,
            "extension":     fp.suffix.lower(),
            "total_lines":   len(lines),
            "code_lines":    code,
            "comment_lines": comment,
            "blank_lines":   blank,
        }


# ─────────────────────────────────────────────
# DirectoryScanner
# ─────────────────────────────────────────────
class DirectoryScanner:
    def __init__(self, base: Path, fs: FileScanner,
                 excl: set[str] = Config.EXCLUDED_DIRS,
                 hidden: bool   = Config.EXCLUDE_HIDDEN_DIRS):
        self._base   = base
        self._fs     = fs
        self._excl   = excl
        self._hidden = hidden

    def scan(self, root: Path) -> list[dict[str, Any]]:
        if not root.exists():
            print(f"  [WARN] Directory not found: {root}", file=sys.stderr)
            return []
        results = []
        for dp, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if self._ok(d)]
            for fn in files:
                m = self._fs.scan(Path(dp) / fn, self._base)
                if m:
                    results.append(m)
        return results

    def _ok(self, n: str) -> bool:
        return n not in self._excl and not (self._hidden and n.startswith("."))


# ─────────────────────────────────────────────
# Aggregator
# ─────────────────────────────────────────────
class Aggregator:
    def aggregate(self, fms: list[dict[str, Any]],
                  sec_root: Path, base: Path) -> dict[str, Any]:
        ov = {"file_count": 0, "directory_count": 0, "total_lines": 0,
              "code_lines": 0, "comment_lines": 0, "blank_lines": 0}
        lng: dict[str, dict] = defaultdict(
            lambda: {"file_count": 0, "total_lines": 0, "code_lines": 0,
                     "comment_lines": 0, "blank_lines": 0})
        drm: dict[str, dict] = defaultdict(
            lambda: {"file_count": 0, "total_lines": 0, "code_lines": 0,
                     "comment_lines": 0, "blank_lines": 0})
        dirs_seen: set[str] = set()
        sec_rel = sec_root.relative_to(base)

        for fm in fms:
            fp = Path(fm["path"])
            try:
                dr = str(fp.parent.relative_to(sec_rel)).replace("\\", "/")
            except ValueError:
                dr = str(fp.parent).replace("\\", "/")
            dirs_seen.add(dr)
            for k in ("total_lines", "code_lines", "comment_lines", "blank_lines"):
                ov[k] += fm[k]
                lng[fm["language"]][k] += fm[k]
                drm[dr][k] += fm[k]
            ov["file_count"] += 1
            lng[fm["language"]]["file_count"] += 1
            drm[dr]["file_count"] += 1

        ov["directory_count"] = len(dirs_seen)
        tot = ov["total_lines"] or 1

        languages = [
            {"name": n, **s, "percentage": round(s["total_lines"] / tot * 100, 2)}
            for n, s in sorted(lng.items(),
                               key=lambda kv: kv[1]["total_lines"], reverse=True)
        ]
        directories = [
            {"path": p, **s, "percentage": round(s["total_lines"] / tot * 100, 2)}
            for p, s in sorted(drm.items(),
                               key=lambda kv: kv[1]["total_lines"], reverse=True)
        ]
        ov["avg_loc_per_file"] = (
            round(ov["code_lines"] / ov["file_count"], 2) if ov["file_count"] else 0)
        ov["code_to_comment_ratio"] = (
            round(ov["code_lines"] / ov["comment_lines"], 2) if ov["comment_lines"] else 0)

        return {
            "overview":    ov,
            "languages":   languages,
            "directories": directories,
            "files":       sorted(fms, key=lambda f: f["total_lines"], reverse=True),
        }
    




# ─────────────────────────────────────────────
# MarkdownReporter
# ─────────────────────────────────────────────
class MarkdownReporter:

    def section_report(self, title: str, label: str,
                       data: dict[str, Any], ts: str) -> str:
        L: list[str] = []; a = L.append
        a(f"# Codebase Analysis \u2014 {title}")
        a(""); a(f"> **Generated:** {ts}  "); a(f"> **Section:** `{label}`")
        a(""); a("---"); a("")
        self._ov(L, data["overview"])
        self._lang(L, data["languages"])
        self._dirs(L, data["directories"])
        self._files(L, data["files"])
        a("---"); a("")
        a("*Report generated by BusMate Codebase Analysis Tool*")
        return "\n".join(L)

    def summary_report(self, main_data: dict, test_data: dict, ts: str) -> str:
        L: list[str] = []; a = L.append
        mo, to = main_data["overview"], test_data["overview"]
        ct = mo["total_lines"]   + to["total_lines"]
        cc = mo["code_lines"]    + to["code_lines"]
        cm = mo["comment_lines"] + to["comment_lines"]
        cb = mo["blank_lines"]   + to["blank_lines"]
        cf = mo["file_count"]    + to["file_count"]
        cd = mo["directory_count"] + to["directory_count"]

        a("# Codebase Analysis \u2014 Overall Summary")
        a(""); a(f"> **Generated:** {ts}"); a(""); a("---"); a("")

        a("## 1. Main Source Code Analysis (`src/main`)"); a("")
        self._ov(L, mo); self._lang(L, main_data["languages"])
        a("---"); a("")
        a("## 2. Test Code Analysis (`src/test`)"); a("")
        self._ov(L, to); self._lang(L, test_data["languages"])
        a("---"); a("")
        a("## 3. Overall Summary"); a("")

        a("### 3.1 Aggregated Metrics"); a("")
        a("| Metric | `src/main` | `src/test` | **Total** |")
        a("|--------|:----------:|:---------:|:------:|")
        a(f"| Files         | {mo['file_count']} | {to['file_count']} | **{cf}** |")
        a(f"| Directories   | {mo['directory_count']} | {to['directory_count']} | **{cd}** |")
        a(f"| Total Lines   | {mo['total_lines']:,} | {to['total_lines']:,} | **{ct:,}** |")
        a(f"| Code Lines    | {mo['code_lines']:,} | {to['code_lines']:,} | **{cc:,}** |")
        a(f"| Comment Lines | {mo['comment_lines']:,} | {to['comment_lines']:,} | **{cm:,}** |")
        a(f"| Blank Lines   | {mo['blank_lines']:,} | {to['blank_lines']:,} | **{cb:,}** |")
        a("")

        ratio = round(to["code_lines"] / mo["code_lines"] * 100, 1) if mo["code_lines"] else 0
        a("### 3.2 Code Distribution"); a("")
        a(f"- **Production code share:** {self._pct(mo['code_lines'], cc):.1f}%")
        a(f"- **Test code share:** {self._pct(to['code_lines'], cc):.1f}%")
        a(f"- **Test-to-production code ratio:** {ratio:.1f}%"); a("")

        a("### 3.3 Code Health Insights"); a("")
        a("| Indicator | `src/main` | `src/test` | Combined |")
        a("|-----------|:----------:|:---------:|:-------:|")
        avg_c = round((mo["avg_loc_per_file"] + to["avg_loc_per_file"]) / 2, 1)
        cc_r  = round(cc / cm, 2) if cm else "N/A"
        a(f"| Avg LOC / File        | {mo['avg_loc_per_file']} | {to['avg_loc_per_file']} | {avg_c} |")
        a(f"| Code-to-comment ratio | {mo['code_to_comment_ratio']} | {to['code_to_comment_ratio']} | {cc_r} |")
        a(f"| Comment coverage (%)  | {self._pct(mo['comment_lines'],mo['code_lines']):.1f}% | "
          f"{self._pct(to['comment_lines'],to['code_lines']):.1f}% | {self._pct(cm, cc):.1f}% |")
        a("")

        a("### 3.4 Observations"); a("")
        for obs in self._observations(mo, to, cc, cm):
            a(f"- {obs}")
        a("")

        a("### 3.5 Combined Language Statistics"); a("")
        ml = self._merge_langs(main_data["languages"], test_data["languages"], ct)
        a("| Language | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | % of Total |")
        a("|----------|------:|------------:|-----------:|--------------:|------------:|-----------:|")
        for lg in ml:
            a(f"| {lg['name']} | {lg['file_count']} | {lg['total_lines']:,} | "
              f"{lg['code_lines']:,} | {lg['comment_lines']:,} | {lg['blank_lines']:,} | "
              f"{lg['percentage']:.1f}% |")
        a("")
        a("---"); a("")
        a("*Report generated by BusMate Codebase Analysis Tool*")
        return "\n".join(L)

    # ── Internal section writers ──────────────────────────────────────────
    def _ov(self, L: list[str], ov: dict) -> None:
        a = L.append; a("### Overview"); a("")
        a("| Metric | Value |"); a("|--------|------:|")
        a(f"| Total Files           | {ov['file_count']} |")
        a(f"| Total Directories     | {ov['directory_count']} |")
        a(f"| Total Lines           | {ov['total_lines']:,} |")
        a(f"| Code Lines            | {ov['code_lines']:,} ({self._pct(ov['code_lines'],ov['total_lines']):.1f}%) |")
        a(f"| Comment Lines         | {ov['comment_lines']:,} ({self._pct(ov['comment_lines'],ov['total_lines']):.1f}%) |")
        a(f"| Blank Lines           | {ov['blank_lines']:,} ({self._pct(ov['blank_lines'],ov['total_lines']):.1f}%) |")
        a(f"| Avg LOC / File        | {ov['avg_loc_per_file']} |")
        a(f"| Code-to-Comment Ratio | {ov['code_to_comment_ratio']} |"); a("")

    def _lang(self, L: list[str], langs: list[dict]) -> None:
        a = L.append; a("### Language Breakdown"); a("")
        a("| Language | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | % of Section |")
        a("|----------|------:|------------:|-----------:|--------------:|------------:|-------------:|")
        for lg in langs:
            a(f"| {lg['name']} | {lg['file_count']} | {lg['total_lines']:,} | "
              f"{lg['code_lines']:,} | {lg['comment_lines']:,} | {lg['blank_lines']:,} | "
              f"{lg['percentage']:.1f}% |")
        a("")

    def _dirs(self, L: list[str], dirs: list[dict]) -> None:
        a = L.append; a("### Directory Breakdown"); a("")
        a("| Directory | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | % |")
        a("|-----------|------:|------------:|-----------:|--------------:|------------:|--:|")
        for d in dirs:
            a(f"| `{d['path']}` | {d['file_count']} | {d['total_lines']:,} | "
              f"{d['code_lines']:,} | {d['comment_lines']:,} | {d['blank_lines']:,} | "
              f"{d['percentage']:.1f}% |")
        a("")

    def _files(self, L: list[str], files: list[dict]) -> None:
        a = L.append; a("### File Breakdown (Top 30 by Total Lines)"); a("")
        a("| File | Language | Total Lines | Code Lines | Comment Lines | Blank Lines |")
        a("|------|----------|------------:|-----------:|--------------:|------------:|")
        for fm in files[:30]:
            a(f"| `{fm['path']}` | {fm['language']} | {fm['total_lines']:,} | "
              f"{fm['code_lines']:,} | {fm['comment_lines']:,} | {fm['blank_lines']:,} |")
        a("")

    # ── Helpers ──────────────────────────────────────────────────────────
    @staticmethod
    def _pct(p: float, w: float) -> float:
        return p / w * 100 if w else 0.0

    @staticmethod
    def _merge_langs(ml: list[dict], tl: list[dict], total: int) -> list[dict]:
        m: dict[str, dict] = {}
        for src in (ml, tl):
            for lg in src:
                n = lg["name"]
                if n not in m:
                    m[n] = {"name": n, "file_count": 0, "total_lines": 0,
                            "code_lines": 0, "comment_lines": 0, "blank_lines": 0}
                for k in ("file_count", "total_lines", "code_lines",
                          "comment_lines", "blank_lines"):
                    m[n][k] += lg[k]
        t = total or 1
        return sorted(
            [{"percentage": round(v["total_lines"] / t * 100, 2), **v}
             for v in m.values()],
            key=lambda x: x["total_lines"], reverse=True,
        )

    @staticmethod
    def _observations(mo: dict, to: dict, cc: int, cm: int) -> list[str]:
        obs: list[str] = []
        cov = cm / cc * 100 if cc else 0
        if cov < 10:
            obs.append(f"Comment coverage is **{cov:.1f}%** — consider adding more documentation.")
        elif cov > 40:
            obs.append(f"Comment coverage is **{cov:.1f}%** — very well-documented codebase.")
        else:
            obs.append(f"Comment coverage is **{cov:.1f}%** — within a healthy range.")
        ratio = to["code_lines"] / mo["code_lines"] if mo["code_lines"] else 0
        if ratio < 0.3:
            obs.append(f"Test-to-production ratio is **{ratio:.2f}** — consider expanding test coverage.")
        elif ratio >= 0.8:
            obs.append(f"Excellent test-to-production ratio of **{ratio:.2f}**.")
        else:
            obs.append(f"Test-to-production code ratio is **{ratio:.2f}** — moderate coverage.")
        if mo["avg_loc_per_file"] > 300:
            obs.append(
                f"Average file length in `src/main` is **{mo['avg_loc_per_file']}** lines "
                "— consider splitting large files.")
        return obs or ["No significant observations."]


# ─────────────────────────────────────────────
# JsExporter  — JS variable files for the dashboard (no web server needed)
# ─────────────────────────────────────────────
class JsExporter:
    def __init__(self, data_dir: Path):
        self._dir = data_dir
        self._dir.mkdir(parents=True, exist_ok=True)

    def export(self, ts: str, slug: str,
               main_data: dict, test_data: dict) -> Path:
        payload = {
            "timestamp": ts,
            "main":      main_data,
            "test":      test_data,
            "summary":   self._build_summary(main_data, test_data),
        }
        out = self._dir / f"report_{slug}.js"
        out.write_text(
            "/* Auto-generated — do not edit */\n"
            "window.__BUSMATE_REPORTS__ = window.__BUSMATE_REPORTS__ || {};\n"
            f"window.__BUSMATE_REPORTS__['{ts}'] =\n"
            + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
            encoding="utf-8",
        )
        return out

    def update_manifest(self, ts: str, slug: str, rf: Path) -> None:
        mp = self._dir / "manifest.js"
        entries: list[dict] = []
        if mp.exists():
            m = re.search(
                r"window\.__BUSMATE_MANIFEST__\s*=\s*(\[.*?\]);",
                mp.read_text(encoding="utf-8"), re.DOTALL)
            if m:
                try:
                    entries = json.loads(m.group(1))
                except json.JSONDecodeError:
                    entries = []
        entries = [e for e in entries if e.get("timestamp") != ts]
        entries.insert(0, {"timestamp": ts, "slug": slug, "file": rf.name})
        mp.write_text(
            "/* Auto-generated manifest — do not edit */\n"
            "window.__BUSMATE_MANIFEST__ =\n"
            + json.dumps(entries[:50], ensure_ascii=False, indent=2) + ";\n",
            encoding="utf-8",
        )

    # ── Summary payload ───────────────────────────────────────────────────
    @staticmethod
    def _build_summary(main_data: dict, test_data: dict) -> dict:
        mo, to = main_data["overview"], test_data["overview"]
        def pct(p: float, w: float) -> float:
            return round(p / w * 100, 2) if w else 0.0
        cc = mo["code_lines"]    + to["code_lines"]
        cm = mo["comment_lines"] + to["comment_lines"]
        ct = mo["total_lines"]   + to["total_lines"]

        merged: dict[str, dict] = {}
        for src in (main_data["languages"], test_data["languages"]):
            for lg in src:
                k = lg["name"]
                if k not in merged:
                    merged[k] = {"name": k, "file_count": 0, "total_lines": 0,
                                 "code_lines": 0, "comment_lines": 0, "blank_lines": 0}
                for f in ("file_count", "total_lines", "code_lines",
                          "comment_lines", "blank_lines"):
                    merged[k][f] += lg[f]
        cl = sorted(merged.values(), key=lambda l: l["total_lines"], reverse=True)
        for lg in cl:
            lg["percentage"] = pct(lg["total_lines"], ct)

        return {
            "combined_overview": {
                "file_count":           mo["file_count"] + to["file_count"],
                "directory_count":      mo["directory_count"] + to["directory_count"],
                "total_lines":          ct,
                "code_lines":           cc,
                "comment_lines":        cm,
                "blank_lines":          mo["blank_lines"] + to["blank_lines"],
                "avg_loc_per_file":     round((mo["avg_loc_per_file"] + to["avg_loc_per_file"]) / 2, 2),
                "code_to_comment_ratio":round(cc / cm, 2) if cm else 0,
            },
            "combined_languages":  cl,
            "main_comment_pct":   pct(mo["comment_lines"], mo["code_lines"]),
            "test_comment_pct":   pct(to["comment_lines"], to["code_lines"]),
            "overall_comment_pct":pct(cm, cc),
            "test_to_prod_ratio": pct(to["code_lines"], mo["code_lines"]),
            "main_code_pct":      pct(mo["code_lines"], cc),
            "test_code_pct":      pct(to["code_lines"], cc),
        }


# ─────────────────────────────────────────────
# main
# ─────────────────────────────────────────────
def main() -> None:
    script_dir   = Path(__file__).resolve().parent
    project_root = script_dir.parent

    now       = datetime.now()
    ts        = now.strftime("%Y-%m-%d %H:%M:%S")
    slug      = now.strftime("%Y%m%d_%H%M%S")

    report_dir = project_root / "reports" / "analyze-codebase" / slug
    data_dir   = project_root / "reports" / "analyze-codebase" / "data"
    report_dir.mkdir(parents=True, exist_ok=True)

    print("BusMate Codebase Analysis Tool")
    print("================================")
    print(f"Project root : {project_root}")
    print(f"Slug         : {slug}")
    print(f"Output dir   : {report_dir}")
    print()

    det = LanguageDetector()
    fs  = FileScanner(det)
    ds  = DirectoryScanner(project_root, fs)
    agg = Aggregator()
    mdr = MarkdownReporter()
    jse = JsExporter(data_dir)

    src_main = project_root / "src" / "main"
    src_test = project_root / "src" / "test"

    print("Scanning src/main ...")
    main_files = ds.scan(src_main)
    main_data  = agg.aggregate(main_files, src_main, project_root)
    mo = main_data["overview"]
    print(f"  {mo['file_count']} files | {mo['code_lines']:,} code lines | "
          f"{mo['comment_lines']:,} comment lines | {mo['directory_count']} dirs")

    print("Scanning src/test ...")
    test_files = ds.scan(src_test)
    test_data  = agg.aggregate(test_files, src_test, project_root)
    to = test_data["overview"]
    print(f"  {to['file_count']} files | {to['code_lines']:,} code lines | "
          f"{to['comment_lines']:,} comment lines | {to['directory_count']} dirs")

    print()
    print("Writing Markdown reports ...")
    paths = {
        "main":    report_dir / "main.md",
        "test":    report_dir / "test.md",
        "summary": report_dir / "summary.md",
    }
    paths["main"].write_text(
        mdr.section_report("Main Source Code", "src/main", main_data, ts),
        encoding="utf-8")
    paths["test"].write_text(
        mdr.section_report("Test Code", "src/test", test_data, ts),
        encoding="utf-8")
    paths["summary"].write_text(
        mdr.summary_report(main_data, test_data, ts),
        encoding="utf-8")
    for k, p in paths.items():
        print(f"  OK  {p.relative_to(project_root)}")

    print("Writing dashboard data ...")
    rjs = jse.export(ts, slug, main_data, test_data)
    jse.update_manifest(ts, slug, rjs)
    print(f"  OK  {rjs.relative_to(project_root)}")
    print(f"  OK  {data_dir.relative_to(project_root)}/manifest.js")

    tc = mo["code_lines"]    + to["code_lines"]
    tm = mo["comment_lines"] + to["comment_lines"]
    tb = mo["blank_lines"]   + to["blank_lines"]
    tf = mo["file_count"]    + to["file_count"]
    tl = mo["total_lines"]   + to["total_lines"]

    print()
    print("Analysis complete!")
    print(f"  Total files     : {tf}")
    print(f"  Total lines     : {tl:,}")
    print(f"  Code lines      : {tc:,}")
    print(f"  Comment lines   : {tm:,}")
    print(f"  Blank lines     : {tb:,}")
    print()
    print("Open the dashboard:")
    print(f"  {project_root / 'reports' / 'analyze-codebase' / 'index.html'}")


if __name__ == "__main__":
    main()


