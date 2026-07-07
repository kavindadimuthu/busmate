export const env = {
  PORT: parseInt(process.env.PORT ?? '8080'),
  SUPABASE_JWT_SECRET: requireEnv('SUPABASE_JWT_SECRET'),
  USER_MANAGEMENT_URL: requireEnv('USER_MANAGEMENT_URL'), // http://localhost:8081
  TICKETING_SERVICE_URL: requireEnv('TICKETING_SERVICE_URL'), // http://localhost:8082
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}
