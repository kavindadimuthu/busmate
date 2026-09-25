/** What a proposal is about, in words — it may concern a stop or who works a departure (ADR-026). */
export type WorkingValues = { operatorNameObserved?: string | null; platesObserved?: string[] | null; serviceClass?: string | null };

export const isWorking = (entityType?: string) => entityType === 'SCHEDULE_WORKING';

export function proposalKind(entityType?: string, action?: string): string {
  if (isWorking(entityType)) return 'Who runs a departure';
  return action === 'CREATE' ? 'New stop' : 'Correction';
}

export function proposalTitle(entityType: string | undefined, values: unknown, fallback: string): string {
  if (!isWorking(entityType)) return fallback;
  const w = (values ?? {}) as WorkingValues;
  return w.operatorNameObserved || (w.platesObserved ?? []).join(', ') || 'Who runs a departure';
}
