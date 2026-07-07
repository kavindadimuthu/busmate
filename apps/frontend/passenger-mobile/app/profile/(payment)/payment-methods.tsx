import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  CreditCard,
  Plus,
  Ban,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react-native';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const safeAreaStyle = useSafeAreaContainerStyles();

  // Mock payment methods data
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      name: 'Visa Credit Card',
      cardNumber: '•••• •••• •••• 4567',
      expiryDate: '09/26',
      cardType: 'visa',
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      name: 'Mastercard Debit',
      cardNumber: '•••• •••• •••• 8912',
      expiryDate: '12/25',
      cardType: 'mastercard',
      isDefault: false
    },
    {
      id: '3',
      type: 'bank',
      name: 'Sampath Bank',
      accountNumber: '•••• •••• 7634',
      isDefault: false
    }
  ]);

  const handleDeleteMethod = (method) => {
    setSelectedMethod(method);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    // Remove the selected payment method
    setPaymentMethods(paymentMethods.filter(method => method.id !== selectedMethod.id));
    setIsDeleteModalVisible(false);
    
    // If deleted method was default, set first remaining method as default
    if (selectedMethod.isDefault && paymentMethods.length > 1) {
      const updatedMethods = paymentMethods.filter(method => method.id !== selectedMethod.id);
      if (updatedMethods.length > 0) {
        setPaymentMethods(updatedMethods.map((method, index) => 
          index === 0 ? {...method, isDefault: true} : method
        ));
      }
    }
  };

  const handleSetDefaultMethod = (id) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const getCardLogo = (type) => {
    switch(type) {
      case 'visa':
        return require('../../../assets/images/visa_logo.png'); // You'll need to add these image assets
      case 'mastercard':
        return require('../../../assets/images/mastercard_logo.png');
      default:
        return null;
    }
  };

  const getMethodIcon = (type) => {
    switch(type) {
      case 'card':
        return <CreditCard size={24} color="#004CFF" />;
      case 'bank':
        return <Ban size={24} color="#004CFF" />;
      default:
        return <CreditCard size={24} color="#004CFF" />;
    }
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      <AppHeader title="Payment Methods" />

      <ScrollView style={styles.content}>
        {/* Payment Methods List */}
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No payment methods</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add a credit/debit card or bank account to make payments easier
            </Text>
          </View>
        ) : (
          <View style={styles.paymentMethodsList}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentMethodCard}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodIconContainer}>
                    {getMethodIcon(method.type)}
                  </View>
                  
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDetail}>
                      {method.type === 'card' ? method.cardNumber : method.accountNumber}
                    </Text>
                  </View>
                  
                  {method.type === 'card' && method.cardType && (
                    <Image 
                      source={getCardLogo(method.cardType)} 
                      style={styles.cardLogo} 
                    />
                  )}
                </View>
                
                <View style={styles.methodFooter}>
                  {method.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetDefaultMethod(method.id)}
                      style={styles.setDefaultButton}
                    >
                      <Text style={styles.setDefaultText}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod(method)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color="#FF3831" />
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          onPress={() => router.push('/profile/(payment)/add-method')}
          style={styles.addButton}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={32} color="#FF3831" />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalTitle}>
              Remove Payment Method?
            </Text>
            <Text style={styles.modalText}>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </Text>
            
            {selectedMethod && (
              <View style={styles.selectedMethodContainer}>
                <View style={styles.selectedMethodIconContainer}>
                  {selectedMethod.type === 'card' 
                    ? <CreditCard size={20} color="#004CFF" />
                    : <Ban size={20} color="#004CFF" />
                  }
                </View>
                <View>
                  <Text style={styles.selectedMethodName}>{selectedMethod.name}</Text>
                  <Text style={styles.selectedMethodDetail}>
                    {selectedMethod.type === 'card' 
                      ? selectedMethod.cardNumber 
                      : selectedMethod.accountNumber}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paymentMethodsList: {
    marginBottom: 24,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardLogo: {
    width: 40,
    height: 24,
    resizeMode: 'contain',
  },
  methodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EBF2FF',
    borderRadius: 16,
  },
  defaultText: {
    fontSize: 12,
    color: '#004CFF',
    fontWeight: '500',
  },
  setDefaultButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  setDefaultText: {
    fontSize: 14,
    color: '#004CFF',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 14,
    color: '#FF3831',
    marginLeft: 6,
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
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectedMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  selectedMethodDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#FF3831',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});