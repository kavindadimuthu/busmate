import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { QrCode, Download, Share, Calendar, Clock, MapPin, User, Phone, MessageCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/ui/AppHeader';
import { TicketControllerService } from '@/lib/api-client/ticketing-management/services/TicketControllerService';
import { PassengerApIsService } from '@/lib/api-client/route-management/services/PassengerApIsService';
import type { ConductorLogTicketDTO } from '@/lib/api-client/ticketing-management/models/ConductorLogTicketDTO';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';
import type { PassengerStopResponse } from '@/lib/api-client/route-management/models/PassengerStopResponse';

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState('details');
  const [ticket, setTicket] = useState<ConductorLogTicketDTO | null>(null);
  const [startStop, setStartStop] = useState<PassengerStopResponse | null>(null);
  const [endStop, setEndStop] = useState<PassengerStopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const safeAreaStyle = useSafeAreaContainerStyles();

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!id) {
        setError('Ticket ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch ticket details
        const ticketData = await TicketControllerService.getTicketById(Number(id));
        setTicket(ticketData);

        // Fetch stop details if location IDs are available
        if (ticketData.startLocationId) {
          try {
            const startStopData = await PassengerApIsService.getStopDetails(ticketData.startLocationId);
            setStartStop(startStopData);
          } catch (err) {
            console.warn('Failed to fetch start stop details:', err);
          }
        }

        if (ticketData.endLocationId) {
          try {
            const endStopData = await PassengerApIsService.getStopDetails(ticketData.endLocationId);
            setEndStop(endStopData);
          } catch (err) {
            console.warn('Failed to fetch end stop details:', err);
          }
        }

      } catch (err) {
        console.error('Error fetching ticket details:', err);
        setError('Failed to load ticket details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id]);

  const handleCancelTicket = () => {
    Alert.alert(
      'Cancel Ticket',
      'Are you sure you want to cancel this ticket? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => router.push('/tickets/cancel')
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#1DD724';
      case 'PENDING': return '#004CFF';
      case 'CANCELLED': return '#FF3831';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
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

  if (loading) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Ticket Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ticket) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Ticket Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Ticket</Text>
          <Text style={styles.errorText}>{error || 'Ticket not found'}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  } {
    Alert.alert(
      'Cancel Ticket',
      'Are you sure you want to cancel this ticket? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => router.push('/tickets/cancel')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader 
        title="Ticket Details"
        rightElement={
          <TouchableOpacity
            onPress={() => router.push(`/tickets/${ticket.ticketId}/qr`)}
            style={styles.qrButton}
          >
            <QrCode size={20} color="#004CFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content}>
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
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
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.paymentStatus || 'PENDING')}15` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(ticket.paymentStatus || 'PENDING') }]}>
                {ticket.paymentStatus || 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#004CFF' }]} />
              <Text style={styles.routeLocation}>
                {startStop?.name || `From: ${ticket.startLocationId || 'Unknown'}`}
              </Text>
              <Text style={styles.routeTime}>{formatTime(ticket.issuedAt || '')}</Text>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.line} />
              <Text style={styles.duration}>
                {ticket.passengerCount || 1} passenger{(ticket.passengerCount || 1) > 1 ? 's' : ''}
              </Text>
              <View style={styles.line} />
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#FF3831' }]} />
              <Text style={styles.routeLocation}>
                {endStop?.name || `To: ${ticket.endLocationId || 'Unknown'}`}
              </Text>
              <Text style={styles.routeTime}>-</Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <Text style={styles.bookingId}>#{ticket.ticketId}</Text>
            <Text style={styles.price}>LKR {ticket.fareAmount || 0}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setSelectedTab('details')}
            style={[styles.tab, selectedTab === 'details' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('passenger')}
            style={[styles.tab, selectedTab === 'passenger' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'passenger' && styles.activeTabText]}>
              Passenger
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('driver')}
            style={[styles.tab, selectedTab === 'driver' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'driver' && styles.activeTabText]}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'details' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Journey Details</Text>
              <View style={styles.detailItem}>
                <Calendar size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Date Issued</Text>
                  <Text style={styles.detailValue}>{formatDate(ticket.issuedAt || '')}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Clock size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Time Issued</Text>
                  <Text style={styles.detailValue}>{formatTime(ticket.issuedAt || '')}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <MapPin size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Seat Number</Text>
                  <Text style={styles.detailValue}>{ticket.seatNumber || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <User size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Passenger Count</Text>
                  <Text style={styles.detailValue}>{ticket.passengerCount || 1}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Route Information</Text>
              <View style={styles.detailItem}>
                <MapPin size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Start Location</Text>
                  <Text style={styles.detailValue}>
                    {startStop?.name || ticket.startLocationId || 'Unknown'}
                  </Text>
                  {startStop?.city && (
                    <Text style={styles.detailSubValue}>{startStop.city}</Text>
                  )}
                </View>
              </View>
              <View style={styles.detailItem}>
                <MapPin size={20} color="#6B7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>End Location</Text>
                  <Text style={styles.detailValue}>
                    {endStop?.name || ticket.endLocationId || 'Unknown'}
                  </Text>
                  {endStop?.city && (
                    <Text style={styles.detailSubValue}>{endStop.city}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Important Information</Text>
              <View style={styles.infoCard}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.infoText}>
                  Please keep this ticket for verification during your journey
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'passenger' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Passenger Information</Text>
              <View style={styles.passengerCard}>
                <View style={styles.passengerAvatar}>
                  <User size={24} color="#004CFF" />
                </View>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerName}>{user?.name || 'Unknown Passenger'}</Text>
                  <Text style={styles.passengerDetail}>{user?.phone || 'No phone number'}</Text>
                  <Text style={styles.passengerDetail}>{user?.email || 'No email'}</Text>
                  <Text style={styles.passengerDetail}>ID: {ticket.passengerId}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'driver' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Service Information</Text>
              <View style={styles.driverCard}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>B</Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>Bus Service</Text>
                  <Text style={styles.driverRating}>Ticket ID: {ticket.ticketId}</Text>
                  <Text style={styles.driverRating}>Payment: {ticket.paymentStatus}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button - Only show for pending tickets */}
        {ticket.paymentStatus === 'PENDING' && (
          <TouchableOpacity
            onPress={handleCancelTicket}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel Ticket</Text>
          </TouchableOpacity>
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
  qrButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2FF',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
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
    marginBottom: 20,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busImage: {
    width: 60,
    height: 40,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  routeNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  routeLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 14,
    color: '#6B7280',
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
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 12,
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
    fontSize: 14,
    color: '#9CA3AF',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004CFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#004CFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    marginBottom: 24,
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailInfo: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  policyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  passengerDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    color: '#6B7280',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004CFF',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
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
  detailSubValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});