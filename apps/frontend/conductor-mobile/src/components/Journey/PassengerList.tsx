import { ticketApi } from '@/services/api/ticket';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Define passenger interface
interface Passenger {
  id: string;
  name: string;
  seatNumber: string;
  mobile?: string;
  isValidated: boolean;
  paymentStatus: string;
  ticketId: string;
}

// Component props
interface PassengerListProps {
  tripId: string;
}

export default function PassengerList({ tripId }: PassengerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch passenger data from API
  const fetchPassengerData = async () => {
    if (!tripId) {
      setError('No trip ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('👥 Fetching passenger data for trip:', tripId);
      
      const seatBookings = await ticketApi.getSeatBookings(tripId);
      
      // Convert seat data to passenger list
      const passengerList: Passenger[] = seatBookings
        .filter(seat => seat.status !== 'available')
        .map(seat => ({
          id: seat.ticketId || seat.seatNumber,
          name: seat.passengerName || 'Unknown Passenger',
          seatNumber: seat.seatNumber,
          mobile: 'N/A', // Would come from ticket data if available
          isValidated: seat.status === 'validated',
          paymentStatus: seat.paymentStatus || 'UNKNOWN',
          ticketId: seat.ticketId || ''
        }));
      
      setPassengers(passengerList);
      console.log('✅ Passenger data loaded:', passengerList.length, 'passengers');
      
    } catch (err: any) {
      console.error('❌ Error fetching passenger data:', err);
      setError(err.message || 'Failed to load passenger data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPassengerData();
  }, [tripId]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPassengerData();
    setRefreshing(false);
  };

  // Filter passengers based on search query
  const filteredPassengers = passengers.filter(passenger => {
    const query = searchQuery.toLowerCase();
    return (
      passenger.name.toLowerCase().includes(query) ||
      passenger.seatNumber.toLowerCase().includes(query) ||
      (passenger.mobile && passenger.mobile.includes(query))
    );
  });

  // Handle passenger press
  const handlePassengerPress = (passenger: Passenger) => {
    Alert.alert(
      'Passenger Details',
      `Name: ${passenger.name}\nSeat: ${passenger.seatNumber}\nStatus: ${passenger.isValidated ? 'Validated' : 'Not Validated'}\nPayment: ${passenger.paymentStatus}\nMobile: ${passenger.mobile || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading passengers...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Unable to Load Passengers</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPassengerData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Trip summary data
  const tripSummary = {
    id: tripId,
    totalPassengers: passengers.length,
    validatedPassengers: passengers.filter(p => p.isValidated).length,
    pendingPassengers: passengers.filter(p => !p.isValidated).length
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search passengers..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Trip Summary */}
      <View style={styles.tripSummaryCard}>
        <View style={styles.tripSummaryLeft}>
          <View style={styles.busIconContainer}>
            <Ionicons name="bus" size={24} color="#0066FF" />
          </View>
          <View>
            {/* <Text style={styles.tripIdText}>Trip #{tripSummary.id}</Text> */}
            <Text style={styles.passengerCountText}>  {tripSummary.totalPassengers} passengers Booked their  Seats </Text>
          </View>
        </View>
        
        <View style={styles.tripSummaryRight}>
          {/* <Text style={styles.validatedText}>{tripSummary.validatedPassengers} Validated</Text>
          <Text style={styles.pendingText}>{tripSummary.pendingPassengers} Pending</Text> */}
        </View>
      </View>
      
      {/* Passenger List */}
      <FlatList
        data={filteredPassengers}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066FF']}
            tintColor="#0066FF"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.passengerCard}
            onPress={() => handlePassengerPress(item)}
          >
            <View style={styles.passengerInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
              
              <View style={styles.passengerDetails}>
                <Text style={styles.passengerName}>{item.name}</Text>
                <Text style={styles.passengerMobile}>Mobile: {item.mobile || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.passengerActions}>
              <View style={styles.seatBadge}>
                <Text style={styles.seatText}>{item.seatNumber}</Text>
              </View>
              
              {item.isValidated ? (
                <View style={styles.validatedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </View>
              )}
              
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No passengers found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
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
    backgroundColor: '#F5F7FA',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  tripSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripIdText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  passengerCountText: {
    fontSize: 14,
    color: '#666',
  },
  tripSummaryRight: {
    alignItems: 'flex-end',
  },
  validatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 2,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerDetails: {
    flex: 1,
    
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  passengerMobile: {
    fontSize: 14,
    color: '#666',
  },
  passengerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatBadge: {
    backgroundColor: '#0066FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  seatText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  validatedBadge: {
    marginRight: 12,
  },
  pendingBadge: {
    marginRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});