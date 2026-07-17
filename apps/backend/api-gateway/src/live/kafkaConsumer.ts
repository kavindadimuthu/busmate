import { Kafka, type Consumer } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { liveState } from './liveState';

/**
 * Consumes the telemetry pipeline's Kafka topics (IoT Platform Layer plan, Phase 3) and feeds
 * {@link liveState}, which the SSE route (`live.routes.ts`) serves to browsers. This is the one
 * place in api-gateway that talks to Kafka directly — everything else in the gateway is HTTP
 * proxying/BFF.
 *
 * Envelope shape mirrors telemetry-service's `EventEnvelope` (Java record) exactly — see
 * `apps/backend/telemetry-service/.../ingest/EventEnvelope.java` — since both device-originated
 * events (Phase 2 ingest) and server-originated ones (Phase 3's FleetHealthMonitorJob) publish the
 * same envelope shape.
 */

const TELEMETRY_TOPIC = 'iot.telemetry.v1';
const DEVICE_STATUS_TOPIC = 'iot.device-status.v1';
const CONSUMER_GROUP_ID = 'api-gateway-live';

interface EventEnvelope {
  envelopeVersion: number;
  eventId: string;
  eventType: string;
  schemaVersion: number;
  deviceId: string;
  busId: string | null;
  tripId: string | null;
  deviceTimestamp: string | null;
  ingestedAt: string;
  sequenceNo: number | null;
  source: { adapter: string; gateway: string };
  payload: Record<string, unknown>;
}

let consumer: Consumer | null = null;

export async function startLiveConsumer(): Promise<void> {
  const kafka = new Kafka({
    clientId: 'api-gateway-live',
    brokers: [env.KAFKA_BOOTSTRAP_SERVERS],
    // Route kafkajs's own internal logging through pino so it doesn't bypass the gateway's
    // structured logging (and isn't silent when something's actually wrong).
    logCreator: () => (entry) => {
      logger.debug({ namespace: entry.namespace, level: entry.level }, entry.log.message);
    },
  });

  consumer = kafka.consumer({ groupId: CONSUMER_GROUP_ID });

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: [TELEMETRY_TOPIC, DEVICE_STATUS_TOPIC], fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        try {
          const envelope: EventEnvelope = JSON.parse(message.value.toString());
          handleEnvelope(topic, envelope);
        } catch (err) {
          logger.warn({ err, topic }, 'Failed to parse live-telemetry Kafka message');
        }
      },
    });
    logger.info({ topics: [TELEMETRY_TOPIC, DEVICE_STATUS_TOPIC] }, 'Live-tracking Kafka consumer started');
  } catch (err) {
    // Best-effort: a broker that isn't up yet (or ever, in an environment that doesn't need the
    // live-map feature) shouldn't crash the whole gateway — proxying/auth/BFF work fine without
    // this. The SSE route just never emits anything beyond an empty initial snapshot.
    logger.warn({ err }, 'Live-tracking Kafka consumer failed to start; live map will show no data');
  }
}

function handleEnvelope(topic: string, envelope: EventEnvelope): void {
  if (topic === TELEMETRY_TOPIC && envelope.eventType === 'location' && envelope.busId) {
    const payload = envelope.payload as { lat?: number; lng?: number; speedKmh?: number; headingDeg?: number };
    if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') return;
    liveState.updateBusPosition({
      busId: envelope.busId,
      deviceId: envelope.deviceId,
      tripId: envelope.tripId,
      lat: payload.lat,
      lng: payload.lng,
      speedKmh: payload.speedKmh ?? null,
      headingDeg: payload.headingDeg ?? null,
      deviceTimestamp: envelope.deviceTimestamp,
      ingestedAt: envelope.ingestedAt,
    });
    return;
  }

  if (topic === DEVICE_STATUS_TOPIC) {
    const payload = envelope.payload as { status?: string };
    liveState.updateDeviceStatus({
      deviceId: envelope.deviceId,
      status: payload.status ?? envelope.eventType,
      ingestedAt: envelope.ingestedAt,
      payload: envelope.payload,
    });
  }
}

export async function stopLiveConsumer(): Promise<void> {
  await consumer?.disconnect();
}
