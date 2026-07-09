import { useAuth } from '@/hooks/auth/useAuth';
import { journeyApi } from '@/services/api/journey';
import { ticketApi } from '@/services/api/ticket';
import { TicketLog } from '@/types/ticket';
import {
  BusInfo,
  SeatCell,
  SeatLayout,
  SeatMapStats,
  SeatStatus,
} from '@/types/seatMap';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Real seat map for a trip. Merges the **static bus seat layout** (core-service, via
 * journeyApi.getBusById) with the **dynamic per-trip bookings** (ticketing-service, via
 * ticketApi.getTicketsByTripId): each seat becomes available / booked / validated / blocked.
 * A ticket's `validationStatus === 'VALID'` -> validated; otherwise booked. `issueMethod`
 * distinguishes online bookings from conductor-issued cash tickets.
 */
export function useSeatMap(tripId?: string, busId?: string) {
  const { user } = useAuth();
  const [bus, setBus] = useState<BusInfo | null>(null);
  const [tickets, setTickets] = useState<TicketLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingTicketId, setValidatingTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tripId || !busId) {
      setError('No ongoing trip found');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      // Bus layout (core) and trip tickets (ticketing) are independent — fetch in parallel.
      // Tickets may legitimately be empty (a trip with no passengers yet) — not an error.
      const [busInfo, tripTickets] = await Promise.all([
        journeyApi.getBusById(busId),
        ticketApi.getTicketsByTripId(tripId).catch(() => [] as TicketLog[]),
      ]);
      setBus(busInfo);
      setTickets(tripTickets);
    } catch (err: any) {
      console.error('❌ Error building seat map:', err);
      setError(err?.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  }, [tripId, busId]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  // Fallback layout if a bus somehow has none (core-service normally always fills a default).
  const layout: SeatLayout = useMemo(() => {
    if (bus?.seatLayout?.rows?.length) return bus.seatLayout;
    const capacity = bus?.capacity ?? 0;
    const rows = [] as SeatLayout['rows'];
    let n = 1;
    while (n <= capacity) {
      const left: string[] = [];
      const right: string[] = [];
      for (let i = 0; i < 2 && n <= capacity; i++) left.push(String(n++));
      for (let i = 0; i < 2 && n <= capacity; i++) right.push(String(n++));
      rows.push({ left, right });
    }
    return { layoutName: `2+2 (${capacity})`, rows, blockedSeats: [] };
  }, [bus]);

  // seatNumber -> ticket. A ticket may carry comma-separated seats.
  const bookingBySeat = useMemo(() => {
    const map = new Map<string, TicketLog>();
    tickets.forEach((t) => {
      if (!t.seatNumber) return;
      t.seatNumber.split(',').map((s) => s.trim()).filter(Boolean).forEach((seat) => {
        map.set(seat, t);
      });
    });
    return map;
  }, [tickets]);

  const blocked = useMemo(
    () => new Set((layout.blockedSeats ?? []).map((s) => String(s))),
    [layout],
  );

  const seatOf = useCallback(
    (seatNumber: string): SeatCell => {
      const ticket = bookingBySeat.get(seatNumber);
      if (ticket) {
        const validated = String(ticket.validationStatus).toUpperCase() === 'VALID';
        const status: SeatStatus = validated ? 'validated' : 'booked';
        return {
          seatNumber,
          status,
          ticketId: String(ticket.ticketId),
          passengerId: ticket.passengerId,
          issueMethod: ticket.issueMethod,
          validationStatus: ticket.validationStatus,
          fareAmount: ticket.fareAmount,
          startLocationId: ticket.startLocationId,
          endLocationId: ticket.endLocationId,
        };
      }
      return { seatNumber, status: blocked.has(seatNumber) ? 'blocked' : 'available' };
    },
    [bookingBySeat, blocked],
  );

  // Occupied seats -> passenger list (one row per booked/validated seat).
  const passengers: SeatCell[] = useMemo(() => {
    const cells: SeatCell[] = [];
    layout.rows.forEach((row) => {
      [...(row.left ?? []), ...(row.right ?? []), ...(row.back ?? [])].forEach((seat) => {
        const cell = seatOf(seat);
        if (cell.status === 'booked' || cell.status === 'validated') cells.push(cell);
      });
    });
    return cells;
  }, [layout, seatOf]);

  const stats: SeatMapStats = useMemo(() => {
    let total = 0, available = 0, booked = 0, validated = 0, blockedCount = 0, online = 0, cash = 0;
    layout.rows.forEach((row) => {
      [...(row.left ?? []), ...(row.right ?? []), ...(row.back ?? [])].forEach((seat) => {
        total++;
        const cell = seatOf(seat);
        if (cell.status === 'available') available++;
        else if (cell.status === 'booked') booked++;
        else if (cell.status === 'validated') validated++;
        else if (cell.status === 'blocked') blockedCount++;
        if (cell.status === 'booked' || cell.status === 'validated') {
          if (String(cell.issueMethod).toUpperCase() === 'ONLINE') online++;
          else cash++;
        }
      });
    });
    return { total, available, booked, validated, blocked: blockedCount, online, cash };
  }, [layout, seatOf]);

  const validateTicket = useCallback(
    async (ticketId: string): Promise<boolean> => {
      if (!user?.id) return false;
      setValidatingTicketId(ticketId);
      try {
        const res = await ticketApi.validateTicket(Number(ticketId), String(user.id));
        await fetchAll();
        return res.success || !!res.isAlreadyValidated;
      } catch (err) {
        console.error('Failed to validate ticket:', err);
        return false;
      } finally {
        setValidatingTicketId(null);
      }
    },
    [user?.id, fetchAll],
  );

  return {
    bus,
    layout,
    seatOf,
    passengers,
    stats,
    loading,
    error,
    refresh: fetchAll,
    validateTicket,
    validatingTicketId,
  };
}
