import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { PassengerDetails, PassengerActionResult } from '@/types/Journey/passenger';
import { passengerApi } from '@/services/Journey/passengerApi';

export function usePassengerCard(passengerId?: string) {
  // Data state
  const [passenger, setPassenger] = useState<PassengerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch passenger data
  useEffect(() => {
    if (!passengerId) {
      setLoading(false);
      return;
    }

    const fetchPassenger = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading passenger data for ID: ${passengerId}`);
        const passengerData = await passengerApi.getPassengerById(passengerId);
        
        setPassenger(passengerData);
        console.log(`Loaded passenger: ${passengerData.name}`);
      } catch (err) {
        console.error('Failed to load passenger:', err);
        setError(err instanceof Error ? err.message : 'Failed to load passenger details');
      } finally {
        setLoading(false);
      }
    };

    fetchPassenger();
  }, [passengerId]);

  // Handle revalidation
  const handleRevalidate = useCallback(async () => {
    if (!passenger) return;

    Alert.alert(
      'Re-validate Ticket',
      `Are you sure you want to re-validate the ticket for ${passenger.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-validate',
          onPress: async () => {
            try {
              setActionLoading(true);
              const result = await passengerApi.revalidatePassenger(passenger.id);
              
              if (result.success && result.updatedPassenger) {
                setPassenger(result.updatedPassenger);
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Revalidation failed:', error);
              Alert.alert('Error', 'Failed to re-validate ticket');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  }, [passenger]);

  // Handle invalidation
  const handleInvalidate = useCallback(async (reason?: string) => {
    if (!passenger) return;

    Alert.alert(
      'Invalidate Ticket',
      `Are you sure you want to invalidate the ticket for ${passenger.name}?${reason ? `\n\nReason: ${reason}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Invalidate',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const result = await passengerApi.invalidatePassenger(passenger.id, reason);
              
              if (result.success && result.updatedPassenger) {
                setPassenger(result.updatedPassenger);
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Invalidation failed:', error);
              Alert.alert('Error', 'Failed to invalidate ticket');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  }, [passenger]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!passenger) return;

    const shareText = `Passenger Details:
Name: ${passenger.name}
Seat: ${passenger.ticket.seatNumber}
Ticket ID: ${passenger.ticket.ticketId}
Status: ${passenger.validationStatus}
Fare: Rs. ${passenger.ticket.fare.toFixed(2)}`;

    try {
      // In real app, you would use React Native's Share API
      console.log('Sharing passenger details:', shareText);
      Alert.alert('Share', 'Passenger details copied to clipboard');
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share passenger details');
    }
  }, [passenger]);

  // Handle message
  const handleMessage = useCallback(async () => {
    if (!passenger) return;

    Alert.prompt(
      'Send Message',
      `Send a message to ${passenger.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            if (!message || message.trim() === '') return;
            
            try {
              setActionLoading(true);
              const result = await passengerApi.sendMessage(passenger.id, message);
              
              if (result.success) {
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Failed to send message:', error);
              Alert.alert('Error', 'Failed to send message');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  }, [passenger]);

  // Handle phone call
  const handleCall = useCallback(async () => {
    if (!passenger) return;

    Alert.alert(
      'Call Passenger',
      `Call ${passenger.name} at ${passenger.contact.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            try {
              const phoneUrl = `tel:${passenger.contact.phone}`;
              const supported = await Linking.canOpenURL(phoneUrl);
              
              if (supported) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Error', 'Phone calls are not supported on this device');
              }
            } catch (error) {
              console.error('Failed to make call:', error);
              Alert.alert('Error', 'Failed to make phone call');
            }
          }
        }
      ]
    );
  }, [passenger]);

  // Refresh passenger data
  const refreshPassenger = useCallback(async () => {
    if (!passengerId) return;

    try {
      setLoading(true);
      const passengerData = await passengerApi.getPassengerById(passengerId);
      setPassenger(passengerData);
    } catch (error) {
      console.error('Failed to refresh passenger:', error);
      setError('Failed to refresh passenger data');
    } finally {
      setLoading(false);
    }
  }, [passengerId]);

  // Get validation status color
  const getValidationStatusColor = useCallback(() => {
    if (!passenger) return '#666';
    
    switch (passenger.validationStatus) {
      case 'validated':
        return '#22C55E';
      case 'pending':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#666';
    }
  }, [passenger]);

  // Get payment type color
  const getPaymentTypeColor = useCallback(() => {
    if (!passenger) return '#0066FF';
    
    switch (passenger.ticket.paymentType) {
      case 'QR Payment':
        return '#0066FF';
      case 'Cash Payment':
        return '#059669';
      case 'Card Payment':
        return '#7C3AED';
      case 'Digital Wallet':
        return '#DC2626';
      default:
        return '#0066FF';
    }
  }, [passenger]);

  return {
    // Data
    passenger,
    loading,
    error,
    actionLoading,
    
    // Actions
    handleRevalidate,
    handleInvalidate,
    handleShare,
    handleMessage,
    handleCall,
    refreshPassenger,
    setError,
    
    // Utilities
    getValidationStatusColor,
    getPaymentTypeColor,
  };
}