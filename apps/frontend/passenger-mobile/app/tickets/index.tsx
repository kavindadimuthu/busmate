import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, QrCode, MoveVertical as MoreVertical, Filter } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/ui/AppHeader';
import { TicketControllerService } from '@/lib/api-client/ticketing-management/services/TicketControllerService';
import { PassengerApIsService } from '@/lib/api-client/route-management/services/PassengerApIsService';
import type { ConductorLogTicketDTO } from '@/lib/api-client/ticketing-management/models/ConductorLogTicketDTO';
import type { PassengerStopResponse } from '@/lib/api-client/route-management/models/PassengerStopResponse';

// Updated interface to match API response exactly
interface Ticket extends ConductorLogTicketDTO {}

// Enhanced ticket interface with stop details
interface EnhancedTicket extends ConductorLogTicketDTO {
  startStopName?: string;
  endStopName?: string;
}

export default function TicketsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [tickets, setTickets] = useState<EnhancedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to fetch stop details
  const fetchStopName = async (locationId: string): Promise<string> => {
    try {
      const stopDetails = await PassengerApIsService.getStopDetails(locationId);
      return stopDetails.name || locationId;
    } catch (err) {
      console.warn(`Failed to fetch stop details for ${locationId}:`, err);
      return locationId;
    }
  };

  // Fetch user's tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await TicketControllerService.getTicketsByPassengerId(user.id);
        const rawTickets = response || [];

        // Enhance tickets with stop names
        const enhancedTickets = await Promise.all(
          rawTickets.map(async (ticket): Promise<EnhancedTicket> => {
            const enhanced: EnhancedTicket = { ...ticket };

            // Fetch start stop name
            if (ticket.startLocationId) {
              enhanced.startStopName = await fetchStopName(ticket.startLocationId);
            }

            // Fetch end stop name
            if (ticket.endLocationId) {
              enhanced.endStopName = await fetchStopName(ticket.endLocationId);
            }

            return enhanced;
          })
        );

        setTickets(enhancedTickets);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.id]);

  const filters = [
    { id: 'all', label: 'All Tickets' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CANCELLED', label: 'Cancelled' }
  ];

  const filteredTickets = selectedFilter === 'all' 
    ? tickets 
    : tickets.filter((ticket: EnhancedTicket) => ticket.paymentStatus === selectedFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#1DD724';
      case 'PENDING': return '#004CFF';
      case 'CANCELLED': return '#FF3831';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Time';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title="My Tickets"
        rightElement={
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.filterTabActive
              ]}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.id && styles.filterTabTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <ScrollView style={styles.ticketsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004CFF" />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error Loading Tickets</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                const fetchTickets = async () => {
                  if (!user?.id) return;
                  try {
                    setLoading(true);
                    setError(null);
                    const response = await TicketControllerService.getTicketsByPassengerId(user.id);
                    const rawTickets = response || [];

                    // Enhance tickets with stop names
                    const enhancedTickets = await Promise.all(
                      rawTickets.map(async (ticket): Promise<EnhancedTicket> => {
                        const enhanced: EnhancedTicket = { ...ticket };

                        // Fetch start stop name
                        if (ticket.startLocationId) {
                          enhanced.startStopName = await fetchStopName(ticket.startLocationId);
                        }

                        // Fetch end stop name
                        if (ticket.endLocationId) {
                          enhanced.endStopName = await fetchStopName(ticket.endLocationId);
                        }

                        return enhanced;
                      })
                    );

                    setTickets(enhancedTickets);
                  } catch (err) {
                    setError('Failed to load tickets. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchTickets();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tickets found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? "You haven't booked any tickets yet"
                : `No ${selectedFilter} tickets found`
              }
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={styles.bookNowButton}
            >
              <Text style={styles.bookNowButtonText}>Book Your First Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.ticketId || Math.random()}
              onPress={() => router.push(`/tickets/${ticket.ticketId}/detail`)}
              style={styles.ticketCard}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketHeaderLeft}>
                  <View style={styles.ticketIcon}>
                    <MapPin size={24} color="#004CFF" />
                  </View>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.operatorName}>Ticket #{ticket.ticketId}</Text>
                    <Text style={styles.routeNumber}>Seat {ticket.seatNumber || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.ticketHeaderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.paymentStatus || 'PENDING')}15` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.paymentStatus || 'PENDING') }]}>
                      {getStatusText(ticket.paymentStatus || 'PENDING')}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <MoreVertical size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#004CFF' }]} />
                  <Text style={styles.routeLocation}>
                    {ticket.startStopName || ticket.startLocationId || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.routeLine}>
                  <View style={styles.line} />
                  <Text style={styles.duration}>{ticket.passengerCount || 1} passenger{(ticket.passengerCount || 1) > 1 ? 's' : ''}</Text>
                  <View style={styles.line} />
                </View>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#FF3831' }]} />
                  <Text style={styles.routeLocation}>
                    {ticket.endStopName || ticket.endLocationId || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{formatDate(ticket.issuedAt || '')}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{formatTime(ticket.issuedAt || '')}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Seat {ticket.seatNumber || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.ticketFooter}>
                <Text style={styles.bookingId}>#{ticket.ticketId}</Text>
                <View style={styles.ticketFooterRight}>
                  <Text style={styles.price}>LKR {ticket.fareAmount || 0}</Text>
                  {ticket.paymentStatus === 'COMPLETED' && (
                    <TouchableOpacity
                      onPress={() => router.push(`/tickets/${ticket.ticketId}/qr`)}
                      style={styles.qrButton}
                    >
                      <QrCode size={16} color="#004CFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#004CFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  ticketsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#004CFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#004CFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busImage: {
    width: 50,
    height: 35,
    borderRadius: 8,
    marginRight: 12,
  },
  ticketIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  routeNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  routeLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  routeLine: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookingId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ticketFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  qrButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});