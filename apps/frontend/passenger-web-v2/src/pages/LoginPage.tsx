import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Field, PasswordField } from "@/components/auth/Field";
import { useAuth } from "@/lib/auth/AuthContext";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import { safeInternalPath, type AuthRouteState } from "@/lib/auth/redirect";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("That doesn't look like an email address"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as AuthRouteState;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: state.email ?? "", password: "" } });

  const destination = safeInternalPath(state.from);
  if (!isLoading && isAuthenticated) return <Navigate to={destination} replace />;

  const onSubmit = async (v: Values) => {
    setFormError(null);
    try {
      await login(v.email, v.password);
      navigate(destination, { replace: true });
    } catch (e) {
      setFormError(extractErrorMessage(e, "Something went wrong. Please try again."));
    }
  };

  return (
    <AuthLayout
      heading="Log in to BusMate"
      intro="Enter your details to see your tickets and book seats."
      side={{
        heading: "Welcome back to",
        accent: "BusMate",
        body: "Log in to manage your bookings, keep your tickets close and pick up where you left off.",
      }}
      footer={
        <>
          Don't have an account?
          <Link to="/signup" state={state} className="inline-flex min-h-11 items-center px-1 font-bold text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {state.notice && (
        <p role="status" className="mb-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium">
          {state.notice}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
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
          labelAside={
            <Link to="/forgot-password" className="inline-flex min-h-11 items-center font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Forgot password?
            </Link>
          }
          autoComplete="current-password"
          enterKeyHint="go"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Logging in…" : "Log In →"}
        </button>
      </form>
    </AuthLayout>
  );
}
