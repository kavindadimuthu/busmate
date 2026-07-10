/**
 * @module data/operator/revenue
 *
 * Mock ticket and revenue data for the operator portal.
 *
 * Provides realistic ticket records, revenue summaries, and helper
 * functions that simulate backend API responses.  Once the real API
 * endpoints are available, replace these functions with actual fetch calls.
 */

// ── Enums / Literal types ─────────────────────────────────────────

/** Payment methods accepted on buses. */
export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'PASS';

/** Lifecycle status of a ticket. */
export type TicketStatus = 'SOLD' | 'REFUNDED' | 'CANCELLED';

// ── Core data types ───────────────────────────────────────────────

/** Single ticket record issued by a conductor. */
export interface TicketRecord {
  ticketId: string;
  tripId: string;
  scheduleId: string;
  routeId: string;
  conductorId: string;
  conductorName: string;
  busId: string;
  busNumber: string;
  passengerId: string | null;
  pickupLocation: string;
  dropOffLocation: string;
  distanceKm: number;
  issueDateTime: string; // ISO string
  ticketPrice: number;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  routeName: string;
}

/** Aggregated revenue breakdown for a single entity (bus, route, etc.). */
export interface RevenueBreakdownItem {
  id: string;
  label: string;
  subLabel?: string;
  totalRevenue: number;
  ticketsSold: number;
  avgTicketPrice: number;
  refunds: number;
  netRevenue: number;
}

/** Daily revenue summary. */
export interface DailyRevenueSummary {
  date: string;
  totalRevenue: number;
  ticketsSold: number;
  refunds: number;
  netRevenue: number;
}

/** Revenue filter options available in the UI. */
export interface RevenueFilterOptions {
  buses: { value: string; label: string }[];
  routes: { value: string; label: string }[];
  conductors: { value: string; label: string }[];
  paymentMethods: { value: PaymentMethod; label: string }[];
  statuses: { value: TicketStatus; label: string }[];
}

/** KPI summary for the revenue dashboard. */
export interface RevenueKPISummary {
  totalRevenue: number;
  totalTickets: number;
  avgTicketPrice: number;
  totalRefunds: number;
  totalTrips: number;
  cashRevenue: number;
  cardRevenue: number;
  qrRevenue: number;
  passRevenue: number;
  netRevenue: number;
  revenueChange: number;   // percentage change vs previous period
  ticketsChange: number;
}

// ── Locations ─────────────────────────────────────────────────────

const LOCATIONS = [
  'Matara', 'Galle', 'Colombo', 'Tangalle', 'Hambantota', 'Weligama',
  'Mirissa', 'Unawatuna', 'Hikkaduwa', 'Ambalangoda', 'Akuressa',
  'Deniyaya', 'Morawaka', 'Kamburupitiya', 'Hakmana', 'Dickwella',
  'Beliatta', 'Tissamaharama', 'Kataragama', 'Embilipitiya',
];

// ── Mock buses ────────────────────────────────────────────────────

const BUSES = [
  { id: 'bus-001', number: 'ND 4536', name: 'Mandakini Express' },
  { id: 'bus-002', number: 'ND 7892', name: 'Mandakini Super' },
  { id: 'bus-003', number: 'ND 3421', name: 'Mandakini Classic' },
  { id: 'bus-004', number: 'ND 8765', name: 'Mandakini Deluxe' },
  { id: 'bus-005', number: 'ND 9876', name: 'Mandakini Royal' },
];

const ROUTES = [
  { id: 'route-001', name: 'Matara — Galle', from: 'Matara', to: 'Galle' },
  { id: 'route-002', name: 'Matara — Colombo', from: 'Matara', to: 'Colombo' },
  { id: 'route-003', name: 'Matara — Tangalle', from: 'Matara', to: 'Tangalle' },
  { id: 'route-004', name: 'Matara — Hambantota', from: 'Matara', to: 'Hambantota' },
  { id: 'route-005', name: 'Matara — Weligama', from: 'Matara', to: 'Weligama' },
  { id: 'route-006', name: 'Galle — Colombo', from: 'Galle', to: 'Colombo' },
];

const CONDUCTORS = [
  { id: 'cond-001', name: 'Nuwan Silva' },
  { id: 'cond-002', name: 'Roshan Jayawardena' },
  { id: 'cond-003', name: 'Mahinda Rathnayake' },
  { id: 'cond-004', name: 'Sampath Wijesinghe' },
  { id: 'cond-005', name: 'Chandana Senanayake' },
];

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'QR', 'PASS'];
const TICKET_STATUSES: TicketStatus[] = ['SOLD', 'SOLD', 'SOLD', 'SOLD', 'SOLD', 'SOLD', 'SOLD', 'SOLD', 'REFUNDED', 'CANCELLED'];

