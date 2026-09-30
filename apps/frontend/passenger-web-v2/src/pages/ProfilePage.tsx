import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronRight, HeartHandshake, Loader2, LogOut, Mail, ShieldCheck, Ticket } from "lucide-react";
import { ApiError, AuthControllerService, UsersControllerService } from "@busmate/api-client-user";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import { Field, PasswordField } from "@/components/auth/Field";
import Disclosure from "@/components/trip/Disclosure";
import { useAuth } from "@/lib/auth/AuthContext";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import type { AuthRouteState } from "@/lib/auth/redirect";
import { changedFields, hasChanges, initialsOf, passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from "@/lib/profile.ts";

const PRIMARY =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
const SECONDARY =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary px-6 text-[15px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/** An email that wraps after the "@" on a narrow screen instead of in the middle of a word. */
const Email = ({ value }: { value: string }) => {
  const at = value.indexOf("@");
  return at < 0 ? <>{value}</> : <>{value.slice(0, at + 1)}<wbr />{value.slice(at + 1)}</>;
};

const Alert = ({ children }: { children: React.ReactNode }) => (
  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
    {children}
  </p>
);

/** Who the passenger is, the details they can change, their password, and the way out. Only what user-service holds:
 * a name, email, username and phone number. No loyalty, saved cards or notification settings: nothing backs them. */
export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.title = "Your profile · BusMate";
  }, []);

  const current = useMemo<Partial<ProfileValues>>(() => ({ fullName: user?.fullName ?? "", username: user?.username ?? "", phoneNumber: user?.phoneNumber ?? "" }), [user]);
  const schema = useMemo(() => profileSchema(current), [current]);
  const details = useForm<ProfileValues>({ resolver: zodResolver(schema), mode: "onTouched", values: { fullName: current.fullName!, username: current.username!, phoneNumber: current.phoneNumber! } });
  const password = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), mode: "onTouched", defaultValues: { currentPassword: "", newPassword: "" } });

  if (!user) return null;
  const typed = details.watch();
  const changes = changedFields(current, typed);
  // "Different from what's saved" is wider than "something to send": a blanked username sends nothing, but the form
  // is still not what's saved, so Save and Undo stay available and the validation explains why it can't go through.
  const dirty = hasChanges(changes) || (Object.keys(current) as (keyof ProfileValues)[]).some((k) => (typed[k] ?? "").trim() !== (current[k] ?? ""));

  const saveDetails = async () => {
    setDetailsError(null);
    setSaved(false);
    try {
      await UsersControllerService.updateUser(user.userId!, changes);
      await refreshUser();
      setSaved(true);
    } catch (e) {
      // user-service answers a username that someone else has with a bare 500 rather than a 409 (a backend gap). A
      // username is the only thing here that can collide, so when one was being changed, say that it may be taken.
      const mayBeTaken = "username" in changes && e instanceof ApiError && (e.status === 409 || e.status === 500);
      setDetailsError(mayBeTaken ? "We couldn't save that username. It may already be taken, so try another." : extractErrorMessage(e, "We couldn't save your details. Please try again."));
    }
  };

  const changePassword = async (v: PasswordValues) => {
    setPasswordError(null);
    try {
      await AuthControllerService.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
    } catch (e) {
      setPasswordError(e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 400) ? "Your current password isn't right." : extractErrorMessage(e, "We couldn't change your password. Please try again."));
      return;
    }
    // Changing the password ends every session, this one included: log in again with the new one.
    await logout();
    const state: AuthRouteState = { email: user.email, notice: "Password changed. Log in with your new password." };
    navigate("/login", { replace: true, state });
  };

  const signOut = async () => {
    setLeaving(true);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <SiteLayout>
      <PageHero compact>
        <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Your profile</h1>
      </PageHero>

      <div className="mx-auto grid max-w-xl gap-4 px-3 pb-16 pt-5 min-[360px]:px-4 md:px-6">
        <section aria-label="Account" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
          <span aria-hidden className="grid h-16 w-16 flex-none place-items-center rounded-full bg-gradient-primary text-xl font-extrabold text-white">
            {initialsOf(user.fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold leading-tight">{user.fullName}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-none" aria-hidden />
              <span className="min-w-0 [overflow-wrap:anywhere]"><Email value={user.email!} /></span>
            </p>
            {user.isEmailVerified && (
              <span className="mt-1.5 inline-flex min-h-7 items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 text-xs font-bold text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Email verified
              </span>
            )}
          </div>
        </section>

        <section aria-label="Your details" className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <h2 className="text-[15px] font-extrabold">Your details</h2>
          <form onSubmit={details.handleSubmit(saveDetails)} noValidate className="mt-4 grid gap-4">
            <Field label="Full name" autoComplete="name" enterKeyHint="next" error={details.formState.errors.fullName?.message} {...details.register("fullName", { onChange: () => setSaved(false) })} />
            <Field label="Username" autoComplete="username" autoCapitalize="none" spellCheck={false} enterKeyHint="next" placeholder="Optional" error={details.formState.errors.username?.message} {...details.register("username", { onChange: () => setSaved(false) })} />
            <Field label="Phone number" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="done" placeholder="Optional" error={details.formState.errors.phoneNumber?.message} {...details.register("phoneNumber", { onChange: () => setSaved(false) })} />
            <div>
              <div className="mb-1.5 text-[13px] font-bold">Email</div>
              <p className="min-h-12 rounded-xl border border-border bg-soft px-4 py-3 text-base text-muted-foreground [overflow-wrap:anywhere]"><Email value={user.email!} /></p>
              <p className="mt-1.5 text-xs text-muted-foreground">Your email is how you log in, so it can't be changed here.</p>
            </div>
            {detailsError && <Alert>{detailsError}</Alert>}
            {saved && !dirty && (
              <p role="status" className="flex items-center gap-2 text-[13px] font-semibold text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Saved.
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <button type="submit" disabled={!dirty || details.formState.isSubmitting} className={PRIMARY}>
                {details.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {details.formState.isSubmitting ? "Saving…" : "Save changes"}
              </button>
              {dirty && (
                <button type="button" disabled={details.formState.isSubmitting} onClick={() => { details.reset(); setDetailsError(null); }} className={`${SECONDARY} sm:w-auto`}>
                  Undo
                </button>
              )}
            </div>
          </form>
        </section>

        <Disclosure title="Change password" hint="You'll be logged out everywhere and asked to log in again">
          <form onSubmit={password.handleSubmit(changePassword)} noValidate className="grid gap-4">
            <PasswordField label="Current password" autoComplete="current-password" error={password.formState.errors.currentPassword?.message} {...password.register("currentPassword")} />
            <PasswordField label="New password" autoComplete="new-password" error={password.formState.errors.newPassword?.message} {...password.register("newPassword")} />
            {passwordError && <Alert>{passwordError}</Alert>}
            <button type="submit" disabled={password.formState.isSubmitting} className={PRIMARY}>
              {password.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {password.formState.isSubmitting ? "Changing…" : "Change password"}
            </button>
          </form>
        </Disclosure>

        <nav aria-label="More" className="grid gap-2">
          {[
            { to: "/tickets", icon: <Ticket className="h-5 w-5" />, title: "My tickets", body: "Your bookings and boarding codes" },
            { to: "/contribute", icon: <HeartHandshake className="h-5 w-5" />, title: "Help improve BusMate", body: "Add stops, routes and timetables you know" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="flex min-h-16 items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-primary" aria-hidden>{l.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-tight">{l.title}</span>
                <span className="block text-xs text-muted-foreground">{l.body}</span>
              </span>
              <ChevronRight className="h-5 w-5 flex-none text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </nav>

        <button type="button" onClick={signOut} disabled={leaving} className={SECONDARY}>
          {leaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
          Log out
        </button>
      </div>
    </SiteLayout>
  );
}
