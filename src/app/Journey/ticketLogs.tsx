import { useTicket } from '@/contexts/TicketContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function TicketLogsScreen() {
  const { qrScanLogs, getQRScanLogsForTrip, cashTicketLogs, getCashTicketLogsForTrip } = useTicket();
  
  // Get ticket data for current trip
  const tripQRLogs = getQRScanLogsForTrip();
  const tripCashTickets = getCashTicketLogsForTrip();

  // Format time display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" translucent={false} />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Logs</Text>
      </View> */}
      
      <ScrollView style={styles.container}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#F0F6FF' }]}>
              <FontAwesome5 name="qrcode" size={24} color="#0066FF" />
              <Text style={styles.summaryValue}>{tripQRLogs.length}</Text>
              <Text style={styles.summaryLabel}>QR Scans</Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#F0FFF6' }]}>
              <FontAwesome5 name="receipt" size={24} color="#00CC66" />
              <Text style={styles.summaryValue}>{tripCashTickets.length}</Text>
              <Text style={styles.summaryLabel}>Physical Tickets</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#FFFBF0' }]}>
              <Ionicons name="people" size={24} color="#FF9500" />
              <Text style={styles.summaryValue}>
                {tripQRLogs.filter(log => log.status === 'success').reduce((total, log) => total + log.passengerCount, 0) +
                 tripCashTickets.reduce((total, ticket) => total + ticket.passengerCount, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Passengers</Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#F9F0FF' }]}>
              <FontAwesome5 name="money-bill-wave" size={20} color="#BF5AF2" />
              <Text style={styles.summaryValue}>
                Rs. {(tripQRLogs.filter(log => log.status === 'success').reduce((total, log) => total + log.ticketFee, 0) +
                     tripCashTickets.reduce((total, ticket) => total + ticket.fareAmount, 0)).toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
            </View>
          </View>
        </View>

        {/* QR Scan Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="qrcode" size={20} color="#0066FF" />
            <Text style={styles.sectionTitle}>QR Scan Logs</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tripQRLogs.length}</Text>
            </View>
          </View>
          
          {tripQRLogs.length > 0 ? (
            tripQRLogs.map((log, index) => (
              <View key={index} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logTitle}>QR Code #{log.ticketId}</Text>
                    <Text style={styles.logTime}>
                      {formatDate(log.scanTime)} at {formatTime(log.scanTime)}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: log.status === 'success' ? '#E6FFF2' : '#FFE6E6' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: log.status === 'success' ? '#00CC66' : '#FF4444' }
                    ]}>
                      {log.status === 'success' ? 'Valid' : 'Invalid'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.logDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Passengers:</Text>
                    <Text style={styles.detailValue}>{log.passengerCount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route:</Text>
                    <Text style={styles.detailValue}>{log.startStation} → {log.endStation}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Seat:</Text>
                    <Text style={styles.detailValue}>{log.seatNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fare:</Text>
                    <Text style={styles.detailValue}>Rs. {log.ticketFee.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="qrcode" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No QR Scans Yet</Text>
              <Text style={styles.emptyMessage}>QR scan logs will appear here once you start scanning tickets</Text>
            </View>
          )}
        </View>

        {/* Physical Ticket Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="receipt" size={20} color="#00CC66" />
            <Text style={styles.sectionTitle}>Physical Ticket Logs</Text>
            <View style={[styles.badge, { backgroundColor: '#E6FFF2' }]}>
              <Text style={[styles.badgeText, { color: '#00CC66' }]}>{tripCashTickets.length}</Text>
            </View>
          </View>
          
          {tripCashTickets.length > 0 ? (
            tripCashTickets.map((ticket, index) => (
              <View key={index} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logTitle}>Ticket #{ticket.ticketId}</Text>
                    <Text style={styles.logTime}>
                      {formatDate(ticket.issuedTime)} at {formatTime(ticket.issuedTime)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: '#00CC66' }]}>Issued</Text>
                  </View>
                </View>
                
                <View style={styles.logDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Passengers:</Text>
                    <Text style={styles.detailValue}>{ticket.passengerCount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>From:</Text>
                    <Text style={styles.detailValue}>{ticket.fromLocation}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>To:</Text>
                    <Text style={styles.detailValue}>{ticket.toLocation}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fare:</Text>
                    <Text style={styles.detailValue}>Rs. {ticket.fareAmount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="receipt" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Physical Tickets Yet</Text>
              <Text style={styles.emptyMessage}>Physical ticket logs will appear here once you start issuing tickets</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
    marginTop: 20,
  },
  summarySection: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: '#E6EFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    backgroundColor: '#E6FFF2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});