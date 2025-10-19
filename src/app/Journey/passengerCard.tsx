import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePassengerCard } from '@/hooks/Journey/usePassegerCard';

export default function PassengerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    passenger,
    loading,
    error,
    actionLoading,
    handleRevalidate,
    handleInvalidate,
    handleShare,
    handleMessage,
    handleCall,
    refreshPassenger,
    setError,
    getValidationStatusColor,
    getPaymentTypeColor,
  } = usePassengerCard(id);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading passenger details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              refreshPassenger();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No passenger found
  if (!passenger) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#999" />
          <Text style={styles.errorText}>Passenger not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passenger Details</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshPassenger}>
          <Ionicons name="refresh" size={20} color="#333" />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.container}>
        {/* Passenger Basic Info Card */}
        <View style={styles.passengerInfoCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.passengerName}>{passenger.name}</Text>
            <View style={[
              styles.validationBadge,
              { backgroundColor: getValidationStatusColor() }
            ]}>
              <Ionicons 
                name={passenger.isValidated ? "checkmark" : "close"} 
                size={14} 
                color="white" 
              />
              <Text style={styles.validationText}>
                {passenger.validationStatus.charAt(0).toUpperCase() + passenger.validationStatus.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Ticket Information Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="confirmation-number" size={22} color="#0066FF" />
            <Text style={styles.sectionTitle}>Ticket Information</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="event-seat" size={20} color="#666" />
              <Text style={styles.labelText}>Seat Number</Text>
            </View>
            <Text style={styles.infoValue}>{passenger.ticket.seatNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="credit-card" size={20} color="#666" />
              <Text style={styles.labelText}>Ticket ID</Text>
            </View>
            <Text style={styles.infoValue}>{passenger.ticket.ticketId}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="payment" size={20} color="#666" />
              <Text style={styles.labelText}>Payment Type</Text>
            </View>
            <View style={[
              styles.paymentTypeBadge,
              { backgroundColor: `${getPaymentTypeColor()}15` }
            ]}>
              <Text style={[
                styles.paymentTypeText,
                { color: getPaymentTypeColor() }
              ]}>
                {passenger.ticket.paymentType}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.labelText}>Passengers</Text>
            </View>
            <Text style={styles.infoValue}>{passenger.ticket.passengerCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="attach-money" size={20} color="#666" />
              <Text style={styles.labelText}>Fare Paid</Text>
            </View>
            <Text style={styles.infoValue}>Rs. {passenger.ticket.fare.toFixed(2)}</Text>
          </View>

          {passenger.ticket.bookingReference && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="receipt" size={20} color="#666" />
                <Text style={styles.labelText}>Booking Ref</Text>
              </View>
              <Text style={styles.infoValue}>{passenger.ticket.bookingReference}</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="contact-phone" size={22} color="#0066FF" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="phone" size={20} color="#666" />
              <Text style={styles.labelText}>Phone Number</Text>
            </View>
            <View style={styles.phoneContainer}>
              <Text style={styles.infoValue}>{passenger.contact.phone}</Text>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <MaterialIcons name="call" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <MaterialIcons name="chat" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {passenger.contact.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="email" size={20} color="#666" />
                <Text style={styles.labelText}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{passenger.contact.email}</Text>
            </View>
          )}

          {passenger.contact.emergencyContact && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="emergency" size={20} color="#666" />
                <Text style={styles.labelText}>Emergency</Text>
              </View>
              <Text style={styles.infoValue}>{passenger.contact.emergencyContact}</Text>
            </View>
          )}
        </View>

        {/* Booking Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={22} color="#0066FF" />
            <Text style={styles.sectionTitle}>Booking Details</Text>
          </View>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Booking Time</Text>
            <Text style={styles.bookingValue}>{passenger.booking.bookingTime}</Text>
          </View>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>Arrival Time</Text>
            <Text style={styles.bookingValue}>{passenger.booking.arrivalTime}</Text>
          </View>

          {passenger.booking.departureTime && (
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>Departure Time</Text>
              <Text style={styles.bookingValue}>{passenger.booking.departureTime}</Text>
            </View>
          )}

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>From</Text>
            <Text style={styles.bookingValue}>{passenger.booking.boardingPoint}</Text>
          </View>

          <View style={styles.bookingRow}>
            <Text style={styles.bookingLabel}>To</Text>
            <Text style={styles.bookingValue}>{passenger.booking.destinationPoint}</Text>
          </View>
        </View>

        {/* Validation Status */}
        <View style={styles.sectionCard}>
          <View style={styles.validationHeader}>
            <Text style={styles.validationTitle}>Validation Status</Text>
            <View style={[
              styles.validationStatusIcon,
              { backgroundColor: getValidationStatusColor() }
            ]}>
              <Ionicons 
                name={passenger.isValidated ? "checkmark" : "close"} 
                size={24} 
                color="white" 
              />
            </View>
          </View>
          <Text style={styles.validationStatusText}>{passenger.validation.status}</Text>
          <Text style={styles.validationTime}>
            {passenger.isValidated ? 'Validated' : 'Last updated'} on: {passenger.validation.timestamp}
          </Text>
          
          {passenger.validation.validatedBy && (
            <Text style={styles.validatedBy}>
              By: {passenger.validation.validatedBy}
            </Text>
          )}
        </View>

        {/* Special Requirements */}
        {passenger.specialRequirements && passenger.specialRequirements.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="info" size={22} color="#0066FF" />
              <Text style={styles.sectionTitle}>Special Requirements</Text>
            </View>
            
            {passenger.specialRequirements.map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Additional Notes */}
        {passenger.additionalNotes && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="note" size={22} color="#0066FF" />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <Text style={styles.notesText}>{passenger.additionalNotes}</Text>
          </View>
        )}

        {/* Extra space at the bottom for scrolling */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[
            styles.revalidateButton,
            actionLoading && styles.disabledButton
          ]} 
          onPress={handleRevalidate}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          )}
          <Text style={styles.revalidateText}>
            {passenger.isValidated ? 'Re-validate Ticket' : 'Validate Ticket'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.invalidateButton} 
          onPress={() => handleInvalidate()}
          disabled={actionLoading}
        >
          <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          disabled={actionLoading}
        >
          <Ionicons name="share-social-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Content Styles
  container: {
    flex: 1,
    padding: 16,
  },
  passengerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  passengerName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  validationText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 3,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  paymentTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bookingLabel: {
    fontSize: 15,
    color: '#666',
  },
  bookingValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  validationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  validationStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationStatusText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  validationTime: {
    fontSize: 14,
    color: '#666',
  },
  validatedBy: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginBottom: 35,
  },
  revalidateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  revalidateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  invalidateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});