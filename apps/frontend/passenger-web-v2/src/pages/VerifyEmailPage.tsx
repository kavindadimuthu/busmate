import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AuthControllerService } from "@busmate/api-client-user";
import AuthLayout from "@/components/auth/AuthLayout";
import { AUTH_BUTTON, AUTH_LINK } from "@/components/auth/authStyles";
import { useAuth } from "@/lib/auth/AuthContext";
import { extractErrorMessage } from "@/lib/auth/errorMessage";
import { tokenFrom } from "@/lib/auth/passwordReset.ts";

type State = { kind: "working" } | { kind: "done" } | { kind: "failed"; text: string };

/** Where the emailed link lands. It confirms the address as soon as it opens, once: a link works a single time, so a
 * second attempt (React's dev double-run, a refresh) would report a good link as used. */
export default function VerifyEmailPage() {
  const token = tokenFrom(useLocation().search);
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const qc = useQueryClient();
  const started = useRef(false);
  const [state, setState] = useState<State>(token ? { kind: "working" } : { kind: "failed", text: "This link isn't complete. Open the link in your email again." });

  useEffect(() => {
    // Wait for the session to be known, so a signed-in visitor's account is refreshed once it's confirmed.
    if (!token || isLoading || started.current) return;
    started.current = true;
    AuthControllerService.verifyEmail({ token })
      .then(async () => {
        setState({ kind: "done" });
        // If they're signed in, what the account says about their email (and whether they can apply to contribute) changes now.
        if (isAuthenticated) {
          await refreshUser().catch(() => undefined);
          qc.invalidateQueries({ queryKey: ["my-standing"] });
        }
      })
      .catch((e) => setState({ kind: "failed", text: extractErrorMessage(e, "We couldn't confirm your email just now. Please try the link again in a moment.") }));
  }, [token, isLoading, isAuthenticated, refreshUser, qc]);

  useEffect(() => {
    document.title = "Verify your email · BusMate";
  }, []);

  return (
    <AuthLayout
      tabs={false}
      heading={state.kind === "done" ? "Email confirmed" : state.kind === "failed" ? "We couldn't confirm your email" : "Confirming your email…"}
      intro=""
      side={{ heading: "Your account,", accent: "your ticket", body: "Keep your tickets and bookings safe, and get back in whenever you need them." }}
      footer={<Link to="/" className={AUTH_LINK}>← Back to home</Link>}
    >
      <div role={state.kind === "failed" ? "alert" : "status"} aria-busy={state.kind === "working"} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        {state.kind === "working" && <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />}
        {state.kind === "done" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden />
            <p className="text-[15px] leading-relaxed">Thanks. Your email address is confirmed.</p>
            <Link to={isAuthenticated ? "/profile" : "/login"} className={AUTH_BUTTON}>
              {isAuthenticated ? "Go to my account" : "Log in"}
            </Link>
          </>
        )}
        {state.kind === "failed" && (
          <>
            <XCircle className="h-8 w-8 text-destructive" aria-hidden />
            <p className="text-[15px] leading-relaxed">{state.text}</p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">A link works once and lasts 24 hours. If you already used it, your email is confirmed and you're all set.</p>
            <Link to={isAuthenticated ? "/profile" : "/login"} className={AUTH_BUTTON}>
              {isAuthenticated ? "Go to my account" : "Log in"}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
