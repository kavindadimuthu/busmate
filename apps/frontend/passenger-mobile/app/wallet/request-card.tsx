import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, User, Home, Phone, FileText, Check, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import MockWalletService from '@/services/mockWalletService';
import mockUserData from '@/data/mockUserData.json';
import AppHeader from '@/components/ui/AppHeader';

export default function RequestCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    phone: '',
    idNumber: '',
    deliveryAddress: 'same',
    alternateAddress: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user data and wallet information
  const userData = user?.email ? mockUserData.users[user.email as keyof typeof mockUserData.users] : null;
  const walletData = user?.email ? MockWalletService.getWalletByEmail(user.email) : null;
  const existingCardRequest = user?.email ? MockWalletService.getLatestCardRequest(user.email) : null;
  const balance = walletData?.balance || 0;
  const activePromotions = MockWalletService.getActivePromotions();

  // Pre-fill form with user data
  React.useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        fullName: userData.name || '',
        address: userData.address || '',
        phone: userData.phone || '',
        idNumber: '' // Keep empty for security
      }));
    }
  }, [userData]);

  // Check if user already has an active card
  const hasActiveCard = walletData?.travelCard?.status === 'active';

  // Calculate fee with promotions
  const calculateFees = () => {
    const baseFee = 200.00;
    const deliveryFee = 50.00;
    
    const firstTimeDiscount = activePromotions.find(promo => 
      promo.id === 'promo-002' && promo.isActive
    );
    
    let cardFee = baseFee;
    let discount = 0;
    
    // Apply first-time user discount if no previous requests
    if (firstTimeDiscount && !existingCardRequest) {
      discount = (baseFee * firstTimeDiscount.discountPercentage) / 100;
      cardFee = baseFee - discount;
    }
    
    return {
      baseFee,
      cardFee,
      deliveryFee,
      discount,
      total: cardFee + deliveryFee
    };
  };

  const fees = calculateFees();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check if user has sufficient balance
    if (balance < fees.total) {
      Alert.alert(
        "Insufficient Balance", 
        `You need LKR ${fees.total.toFixed(2)} to request a card. Your current balance is LKR ${balance.toFixed(2)}. Please top up your wallet first.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Top Up", onPress: () => router.push('/wallet/topup') }
        ]
      );
      return;
    }
    
    setIsProcessing(true);
    
    // Use service to simulate request
    const deliveryAddress = formData.deliveryAddress === 'same' 
      ? formData.address 
      : formData.alternateAddress;
    
    const success = MockWalletService.simulateCardRequest(
      user?.email || '', 
      deliveryAddress
    );
    
    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        Alert.alert(
          "Request Submitted",
          `Your travel card request has been submitted successfully. Request ID: REQ${Date.now()}. You will receive updates on your request status.`,
          [
            { 
              text: "OK", 
              onPress: () => router.back() 
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to submit request. Please try again.");
      }
    }, 2000);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert("Error", "Please enter your address");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!formData.idNumber.trim()) {
      Alert.alert("Error", "Please enter your ID number");
      return false;
    }
    if (formData.deliveryAddress === 'alternate' && !formData.alternateAddress.trim()) {
      Alert.alert("Error", "Please enter your alternate address");
      return false;
    }
    if (!agreeToTerms) {
      Alert.alert("Error", "Please agree to the terms and conditions");
      return false;
    }
    
    return true;
  };

  // Handle existing card check
  if (existingCardRequest && existingCardRequest.status === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Request Travel Card" />
        
        <View style={styles.content}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Request Already Submitted</Text>
            <Text style={styles.statusText}>
              You have a pending travel card request.
            </Text>
            <Text style={styles.trackingText}>
              Request ID: {existingCardRequest.requestId}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Handle existing active card
  if (walletData?.travelCard?.status === 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Request Travel Card" />
        
        <View style={styles.content}>
          <View style={styles.warningCard}>
            <AlertTriangle size={24} color="#92400E" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Card Already Active</Text>
              <Text style={styles.warningText}>
                You already have an active travel card. If you need a replacement, please block your current card first.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/wallet/block-card')}
            style={styles.blockCardButton}
          >
            <Text style={styles.blockCardButtonText}>Block Current Card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader title="Request Travel Card" />

      <ScrollView style={styles.content}>
        {/* Existing Request Status */}
        {existingCardRequest && existingCardRequest.status === 'approved' && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Request Approved</Text>
            <Text style={styles.statusText}>
              Your travel card request has been approved and is being processed for delivery.
            </Text>
            <Text style={styles.trackingText}>
              Expected delivery: {existingCardRequest.estimatedDelivery}
            </Text>
          </View>
        )}

        {/* First-time User Promotion */}
        {fees.discount > 0 && (
          <View style={styles.promotionBanner}>
            <Text style={styles.promotionTitle}>🎉 First-Time User Discount!</Text>
            <Text style={styles.promotionText}>
              Get 50% off on your first travel card request
            </Text>
            <Text style={styles.discountAmount}>Save LKR {fees.discount}</Text>
          </View>
        )}

        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardIconContainer}>
            <CreditCard size={24} color="#004CFF" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoTitle}>Physical Travel Card</Text>
            <Text style={styles.cardInfoText}>
              Request a physical travel card to use on all buses and routes. 
              Card will be delivered to your address within 7-10 business days.
            </Text>
            <View style={styles.feeContainer}>
              <Text style={styles.feeText}>Card fee:</Text>
              <Text style={styles.feeAmount}>
                {fees.discount > 0 ? (
                  <>
                    <Text style={styles.originalFee}>LKR {fees.baseFee.toFixed(2)}</Text>
                    {' '}LKR {fees.cardFee.toFixed(2)}
                  </>
                ) : (
                  `LKR ${fees.cardFee.toFixed(2)}`
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Balance Check */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>LKR {balance.toFixed(2)}</Text>
          {balance < fees.total ? (
            <Text style={styles.insufficientText}>
              Insufficient balance. Need LKR {(fees.total - balance).toFixed(2)} more.
            </Text>
          ) : (
            <Text style={styles.sufficientText}>✓ Sufficient balance</Text>
          )}
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Residential Address</Text>
            <View style={styles.inputContainer}>
              <Home size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your address"
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID Number</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your NIC number"
                value={formData.idNumber}
                onChangeText={(text) => handleChange('idNumber', text)}
              />
            </View>
          </View>

          <Text style={styles.formTitle}>Delivery Information</Text>
          
          <View style={styles.radioGroup}>
            <TouchableOpacity
              onPress={() => handleChange('deliveryAddress', 'same')}
              style={styles.radioOption}
            >
              <View style={[
                styles.radioButton,
                formData.deliveryAddress === 'same' && styles.radioButtonSelected
              ]}>
                {formData.deliveryAddress === 'same' && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Deliver to my residential address</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleChange('deliveryAddress', 'alternate')}
              style={styles.radioOption}
            >
              <View style={[
                styles.radioButton,
                formData.deliveryAddress === 'alternate' && styles.radioButtonSelected
              ]}>
                {formData.deliveryAddress === 'alternate' && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioText}>Deliver to a different address</Text>
            </TouchableOpacity>
          </View>

          {formData.deliveryAddress === 'alternate' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alternate Address</Text>
              <View style={styles.inputContainer}>
                <Home size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter alternate delivery address"
                  value={formData.alternateAddress}
                  onChangeText={(text) => handleChange('alternateAddress', text)}
                  multiline
                />
              </View>
            </View>
          )}

          {/* Terms and Conditions */}
          <TouchableOpacity
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            style={styles.termsContainer}
          >
            <View style={[
              styles.checkbox,
              agreeToTerms && styles.checkboxSelected
            ]}>
              {agreeToTerms && <Check size={14} color="white" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fee Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Fee Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Card Fee</Text>
            <View style={styles.summaryValueContainer}>
              {fees.discount > 0 && (
                <Text style={styles.originalFeeSmall}>LKR {fees.baseFee.toFixed(2)}</Text>
              )}
              <Text style={styles.summaryValue}>LKR {fees.cardFee.toFixed(2)}</Text>
            </View>
          </View>
          
          {fees.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>First-time Discount (50%)</Text>
              <Text style={styles.discountValue}>-LKR {fees.discount.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>LKR {fees.deliveryFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>LKR {fees.total.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.summaryNote}>
            Amount will be deducted from your wallet balance upon approval
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isProcessing || balance < fees.total}
          style={[
            styles.submitButton,
            (isProcessing || balance < fees.total) && styles.submitButtonDisabled
          ]}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <RefreshCw size={20} color="white" />
              <Text style={styles.submitButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {balance < fees.total ? 'Insufficient Balance' : 'Submit Request'}
            </Text>
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
    backgroundColor: '#FEF3C7',
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
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  blockCardButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  blockCardButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  statusCard: {
    backgroundColor: '#EBF2FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#004CFF',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#004CFF',
    marginBottom: 4,
  },
  trackingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  promotionBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  promotionText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  discountAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1DD724',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 4,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004CFF',
  },
  originalFee: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  balanceTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  insufficientText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  sufficientText: {
    fontSize: 14,
    color: '#1DD724',
    fontWeight: '500',
  },
  formContainer: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#004CFF',
  },
  radioText: {
    fontSize: 16,
    color: '#374151',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#004CFF',
    fontWeight: '500',
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValueContainer: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  originalFeeSmall: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1DD724',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
  },
  summaryNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 8,
  },
  submitContainer: {
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
  submitButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});