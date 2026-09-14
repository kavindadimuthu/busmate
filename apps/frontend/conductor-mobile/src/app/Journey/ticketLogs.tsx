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
import { presentationFor } from '../../lib/payments/paymentMethods';
import {
  awaitingBoarding,
  boardingBadge,
  isCancelled,
  saleBreakdownFromTickets,
  stageOfTicket,
  stagePresentation,
  stagesToShow,
} from '../../lib/tickets/saleStages';

export default function TicketLogsScreen() {
  const authContext = useContext(AuthContext);
  const { ongoingTrip } = useOngoingTrip(); // Get current ongoing trip
  
  // State for backend ticket data and location names
  const [currentTripTickets, setCurrentTripTickets] = useState<TicketLog[]>([]);
  const [stopNames, setStopNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Which sale-stage sections are expanded past their first three tickets
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  
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

  // Tickets grouped by when they were sold - on the bus vs pre-booked - as classified by the
  // backend (INC-010, ADR-012). Cancelled tickets stay listed in their section but never count
  // toward the tiles.
  const saleBreakdown = saleBreakdownFromTickets(currentTripTickets);
  const activeTickets = currentTripTickets.filter((ticket: TicketLog) => !isCancelled(ticket));
  const stageEntry = (stage: string) => saleBreakdown.find((entry) => entry.stage === stage);
  const sections = stagesToShow(currentTripTickets);
  const ticketsInStage = (stage: string) =>
    currentTripTickets.filter((ticket: TicketLog) => stageOfTicket(ticket) === stage);

  // Shared presentation (lib/payments/paymentMethods) so every screen labels a method the same
  // way, and a new method is styled in exactly one place.
  const paymentMethodBadge = (ticket: TicketLog) => presentationFor(ticket.paymentMethod);

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

          {/* Summary cards, grouped by when tickets were sold (INC-010, ADR-012). Cancelled
              tickets are still listed below, but never counted here. */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              {sections.map((stage) => {
                const presentation = stagePresentation(stage);
                const entry = stageEntry(stage);
                return (
                  <View key={stage} style={[styles.summaryCard, { backgroundColor: presentation.background }]}>
                    <Ionicons name={presentation.icon as any} size={24} color={presentation.color} />
                    <Text style={styles.summaryValue}>{entry?.ticketCount ?? 0}</Text>
                    <Text style={styles.summaryLabel}>{presentation.label}</Text>
                    {stage === 'PRE_BOOKED' && (
                      <Text style={styles.summarySubLabel}>
                        {entry?.boardedCount ?? 0} boarded · {awaitingBoarding(saleBreakdown)} awaiting
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#FFFBF0' }]}>
                <Ionicons name="people" size={24} color="#FF9500" />
                <Text style={styles.summaryValue}>
                  {activeTickets.reduce((total: number, ticket: TicketLog) => total + ticket.passengerCount, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Passengers</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#F9F0FF' }]}>
                <FontAwesome5 name="money-bill-wave" size={20} color="#BF5AF2" />
                <Text style={styles.summaryValue}>
                  Rs. {activeTickets.reduce((total: number, ticket: TicketLog) => total + ticket.fareAmount, 0).toFixed(2)}
                </Text>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
              </View>
            </View>
          </View>

        {/* One section per sale stage, sharing one card layout - a stage added later renders here
            with no new markup. Each card shows payment method and, for pre-booked tickets,
            boarding status as separate badges. */}
        {sections.map((stage) => {
          const presentation = stagePresentation(stage);
          const stageTickets = ticketsInStage(stage);
          const expanded = !!expandedStages[stage];
          return (
            <View key={stage} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name={presentation.icon as any} size={20} color={presentation.color} />
                <Text style={styles.sectionTitle}>{presentation.sectionTitle}</Text>
                <View style={[styles.badge, { backgroundColor: presentation.background }]}>
                  <Text style={[styles.badgeText, { color: presentation.color }]}>{stageTickets.length}</Text>
                </View>
              </View>

              {stageTickets.length > 0 ? (
                <>
                  {(expanded ? stageTickets : stageTickets.slice(0, 3)).map((ticket: TicketLog) => {
                    const payment = paymentMethodBadge(ticket);
                    const boarding = boardingBadge(ticket);
                    return (
                      <View key={ticket.ticketId} style={[styles.logCard, isCancelled(ticket) && styles.logCardCancelled]}>
                        <View style={styles.logHeader}>
                          <View style={styles.logInfo}>
                            <Text style={styles.logTitle}>Ticket #{ticket.ticketId}</Text>
                            <Text style={styles.logTime}>
                              {formatDate(new Date(ticket.issuedAt))} at {formatTime(new Date(ticket.issuedAt))}
                            </Text>
                          </View>
                          <View style={styles.badgeColumn}>
                            <View style={[styles.statusBadge, { backgroundColor: payment.background }]}>
                              <Text style={[styles.statusText, { color: payment.color }]}>{payment.label}</Text>
                            </View>
                            {boarding && (
                              <View style={[styles.statusBadge, styles.secondaryBadge, { backgroundColor: boarding.background }]}>
                                <Text style={[styles.statusText, { color: boarding.color }]}>{boarding.label}</Text>
                              </View>
                            )}
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
                        </View>
                      </View>
                    );
                  })}

                  {stageTickets.length > 3 && (
                    <TouchableOpacity
                      style={styles.viewMoreButton}
                      onPress={() => setExpandedStages((current) => ({ ...current, [stage]: !expanded }))}
                    >
                      <Text style={styles.viewMoreText}>
                        {expanded ? 'Show Less' : `View All (${stageTickets.length} tickets)`}
                      </Text>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#0066FF" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name={presentation.icon as any} size={48} color="#CCCCCC" />
                  <Text style={styles.emptyTitle}>{presentation.emptyTitle}</Text>
                  <Text style={styles.emptyMessage}>{presentation.emptyMessage}</Text>
                </View>
              )}
            </View>
          );
        })}

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
  summarySubLabel: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
  },
  badgeColumn: {
    alignItems: 'flex-end',
  },
  secondaryBadge: {
    marginTop: 4,
  },
  logCardCancelled: {
    opacity: 0.55,
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