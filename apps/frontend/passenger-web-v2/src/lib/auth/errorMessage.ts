import { ApiError } from "@busmate/api-client-user";

/** A message safe to show a passenger. Reads both error shapes BusMate returns: user-service sends
 * `{ error: "text" }`, the gateway (rate limiting, auth checks) sends `{ error: { code, message } }`. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return "We couldn't reach BusMate. Check your connection and try again.";
  }
  // A server fault has nothing a passenger can act on, and its text ("Internal server error") is a stack of jargon.
  if (error.status >= 500) {
    return fallback;
  }
  if (error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  const body = error.body as { error?: unknown; message?: unknown } | null | undefined;
  const raw = body?.error ?? body?.message;
  const text =
    typeof raw === "string" ? raw : raw && typeof raw === "object" ? (raw as { message?: unknown }).message : undefined;
  return typeof text === "string" && text.trim() ? text : fallback;
}
