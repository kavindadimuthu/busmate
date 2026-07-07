import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle, Chrome as Home, Ticket, MapPin, Calendar, Clock, User } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useBooking } from '@/context/BookingContext';
import { formatFare } from '@/utils/bookingUtils';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function SuccessScreen() {
  const router = useRouter();
  const { bookedTicket, bookingData, paymentData, clearBookingData } = useBooking();
  const safeAreaStyle = useSafeAreaContainerStyles();
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Auto redirect after 8 seconds
    const timer = setTimeout(() => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      try {
        // First, navigate to home
        router.replace('/(tabs)');
        
        // Then clear booking data after a small delay to avoid race conditions
        setTimeout(() => {
          if (isMountedRef.current) {
            clearBookingData();
          }
        }, 100);
      } catch (error) {
        console.error('Auto-redirect error:', error);
        // Fallback: just clear data if navigation fails
        if (isMountedRef.current) {
          clearBookingData();
        }
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [clearBookingData, router]);

  // Cleanup effect to mark component as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Today';
    }
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      <ScrollView style={styles.content}>
        <View style={styles.successIcon}>
          <CheckCircle size={80} color="#1DD724" />
        </View>
        
        <Text style={styles.title}>Booking Successful!</Text>
        <Text style={styles.subtitle}>
          Your bus ticket has been confirmed and saved to your account
        </Text>

        {/* Ticket Information */}
        {bookedTicket && (
          <View style={styles.ticketCard}>
            <Text style={styles.ticketTitle}>Ticket Details</Text>
            
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Ticket ID</Text>
              <Text style={styles.ticketValue}>#{bookedTicket.ticketId}</Text>
            </View>
            
            {bookedTicket.seatNumber && (
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Seat Number</Text>
                <Text style={styles.ticketValue}>{bookedTicket.seatNumber}</Text>
              </View>
            )}
            
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Fare Amount</Text>
              <Text style={styles.ticketValue}>{formatFare(bookedTicket.fareAmount || 0)}</Text>
            </View>

            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Payment Status</Text>
              <Text style={[styles.ticketValue, { color: '#1DD724' }]}>
                {bookedTicket.paymentStatus || 'Paid'}
              </Text>
            </View>

            {paymentData && (
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Transaction Ref</Text>
                <Text style={styles.ticketValue}>{paymentData.transactionRef}</Text>
              </View>
            )}
          </View>
        )}

        {/* Trip Information */}
        {bookingData && (
          <View style={styles.tripCard}>
            <Text style={styles.tripTitle}>Trip Information</Text>
            
            <View style={styles.tripRow}>
              <MapPin size={16} color="#004CFF" />
              <Text style={styles.tripText}>{bookingData.fromStopName} → {bookingData.toStopName}</Text>
            </View>
            
            <View style={styles.tripRow}>
              <Calendar size={16} color="#004CFF" />
              <Text style={styles.tripText}>
                {formatDate(bookingData.tripData.scheduledDeparture)}
              </Text>
            </View>
            
            <View style={styles.tripRow}>
              <Clock size={16} color="#004CFF" />
              <Text style={styles.tripText}>
                {formatTime(bookingData.tripData.scheduledDeparture)} - {formatTime(bookingData.tripData.scheduledArrival)}
              </Text>
            </View>
            
            <View style={styles.tripRow}>
              <User size={16} color="#004CFF" />
              <Text style={styles.tripText}>
                {bookingData.tripData.operator?.name || 'Bus Operator'}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>
            You will receive a confirmation SMS and email shortly
          </Text>
          <Text style={styles.detailsText}>
            Your ticket is now available in "My Tickets"
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => {
              if (!isMountedRef.current) return;
              
              try {
                router.push('/tickets');
                setTimeout(() => {
                  if (isMountedRef.current) {
                    clearBookingData();
                  }
                }, 100);
              } catch (error) {
                console.error('Navigation to tickets error:', error);
                if (isMountedRef.current) {
                  clearBookingData();
                }
              }
            }}
            style={styles.ticketsButton}
          >
            <Ticket size={20} color="white" />
            <Text style={styles.ticketsButtonText}>View My Tickets</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              if (!isMountedRef.current) return;
              
              try {
                router.replace('/(tabs)');
                setTimeout(() => {
                  if (isMountedRef.current) {
                    clearBookingData();
                  }
                }, 100);
              } catch (error) {
                console.error('Navigation to home error:', error);
                if (isMountedRef.current) {
                  clearBookingData();
                }
              }
            }}
            style={styles.homeButton}
          >
            <Home size={20} color="#004CFF" />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.autoRedirectText}>
          Automatically redirecting to home in 8 seconds...
        </Text>
      </ScrollView>
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
    paddingVertical: 40,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  ticketCard: {
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
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tripText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  ticketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ticketsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  homeButton: {
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
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  autoRedirectText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});