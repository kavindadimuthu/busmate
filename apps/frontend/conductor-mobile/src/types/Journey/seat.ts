export type SeatStatus = 0 | 1 | 2 | 3; // Available | Booked & Validated | Booked Not Validated | Blocked/Canceled

export type SeatData = {
  [key: string]: SeatStatus;
};

export type Passenger = {
  id: string;
  name: string;
  mobile: string;
  seat: string;
  isValidated: boolean;
};

export type TripData = {
  id: string;
  route: {
    from: string;
    to: string;
  };
  totalPassengers: number;
  validatedPassengers: number;
  pendingPassengers: number;
};

export type BusLayout = {
  rows: string[];
  cols: number[];
};

export type TabType = 'seatView' | 'passengerList';

export type SeatStyleName = 'seatAvailable' | 'seatBookedValidated' | 'seatBookedNotValidated' | 'seatBlocked';