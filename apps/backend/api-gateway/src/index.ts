import './tracing'; // Phase 6 — must be the first import, see tracing.ts
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startLiveConsumer } from './live/kafkaConsumer';

const app = createApp();
app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, `API Gateway running on port ${env.PORT}`);
});

// Fire-and-forget: startLiveConsumer already swallows/logs its own connection failures so a
// broker that isn't up yet never blocks the gateway's HTTP listener from starting.
void startLiveConsumer();
