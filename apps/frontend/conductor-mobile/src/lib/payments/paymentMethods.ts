/**
 * How payment methods are presented in conductor-mobile (INC-009, ADR-011).
 *
 * ## Adding a payment method
 *
 * Add an entry to PRESENTATION below. That is the whole frontend change — no screen, chart or
 * summary needs editing, because they all render whatever methods the backend reports.
 *
 * Adding the entry is also **optional**: a method this build has never heard of still renders,
 * with neutral styling and its raw code as the label, and its money still counts toward the
 * totals. Missing an icon is a cosmetic gap, never a missing-revenue bug.
 *
 * Labels live here rather than coming from the backend because BusMate is trilingual — the
 * client knows the viewer's language, the server doesn't. When i18n arrives these become
 * translation keys; the shape doesn't change.
 */

/** Who is holding the money. Backend-authoritative — never inferred from the method code here. */
export type Custody = 'ON_HAND' | 'SETTLED' | 'UNKNOWN';

export interface PaymentBreakdownEntry {
  method: string;
  custody: Custody | string;
  amount: number;
  ticketCount: number;
}

export interface PaymentMethodPresentation {
  label: string;
  /** Ionicons name. */
  icon: string;
  color: string;
  background: string;
}

const PRESENTATION: Record<string, PaymentMethodPresentation> = {
  CASH: { label: 'Cash', icon: 'cash-outline', color: '#00A854', background: '#E6FFF2' },
  CARD: { label: 'Card', icon: 'card-outline', color: '#0066FF', background: '#E6F0FF' },
  // Colours must stay visually distinct from each other: they are pie-chart slice colours too.
  PAYHERE: { label: 'Online', icon: 'globe-outline', color: '#8B5CF6', background: '#F3EEFF' },
};

const UNRECOGNISED: PaymentMethodPresentation = {
  label: 'Other',
  icon: 'ellipse-outline',
  color: '#6B7280',
  background: '#F3F4F6',
};

/** Presentation for a method code, falling back to neutral styling that names the code itself. */
export function presentationFor(method?: string | null): PaymentMethodPresentation {
  const code = String(method || '').toUpperCase();
  if (PRESENTATION[code]) {
    return PRESENTATION[code];
  }
  if (!code || code === 'UNKNOWN') {
    return { ...UNRECOGNISED, label: 'Unknown' };
  }
  // A method the backend knows about but this build doesn't: show the code rather than hide it.
  return { ...UNRECOGNISED, label: titleCase(code) };
}

function titleCase(code: string): string {
  return code.charAt(0) + code.slice(1).toLowerCase();
}

/**
 * Cash the conductor is personally accountable for handing over at the end of the shift.
 * Summed from custody, never from a list of method codes — that is what keeps it correct when a
 * payment method is added.
 */
export function cashOnHand(breakdown: PaymentBreakdownEntry[]): number {
  return sumWhere(breakdown, 'ON_HAND');
}

/** Fares that reached the operator's account directly, bypassing the conductor. */
export function settledRevenue(breakdown: PaymentBreakdownEntry[]): number {
  return sumWhere(breakdown, 'SETTLED');
}

/** Money whose custody the backend could not classify — surfaced, never dropped from a total. */
export function unclassifiedRevenue(breakdown: PaymentBreakdownEntry[]): number {
  return breakdown
    .filter((entry) => String(entry.custody).toUpperCase() !== 'ON_HAND'
      && String(entry.custody).toUpperCase() !== 'SETTLED')
    .reduce((total, entry) => total + (entry.amount || 0), 0);
}

export function totalRevenue(breakdown: PaymentBreakdownEntry[]): number {
  return breakdown.reduce((total, entry) => total + (entry.amount || 0), 0);
}

/** Share of revenue collected without cash changing hands — BusMate's F-1 go-to-market metric. */
export function digitalSharePercent(breakdown: PaymentBreakdownEntry[]): number {
  const total = totalRevenue(breakdown);
  if (total <= 0) {
    return 0;
  }
  return Math.round((settledRevenue(breakdown) / total) * 100);
}

/**
 * Groups a ticket list into the same breakdown shape the summary endpoint returns — for the
 * period-filtered insights view, and as a fallback when the summary call itself fails.
 *
 * Note it reads each ticket's backend-supplied method AND custody rather than classifying
 * anything locally: that is what stops this becoming a second copy of the mapping that has to
 * be updated whenever a payment method is added.
 */
export function breakdownFromTickets(
  tickets: { paymentMethod?: string | null; custody?: string | null; fareAmount: number }[],
): PaymentBreakdownEntry[] {
  const byMethod = new Map<string, PaymentBreakdownEntry>();

  for (const ticket of tickets) {
    const method = String(ticket.paymentMethod || 'UNKNOWN').toUpperCase();
    const existing = byMethod.get(method);
    if (existing) {
      existing.amount += ticket.fareAmount || 0;
      existing.ticketCount += 1;
    } else {
      byMethod.set(method, {
        method,
        custody: String(ticket.custody || 'UNKNOWN').toUpperCase(),
        amount: ticket.fareAmount || 0,
        ticketCount: 1,
      });
    }
  }

  // Cash first (it's the number a conductor is accountable for), then everything else, so rows
  // don't reshuffle between refreshes.
  return [...byMethod.values()].sort((a, b) => rank(a.method) - rank(b.method));
}

function rank(method: string): number {
  const order = ['CASH', 'CARD', 'PAYHERE'];
  const index = order.indexOf(method.toUpperCase());
  return index === -1 ? order.length : index;
}

function sumWhere(breakdown: PaymentBreakdownEntry[], custody: Custody): number {
  return breakdown
    .filter((entry) => String(entry.custody).toUpperCase() === custody)
    .reduce((total, entry) => total + (entry.amount || 0), 0);
}
