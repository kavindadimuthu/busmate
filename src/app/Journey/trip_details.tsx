import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BusLayout from '../../components/Journey/BusLayout';
import PassengerList from '../../components/Journey/PassengerList';
import { useEmployeeScheduleContext } from '../../contexts/EmployeeScheduleContext';
import { EmployeeSchedule } from '../../types/employee';

export default function TripDetailsScreen() {
  const [activeTab, setActiveTab] = useState<'seats' | 'passengers'>('seats');
  const { schedules, loading, error } = useEmployeeScheduleContext();
   const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const [tripData, setTripData] = useState<EmployeeSchedule | null>(null);

  // Find the specific trip by ID
  useEffect(() => {
    if (tripId && schedules.length > 0) {
      const trip = schedules.find(schedule => schedule.id === tripId);
      setTripData(trip || null);
      console.log('📋 Trip details loaded:', trip);
    }
  }, [tripId, schedules]);

  // Helper function to format time from HH:MM:SS to readable format
  const formatTime = (timeStr: string): string => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const min = minutes;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${min} ${period}`;
    } catch {
      return timeStr;
    }
  };

  // Helper function to format date from YYYY-MM-DD to readable format
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Get status color and text
  const getStatusDisplay = (status: EmployeeSchedule['status']) => {
    switch (status) {
      case 'ongoing':
        return { color: '#22C55E', text: 'Ongoing' };
      case 'completed':
        return { color: '#6B7280', text: 'Completed' };
      case 'upcoming':
        return { color: '#3B82F6', text: 'Upcoming' };
      case 'pending':
        return { color: '#F59E0B', text: 'Pending' };
      case 'cancelled':
        return { color: '#EF4444', text: 'Cancelled' };
      default:
        return { color: '#6B7280', text: 'Unknown' };
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to Load Trip</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Trip not found
  if (!tripData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="bus-outline" size={64} color="#6B7280" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorMessage}>
            The requested trip could not be found. It may have been cancelled or updated.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusDisplay = getStatusDisplay(tripData.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with back button */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View> */}

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'seats' && styles.activeTab]}
          onPress={() => setActiveTab('seats')}
        >
          <Ionicons name="car-outline" size={18} color={activeTab === 'seats' ? "#fff" : "#333"} />
          <Text style={[styles.tabText, activeTab === 'seats' && styles.activeTabText]}>
            Seat View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'passengers' && styles.activeTab]}
          onPress={() => setActiveTab('passengers')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={activeTab === 'passengers' ? "#fff" : "#333"} 
          />
          <Text style={[styles.tabText, activeTab === 'passengers' && styles.activeTabText]}>
            Passenger List
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {activeTab === 'seats' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Trip Info Card */}
            <View style={styles.tripCard}>
              <View style={styles.routeContainer}>
                <Text style={styles.routeName}>{tripData.route}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color }]}>
                  <Text style={styles.statusText}>{statusDisplay.text}</Text>
                </View>
              </View>
              
              <Text style={styles.busNumber}>Bus No: {tripData.busPlateNumber || tripData.busId}</Text>
              
              {/* Route Details */}
              {tripData.fromLocation && tripData.toLocation && (
                <View style={styles.routeDetails}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="#0066FF" />
                    <Text style={styles.locationText}>From: {tripData.fromLocation}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="flag" size={16} color="#EF4444" />
                    <Text style={styles.locationText}>To: {tripData.toLocation}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.timeContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Departure</Text>
                  <Text style={styles.timeValue}>{formatTime(tripData.startTime)}</Text>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Arrival</Text>
                  <Text style={styles.timeValue}>{formatTime(tripData.endTime)}</Text>
                </View>
              </View>
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Date</Text>
                <Text style={styles.dateValue}>{formatDate(tripData.date)}</Text>
              </View>

              {/* Schedule Information */}
              {tripData.scheduleName && (
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleLabel}>Schedule</Text>
                  <Text style={styles.scheduleValue}>{tripData.scheduleName}</Text>
                </View>
              )}
            </View>
            
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Passengers</Text>
                  <View style={styles.statValueWrapper}>
                    <Text style={[styles.statValue, styles.passengerValue]}>
                      {tripData.passengers || 0}
                    </Text>
                    <Ionicons name="people" size={24} color="#0066FF" style={styles.statIcon} />
                  </View>
                </View>
                
                <View style={[styles.statItem, styles.borderLeft]}>
                  <Text style={styles.statLabel}>Revenue</Text>
                  <View style={styles.statValueWrapper}>
                    <Text style={[styles.statValue, styles.amountValue]}>
                      Rs. {(tripData.revenue || 0).toLocaleString()}
                    </Text>
                    <Ionicons name="cash" size={24} color="#22C55E" style={styles.statIcon} />
                  </View>
                </View>
              </View>
            </View>

            {/* Trip IDs Card (for debugging/reference) */}
            {/* <View style={styles.idsCard}>
              <Text style={styles.idsTitle}>Trip Information</Text>
              <View style={styles.idRow}>
                <Text style={styles.idLabel}>Trip ID:</Text>
                <Text style={styles.idValue}>{tripData.id}</Text>
              </View>
              {tripData.scheduleId && (
                <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Schedule ID:</Text>
                  <Text style={styles.idValue}>{tripData.scheduleId}</Text>
                </View>
              )}
              {tripData.RouteId && (
                <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Route ID:</Text>
                  <Text style={styles.idValue}>{tripData.RouteId}</Text>
                </View>
              )}
            </View> */}
            
            {/* Content Header */}
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>Bus Layout</Text>
            </View>
            
            {/* Bus Layout Component */}
            <BusLayout />
            
            {/* Extra padding at the bottom */}
            <View style={{height: 30}} />
          </ScrollView>
        ) : (
          <PassengerList tripId={tripData.id} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  menuButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  busNumber: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  routeDetails: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#333333',
  },
  scheduleInfo: {
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    padding: 16,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  passengerValue: {
    color: '#0066FF',
  },
  amountValue: {
    color: '#22C55E',
  },
  statIcon: {
    marginLeft: 8,
  },
  idsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  idsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idLabel: {
    fontSize: 14,
    color: '#666',
  },
  idValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});