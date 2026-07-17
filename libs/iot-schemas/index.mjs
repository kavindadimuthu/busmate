// Programmatic access to the IoT event schemas for JS/TS consumers (api-gateway SSE layer, tools,
// device simulator). Java services load the same JSON files from the classpath or a build copy.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(root, 'schemas', name), 'utf8'));

export const envelopeSchema = load('envelope.v1.json');

// Keyed by `${eventType}.v${schemaVersion}` — the discriminator an envelope carries.
export const payloadSchemas = {
  'location.v1': load('location.v1.json'),
  'device-status.v1': load('device-status.v1.json'),
};

export const TOPICS = {
  telemetry: 'iot.telemetry.v1',
  deviceStatus: 'iot.device-status.v1',
  dlq: 'iot.telemetry.dlq.v1',
};
