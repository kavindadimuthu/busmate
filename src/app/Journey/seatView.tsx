import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { ticketApi } from '@/services/api/ticket';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

interface Passenger {
  id: string;
  name: string;
  seatNumber: string;
  mobile?: string;
  isValidated: boolean;
  paymentStatus: string;
  ticketId: string;
}

export default function SeatViewScreen() {
  const { ongoingTrip } = useOngoingTrip();
  const [activeTab, setActiveTab] = useState<'seatView' | 'passengerList'>('seatView');
  const [searchQuery, setSearchQuery] = useState('');
  const [seatData, setSeatData] = useState<SeatData[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch seat data from API
  const fetchSeatData = async () => {
    if (!ongoingTrip?.id) {
      setError('No ongoing trip found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🪑 Fetching seat bookings for trip:', ongoingTrip.id);
      
      const seatBookings = await ticketApi.getSeatBookings(ongoingTrip.id);
      setSeatData(seatBookings);
      
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
  }, [ongoingTrip?.id]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSeatData();
    setRefreshing(false);
  };

  // Filter passengers based on search
  const filteredPassengers = passengers.filter(passenger =>
    passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    passenger.seatNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Calculate statistics
  const stats = {
    total: seatData.length,
    available: seatData.filter(s => s.status === 'available').length,
    booked: seatData.filter(s => s.status === 'booked').length,
    validated: seatData.filter(s => s.status === 'validated').length
  };

  // Render passenger item
  const renderPassengerItem = ({ item }: { item: Passenger }) => (
    <TouchableOpacity 
      style={styles.passengerCard}
      onPress={() => Alert.alert(
        'Passenger Details',
        `Name: ${item.name}\nSeat: ${item.seatNumber}\nStatus: ${item.isValidated ? 'Validated' : 'Not Validated'}\nPayment: ${item.paymentStatus}`
      )}
    >
      <View style={styles.passengerInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        
        <View style={styles.passengerDetails}>
          <Text style={styles.passengerName}>{item.name}</Text>
          <Text style={styles.passengerMobile}>Seat: {item.seatNumber}</Text>
        </View>
      </View>
      
      <View style={styles.passengerActions}>
        <View style={styles.seatBadge}>
          <Text style={styles.seatBadgeText}>{item.seatNumber}</Text>
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
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading seat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Unable to Load Seat Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSeatData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seat View</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#FFFFFF" 
            style={refreshing ? { opacity: 0.5 } : {}} 
          />
        </TouchableOpacity>
      </View> */}
      
      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'seatView' && styles.activeTab]}
          onPress={() => setActiveTab('seatView')}
        >
          <Ionicons name="car-outline" size={18} color={activeTab === 'seatView' ? "#fff" : "#333"} />
          <Text style={[styles.tabText, activeTab === 'seatView' && styles.activeTabText]}>
            Seat View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'passengerList' && styles.activeTab]}
          onPress={() => setActiveTab('passengerList')}
        >
          <MaterialIcons 
            name="format-list-bulleted" 
            size={18} 
            color={activeTab === 'passengerList' ? "#fff" : "#333"} 
          />
          <Text style={[styles.tabText, activeTab === 'passengerList' && styles.activeTabText]}>
            Passenger List ({filteredPassengers.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Seat View Tab */}
      {activeTab === 'seatView' && (
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066FF']}
              tintColor="#0066FF"
            />
          }
        >
          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSeat, styles.seatAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSeat, styles.seatBooked]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSeat, styles.seatValidated]} />
              <Text style={styles.legendText}>Validated</Text>
            </View>
          </View>
          
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
          
          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Seat Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Seats</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.available}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.booked}</Text>
                <Text style={styles.statLabel}>Booked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#0066FF' }]}>{stats.validated}</Text>
                <Text style={styles.statLabel}>Validated</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
      
      {/* Passenger List Tab */}
      {activeTab === 'passengerList' && (
        <View style={styles.passengerListContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search passengers or seat numbers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Passenger List */}
          <FlatList
            data={filteredPassengers}
            renderItem={renderPassengerItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0066FF']}
                tintColor="#0066FF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color="#CCCCCC" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No passengers found' : 'No passengers booked yet'}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
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
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F7',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendSeat: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  seatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  seatTextWhite: {
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  passengerListContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  passengerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#F0F6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  seatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  validatedBadge: {
    marginRight: 8,
  },
  pendingBadge: {
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});
