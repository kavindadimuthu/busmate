import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, Calendar, Lock, User, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useBooking } from '@/context/BookingContext';
import { TicketControllerService } from '@/lib/api-client/ticketing-management';
import type { PaymentRequestDTO } from '@/lib/api-client/ticketing-management';
import { generateTransactionRef, formatFare, validateBookingData } from '@/utils/bookingUtils';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingData, setPaymentData, setBookedTicket, setBookingInProgress, isBookingInProgress } = useBooking();
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

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

  const totalAmount = bookingData.fareAmount + 25 + (bookingData.selectedSeatNumber ? 50 : 0);

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, '');
    
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    
    return v;
  };

  const isFormValid = () => {
    return (
      cardNumber.replace(/\s/g, '').length >= 13 &&
      expiryDate.length === 5 &&
      cvv.length >= 3 &&
      cardholderName.trim().length >= 2
    );
  };

  const handlePayNow = async () => {
    if (!isFormValid()) {
      Alert.alert('Invalid Information', 'Please fill in all payment details correctly.');
      return;
    }

    // Validate booking data
    const validation = validateBookingData(bookingData);
    if (!validation.isValid) {
      Alert.alert('Booking Error', validation.errors.join('\n'));
      return;
    }

    try {
      setBookingInProgress(true);

      // Generate transaction reference
      const transactionRef = generateTransactionRef();

      // Store payment data
      const paymentData = {
        transactionRef,
        paymentMethod: 'ONLINE',
        amount: totalAmount
      };
      setPaymentData(paymentData);

      // Prepare payment request for API
      const paymentRequest: PaymentRequestDTO = {
        busId: bookingData.busData.id,
        tripId: bookingData.tripId,
        startLocationId: bookingData.fromStopId,
        endLocationId: bookingData.toStopId,
        fareAmount: totalAmount,
        paymentMethod: 'ONLINE',
        transactionRef: transactionRef,
        seatNumber: bookingData.selectedSeatNumber,
        passengerId: bookingData.passengerId
      };

      // Call the ticket booking API
      const ticketResponse = await TicketControllerService.createTicket(paymentRequest);
      
      // Store the booked ticket
      setBookedTicket(ticketResponse);

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
            <Text style={styles.summaryLabel}>Base Fare</Text>
            <Text style={styles.summaryValue}>{formatFare(bookingData.fareAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>LKR 25</Text>
          </View>
          {bookingData.selectedSeatNumber && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Seat {bookingData.selectedSeatNumber}</Text>
              <Text style={styles.summaryValue}>LKR 50</Text>
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
              <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
              <CheckCircle size={20} color="#1DD724" />
            </View>
          </View>
          
          <Text style={styles.noteText}>
            Note: This is a demo payment interface. No real payment will be processed.
          </Text>
        </View>

        {/* Card Details */}
        <View style={styles.cardForm}>
          <Text style={styles.sectionTitle}>Card Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <View style={styles.inputWrapper}>
              <CreditCard size={16} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={16} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <View style={styles.inputWrapper}>
              <User size={16} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          onPress={handlePayNow}
          style={[
            styles.payButton,
            (!isFormValid() || isBookingInProgress) && styles.payButtonDisabled
          ]}
          disabled={!isFormValid() || isBookingInProgress}
        >
          {isBookingInProgress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.payButtonText}>Processing...</Text>
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
  cardForm: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
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
  rowContainer: {
    flexDirection: 'row',
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