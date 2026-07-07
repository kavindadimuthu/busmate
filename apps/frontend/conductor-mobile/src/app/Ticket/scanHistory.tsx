import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useTicket } from '../../contexts/TicketContext';

// Define types for ticket data
interface TicketData {
  id: number;
  ticketId: string;
  passengerName?: string;
  fromLocation?: string;
  toLocation?: string;
  seatNumber?: string;
  passengerCount?: number;
  ticketFee?: number;
  status?: string;
  timestamp: Date;
}

export default function ScanHistoryScreen() {
  const authContext = useContext(AuthContext);
  const { qrScanLogs } = useTicket();
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Convert QR scan logs from context to TicketData format
  const scanHistory: TicketData[] = qrScanLogs
    .filter(log => log.status === 'success') // Only show successfully scanned tickets
    .map(log => ({
      id: parseInt(log.ticketId) || Date.now(), // Convert ticketId to number for API
      ticketId: log.ticketId,
      passengerName: log.name,
      fromLocation: log.startStation,
      toLocation: log.endStation,
      seatNumber: log.seatNumber,
      passengerCount: log.passengerCount,
      ticketFee: log.ticketFee,
      status: "scanned", // Just show as scanned
      timestamp: log.scanTime
    }));

  const openTicketDetails = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scanned':
        return '#22C55E';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'scanned':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'document-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => router.push('/Ticket/qrScanner')}
        >
          <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {scanHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="qr-code" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Scan History</Text>
          <Text style={styles.emptyMessage}>
            Start scanning QR codes to see your validation history here.
          </Text>
          <TouchableOpacity 
            style={styles.startScanButton}
            onPress={() => router.push('/Ticket/qrScanner')}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
            <Text style={styles.startScanButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.historyList}>
            {scanHistory.map((ticket, index) => (
              <TouchableOpacity
                key={`${ticket.ticketId}-${index}`}
                style={styles.ticketCard}
                onPress={() => openTicketDetails(ticket)}
                activeOpacity={0.7}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketIdContainer}>
                    <Text style={styles.ticketId}>{ticket.ticketId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Ionicons 
                        name={getStatusIcon(ticket.status) as any} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.statusText}>
                        {ticket.status ? ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1) : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timestamp}>{formatTimestamp(ticket.timestamp)}</Text>
                </View>

                <View style={styles.ticketBody}>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{ticket.passengerName || 'Unknown Passenger'}</Text>
                    <Text style={styles.routeInfo}>
                      {ticket.fromLocation || 'N/A'} → {ticket.toLocation || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.ticketDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="airplane" size={14} color="#666" />
                      <Text style={styles.detailText}>Seat {ticket.seatNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="people" size={14} color="#666" />
                      <Text style={styles.detailText}>{ticket.passengerCount || 1} passenger(s)</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash" size={14} color="#666" />
                      <Text style={styles.detailText}>Rs. {ticket.ticketFee?.toFixed(2) || '0.00'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Ticket Details Modal */}
      <Modal
        visible={showTicketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTicketModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalTicketId}>
                  <Text style={styles.modalTicketIdText}>{selectedTicket.ticketId}</Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
                    <Text style={styles.modalStatusText}>
                      {selectedTicket.status ? selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalSectionTitle}>Passenger Information</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Name:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTicket.passengerName || 'Unknown'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Passengers:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTicket.passengerCount || 1}</Text>
                  </View>
                </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalSectionTitle}>Journey Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>From:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTicket.fromLocation || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>To:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTicket.toLocation || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Seat:</Text>
                    <Text style={styles.modalDetailValue}>{selectedTicket.seatNumber || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.modalDetailSection}>
                  <Text style={styles.modalSectionTitle}>Payment Information</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Ticket Fee:</Text>
                    <Text style={styles.modalDetailValue}>Rs. {selectedTicket.ticketFee?.toFixed(2) || '0.00'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Scanned:</Text>
                    <Text style={styles.modalDetailValue}>{formatTimestamp(selectedTicket.timestamp)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanButton: {
    padding: 4,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Content styles
  content: {
    flex: 1,
  },
  historyList: {
    padding: 16,
  },
  // Ticket card styles
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  ticketBody: {
    marginBottom: 16,
  },
  passengerInfo: {
    marginBottom: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routeInfo: {
    fontSize: 14,
    color: '#666',
  },
  ticketDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  // Action buttons
  ticketActions: {
    alignItems: 'flex-end',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  validatedButton: {
    backgroundColor: '#22C55E',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalTicketId: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTicketIdText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDetailSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  modalValidateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  modalValidatedButton: {
    backgroundColor: '#22C55E',
  },
  modalValidateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});