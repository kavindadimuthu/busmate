import { CashTicketLog, useTicket } from '@/contexts/TicketContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
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
import { useOngoingTrip } from '../../hooks/employee/useOngoingTrip';
import { journeyApi } from '../../services/api/journey';
import { RouteStop } from '../../types/journey';
import { IssueTicketRequest } from '../../types/ticket';

export default function TicketsScreen() {
  const { 
    setTicketData, 
    setTicketBackendData,
    routeStopsCache, 
    setRouteStopsCache, 
    isRouteStopsCacheValid,
    addCashTicketLog 
  } = useTicket();
  const { user } = useAuth();
  const { ongoingTrip } = useOngoingTrip();
  
  // State for route stops
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Base fare per km
  const farePerKm = 2.5;

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('+94 77 123 4567');
  const [totalFare, setTotalFare] = useState(0);
  const [farePerPassenger, setFarePerPassenger] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Dropdown states
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromSearchText, setFromSearchText] = useState('');
  const [toSearchText, setToSearchText] = useState('');

  // Fetch route stops when component mounts
  const fetchRouteStops = async (isRefresh = false) => {
    if (!ongoingTrip?.RouteId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Check if we have valid cached data and it's not a forced refresh
    if (!isRefresh && isRouteStopsCacheValid(ongoingTrip.RouteId)) {
      console.log('Using cached route stops for RouteId:', ongoingTrip.RouteId);
      setRouteStops(routeStopsCache!.stops);
      setLoading(false);
      setRefreshing(false);
      setUsingCachedData(true);
      
      // Set default locations if not set
      const cachedStops = routeStopsCache!.stops;
      if (cachedStops.length >= 2 && (!fromLocation || !toLocation)) {
        setFromLocation(cachedStops[0].stopName);
        setToLocation(cachedStops[cachedStops.length - 1].stopName);
        updateFare(cachedStops[0].stopName, cachedStops[cachedStops.length - 1].stopName, 1);
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching route stops from API for RouteId:', ongoingTrip.RouteId);
      const stops: RouteStop[] = await journeyApi.getRouteStops(ongoingTrip.RouteId);
      
      if (!stops || stops.length === 0) {
        throw new Error('No route stops found for this trip');
      }
      
      const sortedStops = stops.sort((a, b) => a.stopOrder - b.stopOrder);
      setRouteStops(sortedStops);
      setUsingCachedData(false);
      
      // Cache the fetched data
      setRouteStopsCache({
        routeId: ongoingTrip.RouteId,
        stops: sortedStops,
        lastFetched: Date.now()
      });
      
      // Set default from and to locations only if not already set
      if (sortedStops.length >= 2 && (!fromLocation || !toLocation)) {
        setFromLocation(sortedStops[0].stopName);
        setToLocation(sortedStops[sortedStops.length - 1].stopName);
        updateFare(sortedStops[0].stopName, sortedStops[sortedStops.length - 1].stopName, 1);
      }
      
    } catch (err) {
      console.error('Error fetching route stops:', err);
      setError(err instanceof Error ? err.message : 'Failed to load route stops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If route has changed and we have cached data for a different route, clear it
    if (routeStopsCache && ongoingTrip?.RouteId && routeStopsCache.routeId !== ongoingTrip.RouteId) {
      console.log('Route changed, clearing cache');
      setRouteStops([]);
    }
    fetchRouteStops();
  }, [ongoingTrip?.RouteId]);

  // Pull to refresh handler - force refresh from API
  const onRefresh = () => {
    console.log('Pull to refresh - forcing API call');
    fetchRouteStops(true);
  };

  // Filter stops based on search text
  const getFilteredStops = (searchText: string) => {
    if (searchText.trim() === '') return routeStops;
    return routeStops.filter((stop: RouteStop) => 
      stop.stopName.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Calculate fare based on distance and passenger count
  const calculateFare = (from: string, to: string, passengers: number) => {
    const fromStop = routeStops.find((stop: RouteStop) => stop.stopName === from);
    const toStop = routeStops.find((stop: RouteStop) => stop.stopName === to);
    
    if (!fromStop || !toStop || from === to) {
      return { totalFare: 0, farePerPassenger: 0 };
    }
    
    const distance = Math.abs(toStop.distanceFromStartKm - fromStop.distanceFromStartKm);
    const farePerPassenger = Math.max(distance * farePerKm, 10); // Minimum fare Rs. 10
    const totalFare = farePerPassenger * passengers;
    
    return { totalFare, farePerPassenger };
  };

  // Update fare whenever locations or passenger count changes
  const updateFare = (from: string, to: string, passengers: number) => {
    const { totalFare: newTotalFare, farePerPassenger: newFarePerPassenger } = calculateFare(from, to, passengers);
    setTotalFare(newTotalFare);
    setFarePerPassenger(newFarePerPassenger);
  };

  const selectFromLocation = (stopName: string) => {
    if (stopName === toLocation) {
      // Don't allow same from and to locations
      return;
    }
    setFromLocation(stopName);
    setShowFromDropdown(false);
    setFromSearchText('');
    updateFare(stopName, toLocation, passengerCount);
  };

  const selectToLocation = (stopName: string) => {
    if (stopName === fromLocation) {
      // Don't allow same from and to locations
      return;
    }
    setToLocation(stopName);
    setShowToDropdown(false);
    setToSearchText('');
    updateFare(fromLocation, stopName, passengerCount);
  };

  const decrementPassengers = () => {
    if (passengerCount > 1) {
      const newCount = passengerCount - 1;
      setPassengerCount(newCount);
      updateFare(fromLocation, toLocation, newCount);
    }
  };

  const incrementPassengers = () => {
    const newCount = passengerCount + 1;
    setPassengerCount(newCount);
    updateFare(fromLocation, toLocation, newCount);
  };

  const issueTicket = () => {
    // Generate ticket ID
    const ticketId = `TK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create ticket data object for display
    const ticketData = {
      id: ticketId,
      from: fromLocation,
      to: toLocation,
      platform: 'Platform 1', // You can make this dynamic based on your logic
      gate: 'Gate A', // You can make this dynamic based on your logic
      passengers: `${passengerCount} ${passengerCount === 1 ? 'Adult' : 'Adults'}`,
      fare: `Rs. ${totalFare.toFixed(2)}`,
      issuedOn: `${currentDate} - ${currentTime}`,
      phoneNumber: phoneNumber || '+94 77 123 4567'
    };

    // Find the route stops for start and end locations
    const fromStop = routeStops.find(stop => stop.stopName === fromLocation);
    const toStop = routeStops.find(stop => stop.stopName === toLocation);

    if (!user?.id || !ongoingTrip?.id || !ongoingTrip?.busId) {
    console.error('❌ Missing required data:', {
      userId: user?.id,
      tripId: ongoingTrip?.id,
      busId: ongoingTrip?.busId
    });
    alert('Error: Missing trip or user information. Please try again.');
    return;
  }

  // Create backend data for API - all IDs as strings to match backend DTO
  const backendData: IssueTicketRequest = {
    // conductorId: user.id.toString(),
    conductorId: user.id.toString(),
    busId: ongoingTrip.busId.toString(),
    tripId: ongoingTrip.id.toString(),
    startLocationId: fromStop?.stopId || 'unknown',
    endLocationId: toStop?.stopId || 'unknown',
    fareAmount: parseFloat(totalFare.toFixed(2)),
    paymentMethod: paymentMethod,
    transactionRef: `TXN-${Date.now()}-${ticketId}`
  };

    console.log('🎫 Backend data validation:', {
      conductorId: backendData.conductorId,
      busId: backendData.busId,
      tripId: backendData.tripId,
      startLocationId: backendData.startLocationId,
      endLocationId: backendData.endLocationId,
      fareAmount: backendData.fareAmount,
      paymentMethod: backendData.paymentMethod,
      transactionRef: backendData.transactionRef
    });

    console.log('🔍 User and trip context:', {
      userId: user?.id,
      userType: typeof user?.id,
      ongoingTripId: ongoingTrip?.id,
      ongoingTripBusId: ongoingTrip?.busId,
      fromStopId: fromStop?.stopId,
      toStopId: toStop?.stopId
    });

    // Create cash ticket log for journey report integration
    const cashTicketLog: CashTicketLog = {
      id: ticketId,
      ticketId: ticketId,
      fromLocation: fromLocation,
      toLocation: toLocation,
      passengerCount: passengerCount,
      fareAmount: totalFare,
      paymentMethod: paymentMethod,
      issuedTime: new Date(),
      phoneNumber: phoneNumber
    };

    // Store both display and backend data using context
    setTicketData(ticketData);
    setTicketBackendData(backendData);
    
    // Add to cash ticket logs for journey report
    addCashTicketLog(cashTicketLog);

    console.log('🎫 Ticket created with backend data:', backendData);
    console.log('💰 Cash ticket log added:', cashTicketLog);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        translucent={false}
        backgroundColor="#0066FF" 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}
          onPress={() => { router.push('/'); }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Ticketing Machine</Text>
        <TouchableOpacity style={styles.qrButton}
         onPress={() => { router.push('/Ticket/qrScanner'); }}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {!ongoingTrip ? (
          // No ongoing trip screen
          <View style={styles.noTripContainer}>
            <View style={styles.noTripContent}>
              <Ionicons name="bus-outline" size={80} color="#666666" />
              <Text style={styles.noTripTitle}>No Ongoing Trip</Text>
              <Text style={styles.noTripMessage}>
                Start a trip to switch on the ticketing machine
              </Text>
            </View>
          </View>
        ) : loading ? (
          // Loading state
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading route stops...</Text>
          </View>
        ) : error ? (
          // Error state with retry button
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchRouteStops()}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Main ticketing interface with pull-to-refresh
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#22C55E']}
                tintColor="#22C55E"
              />
            }
          >
          <>
        {/* From Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowFromDropdown(true)}
          >
            <Text style={styles.dropdownText}>{fromLocation}</Text>
            <Ionicons name="chevron-down" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* To Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowToDropdown(true)}
          >
            <Text style={styles.dropdownText}>{toLocation}</Text>
            <Ionicons name="chevron-down" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Passenger Count */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Passengers</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={styles.counterButton} 
              onPress={decrementPassengers}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{passengerCount}</Text>
            <TouchableOpacity 
              style={[styles.counterButton, styles.incrementButton]} 
              onPress={incrementPassengers}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare Display */}
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>Rs. {totalFare.toFixed(2)}</Text>
          <Text style={styles.farePerPassenger}>
            Fare per passenger: Rs. {farePerPassenger.toFixed(2)}
          </Text>
          <Text style={styles.journeyInfo}>
            {fromLocation} → {toLocation} • {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Phone Number */}
        {/* <View style={styles.inputGroup}>
          <Text style={styles.label}>Passenger Phone Number (Optional)</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            <Ionicons name="call-outline" size={24} color="#999" style={styles.phoneIcon} />
          </View>
        </View> */}

        {/* Issue Ticket Button */}
        <TouchableOpacity
          style={styles.issueButton}
          onPress={() => {
            issueTicket();
            router.push('/Ticket/ticketPrintingpage');
          }}
        >
          <FontAwesome5 name="ticket-alt" size={20} color="white" style={styles.ticketIcon} />
          <Text style={styles.issueButtonText}>Issue Ticket</Text>
        </TouchableOpacity>
          </>
          </ScrollView>
        )}
      </View>

      {/* From Location Modal */}
      <Modal
        visible={showFromDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFromDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select From Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFromDropdown(false)}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stops..."
                placeholderTextColor="#999"
                value={fromSearchText}
                onChangeText={setFromSearchText}
              />
            </View>
            
            <FlatList
              data={getFilteredStops(fromSearchText)}
              keyExtractor={(item) => item.stopId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stopItem,
                    item.stopName === toLocation && styles.disabledOption
                  ]}
                  onPress={() => selectFromLocation(item.stopName)}
                  disabled={item.stopName === toLocation}
                >
                  <View style={styles.stopInfo}>
                    <Text style={[
                      styles.stopName,
                      item.stopName === toLocation && styles.disabledText
                    ]}>
                      {item.stopName}
                    </Text>
                    <Text style={[
                      styles.stopDistance,
                      item.stopName === toLocation && styles.disabledText
                    ]}>
                      KM {item.distanceFromStartKm}
                    </Text>
                  </View>
                  {/* <Ionicons name="chevron-forward" size={20} color="#999" /> */}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* To Location Modal */}
      <Modal
        visible={showToDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowToDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select To Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowToDropdown(false)}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stops..."
                placeholderTextColor="#999"
                value={toSearchText}
                onChangeText={setToSearchText}
              />
            </View>
            
            <FlatList
              data={getFilteredStops(toSearchText)}
              keyExtractor={(item) => item.stopId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stopItem,
                    item.stopName === fromLocation && styles.disabledOption
                  ]}
                  onPress={() => selectToLocation(item.stopName)}
                  disabled={item.stopName === fromLocation}
                >
                  <View style={styles.stopInfo}>
                    <Text style={[
                      styles.stopName,
                      item.stopName === fromLocation && styles.disabledText
                    ]}>
                      {item.stopName}
                    </Text>
                    <Text style={[
                      styles.stopDistance,
                      item.stopName === fromLocation && styles.disabledText
                    ]}>
                      KM {item.distanceFromStartKm}
                    </Text>
                  </View>
                  {/* <Ionicons name="chevron-forward" size={20} color="#999" /> */}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF', 
    
    // Changed to match header color
  },
  header: {
    // REMOVED: marginTop: StatusBar.currentHeight, ← This was causing the gap
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginTop: 20, // Added margin to separate from title
  },
  headerTitle: {
    marginTop: 20, // Adjusted to center vertically
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  qrButton: {
    padding: 4,
    marginTop: 20, // Added margin to separate from title
  },
  container: {
    flex: 1,
    backgroundColor: '#141313ff', // Changed to pure black for consistency
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#22C55E',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#1E1E1E', // Darker background
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dropdownText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  counterContainer: {
    backgroundColor: '#1E1E1E', // Darker background
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(150, 150, 150, 0.2)', // More subtle background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  incrementButton: {
    backgroundColor: '#22C55E', // Green to match theme
    borderColor: '#22C55E',
  },
  counterButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 28,
    color: 'white',
    fontWeight: '500',
  },
  fareContainer: {
    backgroundColor: '#1E1E1E', // Darker background
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  fareLabel: {
    color: '#999',
    fontSize: 16,
    marginBottom: 8,
  },
  fareAmount: {
    color: '#22C55E', // Changed to green to match the theme
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(34, 197, 94, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  farePerPassenger: {
    color: '#999',
    fontSize: 14,
  },
  journeyInfo: {
    color: '#22C55E',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  phoneInputContainer: {
    backgroundColor: '#1E1E1E', // Darker background
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  phoneInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 16,
  },
  phoneIcon: {
    marginLeft: 8,
  },
  issueButton: {
    backgroundColor: '#22C55E', // Changed to green for better contrast
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ticketIcon: {
    marginRight: 8,
  },
  issueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.8)', // Added semi-transparent overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E', // Darker modal background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '67%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444', // Lighter border for better contrast
  },
  modalTitle: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333', // Slightly lighter than modal background
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 12,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444', // Lighter border
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  stopDistance: {
    color: '#999',
    fontSize: 12,
  },
  disabledOption: {
    opacity: 0.4,
    backgroundColor: '#2A2A2A', // Slightly different background for disabled items
  },
  disabledText: {
    color: '#666666',
  },
  noTripContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTripContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noTripTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noTripMessage: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
});