import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function CancelTicketScreen() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const safeAreaStyle = useSafeAreaContainerStyles();

  const cancellationReasons = [
    'Change of plans',
    'Emergency situation',
    'Found alternative transport',
    'Schedule conflict',
    'Medical reasons',
    'Other'
  ];

  const ticketData = {
    bookingId: 'SB2024011501',
    route: { from: 'Colombo Fort', to: 'Kandy' },
    date: 'Today, Jan 15',
    time: '08:30 AM',
    seatNumber: 'A12',
    price: 250,
    refundAmount: 225, // After cancellation fee
    cancellationFee: 25
  };

  const handleCancelTicket = async () => {
    if (!selectedReason) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      router.replace('/tickets');
    }, 2000);
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader title="Cancel Ticket" />

      <ScrollView style={styles.content}>
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <AlertTriangle size={24} color="#F59E0B" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Cancellation Policy</Text>
            <Text style={styles.warningText}>
              Free cancellation up to 2 hours before departure. 
              A cancellation fee of LKR 25 will be deducted from your refund.
            </Text>
          </View>
        </View>

        {/* Ticket Summary */}
        <View style={styles.ticketSummary}>
          <Text style={styles.sectionTitle}>Ticket Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue}>{ticketData.route.from} → {ticketData.route.to}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>{ticketData.date} • {ticketData.time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seat</Text>
            <Text style={styles.summaryValue}>{ticketData.seatNumber}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking ID</Text>
            <Text style={styles.summaryValue}>#{ticketData.bookingId}</Text>
          </View>
        </View>

        {/* Cancellation Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          <Text style={styles.sectionSubtitle}>Please select a reason for cancelling your ticket</Text>
          
          <View style={styles.reasonsList}>
            {cancellationReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected
                ]}
              >
                <View style={[
                  styles.radioButton,
                  selectedReason === reason && styles.radioButtonSelected
                ]}>
                  {selectedReason === reason && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextSelected
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Other' && (
            <View style={styles.customReasonContainer}>
              <Text style={styles.inputLabel}>Please specify</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your reason..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        </View>

        {/* Refund Information */}
        <View style={styles.refundSection}>
          <Text style={styles.sectionTitle}>Refund Information</Text>
          <View style={styles.refundDetails}>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Original Amount</Text>
              <Text style={styles.refundValue}>LKR {ticketData.price}</Text>
            </View>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Cancellation Fee</Text>
              <Text style={styles.refundFee}>- LKR {ticketData.cancellationFee}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.refundRow}>
              <Text style={styles.refundTotalLabel}>Refund Amount</Text>
              <Text style={styles.refundTotalValue}>LKR {ticketData.refundAmount}</Text>
            </View>
          </View>
          <Text style={styles.refundNote}>
            Refund will be processed within 3-5 business days to your original payment method.
          </Text>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      <View style={styles.cancelContainer}>
        <TouchableOpacity
          onPress={handleCancelTicket}
          disabled={!selectedReason || isProcessing}
          style={[
            styles.cancelButton,
            (!selectedReason || isProcessing) && styles.cancelButtonDisabled
          ]}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <RefreshCw size={20} color="white" />
              <Text style={styles.cancelButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Ticket</Text>
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  ticketSummary: {
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
    fontWeight: '500',
    color: '#111827',
  },
  reasonSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonItemSelected: {
    borderColor: '#004CFF',
    backgroundColor: '#EBF2FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#004CFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004CFF',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#004CFF',
    fontWeight: '500',
  },
  customReasonContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
  },
  refundSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 115,
  },
  refundDetails: {
    marginBottom: 16,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  refundValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  refundFee: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  refundTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  refundTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1DD724',
  },
  refundNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  cancelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});