// ── Deterministic pseudo-random ───────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Generate mock ticket data ─────────────────────────────────────

function generateTickets(): TicketRecord[] {
  const rand = seededRandom(42);
  const tickets: TicketRecord[] = [];

  // Generate tickets for the last 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Each bus runs 4-10 trips per day, each trip has 10-40 tickets
    for (const bus of BUSES) {
      const tripsToday = Math.floor(rand() * 7) + 4;

      for (let trip = 0; trip < tripsToday; trip++) {
        const route = ROUTES[Math.floor(rand() * ROUTES.length)];
        const conductor = CONDUCTORS[Math.floor(rand() * CONDUCTORS.length)];
        const tripId = `trip-${dateStr}-${bus.id}-${trip}`;
        const scheduleId = `sched-${bus.id}-${trip}`;
        const ticketsInTrip = Math.floor(rand() * 31) + 10;

        for (let t = 0; t < ticketsInTrip; t++) {
          const pickupIdx = Math.floor(rand() * LOCATIONS.length);
          let dropIdx = Math.floor(rand() * LOCATIONS.length);
          if (dropIdx === pickupIdx) dropIdx = (dropIdx + 1) % LOCATIONS.length;

          const distance = Math.round((rand() * 80 + 5) * 10) / 10;
          const basePrice = Math.round(distance * 3.5);
          const price = Math.max(30, basePrice + Math.floor(rand() * 20));
          const hour = Math.floor(rand() * 14) + 5; // 5 AM to 7 PM
          const minute = Math.floor(rand() * 60);

          tickets.push({
            ticketId: `TKT-${dateStr.replace(/-/g, '')}-${bus.number.replace(/\s/g, '')}-${String(trip).padStart(2, '0')}${String(t).padStart(3, '0')}`,
            tripId,
            scheduleId,
            routeId: route.id,
            conductorId: conductor.id,
            conductorName: conductor.name,
            busId: bus.id,
            busNumber: bus.number,
            passengerId: rand() > 0.7 ? `PAX-${Math.floor(rand() * 9999).toString().padStart(4, '0')}` : null,
            pickupLocation: LOCATIONS[pickupIdx],
            dropOffLocation: LOCATIONS[dropIdx],
            distanceKm: distance,
            issueDateTime: `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
            ticketPrice: price,
            paymentMethod: PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)],
            status: TICKET_STATUSES[Math.floor(rand() * TICKET_STATUSES.length)],
            routeName: route.name,
          });
        }
      }
    }
  }

  // Sort by issue date descending (newest first)
  tickets.sort((a, b) => b.issueDateTime.localeCompare(a.issueDateTime));
  return tickets;
}

// ── Singleton ticket cache ────────────────────────────────────────

let _ticketCache: TicketRecord[] | null = null;

function getTicketData(): TicketRecord[] {
  if (!_ticketCache) {
    _ticketCache = generateTickets();
  }
  return _ticketCache;
}

// ── Public service functions ──────────────────────────────────────

/**
 * Retrieve all ticket records.
 * Simulates an async backend call with a small delay.
 */
export async function getAllTickets(): Promise<TicketRecord[]> {
  await new Promise((r) => setTimeout(r, 300));
  return getTicketData();
}

/**
 * Get tickets filtered by date range (ISO date strings, inclusive).
 */
export function getTicketsByDateRange(startDate: string, endDate: string): TicketRecord[] {
  return getTicketData().filter((t) => {
    const d = t.issueDateTime.split('T')[0];
    return d >= startDate && d <= endDate;
  });
}

/**
 * Compute KPI summary for a given set of tickets.
 */
export function computeRevenueKPIs(tickets: TicketRecord[]): RevenueKPISummary {
  const sold = tickets.filter((t) => t.status === 'SOLD');
  const refunded = tickets.filter((t) => t.status === 'REFUNDED');

  const totalRevenue = sold.reduce((s, t) => s + t.ticketPrice, 0);
  const refundAmount = refunded.reduce((s, t) => s + t.ticketPrice, 0);
  const uniqueTrips = new Set(sold.map((t) => t.tripId)).size;

  const byMethod = (method: PaymentMethod) =>
    sold.filter((t) => t.paymentMethod === method).reduce((s, t) => s + t.ticketPrice, 0);

  return {
    totalRevenue,
    totalTickets: sold.length,
    avgTicketPrice: sold.length > 0 ? Math.round(totalRevenue / sold.length) : 0,
    totalRefunds: refundAmount,
    totalTrips: uniqueTrips,
    cashRevenue: byMethod('CASH'),
    cardRevenue: byMethod('CARD'),
    qrRevenue: byMethod('QR'),
    passRevenue: byMethod('PASS'),
    netRevenue: totalRevenue - refundAmount,
    revenueChange: 12.5,   // mock percentage change
    ticketsChange: 8.3,
  };
}

/**
 * Build a revenue breakdown grouped by a specific dimension.
 */
export function getRevenueBreakdown(
  tickets: TicketRecord[],
  groupBy: 'bus' | 'route' | 'conductor' | 'paymentMethod',
): RevenueBreakdownItem[] {
  const groups = new Map<string, TicketRecord[]>();

  for (const ticket of tickets) {
    let key: string;
    switch (groupBy) {
      case 'bus':           key = ticket.busId; break;
      case 'route':         key = ticket.routeId; break;
      case 'conductor':     key = ticket.conductorId; break;
      case 'paymentMethod': key = ticket.paymentMethod; break;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ticket);
  }

  const items: RevenueBreakdownItem[] = [];

  for (const [key, group] of groups) {
    const sold = group.filter((t) => t.status === 'SOLD');
    const refunded = group.filter((t) => t.status === 'REFUNDED');
    const totalRev = sold.reduce((s, t) => s + t.ticketPrice, 0);
    const refundAmt = refunded.reduce((s, t) => s + t.ticketPrice, 0);

    let label = key;
    let subLabel: string | undefined;

    switch (groupBy) {
      case 'bus': {
        const bus = BUSES.find((b) => b.id === key);
        label = bus?.number ?? key;
        subLabel = bus?.name;
        break;
      }
      case 'route': {
        const route = ROUTES.find((r) => r.id === key);
        label = route?.name ?? key;
        break;
      }
      case 'conductor': {
        const cond = CONDUCTORS.find((c) => c.id === key);
        label = cond?.name ?? key;
        break;
      }
      case 'paymentMethod': {
        const labels: Record<string, string> = {
          CASH: 'Cash', CARD: 'Card', QR: 'QR Code', PASS: 'Travel Pass',
        };
        label = labels[key] ?? key;
        break;
      }
    }

    items.push({
      id: key,
      label,
      subLabel,
      totalRevenue: totalRev,
      ticketsSold: sold.length,
      avgTicketPrice: sold.length > 0 ? Math.round(totalRev / sold.length) : 0,
      refunds: refundAmt,
      netRevenue: totalRev - refundAmt,
    });
  }

  return items.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get daily revenue summaries for a date range.
 */
export function getDailyRevenueSummaries(tickets: TicketRecord[]): DailyRevenueSummary[] {
  const dayMap = new Map<string, TicketRecord[]>();

  for (const t of tickets) {
    const d = t.issueDateTime.split('T')[0];
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d)!.push(t);
  }

  const summaries: DailyRevenueSummary[] = [];

  for (const [date, group] of dayMap) {
    const sold = group.filter((t) => t.status === 'SOLD');
    const refunded = group.filter((t) => t.status === 'REFUNDED');
    const rev = sold.reduce((s, t) => s + t.ticketPrice, 0);
    const ref = refunded.reduce((s, t) => s + t.ticketPrice, 0);

    summaries.push({
      date,
      totalRevenue: rev,
      ticketsSold: sold.length,
      refunds: ref,
      netRevenue: rev - ref,
    });
  }

  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Returns the available filter option values derived from the current data.
 */
export function getRevenueFilterOptions(): RevenueFilterOptions {
  return {
    buses: BUSES.map((b) => ({ value: b.id, label: `${b.number} — ${b.name}` })),
    routes: ROUTES.map((r) => ({ value: r.id, label: r.name })),
    conductors: CONDUCTORS.map((c) => ({ value: c.id, label: c.name })),
    paymentMethods: [
      { value: 'CASH' as PaymentMethod, label: 'Cash' },
      { value: 'CARD' as PaymentMethod, label: 'Card' },
      { value: 'QR' as PaymentMethod, label: 'QR Code' },
      { value: 'PASS' as PaymentMethod, label: 'Travel Pass' },
    ],
    statuses: [
      { value: 'SOLD' as TicketStatus, label: 'Sold' },
      { value: 'REFUNDED' as TicketStatus, label: 'Refunded' },
      { value: 'CANCELLED' as TicketStatus, label: 'Cancelled' },
    ],
  };
}
