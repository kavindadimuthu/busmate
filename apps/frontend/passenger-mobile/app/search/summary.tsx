import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Calendar, Clock, Users, CreditCard, Download, Share } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function SummaryScreen() {
  const router = useRouter();
  const safeAreaStyle = useSafeAreaContainerStyles();

  const bookingDetails = {
    bookingId: 'SB2024011501',
    route: 'Colombo Fort → Kandy',
    date: 'Today, Jan 15, 2024',
    time: '08:30 AM',
    duration: '2h 30m',
    operator: 'SLTB Express',
    routeNumber: '001',
    passengers: [
      { name: 'John Doe', seat: 'A12', age: 28 },
      { name: 'Jane Doe', seat: 'A13', age: 25 }
    ],
    payment: {
      method: 'Credit Card',
      amount: 525,
      transactionId: 'TXN123456789'
    },
    status: 'Confirmed'
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader title="Booking Summary" />

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Text style={styles.statusEmoji}>✅</Text>
          </View>
          <Text style={styles.statusTitle}>Booking Confirmed!</Text>
          <Text style={styles.statusSubtitle}>
            Your bus ticket has been booked successfully
          </Text>
          <Text style={styles.bookingId}>Booking ID: {bookingDetails.bookingId}</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText}>{bookingDetails.route}</Text>
              <Text style={styles.operatorText}>
                {bookingDetails.operator} • Route {bookingDetails.routeNumber}
              </Text>
            </View>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripInfoItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.tripInfoText}>{bookingDetails.date}</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.tripInfoText}>{bookingDetails.time} • {bookingDetails.duration}</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.tripInfoText}>{bookingDetails.passengers.length} passengers</Text>
            </View>
          </View>
        </View>

        {/* Passenger Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Passenger Details</Text>
          {bookingDetails.passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerItem}>
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>{passenger.name}</Text>
                <Text style={styles.passengerDetails}>Age: {passenger.age}</Text>
              </View>
              <View style={styles.seatInfo}>
                <Text style={styles.seatNumber}>Seat {passenger.seat}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentMethod}>
                <CreditCard size={16} color="#6B7280" />
                <Text style={styles.paymentMethodText}>{bookingDetails.payment.method}</Text>
              </View>
              <Text style={styles.paymentAmount}>LKR {bookingDetails.payment.amount}</Text>
            </View>
            <Text style={styles.transactionId}>
              Transaction ID: {bookingDetails.payment.transactionId}
            </Text>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Important Information</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Please arrive at the departure point 15 minutes early</Text>
            <Text style={styles.infoItem}>• Carry a valid ID for verification</Text>
            <Text style={styles.infoItem}>• Your ticket will be available in the "My Tickets" section</Text>
            <Text style={styles.infoItem}>• Cancellation is allowed up to 2 hours before departure</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Download Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Share Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={() => router.push('/tickets')}
          style={styles.viewTicketsButton}
        >
          <Text style={styles.viewTicketsButtonText}>View My Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/search/success')}
          style={styles.doneButton}
        >
          <Text style={styles.doneButtonText}>Done</Text>
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
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusEmoji: {
    fontSize: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004CFF',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeHeader: {
    alignItems: 'center',
  },
  routeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  operatorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tripInfo: {
    gap: 12,
  },
  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  passengerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  passengerDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  seatInfo: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004CFF',
  },
  paymentInfo: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  transactionId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004CFF',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  viewTicketsButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  viewTicketsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#004CFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});