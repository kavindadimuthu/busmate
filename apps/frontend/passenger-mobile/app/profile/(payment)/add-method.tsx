import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  CreditCard, 
  User,
  Calendar,
  Lock,
  Check,
  ChevronRight,
  Ban
} from 'lucide-react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [methodType, setMethodType] = useState('card'); // 'card' or 'bank'
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  // Credit/Debit card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });

  // Bank account form state
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branchCode: '',
  });

  const [isSaveAsDefault, setSaveAsDefault] = useState(true);

  const handleCardFormChange = (field, value) => {
    // Format card number with spaces every 4 digits
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      value = value.substring(0, 19); // Limit to 16 digits + 3 spaces
    }
    
    // Format expiry date as MM/YY
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      value = value.substring(0, 5);
    }
    
    // Limit CVV to 3-4 digits
    if (field === 'cvv') {
      value = value.replace(/\D/g, '');
      value = value.substring(0, 4);
    }
    
    setCardForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBankFormChange = (field, value) => {
    setBankForm(prev => ({ ...prev, [field]: value }));
  };

  const validateCardForm = () => {
    if (cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    
    if (!cardForm.cardholderName.trim()) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return false;
    }
    
    if (cardForm.expiryDate.length < 5 || !cardForm.expiryDate.includes('/')) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (cardForm.cvv.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return false;
    }
    
    return true;
  };

  const validateBankForm = () => {
    if (!bankForm.bankName.trim()) {
      Alert.alert('Error', 'Please enter the bank name');
      return false;
    }
    
    if (!bankForm.accountNumber.trim()) {
      Alert.alert('Error', 'Please enter your account number');
      return false;
    }
    
    if (!bankForm.accountName.trim()) {
      Alert.alert('Error', 'Please enter the account holder name');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    let isValid = methodType === 'card' ? validateCardForm() : validateBankForm();
    
    if (!isValid) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Payment Method Added",
        "Your payment method has been added successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      <AppHeader title="Add Payment Method" />

      <ScrollView style={styles.content}>
        {/* Payment Method Type Selector */}
        <View style={styles.methodTypeContainer}>
          <TouchableOpacity 
            style={[
              styles.methodTypeButton,
              methodType === 'card' && styles.methodTypeButtonSelected
            ]}
            onPress={() => setMethodType('card')}
          >
            <CreditCard size={20} color={methodType === 'card' ? "#004CFF" : "#6B7280"} />
            <Text style={[
              styles.methodTypeText,
              methodType === 'card' && styles.methodTypeTextSelected
            ]}>
              Card
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.methodTypeButton,
              methodType === 'bank' && styles.methodTypeButtonSelected
            ]}
            onPress={() => setMethodType('bank')}
          >
            <Ban size={20} color={methodType === 'bank' ? "#004CFF" : "#6B7280"} />
            <Text style={[
              styles.methodTypeText,
              methodType === 'bank' && styles.methodTypeTextSelected
            ]}>
              Bank Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Form */}
        {methodType === 'card' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputContainer}>
                <CreditCard size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.cardNumber}
                  onChangeText={(text) => handleCardFormChange('cardNumber', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter name as shown on card"
                  value={cardForm.cardholderName}
                  onChangeText={(text) => handleCardFormChange('cardholderName', text)}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.inputContainer}>
                  <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/YY"
                    value={cardForm.expiryDate}
                    onChangeText={(text) => handleCardFormChange('expiryDate', text)}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    value={cardForm.cvv}
                    onChangeText={(text) => handleCardFormChange('cvv', text)}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bank Account Form */}
        {methodType === 'bank' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <View style={styles.inputContainer}>
                <Ban size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter bank name"
                  value={bankForm.bankName}
                  onChangeText={(text) => handleBankFormChange('bankName', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <View style={styles.inputContainer}>
                <CreditCard size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter account number"
                  value={bankForm.accountNumber}
                  onChangeText={(text) => handleBankFormChange('accountNumber', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter account holder name"
                  value={bankForm.accountName}
                  onChangeText={(text) => handleBankFormChange('accountName', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Branch Code (Optional)</Text>
              <View style={styles.inputContainer}>
                <CreditCard size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter branch code"
                  value={bankForm.branchCode}
                  onChangeText={(text) => handleBankFormChange('branchCode', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Set as Default */}
        <TouchableOpacity 
          style={styles.defaultOption}
          onPress={() => setSaveAsDefault(!isSaveAsDefault)}
        >
          <View style={[
            styles.checkbox,
            isSaveAsDefault && styles.checkboxSelected
          ]}>
            {isSaveAsDefault && <Check size={14} color="white" />}
          </View>
          <Text style={styles.defaultOptionText}>
            Set as default payment method
          </Text>
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Lock size={16} color="#6B7280" />
          <Text style={styles.securityNoteText}>
            Your payment information is encrypted and securely stored
          </Text>
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsLink}>
          <Text style={styles.termsText}>
            View Terms & Conditions
          </Text>
          <ChevronRight size={16} color="#004CFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isProcessing}
          style={[
            styles.addButton, 
            isProcessing && styles.addButtonDisabled
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Check size={20} color="white" />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
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
    paddingTop: 20,
    paddingBottom: 80,
    marginBottom: 80,
  },
  methodTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  methodTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  methodTypeButtonSelected: {
    borderColor: '#004CFF',
    backgroundColor: '#EBF2FF',
  },
  methodTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  methodTypeTextSelected: {
    color: '#004CFF',
  },
  formCard: {
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  defaultOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  securityNoteText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  termsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#004CFF',
    marginRight: 4,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});