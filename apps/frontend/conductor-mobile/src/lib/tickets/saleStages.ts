/**
 * How a ticket's sale stage is presented in conductor-mobile (INC-010, ADR-012).
 *
 * Tickets are categorised by WHEN they were sold relative to boarding — on the bus, or
 * pre-booked — which the backend classifies. That is a different question from how the fare was
 * paid (lib/payments/paymentMethods) and from whether the passenger has boarded; screens show
 * each as its own badge rather than folding them into one word like "Physical" or "Online".
 *
 * ## Adding a sale channel (depot counter, agent, …)
 * Nothing here changes. The channel is added in the backend's SaleChannel with its stage, and its
 * tickets arrive already classified ON_BUS or PRE_BOOKED.
 *
 * ## Adding a sale stage
 * Rare, and a product change needing its own ADR. Add its presentation below. Screens iterate
 * stagesToShow(), and a stage this build doesn't recognise already renders as "Other" rather than
 * disappearing.
 */

export type SaleStage = 'ON_BUS' | 'PRE_BOOKED' | 'UNKNOWN';

export interface SaleStageBreakdownEntry {
  stage: SaleStage | string;
  ticketCount: number;
  boardedCount: number;
  amount: number;
}

export interface SaleStagePresentation {
  label: string;
  sectionTitle: string;
  emptyTitle: string;
  emptyMessage: string;
  /** Ionicons name. */
  icon: string;
  color: string;
  background: string;
}

export interface BadgePresentation {
  label: string;
  color: string;
  background: string;
}

type StagedTicket = {
  saleStage?: string | null;
  validationStatus?: string | null;
  fareAmount?: number;
};

const PRESENTATION: Record<string, SaleStagePresentation> = {
  ON_BUS: {
    label: 'On bus',
    sectionTitle: 'Sold on the bus',
    emptyTitle: 'No tickets sold on the bus yet',
    emptyMessage: 'Tickets you issue during this trip will appear here.',
    icon: 'bus-outline',
    color: '#0891B2',
    background: '#E0F7FA',
  },
  PRE_BOOKED: {
    label: 'Pre-booked',
    sectionTitle: 'Pre-booked',
    emptyTitle: 'No pre-booked tickets',
    emptyMessage: 'Tickets passengers buy before boarding will appear here.',
    icon: 'calendar-outline',
    color: '#7C3AED',
    background: '#EDE9FE',
  },
};

const OTHER: SaleStagePresentation = {
  label: 'Other',
  sectionTitle: 'Other tickets',
  emptyTitle: 'No other tickets',
  emptyMessage: '',
  icon: 'help-circle-outline',
  color: '#6B7280',
  background: '#F3F4F6',
};

/**
 * Always shown, in this order, even when empty — a conductor should read "0 pre-booked", not find
 * a section missing and wonder whether it failed to load.
 */
const PRIMARY_STAGES = ['ON_BUS', 'PRE_BOOKED'];

export function stageOfTicket(ticket: { saleStage?: string | null }): string {
  return String(ticket.saleStage || 'UNKNOWN').toUpperCase();
}

export function stagePresentation(stage?: string | null): SaleStagePresentation {
  return PRESENTATION[String(stage || '').toUpperCase()] ?? OTHER;
}

export function isCancelled(ticket: { validationStatus?: string | null }): boolean {
  return String(ticket.validationStatus).toUpperCase() === 'CANCELLED';
}

/** The primary stages, then any other stage present in a summary's breakdown. */
export function stagesForBreakdown(breakdown: SaleStageBreakdownEntry[]): string[] {
  return stagesToShow(breakdown.map((entry) => ({ saleStage: String(entry.stage) })));
}

/** The primary stages, then any other stage actually present in these tickets. */
export function stagesToShow(tickets: { saleStage?: string | null }[]): string[] {
  const extra = new Set<string>();
  for (const ticket of tickets) {
    const stage = stageOfTicket(ticket);
    if (!PRIMARY_STAGES.includes(stage)) {
      extra.add(stage);
    }
  }
  return [...PRIMARY_STAGES, ...extra];
}

/**
 * The boarding badge a ticket needs, if any. A ticket sold on the bus is boarded the moment it is
 * sold, so it gets none — a "Boarded" badge on every on-bus ticket would be noise. Cancelled is
 * shown on any stage.
 */
export function boardingBadge(ticket: StagedTicket): BadgePresentation | null {
  if (isCancelled(ticket)) {
    return { label: 'Cancelled', color: '#6B7280', background: '#F3F4F6' };
  }
  if (stageOfTicket(ticket) !== 'PRE_BOOKED') {
    return null;
  }
  return String(ticket.validationStatus).toUpperCase() === 'VALID'
    ? { label: 'Boarded', color: '#0066FF', background: '#E6F0FF' }
    : { label: 'Awaiting boarding', color: '#B45309', background: '#FEF3C7' };
}

/**
 * Same shape as the trip summary's saleBreakdown, built from a ticket list — for screens that
 * already hold the tickets, and as a fallback if the summary call fails. Cancelled tickets are
 * excluded, matching the backend.
 */
export function saleBreakdownFromTickets(tickets: StagedTicket[]): SaleStageBreakdownEntry[] {
  const byStage = new Map<string, SaleStageBreakdownEntry>();

  for (const ticket of tickets) {
    if (isCancelled(ticket)) {
      continue;
    }
    const stage = stageOfTicket(ticket);
    const entry = byStage.get(stage) ?? { stage, ticketCount: 0, boardedCount: 0, amount: 0 };
    entry.ticketCount += 1;
    if (String(ticket.validationStatus).toUpperCase() === 'VALID') {
      entry.boardedCount += 1;
    }
    entry.amount += ticket.fareAmount || 0;
    byStage.set(stage, entry);
  }

  const order = (stage: string) => {
    const index = PRIMARY_STAGES.indexOf(stage);
    return index === -1 ? PRIMARY_STAGES.length : index;
  };
  return [...byStage.values()].sort((a, b) => order(String(a.stage)) - order(String(b.stage)));
}

/** Pre-booked passengers who have not boarded yet — the number a conductor works from. */
export function awaitingBoarding(breakdown: SaleStageBreakdownEntry[]): number {
  return breakdown
    .filter((entry) => String(entry.stage).toUpperCase() === 'PRE_BOOKED')
    .reduce((total, entry) => total + (entry.ticketCount - entry.boardedCount), 0);
}

/** One line for summary screens, e.g. "On bus 2 · Pre-booked 1 (0 boarded) · Cancelled 1". */
export function describeSaleBreakdown(breakdown: SaleStageBreakdownEntry[], cancelledTickets: number): string {
  const find = (stage: string) => breakdown.find((entry) => String(entry.stage).toUpperCase() === stage);
  const parts: string[] = [];

  for (const stage of PRIMARY_STAGES) {
    const entry = find(stage);
    const count = entry?.ticketCount ?? 0;
    parts.push(stage === 'PRE_BOOKED'
      ? `${stagePresentation(stage).label} ${count} (${entry?.boardedCount ?? 0} boarded)`
      : `${stagePresentation(stage).label} ${count}`);
  }
  for (const entry of breakdown) {
    if (!PRIMARY_STAGES.includes(String(entry.stage).toUpperCase())) {
      parts.push(`${stagePresentation(entry.stage).label} ${entry.ticketCount}`);
    }
  }
  if (cancelledTickets > 0) {
    parts.push(`Cancelled ${cancelledTickets}`);
  }
  return parts.join(' · ');
}
