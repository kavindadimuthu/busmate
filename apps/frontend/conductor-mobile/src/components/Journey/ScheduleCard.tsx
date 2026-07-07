import { Schedule } from '@/types/Journey/schedule';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  item: Schedule;
};

// Helper function to format date display - turns MM/DD/YYYY into a readable format
const formatDate = (dateStr: string): string => {
  try {
    // Trim any leading/trailing spaces
    dateStr = dateStr.trim();
    
    // Split by /
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      console.error(`Invalid date format in ScheduleCard: "${dateStr}"`);
      return dateStr; // Return the original string if format is incorrect
    }
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      console.error(`Invalid date components: month=${parts[0]}, day=${parts[1]}, year=${parts[2]}`);
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

export default function ScheduleCard({ item }: Props) {
  // Get status display text
  const getStatusText = (status: Schedule['status']): string => {
    switch (status) {
      case 'ongoing': return 'Ongoing';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Get color for status badge
  const getStatusColor = (status: Schedule['status']): string => {
    switch (status) {
      case 'ongoing': return '#22C55E';
      case 'upcoming': return '#0066FF';
      case 'completed': return '#999';
      default: return '#999';
    }
  };

  return (
    <View style={styles.scheduleCard}>
      {/* Route and Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.routeText}>{item.from} – {item.to}</Text>
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
        <Text style={styles.infoText}>Bus #{item.busNumber}</Text>
      </View>
      
      {/* Time */}
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color="#777" />
        <Text style={styles.infoText}>{item.startTime} – {item.endTime}</Text>
      </View>
      
      {/* Date - using our formatter */}
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color="#777" />
        <Text style={styles.infoText}>{formatDate(item.date)}</Text>
      </View>
      
      {/* Seats */}
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={18} color="#777" />
        <Text style={styles.infoText}>
          {item.seatsOccupied}/{item.totalSeats} seats filled
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {item.status === 'ongoing' && (
          <>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/Journey/seatView')}
            >
              <Text style={styles.primaryButtonText}>View Seats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/journeyReport?id=${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>Trip Details</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'upcoming' && (
          <>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push(`/Journey/journeyReport?id=${item.id}`)}
            >
              <Text style={styles.primaryButtonText}>Start Trip</Text>
            </TouchableOpacity>
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
              style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/journeyReport?id=${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>View Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/Journey/tripOverview?id=${item.id}`)}
            >
              <Text style={styles.secondaryButtonText}>Trip Summary</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
});