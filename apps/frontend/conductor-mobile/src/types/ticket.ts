// API request types for backend integration
export interface IssueTicketRequest {
  conductorId: string;
  busId: string;
  tripId: string;
  startLocationId: string;
  endLocationId: string;
  fareAmount: number;
  paymentMethod: string;
  transactionRef: string;
}

export interface IssueTicketResponse {
  success: boolean;
  message: string;
  ticketId?: string;
  timestamp?: string;
}


export interface TicketDetails {
  id: string;
  from: string;
  to: string;
  platform: string;
  gate: string;
  passengers: string;
  fare: string;
  issuedOn: string;
  phoneNumber?: string;
  // Backend data
  conductorId?: number;
  busId?: number;
  tripId?: number;
  startLocationId?: string;
  endLocationId?: string;
  fareAmount?: number;
  paymentMethod?: string;
  transactionRef?: string;
}

// Ticket log types for insights
export interface TicketLog {
  ticketId: number;
  passengerId: string | null;
  startLocationId: string;
  endLocationId: string;
  seatNumber: string | null;
  passengerCount: number;
  fareAmount: number;
  paymentStatus: string;
  // CONDUCTOR (cash issued on the bus) vs ONLINE (passenger booked online).
  issueMethod?: 'CONDUCTOR' | 'ONLINE' | string | null;
  // VALID (validated / boarded) vs NOT_VALID (booked, not yet validated).
  validationStatus?: 'VALID' | 'NOT_VALID' | string | null;
  issuedAt: string;
}

export interface InsightsData {
  totalPassengers: {
    value: number;
    trend: string;
    trending: 'up' | 'down' | 'same';
  };
  moneyCollected: {
    value: number;
    trend: string;
    trending: 'up' | 'down' | 'same';
  };
  tripsCompleted: {
    value: number;
    trend: string;
    trending: 'up' | 'down' | 'same';
  };
  qrValidations: {
    value: number;
    trend: string;
    trending: 'up' | 'down' | 'same';
  };
  paymentBreakdown: {
    cash: {
      amount: number;
      percentage: number;
    };
    qr: {
      amount: number;
      percentage: number;
    };
  };
}