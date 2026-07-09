import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useOngoingTrip } from '../../hooks/employee/useOngoingTrip';
import { stopsApi } from '../../services/api/stops';
import { ticketApi } from '../../services/api/ticket';
import { TicketLog } from '../../types/ticket';

export default function TicketLogsScreen() {
  const authContext = useContext(AuthContext);
  const { ongoingTrip } = useOngoingTrip(); // Get current ongoing trip
  
  // State for backend ticket data and location names
  const [currentTripTickets, setCurrentTripTickets] = useState<TicketLog[]>([]);
  const [stopNames, setStopNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for showing more tickets
  const [showAllPhysical, setShowAllPhysical] = useState(false);
  const [showAllOnline, setShowAllOnline] = useState(false);
  
  // Get conductor ID from auth context
  const conductorId = authContext?.user?.id;

  // Fetch current trip tickets and location names
  useEffect(() => {
    const fetchCurrentTripTickets = async () => {
      if (!conductorId) {
        setError('Conductor ID not found');
        setLoading(false);
        return;
      }

      if (!ongoingTrip) {
        console.log('No ongoing trip found');
        setCurrentTripTickets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🎫 Fetching tickets for current trip:', ongoingTrip.id);
        
        // Get tickets for the current trip only
        const tripTickets = await ticketApi.getTicketsByTripId(ongoingTrip.id);
        console.log(`📋 Current trip tickets: ${tripTickets.length}`);
        
        // Get unique location IDs from tickets
        const locationIds = new Set<string>();
        tripTickets.forEach(ticket => {
          locationIds.add(ticket.startLocationId);
          locationIds.add(ticket.endLocationId);
        });

        console.log('🚏 Fetching location names for:', Array.from(locationIds));
        
        // Fetch location names
        const locationMap = await stopsApi.getStopsByIds(Array.from(locationIds));
        const nameMap = new Map<string, string>();
        
        locationMap.forEach((stop, id) => {
          nameMap.set(id, stop.name);
        });

        // Add fallback names for missing locations
        locationIds.forEach(id => {
          if (!nameMap.has(id)) {
            nameMap.set(id, id.includes('start') || id.includes('boarding') ? 'Boarding Stop' : 
                               id.includes('end') || id.includes('alighting') ? 'Alighting Stop' : 
                               'Unknown Stop');
          }
        });
        
        setCurrentTripTickets(tripTickets);
        setStopNames(nameMap);
        
      } catch (err: any) {
        console.error(' Error fetching current trip tickets:', err);
        setError(err.message || 'Failed to fetch ticket data');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentTripTickets();
  }, [conductorId, ongoingTrip?.id]);

  // Split by issue method (authoritative field; paymentStatus kept as a fallback for older data)
  const isOnlineTicket = (ticket: TicketLog) =>
    String(ticket.issueMethod || ticket.paymentStatus).toUpperCase() === 'ONLINE';
  const physicalTickets = currentTripTickets.filter((ticket: TicketLog) => !isOnlineTicket(ticket));
  const onlineTickets = currentTripTickets.filter((ticket: TicketLog) => isOnlineTicket(ticket));

  // Helper function to get location name or fallback
  const getLocationName = (locationId: string): string => {
    return stopNames.get(locationId) || 
           (locationId.includes('start') ? 'Boarding Stop' : 
            locationId.includes('end') ? 'Alighting Stop' : 
            'Unknown Stop');
  };

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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading ticket logs...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
          <Text style={styles.errorTitle}>Error Loading Tickets</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          {/* Current Trip Info */}
          {ongoingTrip && (
            <View style={styles.tripInfoCard}>
              <View style={styles.tripInfoHeader}>
                <FontAwesome5 name="bus" size={20} color="#0066FF" />
                <Text style={styles.tripInfoTitle}>Current Trip</Text>
              </View>
              <Text style={styles.tripInfoRoute}>
                {ongoingTrip.fromLocation || 'Start'} → {ongoingTrip.toLocation || 'End'}
              </Text>
              <Text style={styles.tripInfoDetails}>
                Bus: {ongoingTrip.busPlateNumber || ongoingTrip.busId} • 
                Started: {ongoingTrip.startTime || 'N/A'}
              </Text>
            </View>
          )}

          {/* Summary Cards */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#F0FFF6' }]}>
                <FontAwesome5 name="receipt" size={24} color="#00CC66" />
                <Text style={styles.summaryValue}>{physicalTickets.length}</Text>
                <Text style={styles.summaryLabel}>Physical Tickets</Text>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
                <FontAwesome5 name="mobile-alt" size={24} color="#22C55E" />
                <Text style={styles.summaryValue}>{onlineTickets.length}</Text>
                <Text style={styles.summaryLabel}>Online Tickets</Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#FFFBF0' }]}>
                <Ionicons name="people" size={24} color="#FF9500" />
                <Text style={styles.summaryValue}>
                  {physicalTickets.reduce((total: number, ticket: TicketLog) => total + ticket.passengerCount, 0) +
                   onlineTickets.reduce((total: number, ticket: TicketLog) => total + ticket.passengerCount, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Passengers</Text>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: '#F9F0FF' }]}>
                <FontAwesome5 name="money-bill-wave" size={20} color="#BF5AF2" />
                <Text style={styles.summaryValue}>
                  Rs. {(physicalTickets.reduce((total: number, ticket: TicketLog) => total + ticket.fareAmount, 0) +
                       onlineTickets.reduce((total: number, ticket: TicketLog) => total + ticket.fareAmount, 0)).toFixed(2)}
                </Text>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
              </View>
            </View>
          </View>

        {/* Physical Ticket Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="receipt" size={20} color="#00CC66" />
            <Text style={styles.sectionTitle}>Physical Ticket Logs</Text>
            <View style={[styles.badge, { backgroundColor: '#E6FFF2' }]}>
              <Text style={[styles.badgeText, { color: '#00CC66' }]}>{physicalTickets.length}</Text>
            </View>
          </View>
          
          {physicalTickets.length > 0 ? (
            <>
              {(showAllPhysical ? physicalTickets : physicalTickets.slice(0, 3)).map((ticket: TicketLog, index: number) => (
                <View key={index} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logTitle}>Ticket #{ticket.ticketId}</Text>
                      <Text style={styles.logTime}>
                        {formatDate(new Date(ticket.issuedAt))} at {formatTime(new Date(ticket.issuedAt))}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={[styles.statusText, { color: '#00CC66' }]}>Cash</Text>
                    </View>
                  </View>
                  
                  <View style={styles.logDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Passengers:</Text>
                      <Text style={styles.detailValue}>{ticket.passengerCount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>{getLocationName(ticket.startLocationId)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>{getLocationName(ticket.endLocationId)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seat Number:</Text>
                      <Text style={styles.detailValue}>{ticket.seatNumber || 'Not assigned'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fare:</Text>
                      <Text style={styles.detailValue}>Rs. {ticket.fareAmount.toFixed(2)}</Text>
                    </View>
                    {/* <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Status:</Text>
                      <Text style={styles.detailValue}>{ticket.paymentStatus}</Text>
                    </View> */}
                  </View>
                </View>
              ))}
              
              {physicalTickets.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => setShowAllPhysical(!showAllPhysical)}
                >
                  <Text style={styles.viewMoreText}>
                    {showAllPhysical ? 'Show Less' : `View All (${physicalTickets.length} tickets)`}
                  </Text>
                  <Ionicons 
                    name={showAllPhysical ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#0066FF" 
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="receipt" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Physical Tickets Yet</Text>
              <Text style={styles.emptyMessage}>Physical ticket logs will appear here once you start issuing tickets</Text>
            </View>
          )}
        </View>

        {/* Online/QR Ticket Logs from Backend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="mobile-alt" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Online Ticket Logs</Text>
            <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.badgeText, { color: '#22C55E' }]}>{onlineTickets.length}</Text>
            </View>
          </View>
          
          {onlineTickets.length > 0 ? (
            <>
              {(showAllOnline ? onlineTickets : onlineTickets.slice(0, 3)).map((ticket: TicketLog, index: number) => (
                <View key={index} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logTitle}>Online Ticket #{ticket.ticketId}</Text>
                      <Text style={styles.logTime}>
                        {formatDate(new Date(ticket.issuedAt))} at {formatTime(new Date(ticket.issuedAt))}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                      <Text style={[styles.statusText, { color: '#22C55E' }]}>Online</Text>
                    </View>
                  </View>
                  
                  <View style={styles.logDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Passengers:</Text>
                      <Text style={styles.detailValue}>{ticket.passengerCount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>{getLocationName(ticket.startLocationId)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>{getLocationName(ticket.endLocationId)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seat Number:</Text>
                      <Text style={styles.detailValue}>{ticket.seatNumber || 'Not assigned'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fare:</Text>
                      <Text style={styles.detailValue}>Rs. {ticket.fareAmount.toFixed(2)}</Text>
                    </View>
                    {/* <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Status:</Text>
                      <Text style={styles.detailValue}>{ticket.paymentStatus}</Text>
                    </View> */}
                  </View>
                </View>
              ))}
              
              {onlineTickets.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => setShowAllOnline(!showAllOnline)}
                >
                  <Text style={styles.viewMoreText}>
                    {showAllOnline ? 'Show Less' : `View All (${onlineTickets.length} tickets)`}
                  </Text>
                  <Ionicons 
                    name={showAllOnline ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#0066FF" 
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="mobile-alt" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Online Tickets Yet</Text>
              <Text style={styles.emptyMessage}>Online ticket logs will appear here when passengers book online</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
      )}
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
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#0066FF',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Trip info card styles
  tripInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  tripInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginLeft: 8,
  },
  tripInfoRoute: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  tripInfoDetails: {
    fontSize: 14,
    color: '#666',
  },

  // View more button styles
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E6EFFF',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
    marginRight: 4,
  },
});