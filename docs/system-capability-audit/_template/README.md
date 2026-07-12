# S{N} — {Section name}

> Section index. Copy the whole `_template/` directory to `sections/S{N}-{slug}/` to start.
> Follow the workflow in [../../README.md](../../README.md). Capture from **code + live behaviour
> first**, docs second. Never mark 🟢 without ✅ evidence.

**Maturity summary:** 🟢/🟡/🔴 — one-paragraph verdict for the whole section.

**Scope (owns):** …
**Out of scope (owned elsewhere):** … → S{x}
**Code roots:** `path/...`
**Source docs:** `docs/...`
**Live-verify how:** the exact flow to drive (login as X → do Y → observe Z).

## Files in this section

| File | Stage | Contents |
|------|-------|----------|
| [current-state.md](current-state.md) | Capture | class diagram, data model/ER, state machine, API surface |
| [workflows.md](workflows.md) | Capture | one sequence diagram per current workflow |
| [capabilities.md](capabilities.md) | Capture | capability inventory (C-S{N}-xx) |
| [gaps-and-improvements.md](gaps-and-improvements.md) | Identify + Analyze | gaps (G-S{N}-xx) → improvements (I-S{N}-xx) |
| [backlog.md](backlog.md) | Prioritize + Manage | ranked, status-tracked |

## Section maturity table

| Capability | Maturity | Evidence |
|---|---|---|
| C-S{N}-01 … | 🟢/🟡/🔴 | ✅/🔎 |

## Capture progress

- [ ] current-state (diagrams)
- [ ] workflows (sequences)
- [ ] capabilities inventory
- [ ] gaps identified + analyzed
- [ ] backlog seeded + escalations pushed to root roll-up
