import { useCallback, useEffect, useState } from 'react';
import { journeyApi } from '../../services/api/journey';
import { ticketApi } from '../../services/api/ticket';
import { Trip } from '../../types/journey';
import { InsightsData, TicketLog } from '../../types/ticket';

type TimeFilter = 'today' | 'lastWeek' | 'lastMonth' | 'custom';

interface UseInsightsOptions {
  conductorId: string;
  customFromDate?: Date;
  customToDate?: Date;
  autoFetch?: boolean; // Add option to control auto-fetching
}

interface UseInsightsReturn {
  insightsData: Record<TimeFilter, InsightsData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  rawTicketLogs: TicketLog[];
  rawTrips: Trip[];
}

export const useInsights = ({
  conductorId,
  customFromDate,
  customToDate,
  autoFetch = false, // Default to not auto-fetch
}: UseInsightsOptions): UseInsightsReturn => {
  const [rawTicketLogs, setRawTicketLogs] = useState<TicketLog[]>([]);
  const [rawTrips, setRawTrips] = useState<Trip[]>([]);
  const [insightsData, setInsightsData] = useState<Record<TimeFilter, InsightsData>>({
    today: {
      totalPassengers: { value: 0, trend: '', trending: 'same' },
      moneyCollected: { value: 0, trend: '', trending: 'same' },
      tripsCompleted: { value: 0, trend: '', trending: 'same' },
      qrValidations: { value: 0, trend: '', trending: 'same' },
      paymentBreakdown: { cash: { amount: 0, percentage: 0 }, qr: { amount: 0, percentage: 0 } },
    },
    lastWeek: {
      totalPassengers: { value: 0, trend: '', trending: 'same' },
      moneyCollected: { value: 0, trend: '', trending: 'same' },
      tripsCompleted: { value: 0, trend: '', trending: 'same' },
      qrValidations: { value: 0, trend: '', trending: 'same' },
      paymentBreakdown: { cash: { amount: 0, percentage: 0 }, qr: { amount: 0, percentage: 0 } },
    },
    lastMonth: {
      totalPassengers: { value: 0, trend: '', trending: 'same' },
      moneyCollected: { value: 0, trend: '', trending: 'same' },
      tripsCompleted: { value: 0, trend: '', trending: 'same' },
      qrValidations: { value: 0, trend: '', trending: 'same' },
      paymentBreakdown: { cash: { amount: 0, percentage: 0 }, qr: { amount: 0, percentage: 0 } },
    },
    custom: {
      totalPassengers: { value: 0, trend: '', trending: 'same' },
      moneyCollected: { value: 0, trend: '', trending: 'same' },
      tripsCompleted: { value: 0, trend: '', trending: 'same' },
      qrValidations: { value: 0, trend: '', trending: 'same' },
      paymentBreakdown: { cash: { amount: 0, percentage: 0 }, qr: { amount: 0, percentage: 0 } },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWithinLastWeek = (date: Date): boolean => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  };

  const isWithinLastMonth = (date: Date): boolean => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  };

  const isWithinCustomRange = (date: Date): boolean => {
    if (!customFromDate || !customToDate) return false;
    return date >= customFromDate && date <= customToDate;
  };

  const filterTicketsByPeriod = useCallback((tickets: TicketLog[], period: TimeFilter): TicketLog[] => {
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.issuedAt);
      
      switch (period) {
        case 'today':
          return isToday(ticketDate);
        case 'lastWeek':
          return isWithinLastWeek(ticketDate);
        case 'lastMonth':
          return isWithinLastMonth(ticketDate);
        case 'custom':
          return isWithinCustomRange(ticketDate);
        default:
          return false;
      }
    });
  }, [customFromDate, customToDate]);

  const filterTripsByPeriod = useCallback((trips: Trip[], period: TimeFilter): Trip[] => {
    return trips.filter(trip => {
      const tripDate = new Date(trip.tripDate);
      
      switch (period) {
        case 'today':
          return isToday(tripDate);
        case 'lastWeek':
          return isWithinLastWeek(tripDate);
        case 'lastMonth':
          return isWithinLastMonth(tripDate);
        case 'custom':
          return isWithinCustomRange(tripDate);
        default:
          return false;
      }
    });
  }, [customFromDate, customToDate]);

  const calculateInsights = useCallback((tickets: TicketLog[], trips: Trip[], period: TimeFilter): InsightsData => {
    const periodTickets = filterTicketsByPeriod(tickets, period);
    const periodTrips = filterTripsByPeriod(trips, period);
    
    // Separate tickets by payment method based on paymentStatus
    const cashTickets = periodTickets.filter(ticket => ticket.paymentStatus === 'CONDUCTOR');
    const onlineTickets = periodTickets.filter(ticket => ticket.paymentStatus === 'ONLINE');
    
    // Calculate totals
    const cashPassengers = cashTickets.reduce((sum, ticket) => sum + ticket.passengerCount, 0);
    const onlinePassengers = onlineTickets.reduce((sum, ticket) => sum + ticket.passengerCount, 0);
    const totalPassengers = cashPassengers + onlinePassengers;
    
    const cashRevenue = cashTickets.reduce((sum, ticket) => sum + ticket.fareAmount, 0);
    const onlineRevenue = onlineTickets.reduce((sum, ticket) => sum + ticket.fareAmount, 0);
    const totalRevenue = cashRevenue + onlineRevenue;
    
    // Use actual trips count from trips API instead of calculated routes
    const tripsCompleted = periodTrips.filter(trip => 
      trip.status === 'completed' || trip.status === 'in_transit'
    ).length;
    
    // QR validations are the online payments (when paymentStatus is ONLINE)
    const qrValidations = onlineTickets.length;
    
    // Calculate payment breakdown percentages
    const cashPercentage = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
    const onlinePercentage = 100 - cashPercentage;

    // Calculate trends (simplified - just showing current values)
    const getTrend = (value: number, label: string) => {
      if (period === 'custom') {
        return 'For selected period';
      }
      return `${value} ${label}`;
    };

    return {
      totalPassengers: {
        value: totalPassengers,
        trend: getTrend(totalPassengers, period === 'today' ? 'today' : `in ${period}`),
        trending: 'same',
      },
      moneyCollected: {
        value: totalRevenue,
        trend: getTrend(totalRevenue, period === 'today' ? 'today' : `in ${period}`),
        trending: 'same',
      },
      tripsCompleted: {
        value: tripsCompleted,
        trend: getTrend(tripsCompleted, period === 'today' ? 'today' : `in ${period}`),
        trending: 'same',
      },
      qrValidations: {
        value: qrValidations,
        trend: getTrend(qrValidations, period === 'today' ? 'today' : `in ${period}`),
        trending: 'same',
      },
      paymentBreakdown: {
        cash: {
          amount: cashRevenue,
          percentage: cashPercentage,
        },
        qr: {
          amount: onlineRevenue,
          percentage: onlinePercentage,
        },
      },
    };
  }, [filterTicketsByPeriod, filterTripsByPeriod]);

  const fetchTicketLogs = useCallback(async () => {
    if (!conductorId) {
      setError('Conductor ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching trips and tickets for conductor:', conductorId);
      
      // Step 1: Get all trips for the conductor
      const trips = await journeyApi.getConductorTrips(conductorId);
      setRawTrips(trips);
      
      // Step 2: Get tickets for each trip
      const allTickets: TicketLog[] = [];
      let tripsWithTickets = 0;
      let emptyTrips = 0;
      
      for (const trip of trips) {
        try {
          const tripTickets = await ticketApi.getTicketsByTripId(trip.id);
          if (tripTickets.length > 0) {
            allTickets.push(...tripTickets);
            tripsWithTickets++;
          } else {
            emptyTrips++;
          }
        } catch (tripError) {
          console.warn(`⚠️ Failed to fetch tickets for trip ${trip.id}:`, tripError);
          emptyTrips++;
          // Continue with other trips even if one fails
        }
      }
      
      console.log(`📊 Trip summary: ${trips.length} total, ${tripsWithTickets} with tickets, ${emptyTrips} empty/failed`);
      console.log(`🎫 Total tickets collected: ${allTickets.length}`);
      
      setRawTicketLogs(allTickets);
      
      // Calculate insights for all periods
      const newInsightsData: Record<TimeFilter, InsightsData> = {
        today: calculateInsights(allTickets, trips, 'today'),
        lastWeek: calculateInsights(allTickets, trips, 'lastWeek'),
        lastMonth: calculateInsights(allTickets, trips, 'lastMonth'),
        custom: calculateInsights(allTickets, trips, 'custom'),
      };
      
      setInsightsData(newInsightsData);
      console.log('✅ Successfully processed insights data');
    } catch (err: any) {
      console.error('❌ Error fetching data:', err);
      setError(err.message || 'Failed to fetch insights data');
    } finally {
      setLoading(false);
    }
  }, [conductorId, calculateInsights]);

  const refetch = useCallback(async () => {
    await fetchTicketLogs();
  }, [fetchTicketLogs]);

  useEffect(() => {
    if (autoFetch) {
      fetchTicketLogs();
    }
  }, [fetchTicketLogs, autoFetch]);

  // Recalculate custom period data when date range changes
  useEffect(() => {
    if (rawTicketLogs.length > 0 && rawTrips.length > 0) {
      const customData = calculateInsights(rawTicketLogs, rawTrips, 'custom');
      setInsightsData(prev => ({
        ...prev,
        custom: customData,
      }));
    }
  }, [customFromDate, customToDate, rawTicketLogs, rawTrips, calculateInsights]);

  return {
    insightsData,
    loading,
    error,
    refetch,
    rawTicketLogs,
    rawTrips,
  };
};