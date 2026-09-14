import type { PaymentBreakdownEntry } from '@/lib/payments/paymentMethods';

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
  // CONDUCTOR (issued on the bus) vs ONLINE (passenger booked online) — who issued it, not
  // how it was paid for. A conductor-issued ticket can be CASH or CARD since INC-008.
  issueMethod?: 'CONDUCTOR' | 'ONLINE' | string | null;
  // How the fare was actually paid. Open-ended on purpose (INC-009) — new methods arrive here
  // as codes this build may not recognise, and must still render and still count.
  paymentMethod?: 'CASH' | 'CARD' | 'PAYHERE' | string | null;
  // Who holds this fare's money, classified by the backend so the app never keeps its own
  // method-to-custody mapping. ON_HAND | SETTLED | UNKNOWN.
  custody?: 'ON_HAND' | 'SETTLED' | 'UNKNOWN' | string | null;
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
  // One entry per payment method actually used in the period (INC-009). A list, not named
  // cash/qr fields, so a payment method added later needs no change here or in any chart.
  paymentBreakdown: PaymentBreakdownEntry[];
}