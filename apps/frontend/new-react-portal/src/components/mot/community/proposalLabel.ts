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

const WORKING_METHOD: Record<string, string> = {
  RODE_THE_ROUTE: 'Rode this bus',
  LIVES_OR_WORKS_NEARBY: 'Sees it regularly nearby',
  TIMETABLE_OR_SIGNBOARD: 'From a timetable or signboard',
  TOLD_BY_CREW: 'A conductor or driver said so',
  OTHER: 'Other',
};

/** The wording for a working proposal; a stop's ("past this stop") reads wrongly for a bus. Undefined for a stop. */
export const workingMethodLabel = (entityType: string | undefined, method: string | undefined): string | undefined =>
  isWorking(entityType) ? WORKING_METHOD[method ?? ''] ?? method : undefined;
