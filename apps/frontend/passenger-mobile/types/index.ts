export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  language: 'en' | 'si' | 'ta';
  createdAt: string;
}

export interface Route {
  id: string;
  routeNumber: string;
  startLocation: string;
  endLocation: string;
  stops: BusStop[];
  duration: number;
  distance: number;
  operatorName: string;
  isActive: boolean;
}

export interface BusStop {
  id: string;
  name: string;
  nameLocal: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  order: number;
  estimatedArrivalTime?: string;
}

export interface Bus {
  id: string;
  plateNumber: string;
  routeId: string;
  driverName: string;
  capacity: number;
  availableSeats: number;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  amenities: BusAmenity[];
}

export interface BusAmenity {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

export interface Ticket {
  id: string;
  userId: string;
  routeId: string;
  busId: string;
  fromStop: string;
  toStop: string;
  seatNumber?: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  status: 'booked' | 'used' | 'cancelled' | 'expired';
  qrCode: string;
  bookingDate: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'payment' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  travelCardNumber?: string;
  travelCardStatus: 'active' | 'blocked' | 'pending' | 'none';
  transactions: WalletTransaction[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'route_update' | 'booking_confirmation' | 'payment' | 'general';
  isRead: boolean;
  timestamp: string;
  data?: any;
}

export interface SearchQuery {
  from: string;
  to: string;
  date: string;
  time?: string;
  passengers: number;
}

export interface RouteResult {
  id: string;
  route: Route;
  buses: Bus[];
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  availableSeats: number;
}