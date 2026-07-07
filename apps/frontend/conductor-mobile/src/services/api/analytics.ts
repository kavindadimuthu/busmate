import { apiClient } from '../apiClient';

export const analyticsApi = {
  // Get conductor insights/analytics - Schedule Management Service
  getConductorInsights: async (conductorId: string, period?: string): Promise<any> => {
    const params = period ? `?conductorId=${conductorId}&period=${period}` : `?conductorId=${conductorId}`;
    return apiClient.authenticatedRequest<any>(`/insights${params}`, {}, 'schedule');
  },

  // Get journey reports - Schedule Management Service
  getJourneyReports: async (conductorId: string, dateRange?: { from: string; to: string }): Promise<any> => {
    let params = `?conductorId=${conductorId}`;
    if (dateRange) {
      params += `&from=${dateRange.from}&to=${dateRange.to}`;
    }
    return apiClient.authenticatedRequest<any>(`/journey-reports${params}`, {}, 'schedule');
  },

  // Get ticket analytics - Ticket Management Service
  getTicketAnalytics: async (conductorId: string, date?: string): Promise<any> => {
    const params = date ? `?conductorId=${conductorId}&date=${date}` : `?conductorId=${conductorId}`;
    return apiClient.authenticatedRequest<any>(`/ticket-analytics${params}`, {}, 'ticket');
  },

  // Get performance metrics - Schedule Management Service
  getPerformanceMetrics: async (conductorId: string): Promise<any> => {
    return apiClient.authenticatedRequest<any>(`/performance?conductorId=${conductorId}`, {}, 'schedule');
  },
};
