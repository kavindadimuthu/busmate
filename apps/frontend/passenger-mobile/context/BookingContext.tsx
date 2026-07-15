import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';

// Flat, real-data shape - populated from search/schedule.tsx's FindMyBusDetailsResponse.trip,
// not a fictional nested tripData/busData pair (those DTOs never existed against the real
// backend contract).
export interface BookingData {
  tripId: string;
  busId: string;
  busPlateNumber?: string;
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  passengers: number;
  fareAmount: number;
  selectedSeatNumber?: string;
  passengerId: string;
  // Display-only fields carried over from schedule.tsx so downstream booking screens don't
  // need to re-fetch trip details just to show a summary.
  routeName?: string;
  operatorName?: string;
  tripDate?: string;
  scheduledDepartureTime?: string;
  scheduledArrivalTime?: string;
}

export interface PaymentData {
  /** The ticketing-service ticket id created by bookTicket(); confirmPayment() acts on this. */
  ticketId: number;
  /** Opaque payment-gateway reference returned by bookTicket(). */
  paymentReference: string;
  amount: number;
}

interface BookingContextType {
  bookingData: BookingData | null;
  paymentData: PaymentData | null;
  bookedTicket: ConductorLogTicketDTO | null;
  isBookingInProgress: boolean;
  
  // Actions
  setBookingData: (data: BookingData) => void;
  setSelectedSeat: (seatNumber: string | undefined) => void;
  setPaymentData: (data: PaymentData) => void;
  setBookedTicket: (ticket: ConductorLogTicketDTO) => void;
  setBookingInProgress: (inProgress: boolean) => void;
  clearBookingData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [bookingData, setBookingDataState] = useState<BookingData | null>(null);
  const [paymentData, setPaymentDataState] = useState<PaymentData | null>(null);
  const [bookedTicket, setBookedTicketState] = useState<ConductorLogTicketDTO | null>(null);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);

  const setBookingData = (data: BookingData) => {
    setBookingDataState(data);
  };

  const setSelectedSeat = (seatNumber: string | undefined) => {
    if (bookingData) {
      setBookingDataState({
        ...bookingData,
        selectedSeatNumber: seatNumber
      });
    }
  };

  const setPaymentData = (data: PaymentData) => {
    setPaymentDataState(data);
  };

  const setBookedTicket = (ticket: ConductorLogTicketDTO) => {
    setBookedTicketState(ticket);
  };

  const setBookingInProgress = (inProgress: boolean) => {
    setIsBookingInProgress(inProgress);
  };

  const clearBookingData = () => {
    setBookingDataState(null);
    setPaymentDataState(null);
    setBookedTicketState(null);
    setIsBookingInProgress(false);
  };

  const value: BookingContextType = {
    bookingData,
    paymentData,
    bookedTicket,
    isBookingInProgress,
    setBookingData,
    setSelectedSeat,
    setPaymentData,
    setBookedTicket,
    setBookingInProgress,
    clearBookingData,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};