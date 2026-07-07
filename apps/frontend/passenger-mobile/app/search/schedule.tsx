import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Clock, Users, Wifi, Snowflake, Zap, Star, Phone, MessageCircle } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/ui/AppHeader';
import { PassengerApIsService, BusManagementService } from '../../lib/api-client/route-management';
import type { PassengerTripResponse, BusResponse } from '../../lib/api-client/route-management';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';
import { findBusByPlateNumber } from '../../utils/bookingUtils';

export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setBookingData } = useBooking();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('schedule');
  const [tripData, setTripData] = useState<PassengerTripResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeAreaStyle = useSafeAreaContainerStyles();

  // Parse parameters
  const tripId = params.tripId as string;
  const fromStopName = params.fromStopName as string || 'Origin';
  const toStopName = params.toStopName as string || 'Destination';
  const fromStopId = params.fromStopId as string || '';
  const toStopId = params.toStopId as string || '';
  const passengers = parseInt(params.passengers as string) || 1;

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) {
        setError('Trip ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await PassengerApIsService.getTripDetails(
          tripId,
          true, // includeRealTimeStatus
          true  // includeStopTimes
        );
        
        setTripData(response);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  // Helper function to get amenity icon based on facility name
  const getAmenityIcon = (facility: string) => {
    if (facility === 'hasAirConditioning' || facility.includes('ac') || facility.includes('air')) {
      return <Snowflake size={20} color="#004CFF" />;
    }
    if (facility === 'hasWiFi' || facility.includes('wifi')) {
      return <Wifi size={20} color="#004CFF" />;
    }
    if (facility === 'isAccessible' || facility.includes('accessible') || facility.includes('seat')) {
      return <Users size={20} color="#004CFF" />;
    }
    if (facility === 'hasToilet' || facility.includes('toilet') || facility.includes('restroom')) {
      return <MapPin size={20} color="#004CFF" />;
    }
    if (facility.includes('charging') || facility.includes('usb')) {
      return <Zap size={20} color="#004CFF" />;
    }
    return <Users size={20} color="#004CFF" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'departure': 
      case 'origin': 
      case 'scheduled': return '#004CFF';
      case 'arrival': 
      case 'destination': return '#FF3831';
      case 'delayed': return '#FF8C00';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    // Handle ISO datetime string
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return timeString;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Handle book trip button press
  const handleBookTrip = async () => {
    // Check authentication
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'Please log in to book a ticket.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    // Check if only single passenger booking is supported
    if (passengers > 1) {
      Alert.alert(
        'Single Passenger Only',
        'Currently, only single passenger booking is supported. Please search again with 1 passenger.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (!tripData) return;

      let busData: BusResponse | null = null;

      // Get bus data using busId if available, otherwise search by plate number
      if (tripData.busId) {
        try {
          busData = await BusManagementService.getBusById(tripData.busId);
        } catch (busError) {
          console.warn('Could not fetch bus by ID, trying plate number search:', busError);
        }
      }

      // If busId lookup failed or unavailable, search by plate number
      if (!busData && tripData.bus?.plateNumber) {
        try {
          const busesResponse = await BusManagementService.getAllBuses(
            0, // page
            100, // size
            'plateNumber', // sortBy
            'asc', // sortDir
            tripData.bus.plateNumber // search by plate number
          );
          
          if (busesResponse.content && busesResponse.content.length > 0) {
            busData = findBusByPlateNumber(busesResponse.content, tripData.bus.plateNumber);
          }
        } catch (searchError) {
          console.warn('Could not search buses by plate number:', searchError);
        }
      }

      if (!busData) {
        Alert.alert(
          'Bus Information Missing',
          'Could not retrieve bus information. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare booking data
      const bookingData = {
        tripId: tripData.tripId || '',
        tripData: tripData,
        busData: busData,
        // fromStopId: fromStopId,
        fromStopId: tripData.departureStop?.id || '',
        // toStopId: toStopId,
        toStopId: tripData.arrivalStop?.id || '' ,
        fromStopName: fromStopName,
        toStopName: toStopName,
        passengers: 1, // Force single passenger
        fareAmount: tripData.fare || 0,
        passengerId: user.id
      };

      // Set booking data in context
      setBookingData(bookingData);

      // Navigate to booking confirmation page
      router.push('/search/booking');

    } catch (error) {
      console.error('Error preparing booking data:', error);
      Alert.alert(
        'Booking Error',
        'Failed to prepare booking. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Schedule Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Schedule Details" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show not found state
  if (!tripData) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Schedule Details" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Trip details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extract departure and arrival times from intermediateStops or fallback to scheduled times
  const departureTime = tripData.intermediateStops && tripData.intermediateStops.length > 0 
    ? formatTime(tripData.intermediateStops[0].departureTime || tripData.intermediateStops[0].scheduledDepartureTime?.toString())
    : formatTime(tripData.scheduledDeparture);
    
  const arrivalTime = tripData.intermediateStops && tripData.intermediateStops.length > 0
    ? formatTime(tripData.intermediateStops[tripData.intermediateStops.length - 1].arrivalTime || tripData.intermediateStops[tripData.intermediateStops.length - 1].scheduledArrivalTime?.toString())
    : formatTime(tripData.scheduledArrival);

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader title="Schedule Details" />

      <ScrollView style={styles.content}>
        {/* Bus Info Card */}
        <View style={styles.busInfoCard}>
          <View style={styles.busHeader}>
            <View style={styles.busImagePlaceholder}>
              <Users size={40} color="#004CFF" />
            </View>
            <View style={styles.busDetails}>
              <Text style={styles.busName}>
                {tripData.bus?.plateNumber || 'Bus Information'}
              </Text>
              <Text style={styles.operatorName}>
                {tripData.operator?.name || 'Bus Operator'}
              </Text>
              
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyText}>
                  {fromStopName} to {toStopName}
                </Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <Star size={14} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>4.5</Text>
                <Text style={styles.reviewsText}>(--)</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItemRoute}>
              <Text style={styles.infoLabel}>Route</Text>
              <Text style={styles.infoValue}>{tripData.routeName || 'N/A'}</Text>
            </View>
            <View style={styles.infoItemSeats}>
              <Text style={styles.infoLabel}>Seats Available</Text>
              <Text style={styles.availableSeats}>
                {tripData.availableSeats || 0}/{tripData.bus?.capacity || 0}
              </Text>
            </View>
            <View style={styles.infoItemPrice}>
              <Text style={styles.infoLabel}>Fare</Text>
              <Text style={styles.priceText}>LKR {tripData.fare || 0}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setSelectedTab('schedule')}
            style={[styles.tab, selectedTab === 'schedule' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'schedule' && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('amenities')}
            style={[styles.tab, selectedTab === 'amenities' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'amenities' && styles.activeTabText]}>
              Amenities
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('staff')}
            style={[styles.tab, selectedTab === 'staff' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'staff' && styles.activeTabText]}>
              Staff
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'schedule' && (
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Route Schedule</Text>
            
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleHeaderItem}>
                <Text style={styles.scheduleHeaderTitle}>Departure</Text>
                <Text style={styles.scheduleHeaderValue}>{departureTime}</Text>
              </View>
              <View style={styles.scheduleHeaderItem}>
                <Text style={styles.scheduleHeaderTitle}>Arrival</Text>
                <Text style={styles.scheduleHeaderValue}>{arrivalTime}</Text>
              </View>
              <View style={styles.scheduleHeaderItem}>
                <Text style={styles.scheduleHeaderTitle}>Duration</Text>
                <Text style={styles.scheduleHeaderValue}>{formatDuration(tripData.duration)}</Text>
              </View>
            </View>
            
            <View style={styles.journeySegmentInfo}>
              <Text style={styles.journeySegmentTitle}>Your Journey ({passengers} passenger{passengers !== 1 ? 's' : ''})</Text>
              <Text style={styles.journeySegmentDetails}>{fromStopName} → {toStopName}</Text>
            </View>
            
            {tripData.intermediateStops?.map((stop, index) => {
              const isUserPickup = stop.name === fromStopName || stop.stopId === tripData.departureStop?.id;
              const isUserDropoff = stop.name === toStopName || stop.stopId === tripData.arrivalStop?.id;
              const isUserStop = isUserPickup || isUserDropoff;
              
              return (
                <View key={stop.stopId || index} style={[
                  styles.scheduleItem,
                  isUserStop && styles.scheduleItemInJourney
                ]}>
                  <View style={styles.timeContainer}>
                    <Text style={[
                      styles.scheduleTime,
                      isUserStop && styles.highlightedText
                    ]}>
                      {formatTime(stop.departureTime || stop.scheduledDepartureTime?.toString())}
                    </Text>
                    {(stop.departureDelay && stop.departureDelay > 0) && (
                      <Text style={styles.delay}>+{stop.departureDelay}min</Text>
                    )}
                  </View>
                  <View style={styles.stopIndicator}>
                    <View style={[
                      styles.stopDot, 
                      { backgroundColor: getStatusColor(stop.status) },
                      isUserStop && styles.highlightedDot
                    ]} />
                    {index < (tripData.intermediateStops?.length || 0) - 1 && (
                      <View style={styles.stopLine} />
                    )}
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={[
                      styles.stopLocation,
                      isUserStop && styles.highlightedText
                    ]}>
                      {stop.name || 'Unknown Stop'}
                      {isUserPickup && ' • Your Pickup'}
                      {isUserDropoff && ' • Your Dropoff'}
                    </Text>
                    <Text style={styles.stopStatus}>
                      {stop.status || 'scheduled'} {stop.city && `• ${stop.city}`}
                    </Text>
                  </View>
                </View>
              );
            }) || <Text style={styles.noDataText}>No stop information available</Text>}
            
            <View style={styles.scheduleNotes}>
              <Text style={styles.scheduleNotesText}>
                Note: Schedule times may vary based on traffic conditions.
              </Text>
            </View>
          </View>
        )}

        {selectedTab === 'amenities' && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.sectionTitle}>Bus Features</Text>
            <View style={styles.amenitiesList}>
              {tripData.bus?.features ? (
                Object.entries(tripData.bus.features).map(([featureName, featureValue], index) => {
                  const displayName = featureName === 'isAccessible' ? 'Accessible' :
                                    featureName === 'hasAirConditioning' ? 'Air Conditioning' :
                                    featureName === 'hasWiFi' ? 'WiFi' :
                                    featureName === 'hasToilet' ? 'Toilet' :
                                    featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/([A-Z])/g, ' $1');
                  
                  return (
                    <View key={index} style={styles.amenityItem}>
                      <View style={[
                        styles.amenityIconContainer,
                        { backgroundColor: featureValue ? '#EBF2FF' : '#F3F4F6' }
                      ]}>
                        {getAmenityIcon(featureName)}
                      </View>
                      <Text style={[
                        styles.amenityName,
                        { color: featureValue ? '#111827' : '#9CA3AF' }
                      ]}>
                        {displayName}
                      </Text>
                      <Text style={[
                        styles.amenityStatus,
                        { color: featureValue ? '#1DD724' : '#FF3831' }
                      ]}>
                        {featureValue ? 'Available' : 'Not Available'}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.amenityItem}>
                  <Text style={styles.noDataText}>No feature information available</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {selectedTab === 'staff' && (
          <View style={styles.staffContainer}>
            <Text style={styles.sectionTitle}>Bus Staff</Text>
            
            <View style={styles.staffNotesContainer}>
              <Text style={styles.staffNotes}>
                Staff information is not available for this trip. Please contact the operator directly for driver and conductor details.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bookingContainer}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingPrice}>LKR {(tripData.fare || 0) * passengers}</Text>
          <Text style={styles.bookingDetails}>for {passengers} passenger{passengers !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          onPress={handleBookTrip}
          style={[
            styles.bookButton,
            !tripData.bookingAvailable && { backgroundColor: '#9CA3AF' }
          ]}
          disabled={!tripData.bookingAvailable}
        >
          <Text style={styles.bookButtonText}>
            {tripData.bookingAvailable ? 'Book This Trip' : 'Booking Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  busInfoCard: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  busHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  busImage: {
    width: 100,
    height: 75,
    borderRadius: 12,
    marginRight: 16,
  },
  busImagePlaceholder: {
    width: 100,
    height: 75,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busDetails: {
    flex: 1,
  },
  busName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  operatorName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  journeyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  journeyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoItemRoute: {
    flex: 2,
  },
  infoItemSeats: {
    flex: 1,
  },
  infoItemPrice: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginTop: 4,
  },
  availableSeats: {
    fontSize: 14,
    color: '#1DD724',
    fontWeight: '600',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#004CFF',
    fontWeight: '600',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#004CFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  scheduleContainer: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  scheduleHeaderItem: {
    alignItems: 'center',
  },
  scheduleHeaderTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduleHeaderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  journeySegmentInfo: {
    backgroundColor: '#EBF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  journeySegmentTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#004CFF',
    marginBottom: 4,
  },
  journeySegmentDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scheduleItemInJourney: {
    backgroundColor: '#FAFBFF',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeContainer: {
    width: 80,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  delay: {
    fontSize: 12,
    color: '#FF3831',
    marginTop: 2,
  },
  stopIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  stopInfo: {
    flex: 1,
    paddingTop: 2,
  },
  stopLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  stopStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  highlightedText: {
    color: '#004CFF',
    fontWeight: '700',
  },
  highlightedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#E6F2FF',
  },
  fadedLine: {
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  scheduleNotes: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  scheduleNotesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  amenitiesContainer: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 120,
  },
  amenitiesList: {
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  amenityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  amenityStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  staffContainer: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 120,
  },
  staffTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  staffAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  staffInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  staffRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  staffRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  staffExperience: {
    fontSize: 14,
    color: '#6B7280',
  },
  staffActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffNotesContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  staffNotes: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
  },
  bookingDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});