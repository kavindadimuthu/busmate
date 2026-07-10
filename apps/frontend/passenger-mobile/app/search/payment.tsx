import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, CheckCircle } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useBooking } from '@/context/BookingContext';
import { TicketControllerService } from '@/lib/api-client/ticketing-management';
import type { BookingRequestDTO } from '@/lib/api-client/ticketing-management';
import { formatFare, validateBookingData } from '@/utils/bookingUtils';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingData, setPaymentData, setBookedTicket, setBookingInProgress, isBookingInProgress } = useBooking();
  const safeAreaStyle = useSafeAreaContainerStyles();

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

  const totalAmount = bookingData.fareAmount;

  const handlePayNow = async () => {
    // Validate booking data
    const validation = validateBookingData(bookingData);
    if (!validation.isValid) {
      Alert.alert('Booking Error', validation.errors.join('\n'));
      return;
    }

    try {
      setBookingInProgress(true);

      // Step 1: initiate the booking - creates a PENDING ticket/transaction and hands off
      // to the payment gateway (dummy gateway for now, real gateway later - same API shape).
      const bookingRequest: BookingRequestDTO = {
        passengerId: bookingData.passengerId,
        busId: bookingData.busId,
        tripId: bookingData.tripId,
        startLocationId: bookingData.fromStopId,
        endLocationId: bookingData.toStopId,
        fareAmount: totalAmount,
        seatNumber: bookingData.selectedSeatNumber,
      };
      const bookingResponse = await TicketControllerService.bookTicket(bookingRequest);
      if (!bookingResponse.ticketId || !bookingResponse.paymentReference) {
        throw new Error('Booking did not return a valid ticket.');
      }
      const ticketId = bookingResponse.ticketId;

      // Brief simulated "processing" delay so the two-step flow is visible to the user,
      // mirroring how a real redirect-based gateway would take a moment to respond.
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 2: confirm the payment with the gateway.
      const confirmResponse = await TicketControllerService.confirmPayment(ticketId);

      if (confirmResponse.paymentStatus !== 'SUCCESS') {
        throw new Error('Payment was not confirmed by the payment gateway.');
      }

      setPaymentData({
        ticketId,
        paymentReference: bookingResponse.paymentReference,
        amount: totalAmount,
      });

      // Fetch the full ticket details for the success/summary screens.
      const ticket = await TicketControllerService.getTicketById(ticketId);
      setBookedTicket(ticket);

      // Navigate to success page
      router.replace('/search/success');

    } catch (error) {
      console.error('Payment/Booking error:', error);

      Alert.alert(
        'Booking Failed',
        'Something went wrong while processing your booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      <AppHeader title="Payment" />

      <ScrollView style={styles.content}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trip</Text>
            <Text style={styles.summaryValue}>{bookingData.fromStopName} → {bookingData.toStopName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fare</Text>
            <Text style={styles.summaryValue}>{formatFare(bookingData.fareAmount)}</Text>
          </View>
          {bookingData.selectedSeatNumber && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Seat</Text>
              <Text style={styles.summaryValue}>{bookingData.selectedSeatNumber}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatFare(totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodContainer}>
            <View style={styles.paymentMethodItem}>
              <CreditCard size={24} color="#004CFF" />
              <Text style={styles.paymentMethodText}>Online Payment</Text>
              <CheckCircle size={20} color="#1DD724" />
            </View>
          </View>

          <Text style={styles.noteText}>
            Note: This uses a test payment gateway - no real payment will be processed. Tapping
            &quot;Pay Now&quot; simulates a real gateway&apos;s initiate-then-confirm flow.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          onPress={handlePayNow}
          style={[
            styles.payButton,
            isBookingInProgress && styles.payButtonDisabled
          ]}
          disabled={isBookingInProgress}
        >
          {isBookingInProgress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.payButtonText}>Processing payment...</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>Pay Now - {formatFare(totalAmount)}</Text>
          )}
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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
  paymentCard: {
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
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004CFF',
    gap: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  payButtonContainer: {
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
  payButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});