import { ApiError } from "@busmate/api-client-core";

/** A message safe to show a passenger for a failed contributor-programme call. core-service sends its own reason
 * for anything the passenger can act on ("Verify your email address before applying"), so that is used when there
 * is one; a server fault, a missing connection and rate limiting get plain words instead of internals. */
export function communityMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return "We couldn't reach BusMate. Check your connection and try again.";
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (error.status >= 500) return fallback;
  const body = error.body as { message?: unknown; error?: unknown } | null | undefined;
  const raw = body?.message ?? body?.error;
  const text = typeof raw === "string" ? raw : raw && typeof raw === "object" ? (raw as { message?: unknown }).message : undefined;
  return typeof text === "string" && text.trim() ? text : fallback;
}

export const statusOf = (error: unknown): number | null => (error instanceof ApiError ? error.status : null);
