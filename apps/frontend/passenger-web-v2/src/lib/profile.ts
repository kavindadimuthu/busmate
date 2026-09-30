// Pure profile logic, no React: what a passenger may enter, and what actually changed. user-service accepts
// anything (it checks nothing on update), so these rules are the only ones. Erasable TypeScript only so
// `node --test` can run it.
import { z } from "zod";

export interface ProfileValues {
  fullName: string;
  username: string;
  phoneNumber: string;
}

const PHONE_CHARS = /^[+(]?[0-9][0-9 ()-]*$/;

/** "Nimal Perera" -> "NP". "?" when there's no name at all. */
export function initialsOf(name: string | undefined | null): string {
  const parts = (name ?? "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => Array.from(p)[0]!.toUpperCase())
    .join("");
}

/** Digits in a phone number as typed, ignoring spaces, dashes, brackets and a leading +. */
export function phoneDigits(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

/** The details form. `current` is what is already saved: a username can be set or changed but never blanked, because
 * user-service has no way to clear one (a blank would be stored as an empty name, and usernames are unique). */
export function profileSchema(current: Partial<ProfileValues>) {
  return z.object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    username: z
      .string()
      .trim()
      .refine((v) => v === "" || /^[A-Za-z0-9_]{3,30}$/.test(v), "Use 3 to 30 letters, numbers or underscores")
      .refine((v) => v !== "" || !current.username, "A username can be changed but not removed"),
    phoneNumber: z
      .string()
      .trim()
      .refine((v) => v === "" || (PHONE_CHARS.test(v) && phoneDigits(v) >= 7 && phoneDigits(v) <= 15), "Enter a phone number with 7 to 15 digits"),
  });
}

/** Only what changed, trimmed. A blank username is never sent (see above); a blank phone number is, which clears it. */
export function changedFields(current: Partial<ProfileValues>, next: ProfileValues): Partial<ProfileValues> {
  const out: Partial<ProfileValues> = {};
  const name = next.fullName.trim();
  const username = next.username.trim();
  const phone = next.phoneNumber.trim();
  if (name !== (current.fullName ?? "")) out.fullName = name;
  if (username !== "" && username !== (current.username ?? "")) out.username = username;
  if (phone !== (current.phoneNumber ?? "")) out.phoneNumber = phone;
  return out;
}

export const hasChanges = (c: Partial<ProfileValues>): boolean => Object.keys(c).length > 0;

/** The password form. There is no "confirm" box: the field has a Show switch, which beats typing it twice on a phone. */
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
  })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password you haven't used here" });

export type PasswordValues = z.infer<typeof passwordSchema>;
