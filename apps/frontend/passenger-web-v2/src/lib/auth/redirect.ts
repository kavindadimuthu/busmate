export interface AuthRouteState {
  /** Where the passenger was headed before being sent to log in. */
  from?: string;
  /** A one-line note for the login screen (e.g. "Account created"). */
  notice?: string;
  email?: string;
}

/** Only ever go somewhere inside the app: a same-site path, never `//host` or `https://…`. */
export function safeInternalPath(path: unknown, fallback = "/"): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
