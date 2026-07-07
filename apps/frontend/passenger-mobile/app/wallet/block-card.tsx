import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Shield, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import MockWalletService from '@/services/mockWalletService';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function BlockCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get wallet and card data from service
  const walletData = user?.email ? MockWalletService.getWalletByEmail(user.email) : null;
  const travelCard = walletData?.travelCard;
  const balance = walletData?.balance || 0;
  const blockedCards = user?.email ? MockWalletService.getBlockedCards(user.email) : [];

  const blockReasons = [
    'Lost card',
    'Stolen card',
    'Damaged card',
    'Suspicious activity',
    'Card not working',
    'Requesting new card',
    'Other'
  ];

  // Check if user has an active card to block
  const hasActiveCard = travelCard?.status === 'active';

  const handleBlockCard = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for blocking your card");
      return;
    }
    
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    
    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert("Error", "Please specify your reason");
      return;
    }
    
    setIsProcessing(true);
    
    // Use service to simulate card blocking
    const success = MockWalletService.simulateCardBlock(
      user?.email || '', 
      reason
    );
    
    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        Alert.alert(
          "Card Blocked",
          `Your travel card has been blocked successfully. Your balance of LKR ${balance.toFixed(2)} will be transferred to your wallet. A new card can be requested from the wallet section.`,
          [
            { 
              text: "OK", 
              onPress: () => router.back() 
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to block card. Please try again.");
      }
    }, 2000);
  };

  // Show message if no active card
  if (!hasActiveCard) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Block Travel Card" />

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <AlertTriangle size={24} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>No Active Card</Text>
              <Text style={styles.infoText}>
                You don't have an active travel card to block. 
                {blockedCards.length > 0 
                  ? " You have previously blocked cards. You can request a new card from the wallet section."
                  : " You can request a new travel card from the wallet section."
                }
              </Text>
            </View>
          </View>

          {blockedCards.length > 0 && (
            <View style={styles.blockedCardsContainer}>
              <Text style={styles.sectionTitle}>Previously Blocked Cards</Text>
              {blockedCards.map((card) => (
                <View key={card.id} style={styles.blockedCardItem}>
                  <Text style={styles.blockedCardNumber}>{card.cardNumber}</Text>
                  <Text style={styles.blockedCardDate}>Blocked: {card.blockDate}</Text>
                  <Text style={styles.blockedCardReason}>Reason: {card.reason}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/wallet/request-card')}
            style={styles.requestCardButton}
          >
            <Text style={styles.requestCardButtonText}>Request New Card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader title="Block Travel Card" />

      <ScrollView style={styles.content}>
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <AlertTriangle size={24} color="#DC2626" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Information</Text>
            <Text style={styles.warningText}>
              Blocking your card is permanent and cannot be undone. After blocking, you will need to request a new card.
            </Text>
          </View>
        </View>

        {/* Card Information */}
        <View style={styles.cardInfoContainer}>
          <Text style={styles.sectionTitle}>Card Information</Text>
          
          <View style={styles.travelCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Travel Card</Text>
              <View style={styles.chipIcon} />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>LKR {balance.toLocaleString()}</Text>
            </View>
            
            <View style={styles.cardNumber}>
              <Text style={styles.cardNumberText}>{travelCard?.cardNumber}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>Card Holder</Text>
                <Text style={styles.cardValue}>{travelCard?.holderName}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>Expires</Text>
                <Text style={styles.cardValue}>{travelCard?.expiryDate}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card Number</Text>
              <Text style={styles.detailValue}>{travelCard?.cardNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card Holder</Text>
              <Text style={styles.detailValue}>{travelCard?.holderName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issued Date</Text>
              <Text style={styles.detailValue}>{travelCard?.issuedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text style={styles.detailValue}>{travelCard?.expiryDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Balance</Text>
              <Text style={styles.detailValue}>LKR {balance.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card Status</Text>
              <Text style={[styles.detailValue, styles.statusActive]}>
                {travelCard?.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Block Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Reason for Blocking</Text>
          <Text style={styles.sectionSubtitle}>Please select a reason for blocking your travel card</Text>
          
          <View style={styles.reasonsList}>
            {blockReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected
                ]}
              >
                <View style={[
                  styles.radioButton,
                  selectedReason === reason && styles.radioButtonSelected
                ]}>
                  {selectedReason === reason && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextSelected
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'Other' && (
            <View style={styles.customReasonContainer}>
              <Text style={styles.inputLabel}>Please specify</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your reason..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        </View>

        {/* What Happens Next */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>What Happens Next?</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Lock size={20} color="#004CFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Card will be blocked immediately</Text>
              <Text style={styles.infoText}>
                Your card will be blocked as soon as you submit this request
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Shield size={20} color="#004CFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Balance is protected</Text>
              <Text style={styles.infoText}>
                Your current balance will be transferred to your wallet
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <CreditCard size={20} color="#004CFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Request a new card</Text>
              <Text style={styles.infoText}>
                You can request a new travel card from the wallet section
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Block Button */}
      <View style={styles.blockContainer}>
        <TouchableOpacity
          onPress={handleBlockCard}
          disabled={!selectedReason || isProcessing}
          style={[
            styles.blockButton,
            (!selectedReason || isProcessing) && styles.blockButtonDisabled
          ]}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <RefreshCw size={20} color="white" />
              <Text style={styles.blockButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.blockButtonText}>Block Card</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 90,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },
  cardInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  travelCard: {
    backgroundColor: '#004CFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 20,
    height: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  chipIcon: {
    width: 40,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#F5D64E',
    opacity: 0.9,
  },
  cardContent: {
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 0,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardNumber: {
    marginBottom: 12,
  },
  cardNumberText: {
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  reasonSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonItemSelected: {
    borderColor: '#004CFF',
    backgroundColor: '#EBF2FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#004CFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004CFF',
  },
  reasonText: {
    fontSize: 16,
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#004CFF',
    fontWeight: '500',
  },
  customReasonContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  blockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  blockButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  blockButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  blockButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  infoCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  blockedCardsContainer: {
    marginTop: 16,
  },
  blockedCardItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockedCardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  blockedCardDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  blockedCardReason: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestCardButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestCardButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  statusActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  statusInactive: {
    color: '#DC2626',
    fontWeight: '600',
  },
  statusPending: {
    color: '#FFA500',
    fontWeight: '600',
  },
});