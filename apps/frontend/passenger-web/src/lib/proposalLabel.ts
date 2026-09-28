/** What a proposal is about, in words — a proposal may concern a stop or who works a departure (ADR-026). */
export type WorkingValues = {
  operatorNameObserved?: string | null;
  platesObserved?: string[] | null;
  serviceClass?: string | null;
};

export const isWorking = (entityType?: string) => entityType === "SCHEDULE_WORKING";

export function proposalTitle(entityType: string | undefined, values: unknown): string {
  if (isWorking(entityType)) {
    const w = (values ?? {}) as WorkingValues;
    return w.operatorNameObserved || (w.platesObserved ?? []).join(", ") || "Who runs a departure";
  }
  return ((values ?? {}) as { name?: string }).name ?? "Untitled proposal";
}

export function proposalKind(entityType: string | undefined, action: string | undefined): string {
  if (isWorking(entityType)) return action === "CREATE" ? "Who usually runs a departure" : "Correction to a working";
  return action === "CREATE" ? "New stop" : "Correction";
}

const STOP_METHOD: Record<string, string> = {
  RODE_THE_ROUTE: "Rode the route past this stop",
  LIVES_OR_WORKS_NEARBY: "Lives or works nearby",
  TIMETABLE_OR_SIGNBOARD: "From a timetable or signboard",
  TOLD_BY_CREW: "A conductor or driver said so",
  OTHER: "Other",
};
const WORKING_METHOD: Record<string, string> = { ...STOP_METHOD, RODE_THE_ROUTE: "Rode this bus", LIVES_OR_WORKS_NEARBY: "Sees it regularly nearby" };

/** How the contributor knows, worded for what they proposed — a stop's wording reads wrongly for a bus. */
export function observationLabel(entityType: string | undefined, method: string | undefined): string {
  const labels = isWorking(entityType) ? WORKING_METHOD : STOP_METHOD;
  return labels[method ?? ""] ?? method ?? "";
}
