import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PassengerTripResponse } from '@/lib/api-client/route-management';
import type { BusResponse } from '@/lib/api-client/route-management';
import type { ConductorLogTicketDTO } from '@/lib/api-client/ticketing-management';

export interface BookingData {
  tripId: string;
  tripData: PassengerTripResponse;
  busData: BusResponse;
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  passengers: number;
  fareAmount: number;
  selectedSeatNumber?: string;
  passengerId: string;
}

export interface PaymentData {
  transactionRef: string;
  paymentMethod: string;
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