// Pure logic for the pages an email link opens: the new-password rules and reading the link's token. No React,
// so `node --test` can run it. The server accepts any password, so these checks are the only ones.
import { z } from "zod";

export const MIN_PASSWORD = 8;

// One box with a Show switch, not a "confirm" box: the passenger sees a typo instead of guessing at dots (same as sign-up).
export const resetSchema = z.object({
  password: z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters`),
});
export type ResetValues = z.infer<typeof resetSchema>;

export const forgotSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("That doesn't look like an email address"),
});
export type ForgotValues = z.infer<typeof forgotSchema>;

/** The token from a link's query string, or null when it's missing or blank. */
export function tokenFrom(search: string): string | null {
  const t = new URLSearchParams(search).get("token");
  return t && t.trim() ? t.trim() : null;
}
