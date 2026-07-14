import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();
app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, `API Gateway running on port ${env.PORT}`);
});
