#!/usr/bin/env node
// One command for UI snapshots: a fresh throwaway stack (unless --no-stack), every discovered route across
// every app (unless scoped), screenshots saved, gallery built, stack torn down (unless --keep-stack).
//
//   node tools/ui-snapshots/run.mjs                         everything, every web app
//   node tools/ui-snapshots/run.mjs --app=new-react-portal   one app, all its discovered routes
//   node tools/ui-snapshots/run.mjs --keep-stack             leave the stack up afterwards, for a re-run
//   node tools/ui-snapshots/run.mjs --no-stack               assume the stack is already up (from a previous --keep-stack)
//   node tools/ui-snapshots/run.mjs --headed                 watch it capture, for debugging a login/route issue
import { APPS } from './apps.mjs';
import { start, stop, BASE_URLS } from './stack.mjs';
import { capture } from './capture.mjs';
import { buildGallery } from './gallery.mjs';

const args = new Set(process.argv.slice(2));
const flag = (name) => [...args].find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const requestedApps = flag('app')?.split(',') ?? Object.keys(APPS);
const useStack = !args.has('--no-stack');
const keepStack = args.has('--keep-stack');
const headed = args.has('--headed');

for (const a of requestedApps) {
  if (!APPS[a]) { console.error(`unknown app "${a}"; known apps: ${Object.keys(APPS).join(', ')}`); process.exit(2); }
}

async function main() {
  if (useStack) await start();
  try {
    console.log(`\ncapturing: ${requestedApps.join(', ')}`);
    const { outputDir, manifest } = await capture({ apps: requestedApps, baseUrls: BASE_URLS, headed });
    buildGallery(outputDir, manifest);
    const captured = manifest.filter((m) => m.status === 'captured').length;
    const skipped = manifest.filter((m) => m.status === 'skipped');
    console.log(`\n${captured} captured, ${skipped.length} skipped`);
    if (skipped.length) console.log(skipped.map((s) => `  skipped ${s.app}${s.route} — ${s.reason}`).join('\n'));
    console.log(`\ngallery: file://${outputDir}/index.html`);
  } finally {
    if (useStack && !keepStack) stop();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
