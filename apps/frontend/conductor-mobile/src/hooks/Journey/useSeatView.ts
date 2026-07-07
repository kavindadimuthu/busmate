import { useState, useEffect, useCallback } from 'react';
import { SeatData, Passenger, TripData, BusLayout, TabType, SeatStatus } from '@/types/Journey/seat';
import { seatApi } from '@/services/Journey/seatApi';

export function useSeatView() {
  // Data state
  const [seatData, setSeatData] = useState<SeatData>({});
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [busLayout, setBusLayout] = useState<BusLayout | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('seatView');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading seat view data...');
        
        // Fetch all data in parallel
        const [seatDataResponse, passengersResponse, tripDataResponse, busLayoutResponse] = await Promise.all([
          seatApi.getSeatData(),
          seatApi.getPassengers(),
          seatApi.getTripData(),
          seatApi.getBusLayout()
        ]);
        
        setSeatData(seatDataResponse);
        setPassengers(passengersResponse);
        setTripData(tripDataResponse);
        setBusLayout(busLayoutResponse);
        
        console.log(`Loaded ${Object.keys(seatDataResponse).length} seats and ${passengersResponse.length} passengers`);
      } catch (err) {
        console.error('Failed to load seat view data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Get seat style based on status
  const getSeatStyle = useCallback((status: SeatStatus) => {
    switch(status) {
      case 1: // Booked & Validated
        return 'seatBookedValidated';
      case 2: // Booked Not Validated
        return 'seatBookedNotValidated';
      case 3: // Blocked/Canceled
        return 'seatBlocked';
      default: // Available
        return 'seatAvailable';
    }
  }, []);

  // Handle seat press
  const handleSeatPress = useCallback((seatId: string) => {
    const seatStatus = seatData[seatId] || 0;
    console.log(`Seat ${seatId} pressed - Status: ${seatStatus}`);
    
    // Find passenger if seat is occupied
    if (seatStatus === 1 || seatStatus === 2) {
      const passenger = passengers.find(p => p.seat === seatId);
      if (passenger) {
        console.log(`Passenger: ${passenger.name} - Validated: ${passenger.isValidated}`);
        // You can add navigation to passenger details here
      }
    }
  }, [seatData, passengers]);

  // Filter passengers based on search query
  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mobile.includes(searchQuery) ||
    p.seat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update seat status (for future use)
  const updateSeatStatus = useCallback(async (seatId: string, status: SeatStatus) => {
    try {
      await seatApi.updateSeatStatus(seatId, status);
      setSeatData(prev => ({
        ...prev,
        [seatId]: status
      }));
      console.log(`Seat ${seatId} updated to status ${status}`);
    } catch (error) {
      console.error('Failed to update seat:', error);
      setError('Failed to update seat status');
    }
  }, []);

  // Validate passenger (for future use)
  const validatePassenger = useCallback(async (passengerId: string) => {
    try {
      await seatApi.validatePassenger(passengerId);
      setPassengers(prev =>
        prev.map(p =>
          p.id === passengerId ? { ...p, isValidated: true } : p
        )
      );
      console.log(`Passenger ${passengerId} validated`);
    } catch (error) {
      console.error('Failed to validate passenger:', error);
      setError('Failed to validate passenger');
    }
  }, []);

  // Calculate stats
  const stats = {
    totalSeats: Object.keys(seatData).length,
    availableSeats: Object.values(seatData).filter(status => status === 0).length,
    bookedValidated: Object.values(seatData).filter(status => status === 1).length,
    bookedNotValidated: Object.values(seatData).filter(status => status === 2).length,
    blockedSeats: Object.values(seatData).filter(status => status === 3).length,
  };

  return {
    // Data
    seatData,
    passengers,
    filteredPassengers,
    tripData,
    busLayout,
    stats,
    
    // UI State
    activeTab,
    searchQuery,
    loading,
    error,
    
    // Actions
    setActiveTab,
    setSearchQuery,
    setError,
    getSeatStyle,
    handleSeatPress,
    updateSeatStatus,
    validatePassenger,
  };
}