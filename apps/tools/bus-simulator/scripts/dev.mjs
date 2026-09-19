// Runs the simulator server and the Vite console together; extra args go to the server.
import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['src/server/main.ts', ...process.argv.slice(2)], { stdio: 'inherit' }),
  spawn(process.execPath, ['../../../node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
const stop = () => children.forEach((c) => c.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', (code) => { stop(); process.exit(code ?? 0); });
