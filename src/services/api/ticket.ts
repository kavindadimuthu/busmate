import { TicketLog } from '../../types/ticket';
import { apiClient } from '../apiClient';

export const ticketApi = {
  // Validate a ticket - Ticket Management Service
  validateTicket: async (ticketId: number, conductorId: string): Promise<{ success: boolean; message: string; isAlreadyValidated?: boolean }> => {
    try {
      console.log(`🎫 Validating ticket ${ticketId} with conductor ${conductorId}`);
      
      // Validate inputs before sending
      if (!ticketId || ticketId <= 0) {
        throw new Error(`Invalid ticket ID: ${ticketId}`);
      }
      
      if (!conductorId || conductorId.trim() === '') {
        throw new Error(`Invalid conductor ID: ${conductorId}`);
      }
      
      const requestPayload = { 
        ticketId: ticketId,
        conductorId: conductorId 
      };
      
      console.log('📤 Sending validation request:', JSON.stringify(requestPayload, null, 2));
      
      const response = await apiClient.authenticatedRequest<any>('/v1/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      }, 'ticket');
      
      console.log('✅ Ticket validation successful');
      return {
        success: true,
        message: response.message || 'Ticket validated successfully'
      };
      
    } catch (error: any) {
      // Handle "already validated" as a known case, not an error
      if (error.message?.toLowerCase().includes('already validated')) {
        console.log('ℹ️ Ticket already validated - this is expected behavior');
        return {
          success: false,
          isAlreadyValidated: true,
          message: 'Ticket is already validated'
        };
      }
      
      // For other errors, log and re-throw for the QR scanner to handle
      console.error('❌ Ticket validation failed:', error.message);
      throw error;
    }
  },

  // Issue a new ticket - Ticket Management Service
  issueTicket: async (ticketData: any): Promise<any> => {
    try {
      console.log('🎫 Attempting to issue ticket with data:', JSON.stringify(ticketData, null, 2));
      
      // Validate required fields before sending
      const requiredFields = ['conductorId', 'busId', 'tripId', 'startLocationId', 'endLocationId', 'fareAmount', 'paymentMethod', 'transactionRef'];
      const missingFields = requiredFields.filter(field => 
        ticketData[field] === undefined || 
        ticketData[field] === null || 
        ticketData[field] === ''
      );
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return {
          success: false,
          error: 'Validation failed',
          message: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Additional validation for data types
      console.log('🔍 Validating data types...');
      const validationIssues = [];
      
      if (typeof ticketData.fareAmount !== 'number' || ticketData.fareAmount <= 0) {
        validationIssues.push('fareAmount must be a positive number');
      }
      
      if (typeof ticketData.conductorId !== 'string' || !ticketData.conductorId.trim()) {
        validationIssues.push('conductorId must be a non-empty string');
      }
      
      if (typeof ticketData.busId !== 'string' || !ticketData.busId.trim()) {
        validationIssues.push('busId must be a non-empty string');
      }
      
      if (typeof ticketData.tripId !== 'string' || !ticketData.tripId.trim()) {
        validationIssues.push('tripId must be a non-empty string');
      }

      if (validationIssues.length > 0) {
        console.error('❌ Data validation failed:', validationIssues);
        return {
          success: false,
          error: 'Data validation failed',
          message: `Invalid data: ${validationIssues.join(', ')}`
        };
      }
      
      // Validate data integrity before sending to backend
      console.log('🔍 Performing pre-flight checks...');
      
      // Check for suspicious data patterns that might cause server errors
      const dataChecks = {
        tripIdFormat: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketData.tripId),
        busIdFormat: /^[0-9a-f-]{36}$/i.test(ticketData.busId),
        conductorIdFormat: /^[0-9a-f-]{36}$/i.test(ticketData.conductorId),
        locationIdFormat: /^[0-9a-f-]{36}$/i.test(ticketData.startLocationId) && /^[0-9a-f-]{36}$/i.test(ticketData.endLocationId),
        fareAmountValid: Number.isFinite(ticketData.fareAmount) && ticketData.fareAmount > 0,
        paymentMethodValid: ['CASH', 'CARD', 'DIGITAL', 'QR'].includes(ticketData.paymentMethod?.toUpperCase()),
      };
      
      console.log('🔍 Data format checks:', dataChecks);
      
      const failedChecks = Object.entries(dataChecks)
        .filter(([key, passed]) => !passed)
        .map(([key]) => key);
        
      if (failedChecks.length > 0) {
        console.warn('⚠️ Data format warnings:', failedChecks);
        // Don't fail here, just warn, as server might accept different formats
      }

      // Log the exact request being sent
      console.log('📤 Sending ticket request to API...');
      console.log('🔍 Final payload validation:', {
        conductorId: typeof ticketData.conductorId,
        busId: typeof ticketData.busId,
        tripId: typeof ticketData.tripId,
        startLocationId: typeof ticketData.startLocationId,
        endLocationId: typeof ticketData.endLocationId,
        fareAmount: typeof ticketData.fareAmount,
        paymentMethod: typeof ticketData.paymentMethod,
        transactionRef: typeof ticketData.transactionRef
      });
      
      const response = await apiClient.authenticatedRequest<any>('/v1/tickets/conductor/issue', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      }, 'ticket');
      
      console.log('✅ Ticket issued successfully:', response);
      return {
        success: true,
        data: response,
        message: 'Ticket issued successfully'
      };
    } catch (error: any) {
      console.error('❌ Error issuing ticket:', error);
      console.log('🔍 Detailed error information:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack?.substring(0, 200) + '...'
      });
      
      // Handle different types of errors
      if (error.message === 'UNAUTHORIZED') {
        return {
          success: false,
          error: 'Authentication failed',
          message: 'Your session has expired. Please login again to continue.'
        };
      }
      
      if (error.message.includes('Permission denied') || error.message.includes('HTTP 403')) {
        return {
          success: false,
          error: 'Permission denied',
          message: 'You do not have permission to issue tickets. Please contact your administrator or check if you are logged in with the correct conductor account.'
        };
      }
      
      if (error.message.includes('JSON Parse error') || error.message.includes('content type')) {
        return {
          success: false,
          error: 'Server response error',
          message: 'Server returned invalid response. The ticket service may be temporarily unavailable.'
        };
      }
      
      if (error.message.includes('HTTP 404')) {
        return {
          success: false,
          error: 'Service not found',
          message: 'Ticket service endpoint not found. Please check your app version or contact support.'
        };
      }
      
      if (error.message.includes('HTTP 500') || error.message.includes('Internal server error')) {
        return {
          success: false,
          error: 'Server error',
          message: 'Server is experiencing issues processing your ticket. This could be due to invalid trip/bus/location data. Please try again or contact support if the issue persists.'
        };
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return {
          success: false,
          error: 'Connection error',
          message: 'Network connection failed. Please check your internet connection and try again.'
        };
      }
      
      // Generic error handling
      return {
        success: false,
        error: error.message || 'Unknown error',
        message: 'Failed to issue ticket. Please check your connection and try again. If the problem persists, contact support.'
      };
    }
  },

  // Get ticket by ID - Ticket Management Service
  getTicketById: async (ticketId: string): Promise<any> => {
    return apiClient.authenticatedRequest<any>(`/tickets/${ticketId}`, {}, 'ticket');
  },

  // Get scan history - Ticket Management Service
  getScanHistory: async (conductorId: string): Promise<any[]> => {
    return apiClient.authenticatedRequest<any[]>(`/scan-history?conductorId=${conductorId}`, {}, 'ticket');
  },

  // Print ticket - Ticket Management Service
  printTicket: async (ticketId: string): Promise<any> => {
    return apiClient.authenticatedRequest<any>(`/print/${ticketId}`, {
      method: 'POST',
    }, 'ticket');
  },

  // Get ticket statistics - Ticket Management Service
  getTicketStats: async (conductorId: string, date?: string): Promise<any> => {
    const params = date ? `?conductorId=${conductorId}&date=${date}` : `?conductorId=${conductorId}`;
    return apiClient.authenticatedRequest<any>(`/stats${params}`, {}, 'ticket');
  },

  // Get conductor ticket logs for insights - Ticket Management Service
  getConductorTicketLogs: async (conductorId: string): Promise<TicketLog[]> => {
    try {
      console.log('📊 Fetching conductor ticket logs for ID:', conductorId);
      
      const response = await apiClient.authenticatedRequest<TicketLog[]>(
        `/v1/tickets/conductor/${conductorId}/logs`, 
        {}, 
        'ticket'
      );
      
      console.log('✅ Successfully fetched ticket logs:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching conductor ticket logs:', error);
      
      // Handle different types of errors
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('Your session has expired. Please login again to continue.');
      }
      
      if (error.message.includes('Permission denied') || error.message.includes('HTTP 403')) {
        throw new Error('You do not have permission to view insights. Please contact your administrator.');
      }
      
      if (error.message.includes('HTTP 404')) {
        throw new Error('Conductor not found or no ticket data available.');
      }
      
      if (error.message.includes('HTTP 500')) {
        throw new Error('Server is experiencing issues. Please try again later.');
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      // Generic error handling
      throw new Error('Failed to fetch insights data. Please try again later.');
    }
  },

  // Get tickets by trip ID - Ticket Management Service  
  getTicketsByTripId: async (tripId: string): Promise<TicketLog[]> => {
    try {
      console.log('🎫 Fetching tickets for trip ID:', tripId);
      
      const response = await apiClient.authenticatedRequest<TicketLog[]>(
        `/v1/tickets/trip/${tripId}`, 
        {}, 
        'ticket'
      );
      
      console.log('✅ Successfully fetched tickets for trip:', response);
      return response;
    } catch (error: any) {
      // Handle the specific case where no tickets are found for a trip - this is NORMAL
      if (error.message?.includes('No tickets found') || 
          error.message?.includes('not found') ||
          (error.message?.includes('HTTP 404') && !error.message?.includes('Trip not found'))) {
        console.log(`ℹ️ No tickets found for trip ${tripId} - this is normal for trips without passengers`);
        return []; // Return empty array instead of throwing error
      }
      
      console.error('❌ Error fetching trip tickets:', error);
      
      // Handle different types of errors
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('Your session has expired. Please login again to continue.');
      }
      
      if (error.message.includes('Permission denied') || error.message.includes('HTTP 403')) {
        throw new Error('You do not have permission to view ticket data. Please contact your administrator.');
      }
      
      if (error.message.includes('Trip not found')) {
        throw new Error('Trip not found. Please check the trip ID.');
      }
      
      if (error.message.includes('HTTP 500')) {
        throw new Error('Server is experiencing issues. Please try again later.');
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      // Generic error handling for other errors
      console.log(`⚠️ Unexpected error for trip ${tripId}, treating as no tickets:`, error.message);
      return []; // Return empty array for any other errors to avoid breaking the entire insights loading
    }
  },

  // Get trip summary statistics - Ticket Management Service
  getTripSummary: async (tripId: string): Promise<{
    totalPassengers: number;
    totalRevenue: number;
    physicalTickets: number;
    onlineTickets: number;
    physicalTicketRevenue: number;
    onlineTicketRevenue: number;
  }> => {
    try {
      console.log('📊 Fetching trip summary for trip ID:', tripId);
      
      // Get all tickets for the trip
      const tickets = await ticketApi.getTicketsByTripId(tripId);
      
      // Calculate statistics from the tickets
      const physicalTickets = tickets.filter(ticket => ticket.paymentStatus === 'CONDUCTOR');
      const onlineTickets = tickets.filter(ticket => ticket.paymentStatus === 'ONLINE');
      
      const totalPassengers = tickets.reduce((total, ticket) => total + ticket.passengerCount, 0);
      const totalRevenue = tickets.reduce((total, ticket) => total + ticket.fareAmount, 0);
      
      const physicalTicketRevenue = physicalTickets.reduce((total, ticket) => total + ticket.fareAmount, 0);
      const onlineTicketRevenue = onlineTickets.reduce((total, ticket) => total + ticket.fareAmount, 0);
      
      const summary = {
        totalPassengers,
        totalRevenue,
        physicalTickets: physicalTickets.length,
        onlineTickets: onlineTickets.length,
        physicalTicketRevenue,
        onlineTicketRevenue
      };
      
      console.log('✅ Trip summary calculated:', summary);
      return summary;
      
    } catch (error: any) {
      console.error('❌ Error fetching trip summary:', error);
      
      // Return default values if there's an error
      return {
        totalPassengers: 0,
        totalRevenue: 0,
        physicalTickets: 0,
        onlineTickets: 0,
        physicalTicketRevenue: 0,
        onlineTicketRevenue: 0
      };
    }
  },

  // Get seat bookings for a trip - Ticket Management Service
  getSeatBookings: async (tripId: string): Promise<{
    seatNumber: string;
    status: 'available' | 'booked' | 'validated';
    passengerName?: string;
    ticketId?: string;
    paymentStatus?: string;
  }[]> => {
    try {
      console.log('🪑 Fetching seat bookings for trip ID:', tripId);
      
      // Get all tickets for the trip
      const tickets = await ticketApi.getTicketsByTripId(tripId);
      
      // Create seat map for all 49 seats
      const seatMap: { [key: string]: any } = {};
      
      // Initialize all 49 seats as available
      for (let i = 1; i <= 49; i++) {
        seatMap[i.toString()] = {
          seatNumber: i.toString(),
          status: 'available' as const
        };
      }
      
      // Update seat status based on bookings
      tickets.forEach(ticket => {
        if (ticket.seatNumber && ticket.seatNumber.trim() !== '') {
          // Handle multiple seat numbers (comma-separated)
          const seatNumbers = ticket.seatNumber.split(',').map(s => s.trim());
          
          seatNumbers.forEach(seatNum => {
            if (seatMap[seatNum]) {
              seatMap[seatNum] = {
                seatNumber: seatNum,
                status: ticket.paymentStatus === 'VALIDATED' ? 'validated' : 'booked',
                passengerName: ticket.passengerId || 'Unknown Passenger',
                ticketId: ticket.ticketId?.toString(),
                paymentStatus: ticket.paymentStatus
              };
            }
          });
        }
      });
      
      // Convert to array and sort by seat number
      const seatBookings = Object.values(seatMap).sort((a, b) => 
        parseInt(a.seatNumber) - parseInt(b.seatNumber)
      );
      
      console.log('✅ Seat bookings fetched:', seatBookings.length, 'seats');
      return seatBookings;
      
    } catch (error: any) {
      console.error('❌ Error fetching seat bookings:', error);
      
      // Return default available seats if there's an error
      const defaultSeats = [];
      for (let i = 1; i <= 49; i++) {
        defaultSeats.push({
          seatNumber: i.toString(),
          status: 'available' as const
        });
      }
      return defaultSeats;
    }
  },
};
