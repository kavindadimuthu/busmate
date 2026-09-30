// Pure contribution logic, no React: how a proposal reads, what changed in it, which proposals a filter shows, what
// the application form allows and what to do when someone opens it. Erasable TypeScript only, apart from zod, so
// `node --test` can run it.
import { z } from "zod";

export interface ChangesetLike {
  id?: string;
  entityType?: string;
  action?: string;
  proposedValues?: unknown;
  targetSnapshot?: unknown;
  observedOn?: string;
  observationMethod?: string;
  note?: string;
  status?: string;
  createdAt?: string;
  decisionReason?: string;
}

// ---------- status ----------

export const STATUSES = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "REVERTED"] as const;
export type ProposalStatus = (typeof STATUSES)[number];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
  REVERTED: "Reverted",
};

export const statusLabel = (s: string | undefined): string => STATUS_LABEL[s ?? ""] ?? s ?? "Unknown";

export type Tone = "good" | "warn" | "bad" | "quiet";
export const statusTone = (s: string | undefined): Tone => (s === "APPROVED" ? "good" : s === "PENDING" ? "warn" : s === "REJECTED" ? "bad" : "quiet");

/** How many proposals are in each status, so a filter never offers an empty choice by surprise. */
export function countByStatus(list: readonly ChangesetLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of list) out[p.status ?? ""] = (out[p.status ?? ""] ?? 0) + 1;
  return out;
}

export function filterProposals<T extends ChangesetLike>(list: readonly T[], status: string): T[] {
  return status === "ALL" ? [...list] : list.filter((p) => p.status === status);
}

// ---------- what a proposal is about ----------

export type WorkingValues = {
  operatorNameObserved?: string | null;
  platesObserved?: string[] | null;
  serviceClass?: string | null;
  effectiveEndDate?: string | null;
};

export const isWorking = (entityType?: string): boolean => entityType === "SCHEDULE_WORKING";

export function proposalTitle(entityType: string | undefined, values: unknown): string {
  if (isWorking(entityType)) {
    const w = (values ?? {}) as WorkingValues;
    return w.operatorNameObserved || (w.platesObserved ?? []).filter(Boolean).join(", ") || "Who runs a departure";
  }
  return ((values ?? {}) as { name?: string }).name || "Untitled proposal";
}

export function proposalKind(entityType: string | undefined, action: string | undefined): string {
  if (isWorking(entityType)) return action === "CREATE" ? "Who usually runs a departure" : "Correction to a working";
  return action === "CREATE" ? "New stop" : "Correction to a stop";
}

const STOP_METHOD: Record<string, string> = {
  RODE_THE_ROUTE: "Rode the route past this stop",
  LIVES_OR_WORKS_NEARBY: "Lives or works nearby",
  TIMETABLE_OR_SIGNBOARD: "From a timetable or signboard",
  TOLD_BY_CREW: "A conductor or driver said so",
  OTHER: "Other",
};
const WORKING_METHOD: Record<string, string> = { ...STOP_METHOD, RODE_THE_ROUTE: "Rode this bus", LIVES_OR_WORKS_NEARBY: "Sees it regularly nearby" };

/** How the contributor knows, worded for what they proposed: a stop's wording reads wrongly for a bus. */
export function observationLabel(entityType: string | undefined, method: string | undefined): string {
  return (isWorking(entityType) ? WORKING_METHOD : STOP_METHOD)[method ?? ""] ?? method ?? "";
}

const get = (values: unknown, key: string): unknown => (values && typeof values === "object" ? (values as Record<string, unknown>)[key] : undefined);

