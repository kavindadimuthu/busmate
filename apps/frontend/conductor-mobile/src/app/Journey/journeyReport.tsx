import { useTicket } from '@/contexts/TicketContext';
import { formatDate, formatTime } from '@/hooks/employee/useNextTrip';
import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView
} from 'react-native';

// Helper functions for status display
function getStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
      return '#F5A623'; 
    case 'ongoing':
      return '#22C55E'; 
    case 'completed':
      return '#6B7280'; 
    case 'cancelled':
      return '#EF4444'; 
    default:
      return '#6B7280'; 
  }
}

function getStatusDisplayText(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'Upcoming';
    case 'ongoing':
      return 'Ongoing';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export default function TripReportScreen() {
  const { ongoingTrip, endTrip, endingTrip } = useOngoingTrip();
  const { qrScanLogs, getQRScanLogsForTrip, cashTicketLogs, getCashTicketLogsForTrip } = useTicket();
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Get QR scan logs and cash ticket logs for this trip
  const tripQRLogs = getQRScanLogsForTrip();
  const tripCashTickets = getCashTicketLogsForTrip();
  
  // Calculate QR revenue from successful scans
  const qrRevenue = tripQRLogs
    .filter(log => log.status === 'success')
    .reduce((total, log) => total + log.ticketFee, 0);
    
  // Calculate cash revenue from physical tickets
  const cashRevenue = tripCashTickets
    .reduce((total, ticket) => total + ticket.fareAmount, 0);

  // If no ongoing trip, show message
  if (!ongoingTrip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.noTripContainer}>
          <Ionicons name="bus-outline" size={80} color="#CCCCCC" />
          <Text style={styles.noTripTitle}>No Ongoing Trip</Text>
          <Text style={styles.noTripMessage}>
            There is no ongoing trip to report at the moment.
          </Text>
          <TouchableOpacity 
            style={styles.backToSchedulesButton}
            onPress={() => router.push('/Journey/schedules')}
          >
            <Text style={styles.backToSchedulesText}>View Journeys</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Trip report data using ongoing trip data
  const tripData = {
    details: {
      route: ongoingTrip.fromLocation && ongoingTrip.toLocation 
        ? `${ongoingTrip.fromLocation} → ${ongoingTrip.toLocation}` 
        : ongoingTrip.route || 'Route Information',
      busNumber: ongoingTrip.busPlateNumber || ongoingTrip.busId || 'N/A',
      date: formatDate(ongoingTrip.date),
      time: `${formatTime(ongoingTrip.startTime)} – ${formatTime(ongoingTrip.endTime)}`,
      status: ongoingTrip.status
    },
    summary: {
      totalPassengers: 
        tripQRLogs.filter(log => log.status === 'success').reduce((total, log) => total + log.passengerCount, 0) +
        tripCashTickets.reduce((total, ticket) => total + ticket.passengerCount, 0),
      ticketsIssued: 
        tripQRLogs.filter(log => log.status === 'success').length + 
        tripCashTickets.length,
      qrRevenue: qrRevenue,
      cashRevenue: cashRevenue,
      duration: calculateTripDuration(ongoingTrip.startTime, ongoingTrip.endTime)
    },
    qrLogs: tripQRLogs,
    totalQrLogs: tripQRLogs.length,
    totalRevenue: cashRevenue + qrRevenue
  };

  // Calculate trip duration
  function calculateTripDuration(startTime: string, endTime: string): string {
    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight trips
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  }

  // Handle end trip
  const handleEndTrip = async () => {
    setShowEndConfirmation(false);
    const success = await endTrip(ongoingTrip.id);
    
    if (success) {
      Alert.alert('Success', 'Trip ended successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/Journey/schedules')
        }
      ]);
    } else {
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  // Show end confirmation popup
  const showEndTripConfirmation = () => {
    setShowEndConfirmation(true);
  };

  const handleExportPDF = () => {
    
  };

  const handleDownloadCSV = () => {
    
  };

  const handleEmailReport = () => {
    
  };

  const handleShareReport = () => {
    
  };

  const handleViewAllLogs = () => {
    setShowAllLogs(!showAllLogs);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Report</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareReport}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View> */}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Trip Details */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Trip Details</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ongoingTrip.status) }]}>
              <Ionicons 
                name={ongoingTrip.status === 'completed' ? 'checkmark' : ongoingTrip.status === 'ongoing' ? 'play' : 'time'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{getStatusDisplayText(ongoingTrip.status)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="git-network" size={18} color="#0066FF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Route</Text>
              <Text style={styles.detailValue}>{tripData.details.route}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="bus" size={18} color="#0066FF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bus No.</Text>
              <Text style={styles.detailValue}>{tripData.details.busNumber}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={18} color="#0066FF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Trip Date</Text>
              <Text style={styles.detailValue}>{tripData.details.date}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={18} color="#0066FF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{tripData.details.time}</Text>
            </View>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Summary</Text>

          <View style={styles.statsGrid}>
            {/* Passengers */}
            <View style={[styles.statCard, { backgroundColor: '#EEF3FF' }]}>
              <Ionicons name="people" size={22} color="#0066FF" />
              <Text style={styles.statValue}>{tripData.summary.totalPassengers}</Text>
              <Text style={styles.statLabel}>Total Passengers</Text>
            </View>

            {/* Tickets */}
            <View style={[styles.statCard, { backgroundColor: '#E6F9EC' }]}>
              <MaterialIcons name="confirmation-number" size={22} color="#22C55E" />
              <Text style={styles.statValue}>{tripData.summary.ticketsIssued}</Text>
              <Text style={styles.statLabel}>Tickets Issued</Text>
            </View>

            {/* QR Revenue */}
            <View style={[styles.statCard, { backgroundColor: '#FFF8E6' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={22} color="#F5A623" />
              <Text style={styles.statValue}>Rs. {tripData.summary.qrRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.statLabel}>QR Revenue</Text>
            </View>

            {/* Cash Revenue */}
            <View style={[styles.statCard, { backgroundColor: '#F5EEFF' }]}>
              <MaterialIcons name="attach-money" size={22} color="#7C3AED" />
              <Text style={styles.statValue}>
                Rs. {tripData.summary.cashRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.statLabel}>Cash Revenue</Text>
            </View>
          </View>

          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Trip Duration</Text>
            <Text style={styles.durationValue}>{tripData.summary.duration}</Text>
          </View>
        </View>

        {/* QR Scan Logs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QR Scan Logs</Text>

          {tripData.qrLogs.length > 0 ? (
            <>
              {(showAllLogs ? tripData.qrLogs : tripData.qrLogs.slice(0, 3)).map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Text style={styles.passengerName}>{log.name}</Text>
                    <View style={log.status === 'success' ? styles.successIndicator : styles.failedIndicator}>
                      <Ionicons 
                        name={log.status === 'success' ? "checkmark-circle" : "close-circle"} 
                        size={18} 
                        color={log.status === 'success' ? "#22C55E" : "#FF3B30"} 
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.qrCode}>{log.ticketId}</Text>
                  
                  <View style={styles.logDetailsRow}>
                    <View style={styles.logDetail}>
                      <Text style={styles.logDetailLabel}>From:</Text>
                      <Text style={styles.logDetailValue}>{log.startStation}</Text>
                    </View>
                    <View style={styles.logDetail}>
                      <Text style={styles.logDetailLabel}>To:</Text>
                      <Text style={styles.logDetailValue}>{log.endStation}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.logDetailsRow}>
                    <View style={styles.logDetail}>
                      <Text style={styles.logDetailLabel}>Scan:</Text>
                      <Text style={styles.logDetailValue}>
                        {log.scanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.logDetail}>
                      <Text style={styles.logDetailLabel}>Fare:</Text>
                      <Text style={styles.fareValue}>Rs. {log.ticketFee}0</Text>
                    </View>
                  </View>
                </View>
              ))}
              
              {tripData.qrLogs.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton} 
                  onPress={handleViewAllLogs}
                >
                  <Text style={styles.viewAllText}>
                    {showAllLogs ? 'Show Less' : `View All Logs (${tripData.totalQrLogs})`}
                  </Text>
                  <Ionicons 
                    name={showAllLogs ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#0066FF" 
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noLogsContainer}>
              <Ionicons name="qr-code-outline" size={48} color="#CCCCCC" />
              <Text style={styles.noLogsTitle}>No QR Scans Yet</Text>
              <Text style={styles.noLogsMessage}>
                QR scan logs will appear here as passengers board the bus
              </Text>
            </View>
          )}
        </View>

        {/* Total Revenue */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Revenue</Text>
          <Text style={styles.totalRevenueValue}>Rs. {tripData.totalRevenue.toLocaleString()}.00</Text>
        </View>

        {/* End Trip Button */}
        {ongoingTrip.status === 'ongoing' && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.endTripButton}
              onPress={showEndTripConfirmation}
              disabled={endingTrip}
            >
              {endingTrip ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.endTripButtonText}>Ending Trip...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.endTripButtonText}>End Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {/* <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.pdfButton]} 
            onPress={handleExportPDF}
          >
            <Ionicons name="document-text" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Export PDF</Text>
          </TouchableOpacity> */}
          
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.csvButton]} 
            onPress={handleDownloadCSV}
          >
            <MaterialIcons name="file-download" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Download CSV</Text>
          </TouchableOpacity> */}
          
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.emailButton]} 
            onPress={handleEmailReport}
          >
            <Ionicons name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Email Report</Text>
          </TouchableOpacity>
        </View> */}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* End Trip Confirmation Modal */}
      <Modal
        visible={showEndConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Ionicons name="stop-circle" size={48} color="#FF3B30" />
            </View>
            
            <Text style={styles.modalTitle}>End Trip?</Text>
            <Text style={styles.modalMessage}>
              Are you really want to end the trip? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEndConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEndTrip}
              >
                <Text style={styles.confirmButtonText}>End Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#0066FF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
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
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  durationContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666666',
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  logItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    paddingLeft: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  successIndicator: {
    padding: 2,
  },
  failedIndicator: {
    padding: 2,
  },
  qrCode: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  logDetailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logDetail: {
    flexDirection: 'row',
    width: '50%',
  },
  logDetailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 50,
  },
  logDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  fareValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: 8,
  },
  viewAllText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  totalRevenueValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 25,
  },
  pdfButton: {
    backgroundColor: '#FF3B30',
  },
  csvButton: {
    backgroundColor: '#22C55E',
  },
  emailButton: {
    backgroundColor: '#0066FF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  bottomSpace: {
    height: 20,
  },
  noTripContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noTripTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  noTripMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToSchedulesButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToSchedulesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noLogsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noLogsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  noLogsMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  endTripButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  endTripButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});