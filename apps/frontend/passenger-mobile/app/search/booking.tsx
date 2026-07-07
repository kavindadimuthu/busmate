import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, Plus, UserPlus, CheckCircle, ArrowRight } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useBooking } from '@/context/BookingContext';
import { formatFare } from '@/utils/bookingUtils';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function BookingScreen() {
  const router = useRouter();
  const { bookingData, setSelectedSeat } = useBooking();
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  // Get selected seat from booking data
  const selectedSeat = bookingData?.selectedSeatNumber;
  
  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      Alert.alert(
        'No Booking Data',
        'Please start the booking process from the search results.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [bookingData, router]);

  if (!bookingData) {
    return null; // Will redirect via useEffect
  }

  const handleSeatSelection = () => {
    router.push('/search/seat-selection');
  };

  const handleConfirmBooking = () => {
    router.push('/search/payment');
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return timeString;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Today';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return 'Today';
    }
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      <AppHeader title="Booking Confirmation" />

      <ScrollView style={styles.content}>
        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>
          <View style={styles.tripDetails}>
            <View style={styles.tripRow}>
              <MapPin size={16} color="#004CFF" />
              <Text style={styles.tripText}>{bookingData.fromStopName} → {bookingData.toStopName}</Text>
            </View>
            <View style={styles.tripRow}>
              <Calendar size={16} color="#004CFF" />
              <Text style={styles.tripText}>{formatDate(bookingData.tripData.scheduledDeparture)}</Text>
            </View>
            <View style={styles.tripRow}>
              <Clock size={16} color="#004CFF" />
              <Text style={styles.tripText}>
                {formatTime(bookingData.tripData.scheduledDeparture)} - {formatTime(bookingData.tripData.scheduledArrival)}
              </Text>
            </View>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorName}>{bookingData.tripData.operator?.name || 'Bus Operator'}</Text>
            <Text style={styles.routeNumber}>{bookingData.tripData.routeName || 'Route'}</Text>
          </View>
        </View>

        {/* Passenger Information */}
        {/* <View style={styles.passengersCard}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          <View style={styles.passengerInfoDisplay}>
            <Text style={styles.passengerNote}>
              Booking for: 1 passenger (Single passenger booking only)
            </Text>
          </View>
        </View> */}

        {/* Seat Selection (Optional) */}
        <View style={styles.seatCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seat Selection</Text>
            <Text style={styles.optionalText}>(Optional)</Text>
          </View>
          
          {selectedSeat ? (
            <View style={styles.selectedSeatContainer}>
              <View style={styles.seatSelectedInfo}>
                <CheckCircle size={20} color="#1DD724" />
                <Text style={styles.selectedSeatText}>Seat {selectedSeat} selected</Text>
              </View>
              <TouchableOpacity onPress={handleSeatSelection} style={styles.changeSeatButton}>
                <Text style={styles.changeSeatText}>Change Seat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleSeatSelection} style={styles.selectSeatButton}>
              <Text style={styles.selectSeatText}>Select Seat</Text>
              <ArrowRight size={16} color="#004CFF" />
            </TouchableOpacity>
          )}
          
          <Text style={styles.seatNote}>
            Seat selection is optional. If no seat is selected, one will be assigned automatically.
          </Text>
        </View>

        {/* Price Summary */}
        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base fare (1 passenger)</Text>
            <Text style={styles.priceValue}>{formatFare(bookingData.fareAmount)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>LKR 25</Text>
          </View>
          {selectedSeat && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Seat reservation</Text>
              <Text style={styles.priceValue}>LKR 50</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              {formatFare(bookingData.fareAmount + 25 + (selectedSeat ? 50 : 0))}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Booking Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          onPress={handleConfirmBooking}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Confirm Booking</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tripDetails: {
    gap: 12,
    marginBottom: 16,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  operatorInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  routeNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  passengersCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004CFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  passengerForm: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#004CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  passengerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  passengerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3831',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderTextActive: {
    color: 'white',
  },
  passengerNotes: {
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
  },
  continueContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  // New styles for updated booking confirmation UI
  passengerInfoDisplay: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
  },
  passengerNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  seatCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionalText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  selectedSeatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1DD724',
    marginTop: 12,
  },
  seatSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedSeatText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1DD724',
  },
  changeSeatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
  },
  changeSeatText: {
    fontSize: 14,
    color: '#004CFF',
    fontWeight: '500',
  },
  selectSeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },
  selectSeatText: {
    fontSize: 16,
    color: '#004CFF',
    fontWeight: '500',
  },
  seatNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    lineHeight: 16,
  },
});