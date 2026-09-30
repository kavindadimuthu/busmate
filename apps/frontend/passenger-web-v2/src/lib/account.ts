// Pure account-area logic, no React: what a passenger's standing means, how it reads, and which tabs the account
// area shows. Erasable TypeScript only so `node --test` can run it.
//
// A passenger, a contributor and a steward are not three kinds of account. Everyone has one passenger account;
// "contributor" and "steward" are a standing kept by core-service on top of it (ADR-019). Hiding a tab here is a
// courtesy: core-service checks standing on every request.

export interface StandingLike {
  /** NONE, APPLIED, ACTIVE, DECLINED or SUSPENDED. */
  status?: string;
  activeContributor?: boolean;
  activeSteward?: boolean;
  canApply?: boolean;
  cannotApplyReason?: string;
  contributor?: { level?: string; stewardScopeRouteGroupIds?: string[]; decisionReason?: string } | null;
}

export type Role =
  | "passenger"
  | "applicant"
  | "contributor"
  /** Accepted, but the agreement has changed since and hasn't been accepted again, so nothing can be proposed yet. */
  | "agreement-due"
  | "steward"
  | "suspended"
  | "declined"
  /** Not a passenger account at all (staff): no standing to show. */
  | "other";

export function roleOf(s: StandingLike | undefined | null): Role | null {
  if (!s) return null;
  if (s.cannotApplyReason === "NOT_A_PASSENGER") return "other";
  switch (s.status) {
    case "APPLIED":
      return "applicant";
    case "SUSPENDED":
      return "suspended";
    case "DECLINED":
      return "declined";
    case "ACTIVE":
      if (s.activeSteward) return "steward";
      return s.activeContributor ? "contributor" : "agreement-due";
    default:
      return "passenger";
  }
}

export interface RoleText {
  title: string;
  /** One line under it, or null when the title says it all. */
  detail: string | null;
}

/** How the standing reads to its owner. `corridors` are the names of a steward's route groups, when known. */
export function roleText(role: Role, s: StandingLike | undefined | null, corridors: readonly string[] = []): RoleText | null {
  switch (role) {
    case "passenger":
      return { title: "Passenger", detail: null };
    case "applicant":
      return { title: "Contributor application", detail: "Under review. We'll show the decision here." };
    case "contributor":
      return { title: "Contributor", detail: "You can suggest stops and who runs a bus." };
    case "agreement-due":
      return { title: "Contributor", detail: "The contributor agreement has changed. Accept the new one to carry on." };
    case "steward":
      return { title: "Steward", detail: corridors.length > 0 ? `You review proposals on ${corridors.join(", ")}.` : "You review other contributors' proposals." };
    case "suspended":
      return { title: "Contributor access suspended", detail: s?.contributor?.decisionReason?.trim() || null };
    case "declined":
      return { title: "Application not accepted", detail: s?.contributor?.decisionReason?.trim() || "You can apply again." };
    case "other":
      return null;
  }
}

export interface Built {
  /** The public "about contributing" page exists in this app. */
  programme: boolean;
  /** The Contributions tab's screens exist. */
  contributions: boolean;
  /** The steward Review tab's screens exist. */
  review: boolean;
}

/** What has actually been built. A tab or link is offered only when its screen exists, however the role reads: a
 * menu item for a page that doesn't work yet is fiction. Each contribute increment flips its own flag. */
export const BUILT: Built = { programme: false, contributions: false, review: false };

export interface AccountTab {
  id: "profile" | "tickets" | "contributions" | "review";
  to: string;
  label: string;
}

/** Profile and My tickets for everyone; Contributions once anyone has a contributor standing; Review for stewards. */
export function accountTabs(role: Role | null, s: StandingLike | undefined | null, built: Built = BUILT): AccountTab[] {
  const tabs: AccountTab[] = [
    { id: "profile", to: "/profile", label: "Profile" },
    { id: "tickets", to: "/tickets", label: "Tickets" },
  ];
  const involved = role !== null && role !== "passenger" && role !== "other";
  if (involved && built.contributions) tabs.push({ id: "contributions", to: "/contribute/mine", label: "Contributions" });
  if (s?.activeSteward && role === "steward" && built.review) tabs.push({ id: "review", to: "/contribute/review", label: "Review" });
  return tabs;
}

/** Whether to offer "become a contributor": only to someone who could, and only once the page it leads to exists. */
export function showBecomeContributor(role: Role | null, s: StandingLike | undefined | null, built: Built = BUILT): boolean {
  return built.programme && role === "passenger" && s?.canApply === true;
}

/** Why a passenger can't apply yet, in words, when it's something they can do something about. */
export function applyBlockedText(s: StandingLike | undefined | null): string | null {
  if (s?.cannotApplyReason === "EMAIL_NOT_VERIFIED" || s?.cannotApplyReason === "ACCOUNT_NOT_ACTIVE") return "Contributing opens once your email address is verified.";
  return null;
}

/** Which tab a path belongs to, so the right one is marked current. Deeper pages belong to their list's tab. */
export function tabFor(pathname: string): AccountTab["id"] | null {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "profile";
  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) return "tickets";
  if (pathname.startsWith("/contribute/mine")) return "contributions";
  if (pathname.startsWith("/contribute/review")) return "review";
  return null;
}
