import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, Wallet, Plus, RefreshCw, Check } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import MockWalletService from '@/services/mockWalletService';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function TopupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const safeAreaStyle = useSafeAreaContainerStyles();

  // Get wallet data and payment methods from service
  const walletData = user?.email ? MockWalletService.getWalletByEmail(user.email) : null;
  const paymentMethods = user?.email ? MockWalletService.getPaymentMethods(user.email) : [];
  const balance = walletData?.balance || 0;
  const activePromotions = MockWalletService.getActivePromotions();

  // Predefined top-up amounts
  const quickAmounts = [500, 1000, 2000, 5000];

  // Handle custom amount input
  const handleAmountChange = (text) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  // Handle amount selection
  const handleSelectAmount = (value) => {
    setAmount(value.toString());
  };

  // Handle payment method selection
  const handleSelectPaymentMethod = (id) => {
    setSelectedPaymentMethod(id);
  };

  // Calculate bonus amount for promotions
  const calculateBonus = () => {
    const numericAmount = parseInt(amount);
    if (!numericAmount) return 0;

    const weekendPromo = activePromotions.find(promo => 
      promo.id === 'promo-001' && 
      promo.isActive && 
      numericAmount >= promo.minAmount
    );

    if (weekendPromo) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return (numericAmount * weekendPromo.bonusPercentage) / 100;
      }
    }
    return 0;
  };

  // Process top-up request
  const handleTopup = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    // Simulate API call using service
    const success = MockWalletService.simulateTopup(
      user?.email || '', 
      parseInt(amount), 
      selectedPaymentMethod
    );
    
    setTimeout(() => {
      setIsProcessing(false);
      if (success) {
        const bonus = calculateBonus();
        const totalAmount = parseInt(amount) + bonus;
        
        Alert.alert(
          "Top-up Successful",
          bonus > 0 
            ? `LKR ${amount} + LKR ${bonus} bonus has been added to your wallet. Total: LKR ${totalAmount}`
            : `LKR ${amount} has been added to your wallet.`,
          [
            { 
              text: "OK", 
              onPress: () => router.back() 
            }
          ]
        );
      } else {
        Alert.alert("Error", "Top-up failed. Please try again.");
      }
    }, 2000);
  };

  // Form validation
  const validateForm = () => {
    const numericAmount = parseInt(amount);
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }
    
    if (numericAmount < 100) {
      Alert.alert("Error", "Minimum top-up amount is LKR 100");
      return false;
    }
    
    if (numericAmount > 50000) {
      Alert.alert("Error", "Maximum top-up amount is LKR 50,000");
      return false;
    }
    
    if (!selectedPaymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      return false;
    }
    
    return true;
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    if (method.type === 'card') {
      return <CreditCard size={24} color="#374151" />;
    } else {
      return <Wallet size={24} color="#374151" />;
    }
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method) => {
    if (method.type === 'card') {
      return `${method.name} ${method.cardNumber}`;
    } else {
      return `${method.bankName} ${method.accountNumber}`;
    }
  };

  const bonus = calculateBonus();
  const finalAmount = parseInt(amount || '0') + bonus;

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader title="Top Up Wallet" />

      <ScrollView style={styles.content}>
        {/* Current Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>LKR {balance.toLocaleString()}</Text>
        </View>

        {/* Weekend Promotion Banner */}
        {bonus > 0 && (
          <View style={styles.promotionBanner}>
            <Text style={styles.promotionTitle}>🎉 Weekend Bonus Active!</Text>
            <Text style={styles.promotionText}>
              Get 5% bonus on top-ups above LKR 1,000 during weekends
            </Text>
            <Text style={styles.bonusAmount}>Bonus: +LKR {bonus}</Text>
          </View>
        )}

        {/* Amount Entry */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>LKR</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>Quick Amounts</Text>
            <View style={styles.quickAmountButtons}>
              {quickAmounts.map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleSelectAmount(value)}
                  style={[
                    styles.quickAmountButton,
                    amount === value.toString() && styles.quickAmountButtonSelected
                  ]}
                >
                  <Text 
                    style={[
                      styles.quickAmountText,
                      amount === value.toString() && styles.quickAmountTextSelected
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No payment methods found</Text>
              <Text style={styles.emptyStateText}>
                Please add a payment method in your wallet settings
              </Text>
            </View>
          ) : (
            <View style={styles.paymentOptions}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => handleSelectPaymentMethod(method.id)}
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === method.id && styles.paymentMethodCardSelected
                  ]}
                >
                  <View style={styles.paymentMethodIcon}>
                    {getPaymentMethodIcon(method)}
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodTitle}>{method.name}</Text>
                    <Text style={styles.paymentMethodSubtitle}>
                      {getPaymentMethodDisplay(method)}
                    </Text>
                    {method.isDefault && (
                      <Text style={styles.defaultBadge}>Default</Text>
                    )}
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedPaymentMethod === method.id && styles.radioButtonSelected
                  ]}>
                    {selectedPaymentMethod === method.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Transaction Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Top-up Amount</Text>
            <Text style={styles.summaryValue}>
              {amount ? `LKR ${parseInt(amount).toLocaleString()}` : 'LKR 0'}
            </Text>
          </View>
          
          {bonus > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weekend Bonus (5%)</Text>
              <Text style={styles.bonusValue}>+LKR {bonus}</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction Fee</Text>
            <Text style={styles.summaryValue}>LKR 0</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              LKR {finalAmount.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>New Balance</Text>
            <Text style={styles.newBalanceValue}>
              LKR {(balance + finalAmount).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesContainer}>
          <View style={styles.noteItem}>
            <Check size={16} color="#1DD724" />
            <Text style={styles.noteText}>Funds will be available immediately after top-up</Text>
          </View>
          <View style={styles.noteItem}>
            <Check size={16} color="#1DD724" />
            <Text style={styles.noteText}>No transaction fees for wallet top-ups</Text>
          </View>
          <View style={styles.noteItem}>
            <Check size={16} color="#1DD724" />
            <Text style={styles.noteText}>Top-up transactions are protected with bank-level security</Text>
          </View>
        </View>
      </ScrollView>

      {/* Top Up Button */}
      <View style={styles.topupContainer}>
        <TouchableOpacity
          onPress={handleTopup}
          disabled={isProcessing || !amount || !selectedPaymentMethod || paymentMethods.length === 0}
          style={[
            styles.topupButton,
            (isProcessing || !amount || !selectedPaymentMethod || paymentMethods.length === 0) && styles.topupButtonDisabled
          ]}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <RefreshCw size={20} color="white" />
              <Text style={styles.topupButtonText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Plus size={20} color="white" />
              <Text style={styles.topupButtonText}>
                Top Up {amount ? `LKR ${finalAmount.toLocaleString()}` : 'Now'}
              </Text>
            </>
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
  balanceContainer: {
    backgroundColor: '#004CFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
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
  bonusAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1DD724',
  },
  amountContainer: {
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
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 16,
  },
  quickAmountContainer: {
    marginTop: 8,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#F3F4F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  quickAmountButtonSelected: {
    backgroundColor: '#EBF2FF',
    borderWidth: 1,
    borderColor: '#004CFF',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickAmountTextSelected: {
    color: '#004CFF',
  },
  paymentMethodContainer: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  paymentMethodCardSelected: {
    backgroundColor: '#EBF2FF',
    borderColor: '#004CFF',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#004CFF',
    fontWeight: '500',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
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
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  bonusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1DD724',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
  },
  newBalanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1DD724',
  },
  notesContainer: {
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
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  topupContainer: {
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
  topupButton: {
    backgroundColor: '#004CFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  topupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  topupButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});