import React, { createContext, useContext, useState } from 'react';
import { RouteStop } from '../types/journey';
import { IssueTicketRequest, TicketDetails } from '../types/ticket';

interface RouteStopsCache {
  routeId: string;
  stops: RouteStop[];
  lastFetched: number;
}

// QR Scan Log interface
export interface QRScanLog {
  id: string;
  name: string;
  qrCode: string;
  ticketId: string;
  startStation: string;
  endStation: string;
  seatNumber: string;
  passengerCount: number;
  ticketFee: number;
  paymentStatus: string;
  scanTime: Date;
  status: 'success' | 'failed';
}

// Cash Ticket Log interface
export interface CashTicketLog {
  id: string;
  ticketId: string;
  fromLocation: string;
  toLocation: string;
  passengerCount: number;
  fareAmount: number;
  paymentMethod: string;
  issuedTime: Date;
  phoneNumber?: string;
}

interface TicketContextType {
  ticketData: TicketDetails | null;
  setTicketData: (ticket: TicketDetails) => void;
  clearTicketData: () => void;
  // Backend data for API calls
  ticketBackendData: IssueTicketRequest | null;
  setTicketBackendData: (data: IssueTicketRequest) => void;
  clearTicketBackendData: () => void;
  // Route stops cache
  routeStopsCache: RouteStopsCache | null;
  setRouteStopsCache: (cache: RouteStopsCache) => void;
  clearRouteStopsCache: () => void;
  isRouteStopsCacheValid: (routeId: string) => boolean;
  // QR Scan logs
  qrScanLogs: QRScanLog[];
  addQRScanLog: (log: QRScanLog) => void;
  clearQRScanLogs: () => void;
  getQRScanLogsForTrip: (tripId?: string) => QRScanLog[];
  // Cash Ticket logs
  cashTicketLogs: CashTicketLog[];
  addCashTicketLog: (log: CashTicketLog) => void;
  clearCashTicketLogs: () => void;
  getCashTicketLogsForTrip: (tripId?: string) => CashTicketLog[];
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ticketData, setTicketData] = useState<TicketDetails | null>(null);
  const [ticketBackendData, setTicketBackendData] = useState<IssueTicketRequest | null>(null);
  const [routeStopsCache, setRouteStopsCache] = useState<RouteStopsCache | null>(null);
  const [qrScanLogs, setQrScanLogs] = useState<QRScanLog[]>([]);
  const [cashTicketLogs, setCashTicketLogs] = useState<CashTicketLog[]>([]);

  const clearTicketData = () => {
    setTicketData(null);
  };

  const clearTicketBackendData = () => {
    setTicketBackendData(null);
  };

  const clearRouteStopsCache = () => {
    setRouteStopsCache(null);
  };

  const addQRScanLog = (log: QRScanLog) => {
    setQrScanLogs(prevLogs => [log, ...prevLogs]);
  };

  const clearQRScanLogs = () => {
    setQrScanLogs([]);
  };

  const getQRScanLogsForTrip = (tripId?: string): QRScanLog[] => {
    // For now, return all logs. In the future, you can filter by tripId
    return qrScanLogs;
  };

  const addCashTicketLog = (log: CashTicketLog) => {
    setCashTicketLogs(prevLogs => [log, ...prevLogs]);
  };

  const clearCashTicketLogs = () => {
    setCashTicketLogs([]);
  };

  const getCashTicketLogsForTrip = (tripId?: string): CashTicketLog[] => {
    // For now, return all logs. In the future, you can filter by tripId
    return cashTicketLogs;
  };

  // Check if cache is valid (same route and within 30 minutes)
  const isRouteStopsCacheValid = (routeId: string): boolean => {
    if (!routeStopsCache) return false;
    if (routeStopsCache.routeId !== routeId) return false;
    
    const now = Date.now();
    const cacheAge = now - routeStopsCache.lastFetched;
    const maxCacheAge = 30 * 60 * 1000; // 30 minutes
    
    return cacheAge < maxCacheAge;
  };

  return (
    <TicketContext.Provider value={{ 
      ticketData, 
      setTicketData, 
      clearTicketData,
      ticketBackendData,
      setTicketBackendData,
      clearTicketBackendData,
      routeStopsCache,
      setRouteStopsCache,
      clearRouteStopsCache,
      isRouteStopsCacheValid,
      qrScanLogs,
      addQRScanLog,
      clearQRScanLogs,
      getQRScanLogsForTrip,
      cashTicketLogs,
      addCashTicketLog,
      clearCashTicketLogs,
      getCashTicketLogsForTrip
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicket = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTicket must be used within a TicketProvider');
  }
  return context;
};
