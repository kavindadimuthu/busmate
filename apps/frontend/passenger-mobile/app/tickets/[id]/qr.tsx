import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Download, Share, Maximize2 } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from '@/components/ui/AppHeader';
import { useBooking } from '@/context/BookingContext';
import { TicketControllerService, ConductorLogTicketDTO } from '@/lib/api-client/ticketing-management';
import { PassengerApIsService, PassengerStopResponse } from '@/lib/api-client/route-management';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function QRCodeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { bookedTicket, bookingData } = useBooking();
  const [brightness, setBrightness] = useState(1);
  const [showDebugData, setShowDebugData] = useState(false);
  const [ticketData, setTicketData] = useState<ConductorLogTicketDTO | null>(null);
  const [startStop, setStartStop] = useState<PassengerStopResponse | null>(null);
  const [endStop, setEndStop] = useState<PassengerStopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth - 80, 300);

  // Fetch ticket data and stop details when component loads
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const ticketId = parseInt(id as string);
        if (!ticketId || isNaN(ticketId)) {
          throw new Error('Invalid ticket ID');
        }

        // First try to get ticket data from API
        let currentTicketData: ConductorLogTicketDTO;
        
        // If we have booking context data (during active booking flow), use it
        if (bookedTicket && bookedTicket.ticketId === ticketId) {
          currentTicketData = bookedTicket;
          console.log('Using booking context data:', currentTicketData);
        } else {
          // Otherwise fetch from API (for viewing existing tickets)
          currentTicketData = await TicketControllerService.getTicketById(ticketId);
          console.log('Fetched ticket data from API:', currentTicketData);
        }
        
        setTicketData(currentTicketData);

        // Fetch stop details to get station names
        const promises = [];
        
        if (currentTicketData.startLocationId) {
          promises.push(
            PassengerApIsService.getStopDetails(currentTicketData.startLocationId)
              .then(stop => setStartStop(stop))
              .catch(err => console.warn('Failed to fetch start stop:', err))
          );
        }
        
        if (currentTicketData.endLocationId) {
          promises.push(
            PassengerApIsService.getStopDetails(currentTicketData.endLocationId)
              .then(stop => setEndStop(stop))
              .catch(err => console.warn('Failed to fetch end stop:', err))
          );
        }

        // Wait for all API calls to complete
        await Promise.all(promises);
        
      } catch (err) {
        console.error('Error fetching ticket data:', err);
        setError('Failed to load ticket details. Please try again.');
        Alert.alert(
          'Error',
          'Failed to load ticket details. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [id, bookedTicket]);

  // Generate QR code data from the actual ticket data
  const getQRCodeData = () => {
    if (!ticketData) {
      return null;
    }

    const qrData = {
      ticketId: ticketData.ticketId || parseInt(id as string),
      passengerName: "Kavinda Dewmith", // TODO: Get from user context when available
      startStation: startStop?.name || bookingData?.fromStopName || "Unknown Station",
      endStation: endStop?.name || bookingData?.toStopName || "Unknown Station",
      seatNumber: ticketData.seatNumber || "N/A",
      passengerCount: ticketData.passengerCount || 1,
      ticketFee: ticketData.fareAmount || 0,
      paymentStatus: ticketData.paymentStatus || "PAID",
      status: "active"
    };

    console.log('Generated QR data:', qrData);
    return qrData;
  };

  const qrData = getQRCodeData();
  const qrCodeString = qrData ? JSON.stringify(qrData) : '';

  // Display data for UI
  const getDisplayData = () => {
    if (!ticketData) {
      return {
        route: { from: 'Loading...', to: 'Loading...' },
        bookingId: 'Loading...',
        seatNumber: 'Loading...',
        fare: 'Loading...'
      };
    }

    return {
      route: { 
        from: startStop?.name || bookingData?.fromStopName || 'Unknown', 
        to: endStop?.name || bookingData?.toStopName || 'Unknown' 
      },
      bookingId: `TB${ticketData.ticketId}`,
      seatNumber: ticketData.seatNumber || 'N/A',
      fare: `LKR ${(ticketData.fareAmount || 0).toFixed(2)}`
    };
  };

  const displayData = getDisplayData();

  // Don't render QR if still loading or no data
  if (loading) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="QR Code" />
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <Text style={styles.routeText}>Loading ticket...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ticketData || !qrData) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="QR Code" />
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <Text style={styles.routeText}>Unable to load ticket</Text>
          <Text style={styles.dateText}>{error || 'Ticket data not available'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[safeAreaStyle, { backgroundColor: brightness > 0.8 ? 'white' : '#F3F4F9' }]}>
      {/* Header */}
      <AppHeader 
        title="QR Code"
        rightElement={
          <TouchableOpacity
            onPress={() => setBrightness(brightness > 0.8 ? 0.3 : 1)}
            style={styles.brightnessButton}
          >
            <Maximize2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <Text style={styles.routeText}>{displayData.route.from} → {displayData.route.to}</Text>
          <Text style={styles.dateText}>Today • {ticketData?.paymentStatus || 'PAID'}</Text>
          <Text style={styles.seatText}>Seat {displayData.seatNumber}</Text>
        </View>

        {/* QR Code */}
        <TouchableOpacity 
          style={styles.qrContainer}
          onLongPress={() => setShowDebugData(!showDebugData)}
          activeOpacity={0.8}
        >
          <View style={styles.qrCode}>
            <QRCode
              value={qrCodeString}
              size={qrSize}
              color="#000000"
              backgroundColor="#FFFFFF"
              logoSize={30}
              logoMargin={2}
              logoBackgroundColor="transparent"
            />
          </View>
        </TouchableOpacity>

        {/* Debug Data - Long press QR to toggle */}
        {showDebugData && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>QR Code Data (for testing):</Text>
            <Text style={styles.debugText}>{qrCodeString}</Text>
          </View>
        )}

        {/* Ticket Details */}
        <View style={styles.ticketDetails}>
          <Text style={styles.bookingId}>#{displayData.bookingId}</Text>
          <Text style={styles.fareText}>{displayData.fare}</Text>
          <Text style={styles.passengerText}>Passenger: {qrData?.passengerName || 'Kavinda Dewmith'}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Ticket Validation Instructions:</Text>
          <Text style={styles.instructionText}>• Show this QR code to the bus conductor for validation</Text>
          <Text style={styles.instructionText}>• Ensure your screen brightness is high for better scanning</Text>
          <Text style={styles.instructionText}>• Keep the QR code steady while conductor scans</Text>
          <Text style={styles.instructionText}>• Have your ID ready if requested by conductor</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Save to Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#004CFF" />
            <Text style={styles.actionButtonText}>Share QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brightnessButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  ticketInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  routeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  seatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  qrContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  qrCode: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
    marginBottom: 8,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  passengerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  debugContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});