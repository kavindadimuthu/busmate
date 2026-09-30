import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { AuthControllerService } from "@busmate/api-client-user";
import AuthLayout from "@/components/auth/AuthLayout";
import { Field } from "@/components/auth/Field";
import { AUTH_BUTTON, AUTH_ERROR, AUTH_LINK } from "@/components/auth/authStyles";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import { forgotSchema, type ForgotValues } from "@/lib/auth/passwordReset.ts";

/** Asks for a reset link. The server answers the same whether or not the address has an account (so nobody can probe
 * for accounts), so this page says the same too: "if there's an account". */
export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  const onSubmit = async (v: ForgotValues) => {
    setFormError(null);
    try {
      await AuthControllerService.forgotPassword({ email: v.email });
      setSentTo(v.email);
    } catch (e) {
      setFormError(extractErrorMessage(e, "We couldn't send that just now. Please try again."));
    }
  };

  return (
    <AuthLayout
      tabs={false}
      heading={sentTo ? "Check your email" : "Forgot your password?"}
      intro={sentTo ? "" : "Enter your email address and we'll send you a link to choose a new one."}
      side={{ heading: "Your account,", accent: "your ticket", body: "Keep your tickets and bookings safe, and get back in whenever you need them." }}
      footer={
        <Link to="/login" className={AUTH_LINK}>
          ← Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <div role="status" className="grid gap-3 rounded-2xl border border-border bg-card p-5">
          <MailCheck className="h-8 w-8 text-primary" aria-hidden />
          <p className="text-[15px] leading-relaxed">
            If there's a BusMate account for <strong className="break-all">{sentTo}</strong>, we've sent a link to it. It works for 30 minutes.
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">Nothing there? Check your spam folder, or try again in a few minutes.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <Field label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="go" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          {formError && (
            <p role="alert" className={AUTH_ERROR}>
              {formError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className={AUTH_BUTTON}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Sending…" : "Send me a link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
