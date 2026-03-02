import { TicketControllerService } from '../../../generated/api-clients/ticketing-management';
import { BusOperatorOperationsService } from '../../../generated/api-clients/route-management/services/BusOperatorOperationsService';
import type { TripSummaryDTO } from '../../../generated/api-clients/ticketing-management/models/TripSummaryDTO';
import type { ConductorLogTicketDTO } from '../../../generated/api-clients/ticketing-management/models/ConductorLogTicketDTO';
import type { BusResponse } from '../../../generated/api-clients/route-management/models/BusResponse';

export interface BusRevenueData {
    busId: string;
    busNumber: string;
    busName?: string;
    route?: string;
    totalTrips: number;
    ticketsIssued: number;
    revenue: number;
    averageTicketPrice: number;
}

export interface TripRevenueData {
    tripId: string;
    busId?: string;
    busNumber?: string;
    totalTickets: number;
    revenue: number;
    averageFare: number;
    validTickets: number;
    invalidTickets: number;
}

export interface RevenueByTimeData {
    date: string;
    revenue: number;
    ticketsIssued: number;
    trips: number;
}

export class RevenueService {
    /**
     * Get revenue data for all buses of an operator
     */
    static async getOperatorBusRevenue(operatorId: string): Promise<BusRevenueData[]> {
        try {
            // Get all buses for the operator
            const busesResponse = await BusOperatorOperationsService.getOperatorBuses(
                operatorId,
                0,
                100,
                'plateNumber',
                'asc'
            );

            const buses = busesResponse.content || [];
            const revenueDataPromises = buses.map(async (bus) => {
                return await this.getBusRevenue(bus);
            });

            const revenueData = await Promise.all(revenueDataPromises);
            return revenueData.filter(data => data !== null) as BusRevenueData[];
        } catch (error) {
            console.error('Error fetching operator bus revenue:', error);
            throw error;
        }
    }

    /**
     * Get revenue data for a specific bus
     */
    static async getBusRevenue(bus: BusResponse): Promise<BusRevenueData | null> {
        try {
            const busId = bus.id;
            if (!busId) return null;

            // Get all tickets for this bus
            const tickets = await TicketControllerService.getTicketsByBusId(busId);

            // Calculate revenue metrics
            const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.fareAmount || 0), 0);
            const ticketsIssued = tickets.length;
            const averageTicketPrice = ticketsIssued > 0 ? totalRevenue / ticketsIssued : 0;

            // Get unique trip count (approximate from ticket timestamps)
            const uniqueDates = new Set(
                tickets.map(t => t.issuedAt ? new Date(t.issuedAt).toDateString() : '')
            );
            const totalTrips = uniqueDates.size;

            return {
                busId,
                busNumber: bus.plateNumber || bus.ntcRegistrationNumber || 'Unknown',
                busName: bus.model || undefined,
                route: undefined, // Route info not available in BusResponse
                totalTrips,
                ticketsIssued,
                revenue: totalRevenue,
                averageTicketPrice,
            };
        } catch (error) {
            console.error(`Error fetching revenue for bus ${bus.id}:`, error);
            return null;
        }
    }

    /**
     * Get trip summary with revenue data
     */
    static async getTripRevenue(tripId: string): Promise<TripRevenueData | null> {
        try {
            const summary = await TicketControllerService.getTripSummary(tripId);

            return {
                tripId,
                totalTickets: summary.totalTickets || 0,
                revenue: summary.totalFareAmount || 0,
                averageFare: summary.averageFarePerTicket || 0,
                validTickets: summary.validTickets || 0,
                invalidTickets: summary.invalidTickets || 0,
            };
        } catch (error) {
            console.error(`Error fetching trip revenue for ${tripId}:`, error);
            return null;
        }
    }

    /**
     * Get revenue data grouped by date
     */
    static async getRevenueByDate(
        operatorId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<RevenueByTimeData[]> {
        try {
            const busRevenue = await this.getOperatorBusRevenue(operatorId);

            // For now, aggregate all data since we don't have date filtering on the backend
            // In a real implementation, you'd want backend support for date range queries
            const totalRevenue = busRevenue.reduce((sum, bus) => sum + bus.revenue, 0);
            const totalTickets = busRevenue.reduce((sum, bus) => sum + bus.ticketsIssued, 0);
            const totalTrips = busRevenue.reduce((sum, bus) => sum + bus.totalTrips, 0);

            return [{
                date: new Date().toISOString().split('T')[0],
                revenue: totalRevenue,
                ticketsIssued: totalTickets,
                trips: totalTrips,
            }];
        } catch (error) {
            console.error('Error fetching revenue by date:', error);
            throw error;
        }
    }

    /**
     * Get revenue statistics for payment methods
     * This aggregates ticket data to show revenue by payment status
     */
    static async getRevenueByPaymentStatus(operatorId: string): Promise<{
        paid: number;
        pending: number;
        failed: number;
    }> {
        try {
            const busRevenue = await this.getOperatorBusRevenue(operatorId);

            // Get all buses
            const busesResponse = await BusOperatorOperationsService.getOperatorBuses(
                operatorId,
                0,
                100,
                'plateNumber',
                'asc'
            );

            const buses = busesResponse.content || [];
            let paidTotal = 0;
            let pendingTotal = 0;
            let failedTotal = 0;

            for (const bus of buses) {
                if (!bus.id) continue;

                try {
                    const tickets = await TicketControllerService.getTicketsByBusId(bus.id);

                    tickets.forEach(ticket => {
                        const amount = ticket.fareAmount || 0;
                        const status = (ticket.paymentStatus || '').toLowerCase();

                        if (status === 'paid' || status === 'completed') {
                            paidTotal += amount;
                        } else if (status === 'pending') {
                            pendingTotal += amount;
                        } else if (status === 'failed') {
                            failedTotal += amount;
                        }
                    });
                } catch (error) {
                    console.error(`Error fetching tickets for bus ${bus.id}:`, error);
                }
            }

            return {
                paid: paidTotal,
                pending: pendingTotal,
                failed: failedTotal,
            };
        } catch (error) {
            console.error('Error fetching revenue by payment status:', error);
            throw error;
        }
    }
}
