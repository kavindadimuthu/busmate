import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Clock, Users, Wifi, Snowflake, Zap, Star } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/ui/AppHeader';
import { PassengerQueryService } from '@busmate/api-client-core';
import type { FindMyBusDetailsResponse, RouteScheduleStop } from '@busmate/api-client-core';
import { RouteFareControllerService, TicketControllerService } from '@busmate/api-client-ticketing';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setBookingData } = useBooking();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('schedule');
  const [tripData, setTripData] = useState<FindMyBusDetailsResponse | null>(null);
  const [fareAmount, setFareAmount] = useState<number | null>(null);
  const [bookedSeatCount, setBookedSeatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeAreaStyle = useSafeAreaContainerStyles();

  // Parse parameters (see search/results.tsx handleTripPress - it supplies all of these)
  const scheduleId = params.scheduleId as string;
  const tripId = (params.tripId as string) || undefined;
  const fromStopId = (params.fromStopId as string) || '';
  const toStopId = (params.toStopId as string) || '';
  const fromStopName = (params.fromStopName as string) || 'Origin';
  const toStopName = (params.toStopName as string) || 'Destination';
  const travelDate = (params.travelDate as string) || new Date().toISOString().split('T')[0];
  const passengers = parseInt(params.passengers as string) || 1;

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!scheduleId || !fromStopId || !toStopId) {
        setError('Missing search details. Please search again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await PassengerQueryService.findMyBusDetails(
          scheduleId,
          fromStopId,
          toStopId,
          tripId,
          travelDate,
          'DEFAULT',
        );
        setTripData(response);

        // Real fare, calculated from the route + journey distances (ticketing-service).
        const busType = response.trip?.bus?.hasAirConditioning ? 'SEMI_LUXURY' : 'NORMAL';
        try {
          const fareResult = await RouteFareControllerService.calculateFare({
            busType,
            routeId: response.route?.routeId,
            distanceFromStartToBoardingPoint: response.journeySummary?.originStopOrder != null
              ? response.routeScheduleStops?.find((s) => s.isOrigin)?.distanceFromStartKm
              : undefined,
            distanceFromStartToAlightingPoint: response.journeySummary?.destinationStopOrder != null
              ? response.routeScheduleStops?.find((s) => s.isDestination)?.distanceFromStartKm
              : undefined,
          });
          const parsed = parseFloat(fareResult);
          setFareAmount(Number.isFinite(parsed) ? parsed : null);
        } catch (fareErr) {
          console.warn('Fare calculation unavailable:', fareErr);
          setFareAmount(null);
        }

        // Real seat availability requires a generated trip (a schedule-only result has no bus
        // assigned yet, so there's nothing to book against).
        if (response.trip?.tripId) {
          try {
            const tickets = await TicketControllerService.getTicketsByTripId(response.trip.tripId);
            setBookedSeatCount((tickets || []).filter((t) => t.validationStatus !== 'CANCELLED').length);
          } catch {
            setBookedSeatCount(0);
          }
        }
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [scheduleId, tripId, fromStopId, toStopId, travelDate]);

  const getAmenityIcon = (facility: string) => {
    if (facility.includes('AirConditioning')) return <Snowflake size={20} color="#004CFF" />;
    if (facility.includes('Accessible')) return <Users size={20} color="#004CFF" />;
    return <Zap size={20} color="#004CFF" />;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) return `${timeParts[0]}:${timeParts[1]}`;
    return timeString;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const capacity = tripData?.trip?.bus?.capacity ?? 0;
  const availableSeats = tripData?.trip?.tripId ? Math.max(0, capacity - bookedSeatCount) : capacity;
  // Booking requires a real generated trip with a bus assigned - a schedule-only result (no
  // trip generated yet, or no bus assigned) has nothing to attach a ticket to.
  const bookingAvailable = !!(tripData?.trip?.tripId && tripData?.trip?.bus?.busId && fareAmount != null);

  const handleBookTrip = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Login Required', 'Please log in to book a ticket.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (passengers > 1) {
      Alert.alert(
        'Single Passenger Only',
        'Currently, only single passenger booking is supported. Please search again with 1 passenger.',
        [{ text: 'OK' }],
      );
      return;
    }

    if (!tripData?.trip?.tripId || !tripData.trip.bus?.busId || fareAmount == null) {
      Alert.alert('Booking Unavailable', 'This trip is not yet open for booking.');
      return;
    }

    setBookingData({
      tripId: tripData.trip.tripId,
      busId: tripData.trip.bus.busId,
      busPlateNumber: tripData.trip.bus.plateNumber,
      fromStopId,
      toStopId,
      fromStopName,
      toStopName,
      passengers: 1,
      fareAmount,
      passengerId: user.id,
      routeName: tripData.route?.name,
      operatorName: tripData.trip.operator?.name,
      tripDate: tripData.trip.tripDate || travelDate,
      scheduledDepartureTime: tripData.trip.scheduledDepartureTime,
      scheduledArrivalTime: tripData.trip.scheduledArrivalTime,
    });

    router.push('/search/booking');
  };

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

  if (error || !tripData) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Schedule Details" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || 'Trip details not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const departureTime = formatTime(tripData.journeySummary?.departureFromOrigin);
  const arrivalTime = formatTime(tripData.journeySummary?.arrivalAtDestination);

  return (
    <SafeAreaView style={safeAreaStyle}>
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
                {tripData.trip?.bus?.plateNumber || 'Bus not yet assigned'}
              </Text>
              <Text style={styles.operatorName}>
                {tripData.trip?.operator?.name || 'Operator TBA'}
              </Text>
              <View style={styles.journeyInfo}>
                <Text style={styles.journeyText}>{fromStopName} to {toStopName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItemRoute}>
              <Text style={styles.infoLabel}>Route</Text>
              <Text style={styles.infoValue}>{tripData.route?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoItemSeats}>
              <Text style={styles.infoLabel}>Seats Available</Text>
              <Text style={styles.availableSeats}>{availableSeats}/{capacity || '—'}</Text>
            </View>
            <View style={styles.infoItemPrice}>
              <Text style={styles.infoLabel}>Fare</Text>
              <Text style={styles.priceText}>{fareAmount != null ? `LKR ${fareAmount.toFixed(2)}` : 'TBA'}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setSelectedTab('schedule')} style={[styles.tab, selectedTab === 'schedule' && styles.activeTab]}>
            <Text style={[styles.tabText, selectedTab === 'schedule' && styles.activeTabText]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTab('amenities')} style={[styles.tab, selectedTab === 'amenities' && styles.activeTab]}>
            <Text style={[styles.tabText, selectedTab === 'amenities' && styles.activeTabText]}>Amenities</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={styles.scheduleHeaderValue}>{formatDuration(tripData.journeySummary?.estimatedDurationMinutes)}</Text>
              </View>
            </View>

            <View style={styles.journeySegmentInfo}>
              <Text style={styles.journeySegmentTitle}>Your Journey ({passengers} passenger{passengers !== 1 ? 's' : ''})</Text>
              <Text style={styles.journeySegmentDetails}>{fromStopName} → {toStopName}</Text>
            </View>

            {tripData.routeScheduleStops?.map((stop: RouteScheduleStop, index) => {
              const isUserStop = stop.isOrigin || stop.isDestination;
              return (
                <View key={stop.scheduleStopId || index} style={[styles.scheduleItem, isUserStop && styles.scheduleItemInJourney]}>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.scheduleTime, isUserStop && styles.highlightedText]}>
                      {formatTime(stop.resolvedDepartureTime || stop.resolvedArrivalTime)}
                    </Text>
                  </View>
                  <View style={styles.stopIndicator}>
                    <View style={[styles.stopDot, { backgroundColor: isUserStop ? '#004CFF' : '#9CA3AF' }, isUserStop && styles.highlightedDot]} />
                    {index < (tripData.routeScheduleStops?.length || 0) - 1 && <View style={styles.stopLine} />}
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={[styles.stopLocation, isUserStop && styles.highlightedText]}>
                      {stop.stop?.name || 'Unknown Stop'}
                      {stop.isOrigin && ' • Your Pickup'}
                      {stop.isDestination && ' • Your Dropoff'}
                    </Text>
                  </View>
                </View>
              );
            }) || <Text style={styles.noDataText}>No stop information available</Text>}

            <View style={styles.scheduleNotes}>
              <Text style={styles.scheduleNotesText}>Note: Schedule times may vary based on traffic conditions.</Text>
            </View>
          </View>
        )}

        {selectedTab === 'amenities' && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.sectionTitle}>Bus Features</Text>
            <View style={styles.amenitiesList}>
              {tripData.trip?.bus ? (
                [
                  { key: 'hasAirConditioning', label: 'Air Conditioning', value: tripData.trip.bus.hasAirConditioning },
                  { key: 'isAccessible', label: 'Wheelchair Accessible', value: tripData.trip.bus.isAccessible },
                ].map((f) => (
                  <View key={f.key} style={styles.amenityItem}>
                    <View style={[styles.amenityIconContainer, { backgroundColor: f.value ? '#EBF2FF' : '#F3F4F6' }]}>
                      {getAmenityIcon(f.key)}
                    </View>
                    <Text style={[styles.amenityName, { color: f.value ? '#111827' : '#9CA3AF' }]}>{f.label}</Text>
                    <Text style={[styles.amenityStatus, { color: f.value ? '#1DD724' : '#FF3831' }]}>
                      {f.value ? 'Available' : 'Not Available'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No feature information available - bus not yet assigned to this trip.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bookingContainer}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingPrice}>{fareAmount != null ? `LKR ${(fareAmount * passengers).toFixed(2)}` : 'Fare TBA'}</Text>
          <Text style={styles.bookingDetails}>for {passengers} passenger{passengers !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          onPress={handleBookTrip}
          style={[styles.bookButton, !bookingAvailable && { backgroundColor: '#9CA3AF' }]}
          disabled={!bookingAvailable}
        >
          <Text style={styles.bookButtonText}>{bookingAvailable ? 'Book This Trip' : 'Booking Unavailable'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F9' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center' },
  noDataText: { fontSize: 14, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' },
  content: { flex: 1 },
  busInfoCard: {
    backgroundColor: 'white', margin: 24, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  busHeader: { flexDirection: 'row', marginBottom: 16 },
  busImagePlaceholder: {
    width: 100, height: 75, borderRadius: 12, marginRight: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  busDetails: { flex: 1 },
  busName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  operatorName: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  journeyInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  journeyText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  infoItemRoute: { flex: 2 },
  infoItemSeats: { flex: 1 },
  infoItemPrice: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', marginTop: 4 },
  availableSeats: { fontSize: 14, color: '#1DD724', fontWeight: '600', marginTop: 4 },
  priceText: { fontSize: 14, color: '#004CFF', fontWeight: '600', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 24, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#004CFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: 'white' },
  scheduleContainer: { backgroundColor: 'white', marginHorizontal: 24, borderRadius: 16, padding: 20, marginBottom: 120 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 20 },
  scheduleHeaderItem: { alignItems: 'center' },
  scheduleHeaderTitle: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  scheduleHeaderValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  journeySegmentInfo: { backgroundColor: '#EBF2FF', borderRadius: 12, padding: 12, marginBottom: 20 },
  journeySegmentTitle: { fontSize: 12, fontWeight: '500', color: '#004CFF', marginBottom: 4 },
  journeySegmentDetails: { fontSize: 14, fontWeight: '600', color: '#111827' },
  scheduleItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  scheduleItemInJourney: { backgroundColor: '#FAFBFF', marginHorizontal: -12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  timeContainer: { width: 80, alignItems: 'flex-end', paddingRight: 16 },
  scheduleTime: { fontSize: 16, fontWeight: '600', color: '#111827' },
  stopIndicator: { alignItems: 'center', marginRight: 16 },
  stopDot: { width: 12, height: 12, borderRadius: 6 },
  stopLine: { width: 2, height: 40, backgroundColor: '#E5E7EB', marginTop: 4 },
  stopInfo: { flex: 1, paddingTop: 2 },
  stopLocation: { fontSize: 16, fontWeight: '500', color: '#111827' },
  highlightedText: { color: '#004CFF', fontWeight: '700' },
  highlightedDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#E6F2FF' },
  scheduleNotes: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginTop: 16 },
  scheduleNotesText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  amenitiesContainer: { backgroundColor: 'white', marginHorizontal: 24, borderRadius: 16, padding: 20, marginBottom: 120 },
  amenitiesList: { gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center' },
  amenityIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  amenityName: { flex: 1, fontSize: 16, fontWeight: '500' },
  amenityStatus: { fontSize: 12, fontWeight: '500' },
  bookingContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
    paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bookingInfo: { flex: 1 },
  bookingPrice: { fontSize: 18, fontWeight: '700', color: '#004CFF' },
  bookingDetails: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  bookButton: { backgroundColor: '#004CFF', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  bookButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
});
