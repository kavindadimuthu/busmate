import { useEmployeeScheduleContext } from '@/contexts/EmployeeScheduleContext';
import { useTicket } from '@/contexts/TicketContext';
import mockTripData from '@/data/Journey/tripSummaryData.json';
import { EmployeeSchedule } from '@/types/employee';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


export default function TripOverviewScreen() {
  const { id } = useLocalSearchParams();
  const { schedules } = useEmployeeScheduleContext();
  const { 
    getQRScanLogsForTrip, 
    getCashTicketLogsForTrip 
  } = useTicket();
  
  // Find the specific trip by ID
  const tripSchedule = schedules?.find((schedule: EmployeeSchedule) => schedule.id === id);
  
  // Get mock data for this trip (using trip ID hash for consistency)
  const getMockDataForTrip = (tripId: string) => {
    // Use a simple hash function to consistently assign mock data to trips
    const hash = tripId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % mockTripData.length;
    return mockTripData[index];
  };
  
  // Calculate trip data from ticket logs
  const tripSummaryData = useMemo(() => {
    if (!tripSchedule?.id) {
      return {
        totalPassengers: 0,
        totalRevenue: 0,
        totalTickets: 0,
        qrScans: { successful: 0, failed: 0, successRate: 0 },
        cashRevenue: 0,
        digitalRevenue: 0,
        isUsingMockData: false
      };
    }

    // Get logs for this trip
    const qrLogs = getQRScanLogsForTrip(tripSchedule.id);
    const cashTickets = getCashTicketLogsForTrip(tripSchedule.id);

    // Calculate QR scan data
    const successfulQRScans = qrLogs.filter(log => log.status === 'success');
    const failedQRScans = qrLogs.filter(log => log.status === 'failed');
    const qrPassengers = successfulQRScans.reduce((total, log) => total + log.passengerCount, 0);
    const qrRevenue = successfulQRScans.reduce((total, log) => total + log.ticketFee, 0);

    // Calculate cash ticket data
    const cashPassengers = cashTickets.reduce((total, ticket) => total + ticket.passengerCount, 0);
    const cashRevenue = cashTickets.reduce((total, ticket) => total + ticket.fareAmount, 0);

    // Calculate totals
    const totalPassengers = qrPassengers + cashPassengers;
    const totalTickets = successfulQRScans.length + cashTickets.length;
    const totalRevenue = qrRevenue + cashRevenue;
    const totalQRAttempts = qrLogs.length;
    const successRate = totalQRAttempts > 0 ? Math.round((successfulQRScans.length / totalQRAttempts) * 100) : 0;

    
    if (totalPassengers === 0 && totalTickets === 0 && totalRevenue === 0) {
      const mockData = getMockDataForTrip(tripSchedule.id);
      return {
        totalPassengers: mockData.passengers,
        totalRevenue: mockData.cashRevenue + mockData.digitalRevenue,
        totalTickets: mockData.tickets,
        qrScans: {
          successful: mockData.qrScans.successful,
          failed: mockData.qrScans.failed,
          successRate: mockData.qrScans.successRate
        },
        cashRevenue: mockData.cashRevenue,
        digitalRevenue: mockData.digitalRevenue,
        isUsingMockData: true
      };
    }

    // Use real data if available
    return {
      totalPassengers: totalPassengers,
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      qrScans: {
        successful: successfulQRScans.length,
        failed: failedQRScans.length,
        successRate: successRate
      },
      cashRevenue: cashRevenue,
      digitalRevenue: qrRevenue,
      isUsingMockData: false
    };
  }, [tripSchedule?.id, getQRScanLogsForTrip, getCashTicketLogsForTrip]);

  // Helper functions
  const formatTime = (timeStr: string): string => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const min = parseInt(minutes, 10);
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      
      return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      if (duration < 0) duration += 24 * 60; // Handle overnight trips
      
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'ongoing': return '#0066FF';
      case 'cancelled': return '#FF3B30';
      default: return '#999';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'ongoing': return 'Ongoing';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // If no trip found, show error
  if (!tripSchedule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorMessage}>The requested trip could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
     

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Route Card */}
        <View style={styles.card}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.routeIconNameContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="bus" size={24} color="#0066FF" />
              </View>
              <View>
                <Text style={styles.routeNumber}>{tripSchedule.route}</Text>
                <Text style={styles.busId}>Bus  {tripSchedule.busPlateNumber || tripSchedule.busId}</Text>
              </View>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: tripSchedule.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons 
                name={tripSchedule.status === 'completed' ? "checkmark" : "close"} 
                size={14} 
                color={getStatusColor(tripSchedule.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(tripSchedule.status) }]}>
                {getStatusText(tripSchedule.status)}
              </Text>
            </View>
          </View>

          <View style={styles.routeProgressContainer}>
            <View style={styles.locationTimeContainer}>
              <Text style={styles.locationText}>{tripSchedule.fromLocation || 'Start'}</Text>
              <Text style={styles.timeText}>{formatTime(tripSchedule.startTime)}</Text>
            </View>

            <View style={styles.progressLineContainer}>
              <View style={styles.progressLine}>
                <View style={styles.progressDot1} />
                <View style={styles.progressDot2} />
              </View>
              <Text style={styles.durationText}>
                {calculateDuration(tripSchedule.startTime, tripSchedule.endTime)}
              </Text>
            </View>

            <View style={styles.locationTimeContainer}>
              <Text style={styles.locationText}>{tripSchedule.toLocation || 'End'}</Text>
              <Text style={styles.timeText}>{formatTime(tripSchedule.endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Passenger and Tickets Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconCircle}>
              <Ionicons name="people" size={20} color="#0066FF" />
            </View>
            <Text style={styles.statsNumber}>{tripSummaryData.totalPassengers}</Text>
            <Text style={styles.statsLabel}>Passengers</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={[styles.statsIconCircle, { backgroundColor: '#F0E6FF' }]}>
              <MaterialIcons name="confirmation-number" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statsNumber}>{tripSummaryData.totalTickets}</Text>
            <Text style={styles.statsLabel}>Tickets</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.card}>
          <View style={styles.revenueHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#E6F9EC' }]}>
              <MaterialIcons name="attach-money" size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.revenueTitle}>Revenue Collected</Text>
              <Text style={styles.revenueSubtitle}>Total earnings for this trip</Text>
            </View>
          </View>

          <View style={styles.revenueRow}>
            <View style={styles.revenueTypeContainer}>
              <MaterialIcons name="money" size={18} color="#22C55E" />
              <Text style={styles.revenueTypeText}>Cash</Text>
            </View>
            <Text style={styles.revenueAmount}>Rs {tripSummaryData.cashRevenue.toLocaleString()}</Text>
          </View>

          <View style={[styles.revenueRow, styles.revenueRowBorder]}>
            <View style={styles.revenueTypeContainer}>
              <Ionicons name="qr-code" size={18} color="#0066FF" />
              <Text style={styles.revenueTypeText}>Digital (QR)</Text>
            </View>
            <Text style={styles.revenueAmount}>Rs {tripSummaryData.digitalRevenue.toLocaleString()}</Text>
          </View>

          <View style={styles.revenueTotalRow}>
            <Text style={styles.revenueTotalText}>Total Revenue</Text>
            <Text style={styles.revenueTotalAmount}>Rs {tripSummaryData.totalRevenue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Trip Completion Card */}
        <View style={styles.completionCard}>
          <Text style={styles.completionHeader}>
            {tripSchedule.status === 'completed' ? 'Trip completed on' : 'Trip scheduled for'}
          </Text>
          <Text style={styles.completionDate}>{formatDate(tripSchedule.date)}</Text>
          <Text style={styles.completionDuration}>
            Journey Duration: {calculateDuration(tripSchedule.startTime, tripSchedule.endTime)}
          </Text>
        </View>
        
        {/* Bottom padding for scroll */}
        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  moreButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeIconNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumber: {
    fontSize: 17,
    fontWeight: '600',
  },
  busId: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
    marginLeft: 4,
  },
  routeProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTimeContainer: {
    alignItems: 'center',
    width: 80,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  progressLineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
    position: 'relative',
  },
  progressDot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
    position: 'absolute',
    left: 0,
    top: -3,
  },
  progressDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    position: 'absolute',
    right: 0,
    top: -3,
  },
  durationText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  revenueSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  revenueRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  revenueTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueTypeText: {
    fontSize: 15,
    marginLeft: 8,
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  revenueTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  revenueTotalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  revenueTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  completionCard: {
    backgroundColor: '#EEF3FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  completionHeader: {
    fontSize: 14,
    color: '#0066FF',
    marginBottom: 6,
  },
  completionDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 6,
  },
  completionDuration: {
    fontSize: 14,
    color: '#0066FF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
});