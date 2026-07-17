// Validation suite for the IoT event schemas (IoT Platform Layer plan, Phase 0). Runs on Node's
// built-in test runner: `node --test`. Proves the schemas actually accept the canonical valid
// examples and reject malformed ones, and that every event's payload validates against the payload
// schema its eventType/schemaVersion selects — the same contract telemetry-service enforces at
// ingest (and rejects to the DLQ on failure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const envelopeSchema = readJson(join(root, 'schemas', 'envelope.v1.json'));
const payloadSchemas = {
  'location.v1': readJson(join(root, 'schemas', 'location.v1.json')),
  'device-status.v1': readJson(join(root, 'schemas', 'device-status.v1.json')),
};

const validateEnvelope = ajv.compile(envelopeSchema);
const validatePayload = Object.fromEntries(
  Object.entries(payloadSchemas).map(([k, s]) => [k, ajv.compile(s)]),
);

function payloadKey(event) {
  return `${event.eventType}.v${event.schemaVersion}`;
}

test('every schema compiles', () => {
  assert.ok(validateEnvelope);
  for (const key of Object.keys(payloadSchemas)) assert.ok(validatePayload[key]);
});

test('valid examples pass envelope + matching payload schema', () => {
  const dir = join(root, 'examples', 'valid');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length > 0, 'expected valid example fixtures');

  for (const file of files) {
    const event = readJson(join(dir, file));
    assert.ok(validateEnvelope(event), `${file}: envelope invalid: ${ajv.errorsText(validateEnvelope.errors)}`);

    const key = payloadKey(event);
    const validator = validatePayload[key];
    assert.ok(validator, `${file}: no payload schema registered for ${key}`);
    assert.ok(validator(event.payload), `${file}: payload invalid: ${ajv.errorsText(validator.errors)}`);
  }
});

test('invalid envelope example is rejected (missing required fields + bad adapter)', () => {
  const event = readJson(join(root, 'examples', 'invalid', 'envelope-missing-fields.json'));
  assert.ok(!validateEnvelope(event), 'expected envelope validation to fail');
});

test('invalid location payload is rejected (latitude out of range)', () => {
  const event = readJson(join(root, 'examples', 'invalid', 'location-bad-coords.json'));
  // Envelope itself is well-formed here; the payload is what must fail.
  assert.ok(validateEnvelope(event), 'envelope of the bad-coords fixture should be structurally valid');
  const validator = validatePayload[payloadKey(event)];
  assert.ok(!validator(event.payload), 'expected location payload validation to fail for lat=200');
});
