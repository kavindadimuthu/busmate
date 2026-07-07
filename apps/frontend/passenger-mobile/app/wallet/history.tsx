import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { 
  Plus, 
  Clock, 
  TriangleAlert as AlertTriangle,
  Check,
  X,
  CreditCard,
  Bus,
  RefreshCw
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import MockWalletService from '@/services/mockWalletService';
import AppHeader from '@/components/ui/AppHeader';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const safeAreaStyle = useSafeAreaContainerStyles();

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'topup', label: 'Top-ups' },
    { id: 'payment', label: 'Payments' },
    { id: 'card-use', label: 'Card Use' },
    { id: 'refund', label: 'Refunds' },
  ];

  // Get transactions using the service
  const allTransactions = user?.email ? MockWalletService.getAllTransactions(user.email) : [];

  const getFilteredTransactions = () => {
    if (selectedFilter === 'all') return allTransactions;
    if (selectedFilter === 'topup') return allTransactions.filter(t => t.type === 'topup');
    if (selectedFilter === 'payment') return allTransactions.filter(t => t.type === 'payment');
    if (selectedFilter === 'card-use') return allTransactions.filter(t => t.type === 'card-use');
    if (selectedFilter === 'refund') return allTransactions.filter(t => t.type === 'refund');
    return allTransactions;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#1DD724';
      case 'pending': return '#F59E0B';
      case 'failed': return '#FF3831';
      default: return '#6B7280';
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'failed') return <AlertTriangle size={16} color="#FF3831" />;
    if (status === 'pending') return <Clock size={16} color="#F59E0B" />;
    
    switch(type) {
      case 'topup': return <Plus size={16} color="#1DD724" />;
      case 'payment': return <Bus size={16} color="#004CFF" />;
      case 'card-use': return <CreditCard size={16} color="#004CFF" />;
      case 'refund': return <RefreshCw size={16} color="#1DD724" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const getTransactionPrefix = (type) => {
    return (type === 'topup' || type === 'refund') ? '+' : '-';
  };

  const getTransactionColor = (type, status) => {
    if (status === 'failed') return '#FF3831';
    if (status === 'pending') return '#F59E0B';
    return (type === 'topup' || type === 'refund') ? '#1DD724' : '#004CFF';
  };

  const getStatusIndicator = (status) => {
    switch(status) {
      case 'completed': return <Check size={14} color="#1DD724" />;
      case 'pending': return <Clock size={14} color="#F59E0B" />;
      case 'failed': return <X size={14} color="#FF3831" />;
      default: return null;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  const formatDate = (dateString) => {
    // Group transactions by date
    if (dateString.startsWith('Today')) return 'Today';
    if (dateString.startsWith('Yesterday')) return 'Yesterday';
    return dateString.split(',')[0]; // Extract just the date part
  };

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = formatDate(transaction.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader title="Transaction History" />

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.filterTabActive
              ]}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.id && styles.filterTabTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? "You haven't made any transactions yet"
                : `No ${selectedFilter} transactions found`
              }
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              
              {dateTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => {}}
                  style={styles.transactionCard}
                >
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionIconContainer}>
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.title}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {transaction.date.includes(',') ? transaction.date.split(', ')[1] : transaction.date}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[
                        styles.amountText,
                        { color: getTransactionColor(transaction.type, transaction.status) }
                      ]}>
                        {getTransactionPrefix(transaction.type)}LKR {transaction.amount.toLocaleString()}
                      </Text>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: `${getStatusColor(transaction.status)}20` }
                      ]}>
                        <View style={styles.statusIconContainer}>
                          {getStatusIndicator(transaction.status)}
                        </View>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) }
                        ]}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    {transaction.location && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{transaction.location}</Text>
                      </View>
                    )}
                    
                    {transaction.method && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Method</Text>
                        <Text style={styles.detailValue}>{transaction.method}</Text>
                      </View>
                    )}
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reference</Text>
                      <Text style={styles.detailValue}>{transaction.reference}</Text>
                    </View>
                    
                    {transaction.description && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailValue}>{transaction.description}</Text>
                      </View>
                    )}
                    
                    {transaction.error && (
                      <View style={styles.errorContainer}>
                        <AlertTriangle size={14} color="#FF3831" />
                        <Text style={styles.errorText}>{transaction.error}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
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
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#004CFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIconContainer: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    marginLeft: 8,
  },
});