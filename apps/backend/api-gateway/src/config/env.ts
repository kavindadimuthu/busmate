export const env = {
  PORT: parseInt(process.env.PORT ?? '8080'),
  SUPABASE_JWT_SECRET: requireEnv('SUPABASE_JWT_SECRET'),
  USER_SERVICE_URL: requireEnv('USER_SERVICE_URL'), // http://localhost:9020
  CORE_SERVICE_URL: requireEnv('CORE_SERVICE_URL'), // http://localhost:9010
  TICKETING_SERVICE_URL: requireEnv('TICKETING_SERVICE_URL'), // http://localhost:9030
  // Optional (defaulted) rather than required so existing deployments/env files that predate
  // telemetry-service keep starting without edits. Compose files set it explicitly.
  TELEMETRY_SERVICE_URL: process.env.TELEMETRY_SERVICE_URL ?? 'http://localhost:9040',
  // Live-tracking SSE consumer (IoT Platform Layer plan, Phase 3). Same broker telemetry-service
  // publishes to; defaulted (not required) so a gateway without the live-map feature enabled
  // (or before Redpanda is up) still starts — the consumer logs and retries instead of crashing.
  KAFKA_BOOTSTRAP_SERVERS: process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
  // Optional: the AI route-generation feature 503s (not a startup crash) when unset.
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}
