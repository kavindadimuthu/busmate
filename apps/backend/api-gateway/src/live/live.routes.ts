import { Router, Request, Response } from 'express';
import { liveState, type BusPosition, type DeviceStatusEvent } from './liveState';

/**
 * Live-tracking SSE stream (IoT Platform Layer plan, Phase 3): pushes bus-position and
 * device-status updates as they arrive from Kafka (see `kafkaConsumer.ts`) to the MOT-facing live
 * map (`new-react-portal`'s `/mot/tracking`, replacing its mock-data source) and any fleet-health
 * indicator built on top of device-status.
 *
 * SSE, not WebSocket: this is a one-directional server→browser feed, and Express supports
 * `text/event-stream` natively with no extra dependency — the api-gateway is already the single
 * browser-facing entry point, so this is the natural home for it (per the plan's Phase 3 design
 * note: streaming lives in the Node gateway, not the Spring services).
 *
 * Mounted behind `authMiddleware` + {@link requireStaffRole} in `app.ts` (staff-only — this is a
 * MOT/admin dashboard feed, not public passenger data).
 */
export const liveRouter = Router();

liveRouter.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable any intermediate proxy buffering (e.g. nginx) so events flush immediately.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Bootstrap the client with everything known right now, then stream deltas.
  send('snapshot', liveState.snapshot());

  const onBusPosition = (position: BusPosition) => send('bus-position', position);
  const onDeviceStatus = (status: DeviceStatusEvent) => send('device-status', status);
  liveState.on('bus-position', onBusPosition);
  liveState.on('device-status', onDeviceStatus);

  // Keep the connection alive through idle proxies/load balancers.
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    liveState.off('bus-position', onBusPosition);
    liveState.off('device-status', onDeviceStatus);
  });
});
