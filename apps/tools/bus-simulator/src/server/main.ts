import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PLAYBACK_SPEEDS } from '../shared/protocol.ts';
import { DEMO_DEVICES } from './devices.ts';
import { GatewayClient } from './gateway.ts';
import { createHttpServer } from './http.ts';
import { Runner } from './runner.ts';

const { values: args } = parseArgs({
  options: {
    gateway: { type: 'string' },
    host: { type: 'string' },
    port: { type: 'string' },
    route: { type: 'string' },
    device: { type: 'string' },
    seed: { type: 'string' },
    playback: { type: 'string' },
    'no-stream': { type: 'boolean' },
    help: { type: 'boolean' },
  },
});

if (args.help) {
  console.log(`Usage: node src/server/main.ts [options]

  --gateway <url>   api-gateway base URL            (default http://localhost:8080, env BUS_SIM_GATEWAY)
  --host <host>     console bind address           (default 127.0.0.1, env BUS_SIM_HOST)
  --port <port>     console port                   (default 4600, env BUS_SIM_PORT)
  --route <uuid>    core-service route to drive    (default Colombo Fort → Kandy demo route)
  --device <serial> demo tracker to report as      (default ${DEMO_DEVICES[0].serial}; one of ${DEMO_DEVICES.map((d) => d.serial).join(', ')})
  --seed <int>      model seed                     (default 1)
  --playback <n>    starting playback speed        (default 1; one of ${PLAYBACK_SPEEDS.join(', ')})
  --no-stream       do not watch the platform's live stream

The platform view signs in to the gateway's staff-only live stream with BUS_SIM_STREAM_EMAIL and
BUS_SIM_STREAM_PASSWORD, defaulting to the dev-seed MOT account.`);
  process.exit(0);
}

const env = process.env;
const gateway = new GatewayClient(args.gateway ?? env.BUS_SIM_GATEWAY ?? 'http://localhost:8080');
const host = args.host ?? env.BUS_SIM_HOST ?? '127.0.0.1';
const port = Number(args.port ?? env.BUS_SIM_PORT ?? 4600);
const playback = Number(args.playback ?? 1);
if (!(PLAYBACK_SPEEDS as readonly number[]).includes(playback)) {
  console.error(`--playback must be one of ${PLAYBACK_SPEEDS.join(', ')}`);
  process.exit(1);
}

let runner: Runner;
try {
  runner = await Runner.create({
    gateway,
    // Colombo Fort → Kandy in the dev seed (docs/dev-seed-contract.md, "Demo routes").
    routeId: args.route ?? env.BUS_SIM_ROUTE ?? '00000000-0000-0000-0000-000000010101',
    deviceSerial: args.device ?? env.BUS_SIM_DEVICE ?? DEMO_DEVICES[0].serial,
    seed: Number(args.seed ?? env.BUS_SIM_SEED ?? 1),
    playback,
    // The dev-seed MOT account (docs/dev-seed-credentials.md). Only meaningful against a dev stack.
    streamCredentials: args['no-stream']
      ? null
      : { email: env.BUS_SIM_STREAM_EMAIL ?? 'mot@busmate.test', password: env.BUS_SIM_STREAM_PASSWORD ?? 'Mot@2026' },
  });
} catch (error) {
  console.error(`Could not start: ${error instanceof Error ? error.message : error}`);
  console.error(`Is api-gateway reachable at ${gateway.baseUrl}, with core-service behind it?`);
  process.exit(1);
}

const staticDir = join(dirname(fileURLToPath(import.meta.url)), '../../dist/console');
const server = createHttpServer(runner, gateway, staticDir);
server.listen(port, host, () => {
  runner.start();
  console.log(`bus-simulator: console API on http://${host}:${port}, reporting to ${gateway.baseUrl}`);
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.warn('bus-simulator: listening beyond this machine — anyone who can reach it can drive the bus.');
  }
});

let stopping = false;
const shutdown = () => {
  if (stopping) process.exit(1); // a second Ctrl+C means "now"
  stopping = true;
  server.close();
  void runner.retire().finally(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
