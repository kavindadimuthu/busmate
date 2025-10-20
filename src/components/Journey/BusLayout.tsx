import { ticketApi } from '@/services/api/ticket';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Types
interface SeatData {
  seatNumber: string;
  status: 'available' | 'booked' | 'validated';
  passengerName?: string;
  ticketId?: string;
  paymentStatus?: string;
}

interface BusLayoutProps {
  tripId: string;
}

export default function BusLayout({ tripId }: BusLayoutProps) {
  const [seatData, setSeatData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seat data from API
  const fetchSeatData = async () => {
    if (!tripId) {
      setError('No trip ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🪑 Fetching seat bookings for trip:', tripId);
      
      const seatBookings = await ticketApi.getSeatBookings(tripId);
      setSeatData(seatBookings);
      console.log('✅ Seat data loaded:', seatBookings.length, 'seats');
      
    } catch (err: any) {
      console.error('❌ Error fetching seat data:', err);
      setError(err.message || 'Failed to load seat data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSeatData();
  }, [tripId]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSeatData();
    setRefreshing(false);
  };

  // Get seat style based on status
  const getSeatStyle = (seat: SeatData) => {
    switch (seat.status) {
      case 'available':
        return [styles.seat, styles.seatAvailable];
      case 'booked':
        return [styles.seat, styles.seatBooked];
      case 'validated':
        return [styles.seat, styles.seatValidated];
      default:
        return [styles.seat, styles.seatAvailable];
    }
  };

  // Handle seat press
  const handleSeatPress = (seat: SeatData) => {
    if (seat.status === 'available') {
      Alert.alert('Available Seat', `Seat ${seat.seatNumber} is available for booking.`);
    } else {
      Alert.alert(
        `Seat ${seat.seatNumber}`,
        `Passenger: ${seat.passengerName || 'Unknown'}\nStatus: ${seat.status === 'validated' ? 'Validated' : 'Booked (Not Validated)'}\nPayment: ${seat.paymentStatus || 'Unknown'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Render individual seat
  const renderSeat = (seatNumber: string) => {
    const seat = seatData.find(s => s.seatNumber === seatNumber) || {
      seatNumber,
      status: 'available' as const
    };

    return (
      <TouchableOpacity
        key={seatNumber}
        style={getSeatStyle(seat)}
        onPress={() => handleSeatPress(seat)}
      >
        <Text style={[
          styles.seatText,
          seat.status !== 'available' && styles.seatTextWhite
        ]}>
          {seatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render seat row (2+2 layout, last row has 5 seats)
  const renderSeatRow = (rowNumber: number) => {
    const isLastRow = rowNumber === 12; // Row 12 is the last row (seats 45-49)
    
    if (isLastRow) {
      // Last row: 5 seats (45, 46, 47, 48, 49)
      const startSeat = 45;
      return (
        <View key={rowNumber} style={styles.seatRow}>
          <View style={styles.seatPair}>
            {renderSeat((startSeat).toString())}
          </View>
          <View style={styles.seatPair}>
            {renderSeat((startSeat + 1).toString())}
          </View>
          <View style={styles.seatPair}>
            {renderSeat((startSeat + 2).toString())}
          </View>
          <View style={styles.seatPair}>
            {renderSeat((startSeat + 3).toString())}
          </View>
          <View style={styles.seatPair}>
            {renderSeat((startSeat + 4).toString())}
          </View>
        </View>
      );
    } else {
      // Regular rows: 2+2 layout
      const startSeat = (rowNumber - 1) * 4 + 1;
      return (
        <View key={rowNumber} style={styles.seatRow}>
          <View style={styles.seatPair}>
            {renderSeat(startSeat.toString())}
            {renderSeat((startSeat + 1).toString())}
          </View>
          <View style={styles.aisle} />
          <View style={styles.seatPair}>
            {renderSeat((startSeat + 2).toString())}
            {renderSeat((startSeat + 3).toString())}
          </View>
        </View>
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading seat data...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Unable to Load Seat Data</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSeatData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0066FF']}
          tintColor="#0066FF"
        />
      }
    >
      {/* Driver Seat */}
      <View style={styles.driverContainer}>
        <View style={styles.driverSeat}>
          <Ionicons name="person" size={20} color="#fff" />
          <Text style={styles.driverText}>Driver</Text>
        </View>
      </View>
      
      {/* Seat Layout - 11 rows of 2+2, 1 row of 5 */}
      <View style={styles.busLayout}>
        {/* Rows 1-11 (2+2 layout) */}
        {Array.from({ length: 11 }, (_, i) => i + 1).map(rowNumber => renderSeatRow(rowNumber))}
        
        {/* Row 12 (5 seats) */}
        {renderSeatRow(12)}
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatAvailable]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatBooked]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>
        
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatValidated]} />
            <Text style={styles.legendText}>Validated</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.seatBlocked]} />
            <Text style={styles.legendText}>Blocked/Canceled</Text>
          </View>
        </View>
      </View>
      
      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const SEAT_WIDTH = (width - 45 - 20 - 16) / 5; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  driverContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  driverSeat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  driverText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  busLayout: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  seatPair: {
    flexDirection: 'row',
  },
  aisle: {
    width: 20,
    height: 40,
  },
  seat: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
  },
  seatAvailable: {
    backgroundColor: '#E8F5E8',
    borderColor: '#22C55E',
  },
  seatBooked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  seatValidated: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0066FF',
  },
  seatBlocked: {
    backgroundColor: '#FECACA',
    borderColor: '#EF4444',
  },
  seatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  seatTextWhite: {
    color: '#333',
  },
  legendContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#555555',
  },
});