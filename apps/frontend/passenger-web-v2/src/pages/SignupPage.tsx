import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ApiError } from "@busmate/api-client-user";
import AuthLayout from "@/components/auth/AuthLayout";
import { Field, PasswordField } from "@/components/auth/Field";
import { useAuth } from "@/lib/auth/AuthContext";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import { safeInternalPath, type AuthRouteState } from "@/lib/auth/redirect";

// user-service accepts anything on sign-up (a 3-character password, "not-an-email"), so these
// checks are the only ones. Name, email and password only; username and phone are added later on
// the Profile page (INC-065).
const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().min(1, "Enter your email address").email("That doesn't look like an email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export default function SignupPage() {
  const { register: signUp, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as AuthRouteState;
  const [formError, setFormError] = useState<{ text: string; emailTaken: boolean; email: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "" } });

  if (!isLoading && isAuthenticated) return <Navigate to={safeInternalPath(state.from)} replace />;

  const onSubmit = async (v: Values) => {
    setFormError(null);
    try {
      await signUp({ fullName: v.fullName, email: v.email, password: v.password });
      const next: AuthRouteState = { from: state.from, email: v.email, notice: "Account created. Log in to continue." };
      navigate("/login", { replace: true, state: next });
    } catch (e) {
      setFormError({
        text: extractErrorMessage(e, "We couldn't create your account. Please try again."),
        emailTaken: e instanceof ApiError && e.status === 409,
        email: v.email,
      });
    }
  };

  return (
    <AuthLayout
      heading="Create your account"
      intro="It only takes a minute. Then you can book seats and keep your tickets."
      side={{
        heading: "Join the ride with",
        accent: "BusMate",
        body: "Create your free account to book seats and keep every ticket in one place.",
      }}
      footer={
        <>
          Already have an account?
          <Link to="/login" state={state} className="inline-flex min-h-11 items-center px-1 font-bold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <Field
          label="Full name"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Nimasha Perera"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          enterKeyHint="go"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium">
            {formError.text}
            {formError.emailTaken && (
              <>
                {" "}
                <Link
                  to="/login"
                  state={{ ...state, email: formError.email } satisfies AuthRouteState}
                  className="-my-2 inline-block py-2 font-bold text-primary underline"
                >
                  Log in instead
                </Link>
              </>
            )}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Creating account…" : "Create Account →"}
        </button>
      </form>
    </AuthLayout>
  );
}