/** "Kandy · 7.29000, 80.63000", whichever parts are known, or null. */
export function locationText(values: unknown): string | null {
  const loc = get(values, "location") as { latitude?: number; longitude?: number; city?: string } | undefined;
  if (!loc) return null;
  const parts: string[] = [];
  if (loc.city) parts.push(loc.city);
  if (typeof loc.latitude === "number" && typeof loc.longitude === "number") parts.push(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** A Google Maps link for a proposed position: an ordinary link, needing no map script. Null without coordinates. */
export function mapsLink(values: unknown): string | null {
  const loc = get(values, "location") as { latitude?: number; longitude?: number } | undefined;
  if (typeof loc?.latitude !== "number" || typeof loc?.longitude !== "number") return null;
  return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
}

export interface Row {
  label: string;
  before: string | null;
  after: string;
  changed: boolean;
}

const dash = (v: unknown): string => (v === undefined || v === null || v === "" ? "—" : String(v));

const STOP_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "nameSinhala", label: "Name (Sinhala)" },
  { key: "nameTamil", label: "Name (Tamil)" },
  { key: "description", label: "Description" },
];

/** What a stop proposal says. A correction lists only what it changes, with the old value; a new stop lists what it gives. */
export function stopRows(c: ChangesetLike): Row[] {
  const proposed = c.proposedValues;
  const rows: Row[] = [];
  if (c.action === "UPDATE" && c.targetSnapshot) {
    for (const { key, label } of STOP_FIELDS) {
      const before = get(c.targetSnapshot, key);
      const after = get(proposed, key);
      if (before === after || (!before && !after)) continue;
      rows.push({ label, before: dash(before), after: dash(after), changed: true });
    }
    const was = locationText(c.targetSnapshot);
    const now = locationText(proposed);
    if (was !== now) rows.push({ label: "Position", before: was ?? "—", after: now ?? "—", changed: true });
    return rows;
  }
  rows.push({ label: "Name", before: null, after: dash(get(proposed, "name")), changed: false });
  for (const { key, label } of STOP_FIELDS.slice(1)) if (get(proposed, key)) rows.push({ label, before: null, after: dash(get(proposed, key)), changed: false });
  rows.push({ label: "Position", before: null, after: locationText(proposed) ?? "—", changed: false });
  return rows;
}

const CLASS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  SEMI_LUXURY: "Semi-luxury",
  LUXURY: "Luxury",
  SUPER_LUXURY: "Super luxury",
  EXPRESSWAY_SUPER_LUXURY: "Expressway super luxury",
};
const classLabel = (v?: string | null): string => (v ? CLASS_LABEL[v] ?? v : "not stated");

type WorkingSnapshot = { operatorName?: string; operatorNameObserved?: string; serviceClass?: string; vehicles?: { plate?: string; plateObserved?: string }[] };

/** What a working proposal says: who runs a departure, on which plates, in which class; for a correction, against what was recorded. */
export function workingRows(c: ChangesetLike): Row[] {
  const proposed = (c.proposedValues ?? {}) as WorkingValues;
  const plates = (proposed.platesObserved ?? []).filter(Boolean);
  const plateLabel = plates.length > 1 ? "Plates (alternating)" : "Plate";
  const join = (p: string[]) => (p.length ? p.join(" or ") : "not stated");
  if (c.action === "UPDATE") {
    const before = (c.targetSnapshot ?? {}) as WorkingSnapshot;
    const beforePlates = (before.vehicles ?? []).map((v) => v.plateObserved ?? v.plate ?? "").filter(Boolean);
    const rows: Row[] = [
      { label: "Operator", before: before.operatorNameObserved ?? before.operatorName ?? "not stated", after: proposed.operatorNameObserved || "not stated", changed: false },
      { label: beforePlates.length > 1 || plates.length > 1 ? "Plates (alternating)" : "Plate", before: join(beforePlates), after: join(plates), changed: false },
      { label: "Service class", before: classLabel(before.serviceClass), after: classLabel(proposed.serviceClass), changed: false },
    ];
    for (const r of rows) r.changed = r.before !== r.after;
    if (proposed.effectiveEndDate) rows.push({ label: "Says it stopped", before: null, after: proposed.effectiveEndDate, changed: true });
    return rows;
  }
  const rows: Row[] = [
    { label: "Operator", before: null, after: proposed.operatorNameObserved || "not stated", changed: false },
    { label: plateLabel, before: null, after: join(plates), changed: false },
  ];
  if (proposed.serviceClass) rows.push({ label: "Service class", before: null, after: classLabel(proposed.serviceClass), changed: false });
  return rows;
}

