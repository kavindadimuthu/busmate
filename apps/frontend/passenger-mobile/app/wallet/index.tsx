import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';
import { 
  Plus, 
  EyeOff, 
  Eye, 
  Clock, 
  CreditCard, 
  History, 
  Lock,
  BellRing, 
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import MockWalletService from '@/services/mockWalletService';
import AppHeader from '@/components/ui/AppHeader';

// Custom Card SVG Component
const TravelCardSVG = ({ balance, cardNumber, expiryDate, name, hidden }) => (
  <View style={styles.travelCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Travel Card</Text>
      <View style={styles.chipIcon} />
    </View>
    
    <View style={styles.cardContent}>
      <Text style={styles.balanceLabel}>Balance</Text>
      <Text style={styles.balanceValue}>
        {hidden ? '••••••' : `LKR ${balance.toLocaleString()}`}
      </Text>
    </View>
    
    <View style={styles.cardNumber}>
      <Text style={styles.cardNumberText}>
        {hidden ? '•••• •••• •••• ' + cardNumber.slice(-4) : cardNumber}
      </Text>
    </View>
    
    <View style={styles.cardFooter}>
      <View>
        <Text style={styles.cardLabel}>Card Holder</Text>
        <Text style={styles.cardValue}>{name}</Text>
      </View>
      <View>
        <Text style={styles.cardLabel}>Expires</Text>
        <Text style={styles.cardValue}>{expiryDate}</Text>
      </View>
    </View>
  </View>
);

export default function WalletScreen() {
  const router = useRouter();
  const [hideBalance, setHideBalance] = useState(false);
  const { user } = useAuth();
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  // Get wallet data using the service
  const walletData = user?.email ? MockWalletService.getWalletByEmail(user.email) : null;
  const recentTransactions = user?.email ? MockWalletService.getRecentTransactions(user.email, 5) : [];
  const notificationSettings = user?.email ? MockWalletService.getNotificationSettings(user.email) : null;

  // Fallback data if no wallet found
  const defaultWalletData = {
    balance: 0,
    travelCard: {
      cardNumber: '•••• •••• •••• ••••',
      expiryDate: 'MM/YY',
      holderName: 'GUEST USER'
    }
  };

  const currentWallet = walletData || defaultWalletData;

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#1DD724';
      case 'pending': return '#F59E0B';
      case 'failed': return '#FF3831';
      default: return '#6B7280';
    }
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'topup': return <Plus size={16} color="#1DD724" />;
      case 'payment': return <Clock size={16} color="#004CFF" />;
      case 'card-use': return <CreditCard size={16} color="#004CFF" />;
      default: return <History size={16} color="#6B7280" />;
    }
  };

  const getTransactionPrefix = (type) => {
    return type === 'topup' || type === 'refund' ? '+' : '-';
  };

  const getTransactionColor = (type) => {
    return type === 'topup' || type === 'refund' ? '#1DD724' : '#004CFF';
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader 
        title="Wallet & Travel Card"
        showBackButton={true}
        rightElement={
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            style={styles.visibilityButton}
          >
            {hideBalance ? 
              <Eye size={20} color="#FFFFFF" /> : 
              <EyeOff size={20} color="#FFFFFF" />
            }
          </TouchableOpacity>
        }
        statusBarStyle="light-content"
      />

      <ScrollView style={styles.content}>
        {/* Travel Card Section */}
        <TravelCardSVG 
          balance={currentWallet.balance} 
          cardNumber={currentWallet.travelCard.cardNumber}
          expiryDate={currentWallet.travelCard.expiryDate}
          name={currentWallet.travelCard.holderName}
          hidden={hideBalance}
        />

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/wallet/topup')}
          >
            <View style={styles.actionIconContainer}>
              <Plus size={20} color="#004CFF" />
            </View>
            <Text style={styles.actionText}>Top Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/wallet/history')}
          >
            <View style={styles.actionIconContainer}>
              <History size={20} color="#004CFF" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/wallet/request-card')}
          >
            <View style={styles.actionIconContainer}>
              <CreditCard size={20} color="#004CFF" />
            </View>
            <Text style={styles.actionText}>Request Card</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/wallet/block-card')}
          >
            <View style={styles.actionIconContainer}>
              <Lock size={20} color="#004CFF" />
            </View>
            <Text style={styles.actionText}>Block Card</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactions}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/wallet/history')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#004CFF" />
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Your recent transactions will appear here.
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                  {getTransactionIcon(transaction.type)}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transaction.title}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type) }
                ]}>
                  {getTransactionPrefix(transaction.type)}LKR {transaction.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Notifications Section */}
        {notificationSettings && !notificationSettings.transactionAlerts && (
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationCard}>
              <View style={styles.notificationIcon}>
                <BellRing size={20} color="#004CFF" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  Enable notifications
                </Text>
                <Text style={styles.notificationText}>
                  Get alerts for transactions, low balance, and promotions
                </Text>
              </View>
              <TouchableOpacity style={styles.enableButton}>
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  visibilityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  // Travel Card Styles
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
  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  // Recent Transactions
  recentTransactions: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#004CFF',
    fontWeight: '500',
    marginRight: 4,
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
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Notifications Section
  notificationsContainer: {
    marginBottom: 40,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  enableButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EBF2FF',
    borderRadius: 20,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004CFF',
  },
});