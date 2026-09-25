/** core-service reports refusals as `{ message }`; user-service uses `{ error }` (see lib/auth/errorMessage.ts). */
export function coreErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { body?: { message?: unknown } } | null)?.body;
  if (body && typeof body.message === "string" && body.message) return body.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
