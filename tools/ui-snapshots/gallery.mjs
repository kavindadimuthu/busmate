import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Groups captured entries by app, then by role, mirroring the route tree so this doubles as a visual sitemap. */
export function buildGallery(outputDir, manifest) {
  const byApp = new Map();
  for (const entry of manifest) {
    if (!byApp.has(entry.app)) byApp.set(entry.app, []);
    byApp.get(entry.app).push(entry);
  }

  const captured = manifest.filter((m) => m.status === 'captured').length;
  const skipped = manifest.filter((m) => m.status === 'skipped');

  const sections = [...byApp.entries()].map(([app, entries]) => {
    const byRole = new Map();
    for (const e of entries) {
      const role = e.role ?? 'public';
      if (!byRole.has(role)) byRole.set(role, []);
      byRole.get(role).push(e);
    }
    const roleBlocks = [...byRole.entries()].map(([role, es]) => `
      <h3>${esc(role)}</h3>
      <div class="grid">
        ${es.map((e) => e.status === 'captured'
          ? `<figure><a href="${esc(e.file)}" target="_blank"><img loading="lazy" src="${esc(e.file)}" alt="${esc(e.route)}"></a><figcaption>${esc(e.route)}</figcaption></figure>`
          : `<figure class="skipped"><div class="placeholder">skipped</div><figcaption>${esc(e.route)}<br><small>${esc(e.reason)}</small></figcaption></figure>`,
        ).join('\n')}
      </div>`).join('\n');
    return `<section><h2>${esc(app)}</h2>${roleBlocks}</section>`;
  }).join('\n');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>BusMate UI snapshots</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #0b0d12; color: #e6e6e6; }
  h1 { font-size: 1.3rem; }
  h2 { border-bottom: 1px solid #333; padding-bottom: 4px; margin-top: 40px; }
  h3 { color: #9aa; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .summary { color: #9aa; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px; }
  figure { margin: 0; background: #161a22; border-radius: 8px; overflow: hidden; border: 1px solid #262b36; }
  figure img { width: 100%; display: block; border-bottom: 1px solid #262b36; }
  figcaption { padding: 6px 8px; font-size: 0.8rem; font-family: monospace; color: #cdd; }
  figure.skipped .placeholder { aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; color: #665; background: #1a1a1a; }
  figcaption small { color: #886; }
</style></head>
<body>
  <h1>BusMate UI snapshots</h1>
  <div class="summary">${captured} captured, ${skipped.length} skipped &middot; ${new Date().toLocaleString()}</div>
  ${sections}
</body></html>`;

  writeFileSync(resolve(outputDir, 'index.html'), html);
}
