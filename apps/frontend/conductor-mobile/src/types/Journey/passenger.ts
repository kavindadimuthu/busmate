export type ValidationStatus = 'validated' | 'pending' | 'expired' | 'cancelled';

export type PaymentType = 'QR Payment' | 'Cash Payment' | 'Card Payment' | 'Digital Wallet';

export type PassengerTicket = {
  seatNumber: string;
  ticketId: string;
  paymentType: PaymentType;
  passengerCount: number;
  fare: number;
  bookingReference?: string;
};

export type PassengerContact = {
  phone: string;
  email?: string;
  emergencyContact?: string;
};

export type PassengerBooking = {
  bookingTime: string;
  arrivalTime: string;
  departureTime?: string;
  boardingPoint: string;
  destinationPoint: string;
};

export type PassengerValidation = {
  status: string;
  timestamp: string;
  validatedBy?: string;
  validationMethod?: 'qr' | 'manual' | 'nfc';
};

export type PassengerDetails = {
  id: string;
  name: string;
  isValidated: boolean;
  validationStatus: ValidationStatus;
  ticket: PassengerTicket;
  contact: PassengerContact;
  booking: PassengerBooking;
  validation: PassengerValidation;
  additionalNotes?: string;
  specialRequirements?: string[];
};

export type PassengerAction = 'revalidate' | 'invalidate' | 'refund' | 'transfer' | 'message' | 'call';

export type PassengerActionResult = {
  success: boolean;
  message: string;
  updatedPassenger?: PassengerDetails;
};