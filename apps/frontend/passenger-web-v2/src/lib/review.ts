// Pure logic for a steward's review of a proposal, no React: what may be decided, why not, how to reject, and how a
// proposer's record and a distance read. core-service enforces every rule; these only say it in words first.
// Erasable TypeScript, so `node --test` can run it.

export const isWorkingType = (entityType?: string): boolean => entityType === "SCHEDULE_WORKING";

// ---------- rejecting ----------
export interface RejectReason {
  value: string;
  label: string;
}

const STOP_REASONS: RejectReason[] = [
  { value: "DUPLICATE", label: "Duplicate of an existing stop" },
  { value: "WRONG_POSITION", label: "Position is wrong" },
  { value: "CANNOT_VERIFY", label: "Can't verify this" },
  { value: "NOT_A_STOP", label: "Not a real stop" },
  { value: "OTHER", label: "Other" },
];
// core-service refuses the stop-only reasons for a working, and words "duplicate" differently.
const WORKING_REASONS: RejectReason[] = [
  { value: "DUPLICATE", label: "Already recorded for this departure" },
  { value: "CANNOT_VERIFY", label: "Can't verify this" },
  { value: "OTHER", label: "Other" },
];

export const rejectReasons = (entityType?: string): RejectReason[] => (isWorkingType(entityType) ? WORKING_REASONS : STOP_REASONS);

export const NOTE_MAX = 400;

export interface RejectForm {
  reason: string;
  note: string;
}

export function rejectProblems(form: RejectForm, entityType?: string): Partial<Record<"reason" | "note", string>> {
  const problems: Partial<Record<"reason" | "note", string>> = {};
  if (!rejectReasons(entityType).some((r) => r.value === form.reason)) problems.reason = "Choose a reason.";
  const note = form.note.trim();
  if (note.length > NOTE_MAX) problems.note = `Keep the note to ${NOTE_MAX} characters or fewer.`;
  else if (form.reason === "OTHER" && !note) problems.note = "Say what's wrong, so the contributor knows.";
  return problems;
}

/** The request body; an empty note is left out. */
export function rejectRequest(form: RejectForm): { reason: string; note?: string } {
  const note = form.note.trim();
  return note ? { reason: form.reason, note } : { reason: form.reason };
}

// ---------- what may be decided ----------
export interface ReviewItemLike {
  changeset?: { status?: string; entityType?: string; action?: string };
  stale?: boolean;
  targetOutranksCommunityTier?: boolean;
}

export interface Decision {
  canApprove: boolean;
  canReject: boolean;
  /** Why approving is closed, in words; null when it's open or the proposal is already decided. */
  approveBlockedText: string | null;
}

export function decisionOf(item: ReviewItemLike | undefined | null): Decision {
  if (item?.changeset?.status !== "PENDING") return { canApprove: false, canReject: false, approveBlockedText: null };
  const what = isWorkingType(item.changeset.entityType) ? "record" : "stop";
  if (item.stale) return { canApprove: false, canReject: true, approveBlockedText: `The ${what} has changed since this was proposed, so it can't be approved as it stands. Reject it as out of date.` };
  if (item.targetOutranksCommunityTier) return { canApprove: false, canReject: true, approveBlockedText: "This stop's data comes from a more trusted source than community observations, so it can't be changed through review. You can reject it." };
  return { canApprove: true, canReject: true, approveBlockedText: null };
}

// ---------- reading a proposal ----------
/** "about 16 m" or "about 1.3 km"; null when there's no distance to give (a new stop). */
export function distanceText(meters: number | undefined | null): string | null {
  if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) return null;
  if (meters < 1) return "less than a metre";
  if (meters < 1000) return `about ${Math.round(meters)} m`;
  return `about ${(meters / 1000).toFixed(1)} km`;
}

export interface TrackLike {
  approved?: number;
  rejected?: number;
  reverted?: number;
}

/** The proposer's history in one line. Someone with no history is new, not bad. */
export function trackText(t: TrackLike | undefined | null): string {
  const approved = t?.approved ?? 0;
  const rejected = t?.rejected ?? 0;
  const reverted = t?.reverted ?? 0;
  if (approved + rejected + reverted === 0) return "No decided proposals yet";
  const parts = [`${approved} approved`, `${rejected} not approved`];
  if (reverted) parts.push(`${reverted} undone later`);
  return parts.join(" · ");
}

const AFFILIATION: Record<string, string> = {
  OPERATOR_EMPLOYEE: "Works for a bus operator",
  BUS_OWNER: "Owns a bus",
  OTHER: "Has another link to buses",
};
/** A declared link to a bus operator, worth knowing when judging who runs a bus; null when there's none. */
export const affiliationText = (a: string | undefined | null): string | null => AFFILIATION[a ?? ""] ?? null;

/** "3 days ago", "today", by Sri Lanka calendar days, so a proposal waiting a long time stands out. */
export function waitingText(createdAt: string | undefined | null, now: Date = new Date()): string {
  if (!createdAt) return "";
  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) return "";
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(d);
  const days = Math.round((Date.parse(day(now)) - Date.parse(day(then))) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export const KIND_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "STOP", label: "Stops" },
  { value: "SCHEDULE_WORKING", label: "Buses" },
] as const;
export type KindFilter = (typeof KIND_FILTERS)[number]["value"];
