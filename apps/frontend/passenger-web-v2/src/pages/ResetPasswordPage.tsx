import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ApiError, AuthControllerService } from "@busmate/api-client-user";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/Field";
import { AUTH_BUTTON, AUTH_ERROR, AUTH_LINK } from "@/components/auth/authStyles";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import { resetSchema, tokenFrom, type ResetValues } from "@/lib/auth/passwordReset.ts";
import type { AuthRouteState } from "@/lib/auth/redirect";

/** Where the emailed link lands: choose a new password. A link that is missing, used or out of date says so and offers
 * a new one; a good one signs every device out (the server does that) and sends them to log in. */
export default function ResetPasswordPage() {
  const token = tokenFrom(useLocation().search);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [linkBad, setLinkBad] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: "" } });

  const onSubmit = async (v: ResetValues) => {
    setFormError(null);
    try {
      await AuthControllerService.resetPassword({ token: token!, newPassword: v.password });
      const state: AuthRouteState = { notice: "Your password has been changed. Log in with the new one." };
      navigate("/login", { replace: true, state });
    } catch (e) {
      // 4xx means the link itself is no good; anything else is worth another go.
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 429) setLinkBad(true);
      else setFormError(extractErrorMessage(e, "We couldn't change your password just now. Please try again."));
    }
  };

  const bad = !token || linkBad;
  return (
    <AuthLayout
      tabs={false}
      heading={bad ? "This link can't be used" : "Choose a new password"}
      intro={bad ? "" : "You'll be logged out everywhere and asked to log in with it."}
      side={{ heading: "Your account,", accent: "your ticket", body: "Keep your tickets and bookings safe, and get back in whenever you need them." }}
      footer={
        <Link to="/login" className={AUTH_LINK}>
          ← Back to log in
        </Link>
      }
    >
      {bad ? (
        <div role="alert" className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-[15px] leading-relaxed">The link may have expired (they last 30 minutes), or it was already used or isn't complete.</p>
          <Link to="/forgot-password" className={AUTH_BUTTON}>
            Send me a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <PasswordField label="New password" autoComplete="new-password" enterKeyHint="go" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
          {formError && (
            <p role="alert" className={AUTH_ERROR}>
              {formError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className={AUTH_BUTTON}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Saving…" : "Change password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