/** "5 Oct 2026" in Sri Lanka time, for an ISO timestamp or a plain date. Empty when it isn't a date. Month names come from
 * one fixed locale so a September reads "Sep" here as on every other page, whatever the device's own settings. */
export function formatDay(value: string | undefined | null): string {
  if (!value) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+05:30`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo" }).formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.day} ${parts.month} ${parts.year}`;
}

// ---------- opening the application page ----------

export interface ApplyStanding {
  status?: string;
  canApply?: boolean;
  cannotApplyReason?: string;
}

export type ApplyGate =
  | { kind: "loading" }
  /** They have already applied, are contributors, or are suspended: their Contributions tab is the place. */
  | { kind: "contributions" }
  | { kind: "form" }
  | { kind: "blocked"; text: string };

const BLOCKED: Record<string, string> = {
  NOT_A_PASSENGER: "Only passenger accounts can apply to contribute.",
  EMAIL_NOT_VERIFIED: "Contributing opens once your email address is verified.",
  ACCOUNT_NOT_ACTIVE: "Contributing opens once your email address is verified.",
};

export function applyGate(s: ApplyStanding | undefined | null): ApplyGate {
  if (!s) return { kind: "loading" };
  if (s.status === "APPLIED" || s.status === "ACTIVE" || s.status === "SUSPENDED") return { kind: "contributions" };
  if (s.canApply) return { kind: "form" };
  return { kind: "blocked", text: BLOCKED[s.cannotApplyReason ?? ""] ?? "You can't apply to contribute right now." };
}

// ---------- the application form ----------

export const AFFILIATIONS = [
  { value: "NONE", label: "No link to any bus operator" },
  { value: "OPERATOR_EMPLOYEE", label: "I work for a bus operator" },
  { value: "BUS_OWNER", label: "I own or run buses" },
  { value: "OTHER", label: "Some other connection" },
] as const;

export const applicationSchema = z
  .object({
    motivation: z.string().trim().min(20, "Say a bit more: at least 20 characters").max(1000, "Keep it under 1,000 characters"),
    homeDistrict: z.string().trim().max(100, "Keep it under 100 characters"),
    corridorRouteGroupIds: z.array(z.string()).max(20, "Choose up to 20 corridors"),
    affiliation: z.enum(["NONE", "OPERATOR_EMPLOYEE", "BUS_OWNER", "OTHER"]),
    affiliationDetail: z.string().trim().max(500, "Keep it under 500 characters"),
    agreementAccepted: z.boolean(),
  })
  .refine((v) => v.affiliation === "NONE" || v.affiliationDetail.length > 0, { path: ["affiliationDetail"], message: "Tell us which operator, and how you're linked to them" })
  .refine((v) => v.agreementAccepted, { path: ["agreementAccepted"], message: "You need to accept the agreement to apply" });

export type ApplicationValues = z.infer<typeof applicationSchema>;

export const EMPTY_APPLICATION: ApplicationValues = { motivation: "", homeDistrict: "", corridorRouteGroupIds: [], affiliation: "NONE", affiliationDetail: "", agreementAccepted: false };

/** What is sent. A blank district is left out, and an operator link's detail is sent only when there is a link. */
export function applicationPayload(v: ApplicationValues, agreementVersion: string) {
  return {
    motivation: v.motivation.trim(),
    homeDistrict: v.homeDistrict.trim() || undefined,
    corridorRouteGroupIds: v.corridorRouteGroupIds,
    affiliation: v.affiliation,
    affiliationDetail: v.affiliation === "NONE" ? undefined : v.affiliationDetail.trim(),
    agreementVersion,
  };
}
