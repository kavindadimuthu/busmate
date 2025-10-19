import { useTicket } from '@/contexts/TicketContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { ticketApi } from '@/services/api/ticket';
import { TicketDetails } from '@/types/ticket';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function TicketConfirmationScreen() {
  const { ticketData, ticketBackendData } = useTicket();
  const { user } = useAuth();
  const [isStoring, setIsStoring] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Check if ticket data is available
  if (!ticketData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>No Ticket Data</Text>
          <Text style={styles.errorMessage}>
            No ticket information available. Please go back and try again.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ticket: TicketDetails = ticketData;

  // Store ticket to database when page loads
  useEffect(() => {
    const storeTicketToDatabase = async () => {
      if (!ticketBackendData) {
        console.warn('⚠️ No backend data available for ticket storage');
        setStorageStatus('error');
        return;
      }

      console.log(' Storing ticket to database...', JSON.stringify(ticketBackendData, null, 2));
      console.log(' Backend data validation:', {
        hasData: !!ticketBackendData,
        conductorId: ticketBackendData.conductorId,
        busId: ticketBackendData.busId,
        tripId: ticketBackendData.tripId,
        startLocationId: ticketBackendData.startLocationId,
        endLocationId: ticketBackendData.endLocationId,
        fareAmount: ticketBackendData.fareAmount,
        paymentMethod: ticketBackendData.paymentMethod,
        transactionRef: ticketBackendData.transactionRef
      });
      
      console.log('👤 Current user context:', {
        userId: user?.id,
        userRole: user?.role,
        isLoggedIn: !!user
      });
      
      setIsStoring(true);

      try {
        const result = await ticketApi.issueTicket(ticketBackendData);
        
        if (result.success) {
          console.log('✅ Ticket successfully stored:', result.message);
          setStorageStatus('success');
        } else {
          console.error('❌ Failed to store ticket:', result.error, '-', result.message);
          setStorageStatus('error');
          
          // Show user-friendly error message based on error type
          setTimeout(() => {
            Alert.alert(
              'Ticket Issue Warning',
              result.message || 'Failed to sync ticket with server. The ticket was generated locally.',
              [{ text: 'OK' }]
            );
          }, 1000); // Delay to let UI render first
        }
      } catch (error: any) {
        console.error('💥 Unexpected error storing ticket:', error);
        setStorageStatus('error');
        
        // Show generic error for unexpected issues
        setTimeout(() => {
          Alert.alert(
            'Connection Error',
            'Could not connect to server. The ticket was generated locally but may not be synced.',
            [{ text: 'OK' }]
          );
        }, 1000);
      } finally {
        setIsStoring(false);
      }
    };
    
    storeTicketToDatabase();
  }, [ticketBackendData]);

  // Generate HTML for PDF
  const generateTicketHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bus Ticket - ${ticket.id}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .ticket-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .ticket-header {
            background: #0066FF;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .ticket-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
          }
          .ticket-subtitle {
            font-size: 14px;
            opacity: 0.8;
            margin: 5px 0 0 0;
          }
          .ticket-id {
            font-size: 16px;
            font-weight: 600;
            margin: 10px 0 0 0;
            letter-spacing: 1px;
          }
          .ticket-body {
            padding: 20px;
          }
          .journey-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            text-align: center;
          }
          .journey-location {
            flex: 1;
          }
          .journey-label {
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .journey-city {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
          .journey-detail {
            color: #666;
            font-size: 13px;
          }
          .journey-arrow {
            flex: 0 0 60px;
            font-size: 20px;
            color: #0066FF;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-label {
            color: #666;
          }
          .detail-value {
            font-weight: 600;
            color: #333;
          }
          .qr-section {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px dashed #ddd;
          }
          .qr-placeholder {
            width: 100px;
            height: 100px;
            background: #f0f0f0;
            margin: 0 auto 10px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 12px;
          }
          .footer {
            text-align: center;
            color: #888;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <h1 class="ticket-title">🎫 Digital Bus Ticket</h1>
            <p class="ticket-subtitle">Valid for single journey</p>
            <p class="ticket-id">ID: ${ticket.id}</p>
          </div>
          
          <div class="ticket-body">
            <div class="journey-section">
              <div class="journey-location">
                <div class="journey-label">From</div>
                <div class="journey-city">${ticket.from}</div>
                <div class="journey-detail">${ticket.platform}</div>
              </div>
              <div class="journey-arrow">🚌→</div>
              <div class="journey-location">
                <div class="journey-label">To</div>
                <div class="journey-city">${ticket.to}</div>
                <div class="journey-detail">${ticket.gate}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Passengers</span>
              <span class="detail-value">${ticket.passengers}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Total Fare</span>
              <span class="detail-value">${ticket.fare}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Issued On</span>
              <span class="detail-value">${ticket.issuedOn}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Phone Number</span>
              <span class="detail-value">${ticket.phoneNumber || 'Not provided'}</span>
            </div>
            
            <div class="qr-section">
              <div class="qr-placeholder">
                QR CODE<br/>
                ${ticket.id}
              </div>
              <p>Scan QR Code for Validation</p>
            </div>
            
            <div class="footer">
              Generated by Virtual Ticketing System<br>
              Keep this ticket until the end of your journey
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Handle download ticket as PDF
  const handleDownload = async () => {
    try {
      // Show loading state
      Alert.alert('Generating PDF...', 'Please wait while we create your ticket PDF');

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: generateTicketHTML(),
        base64: false,
      });

      // Create filename
      const filename = `BusTicket_${ticket.id.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      if (Platform.OS === 'ios') {
        // On iOS, directly share the PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Ticket PDF',
          });
        } else {
          Alert.alert('Success', 'PDF generated successfully!');
        }
      } else {
        // On Android, try to share directly first
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save or Share Ticket PDF',
          });
          
          Alert.alert(
            'PDF Ready!', 
            'Your ticket PDF has been generated and is ready to share.',
            [
              { text: 'OK' }
            ]
          );
        } else {
          // Fallback: try to save to file system
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            
            if (status === 'granted') {
              // Try to save to media library directly
              const asset = await MediaLibrary.createAssetAsync(uri);
              const album = await MediaLibrary.getAlbumAsync('Download');
              if (album == null) {
                await MediaLibrary.createAlbumAsync('Download', asset, false);
              } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
              }

              Alert.alert(
                'Download Complete!',
                `Ticket saved to Downloads folder as: ${filename}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'PDF Generated!',
                'Your ticket PDF has been created. Please use the share option to save or send it.',
                [{ text: 'OK' }]
              );
            }
          } catch (saveError) {
            console.log('Save error:', saveError);
            Alert.alert(
              'PDF Generated Successfully!',
              'Your ticket PDF has been created. You can access it through the share menu above.',
              [{ text: 'OK' }]
            );
          }
        }
      }

    } catch (error) {
      console.error('Error downloading ticket:', error);
      Alert.alert(
        'Generation Failed', 
        'Could not generate ticket PDF. Please try again or contact support.',
        [
          { text: 'OK' }
        ]
      );
    }
  };

  // Handle going back
  const handleBack = () => {
    router.back();
  };

  // Handle issue another ticket
  const handleIssueAnother = () => {
    router.push('/(tabs)/tickets');
  };

  // Handle share ticket
  const handleShare = async () => {
    try {
      const ticketMessage = `🎫 Bus Ticket Confirmation\n\n` +
        `📍 From: ${ticket.from} (${ticket.platform})\n` +
        `📍 To: ${ticket.to} (${ticket.gate})\n` +
        `👥 Passengers: ${ticket.passengers}\n` +
        `💰 Total Fare: ${ticket.fare}\n` +
        `🆔 Ticket ID: ${ticket.id}\n` +
        `📅 Issued: ${ticket.issuedOn}\n` +
        `📱 Phone: ${ticket.phoneNumber}\n\n` +
        `🚌 Virtual Ticketing System\n` +
        `Show this ticket to conductor for validation`;

      if (await Sharing.isAvailableAsync()) {
        // Try to share the PDF first if it exists
        try {
          const { uri } = await Print.printToFileAsync({
            html: generateTicketHTML(),
            base64: false,
          });
          
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Ticket',
          });
        } catch (pdfError) {
          // Fallback to text sharing
          console.log('PDF share failed, using text:', pdfError);
          await Share.share({
            message: ticketMessage,
            title: 'Bus Ticket - ' + ticket.id,
          });
        }
      } else {
        // Use React Native's built-in Share API
        await Share.share({
          message: ticketMessage,
          title: 'Bus Ticket - ' + ticket.id,
        });
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
      Alert.alert('Share Failed', 'Could not share ticket. Please try again.');
    }
  };

  // Handle view history
  const handleViewHistory = () => {
    router.push('/Ticket/scanHistory');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Confirmation</Text>
        <View style={{ width: 24 }} />
      </View> */}
      
      {/* Content */}
      <View style={styles.content}>
        {/* Success Message */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Ticket Successfully Issued!</Text>
          <Text style={styles.successSubtitle}>Your virtual ticket has been generated</Text>
        </View>
        
        {/* Digital Ticket */}
        <View style={styles.ticketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <View style={styles.ticketIcon}>
                <Ionicons name="ticket-outline" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.ticketHeaderTitle}>Digital Ticket</Text>
                <Text style={styles.ticketHeaderSubtitle}>Valid for single journey</Text>
              </View>
            </View>
            <View>
              <Text style={styles.ticketIdLabel}>Ticket ID</Text>
              <Text style={styles.ticketIdText}>{ticket.id}</Text>
            </View>
          </View>
          
          {/* Ticket Body */}
          <View style={styles.ticketBody}>
            {/* From - To */}
            <View>
              {/* From row with bus indicator centered */}
              <View style={styles.journeyRow}>
              <View>
                <Text style={styles.journeyLabel}>FROM</Text>
                <Text style={styles.journeyLocation}>{ticket.from}</Text>
                {/* <Text style={styles.journeyDetail}>{ticket.platform}</Text> */}
              </View>
              <View style={styles.journeyMiddle}>
                <View style={styles.journeyLine}>
                <View style={styles.journeyDot} />
                <View style={styles.journeyBus}>
                  <FontAwesome5 name="bus" size={14} color="#0066FF" />
                </View>
                <View style={styles.journeyDot} />
                </View>
              </View>
              {/* placeholder to keep spacing consistent */}
              <View style={{ width: 48 }} />
              </View>

              {/* To section placed below the From row */}
              <View style={{ marginTop: 8 }}>
              <Text style={styles.journeyLabel}>TO</Text>
              <Text style={styles.journeyLocation}>{ticket.to}</Text>
              {/* <Text style={styles.journeyDetail}>{ticket.gate}</Text> */}
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Ticket Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passengers</Text>
              <Text style={styles.detailValue}>{ticket.passengers}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Fare</Text>
              <Text style={styles.detailValue}>{ticket.fare}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issued On</Text>
              <Text style={styles.detailValue}>{ticket.issuedOn}</Text>
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* QR Code */}
            {/* <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR CODE</Text>
                <Text style={styles.qrPlaceholderId}>{ticket.id}</Text>
              </View>
              <Text style={styles.qrText}>Scan QR Code for Validation</Text>
            </View> */}
          </View>
        </View>
        
        {/* SMS Confirmation */}
        {/* <View style={styles.smsContainer}>
          <Ionicons name="phone-portrait-outline" size={20} color="#22C55E" />
          <View style={styles.smsTextContainer}>
            <Text style={styles.smsTitle}>SMS Sent Successfully</Text>
            <Text style={styles.smsDetails}>
              Ticket details sent to {ticket.phoneNumber}
            </Text>
          </View>
        </View> */}
      </View>
      
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton} 
        onPress={() => { router.push('/(tabs)/tickets'); }}
        >
          <Text style={styles.primaryButtonText}>Issue Another Ticket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.downloadButtonText}>Generate PDF</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <View style={styles.shareIconContainer}>
              <Ionicons name="share-outline" size={20} color="#0066FF" />
            </View>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
            <View style={styles.historyIconContainer}>
              <Ionicons name="time-outline" size={20} color="#555" />
            </View>
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity> */}
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ticketHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ticketHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ticketIdLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  ticketIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ticketBody: {
    padding: 16,
  },
  journeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  journeyLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  journeyLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  journeyDetail: {
    fontSize: 13,
    color: '#666',
  },
  journeyMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginTop: -15,
  },
  journeyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
  },
  journeyBus: {
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyDestination: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  qrCode: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  qrPlaceholderId: {
    fontSize: 10,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  qrText: {
    fontSize: 14,
    color: '#666',
  },
  smsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  smsTextContainer: {
    marginLeft: 12,
  },
  smsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22C55E',
  },
  smsDetails: {
    fontSize: 13,
    color: '#4A9D60',
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  shareIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});