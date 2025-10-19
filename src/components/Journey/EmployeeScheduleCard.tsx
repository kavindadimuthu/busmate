import { isStartable } from '@/contexts/EmployeeScheduleContext';
import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { EmployeeSchedule } from '@/types/employee';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  item: EmployeeSchedule;
};

// Helper function to format date display - turns YYYY-MM-DD into a readable format
const formatDate = (dateStr: string): string => {
  try {
    // Trim any leading/trailing spaces
    dateStr = dateStr.trim();
    
    // Split by - for YYYY-MM-DD format
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      console.error(`Invalid date format in EmployeeScheduleCard: "${dateStr}"`);
      return dateStr; // Return the original string if format is incorrect
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      console.error(`Invalid date components: year=${parts[0]}, month=${parts[1]}, day=${parts[2]}`);
      return dateStr;
    }
    
    // Create date
    const date = new Date(year, month - 1, day);
    
    // Format the date nicely for display
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return `${weekdays[date.getDay()]}, ${monthNames[date.getMonth()]} ${day}, ${year}`;
  } catch (error) {
    console.error(`Error formatting date "${dateStr}":`, error);
    return dateStr; // Return the original if any error
  }
};

// Helper function to format time from HH:MM:SS to HH:MM AM/PM
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

export default function EmployeeScheduleCard({ item }: Props) {
  const { startTrip, startingTrip } = useOngoingTrip();
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);

  // Handle start trip confirmation
  const handleStartTrip = async () => {
    setShowStartConfirmation(false);
    const success = await startTrip(item.id);
    
    if (success) {
      Alert.alert('Success', 'Trip started successfully!');
    } else {
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  // Show start confirmation popup
  const showStartTripConfirmation = () => {
    setShowStartConfirmation(true);
  };
  // Get status display text
  const getStatusText = (status: EmployeeSchedule['status']): string => {
    switch (status) {
      case 'ongoing': return 'Ongoing';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Get color for status badge
  const getStatusColor = (status: EmployeeSchedule['status']): string => {
    switch (status) {
      case 'ongoing': return '#22C55E';
      case 'upcoming': return '#0066FF';
      case 'completed': return '#999';
      case 'pending': return '#FFA500';
      case 'cancelled': return '#FF3B30';
      default: return '#999';
    }
  };

  return (
    <View style={styles.scheduleCard}>
      {/* Route and Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.routeText}>{item.route}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {/* Bus Number */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="bus" size={18} color="#0066FF" />
        <Text style={styles.infoText}>Bus {item.busPlateNumber || item.busId}</Text>
      </View>
      
      {/* Time */}
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color="#777" />
        <Text style={styles.infoText}>
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
        </Text>
      </View>
      
      {/* Date - using our formatter */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color="#777" />
        <Text style={styles.infoText}>{formatDate(item.date)}</Text>
      </View>
      
      {/* Passengers and Revenue (if available) */}
      {/* {(item.passengers !== undefined || item.revenue !== undefined) && (
        <>
          {item.passengers !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={18} color="#777" />
              <Text style={styles.infoText}>
                {item.passengers} passengers
              </Text>
            </View>
          )}
          
          {item.revenue !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color="#777" />
              <Text style={styles.infoText}>
                LKR {item.revenue.toLocaleString()}
              </Text>
            </View>
          )}
        </>
      )} */}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {item.status === 'ongoing' && (
          <>
            <TouchableOpacity 
              style={styles.successButton}
              disabled={true}
            >
              <Text style={styles.successButtonText}>Trip Started</Text>
              
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              // onPress={() => router.push(`/Journey/journeyReport?id=${item.id}`)}
              onPress={() => router.push(`/(tabs)/journey`)}
            >
              <Text style={styles.secondaryButtonText}>View Journey</Text>
            </TouchableOpacity>
          </>
        )}

        {(item.status === 'upcoming' || item.status === 'pending') && (
          <>
            {isStartable(item) ? (
              <TouchableOpacity 
                style={[styles.primaryButton, startingTrip && styles.disabledButton]}
                onPress={showStartTripConfirmation}
                disabled={startingTrip}
              >
                <Text style={styles.primaryButtonText}>
                  {startingTrip ? 'Starting...' : 'Start Trip'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.disabledButton}
                disabled={true}
              >
                <Text style={styles.disabledButtonText}>Not Yet Startable</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/trip_details?id=${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'completed' && (
          <>
            <TouchableOpacity 
              // style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/journeyReport?id=${item.id}`)}
            >
              {/* <Text style={styles.secondaryButtonText}>View Report</Text> */}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/tripOverview?id=${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>Trip Summary</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'cancelled' && (
          <TouchableOpacity 
            // style={styles.secondaryButton}
            onPress={() => router.push(`/Journey/trip_details?id=${item.id}`)}
          >
            {/* <Text style={styles.secondaryButtonText}>View Details</Text> */}
          </TouchableOpacity>
        )}
      </View>

      {/* Start Trip Confirmation Modal */}
      <Modal
        visible={showStartConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Trip?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to start this trip?{'\n\n'}
              <Text style={styles.modalRoute}>{item.route}</Text>{'\n'}
              Departure: {formatTime(item.startTime)}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStartConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleStartTrip}
              >
                <Text style={styles.confirmButtonText}>Yes, Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  successButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalRoute: {
    fontWeight: '600',
    color: '#0066FF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#0066FF',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
