// A real race exists in new-react-portal's RoleGate (src/components/layouts/role-gate.tsx): its
// useEffect fires twice under React StrictMode right after login, both calling GET /api/bff/auth/me
// concurrently. On a cold gateway — before its JWKS key-set cache warms up — that first pair of
// requests can resolve out of order and one loses, bouncing the user back to the sign-in page despite
// a successful login. It self-resolves after a few requests. This tool always starts a fresh stack
// right before logging in, so it hits this cold window every time — not something a hand-run login
// normally would. The real fix belongs in the app (its own increment); here we just retry past it.
export async function withLoginRetry(page, isSignedIn, attempt, { retries = 3, settleMs = 1200 } = {}) {
  for (let i = 1; i <= retries; i++) {
    await attempt();
    await new Promise((r) => setTimeout(r, settleMs)); // let a possible bounce-back finish
    if (isSignedIn(page.url())) return;
  }
  throw new Error(`login kept bouncing back to the sign-in page after ${retries} attempts (see lib/login-retry.mjs)`);
}
