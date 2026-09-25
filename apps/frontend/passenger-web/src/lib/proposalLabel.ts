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
  if (isWorking(entityType)) return "Who usually runs a departure";
  return action === "CREATE" ? "New stop" : "Correction";
}
