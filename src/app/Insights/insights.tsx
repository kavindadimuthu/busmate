import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../../contexts/AuthContext';
import { useInsights } from '../../hooks/ticket/useInsights';

// Note: For charts in the "Daily Passenger Trend" section, you would need to install
// a charting library like react-native-chart-kit

type TimeFilter = 'today' | 'lastWeek' | 'lastMonth' | 'custom';

export default function InsightsScreen() {
  const authContext = useContext(AuthContext);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'from' | 'to'>('from');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Get conductor ID from auth context
  const conductorId = authContext?.user?.id;

  // Use the insights hook to fetch real data
  const { insightsData, loading, error, refetch } = useInsights({
    conductorId: conductorId || '',
    customFromDate: fromDate,
    customToDate: toDate,
    autoFetch: hasInitialLoad, // Only auto-fetch if initial load has been triggered
  });

  // Track if we've attempted initial load
  React.useEffect(() => {
    if (conductorId && !hasInitialLoad) {
      setHasInitialLoad(true);
    }
  }, [conductorId, hasInitialLoad]);

  // Handle manual load
  const handleManualLoad = async () => {
    setHasInitialLoad(true);
    await refetch();
  };

  // Show login required if no conductor ID
  if (!conductorId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="account-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Login Required</Text>
          <Text style={styles.errorMessage}>Please login to view your insights</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show "Click to Load" if no initial load attempted
  if (!hasInitialLoad) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadDataContainer}>
          <MaterialIcons name="analytics" size={64} color="#0066FF" />
          <Text style={styles.loadDataTitle}>Load Your Insights</Text>
          <Text style={styles.loadDataMessage}>
            Tap the button below to load your conductor insights and performance data.
          </Text>
          <TouchableOpacity 
            style={styles.loadDataButton} 
            onPress={handleManualLoad}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loadDataButtonText}>Load Insights</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state during data fetch
  if (loading && hasInitialLoad) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to load insights</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={refetch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.retryButtonText}>Retry</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get current selected period data
  const currentData = insightsData[timeFilter];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (datePickerMode === 'from') {
        setFromDate(selectedDate);
      } else {
        setToDate(selectedDate);
      }
      
      // If custom filter is selected, the hook will automatically recalculate the data
      // due to the useEffect dependency on fromDate and toDate
    }
  };

  const openDatePicker = (mode: 'from' | 'to') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Prepare chart data for payment methods
  const getPaymentChartData = () => {
    const chartData = [];
    const totalRevenue = currentData.moneyCollected.value;
    
    // Always show both payment methods if there's any data
    if (totalRevenue > 0 || currentData.totalPassengers.value > 0) {
      // Cash payments
      chartData.push({
        name: 'Cash',
        population: currentData.paymentBreakdown.cash.amount > 0 ? currentData.paymentBreakdown.cash.amount : 0.1,
        color: currentData.paymentBreakdown.cash.amount > 0 ? '#0066FF' : '#E5E5E5',
        legendFontColor: currentData.paymentBreakdown.cash.amount > 0 ? '#333' : '#999',
        legendFontSize: 14,
      });
      
      // QR/Digital payments
      chartData.push({
        name: 'QR/Digital',
        population: currentData.paymentBreakdown.qr.amount > 0 ? currentData.paymentBreakdown.qr.amount : 0.1,
        color: currentData.paymentBreakdown.qr.amount > 0 ? '#22C55E' : '#E5E5E5',
        legendFontColor: currentData.paymentBreakdown.qr.amount > 0 ? '#333' : '#999',
        legendFontSize: 14,
      });
    } else {
      // No data at all
      chartData.push({
        name: 'No Data',
        population: 1,
        color: '#E5E5E5',
        legendFontColor: '#999',
        legendFontSize: 14,
      });
    }
    
    return chartData;
  };

  const screenWidth = Dimensions.get('window').width;
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      </View> */}
      
      {/* Time Period Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === 'today' && styles.activeFilterButton]} 
            onPress={() => setTimeFilter('today')}
          >
            <Text style={[styles.filterText, timeFilter === 'today' && styles.activeFilterText]}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === 'lastWeek' && styles.activeFilterButton]} 
            onPress={() => setTimeFilter('lastWeek')}
          >
            <Text style={[styles.filterText, timeFilter === 'lastWeek' && styles.activeFilterText]}>Last Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === 'lastMonth' && styles.activeFilterButton]} 
            onPress={() => setTimeFilter('lastMonth')}
          >
            <Text style={[styles.filterText, timeFilter === 'lastMonth' && styles.activeFilterText]}>Last Month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === 'custom' && styles.activeFilterButton]} 
            onPress={() => setTimeFilter('custom')}
          >
            <Text style={[styles.filterText, timeFilter === 'custom' && styles.activeFilterText]}>Custom</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Custom Date Range (shown when custom filter is selected) */}
      {timeFilter === 'custom' && (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeTitle}>Select Date Range</Text>
          <View style={styles.dateRangeButtons}>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from')}>
              <Text style={styles.dateButtonLabel}>From</Text>
              <Text style={styles.dateButtonValue}>{formatDate(fromDate)}</Text>
            </TouchableOpacity>
            
            <Text style={styles.dateRangeSeparator}>to</Text>
            
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to')}>
              <Text style={styles.dateButtonLabel}>To</Text>
              <Text style={styles.dateButtonValue}>{formatDate(toDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={['#0066FF']}
              tintColor="#0066FF"
            />
          }
        >
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {/* Total Passengers */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Passengers</Text>
            <View style={styles.metricValueRow}>
              <Ionicons name="people" size={20} color="#0066FF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>{currentData.totalPassengers.value}</Text>
            </View>
            <Text style={[
              styles.trendText, 
              currentData.totalPassengers.trending === 'up' ? styles.trendUp : 
              currentData.totalPassengers.trending === 'down' ? styles.trendDown : 
              styles.trendSame
            ]}>
              {currentData.totalPassengers.trend}
            </Text>
          </View>
          
          {/* Money Collected */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Money Collected</Text>
            <View style={styles.metricValueRow}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#0066FF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>RS {currentData.moneyCollected.value}</Text>
            </View>
            <Text style={[
              styles.trendText, 
              currentData.moneyCollected.trending === 'up' ? styles.trendUp : 
              currentData.moneyCollected.trending === 'down' ? styles.trendDown : 
              styles.trendSame
            ]}>
              {currentData.moneyCollected.trend}
            </Text>
          </View>
          
          {/* Trips Completed */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Trips Completed</Text>
            <View style={styles.metricValueRow}>
              <MaterialCommunityIcons name="map-marker-path" size={20} color="#0066FF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>{currentData.tripsCompleted.value}</Text>
            </View>
            <Text style={[
              styles.trendText, 
              currentData.tripsCompleted.trending === 'up' ? styles.trendUp : 
              currentData.tripsCompleted.trending === 'down' ? styles.trendDown : 
              styles.trendSame
            ]}>
              {currentData.tripsCompleted.trend}
            </Text>
          </View>
          
          {/* QR Validations */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>QR Validations</Text>
            <View style={styles.metricValueRow}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#0066FF" style={styles.metricIcon} />
              <Text style={styles.metricValue}>{currentData.qrValidations.value}</Text>
            </View>
            <Text style={[
              styles.trendText, 
              currentData.qrValidations.trending === 'up' ? styles.trendUp : 
              currentData.qrValidations.trending === 'down' ? styles.trendDown : 
              styles.trendSame
            ]}>
              {currentData.qrValidations.trend}
            </Text>
          </View>
        </View>
        
        {/* Payment Breakdown */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          <View style={styles.paymentBreakdownContainer}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.dot, {backgroundColor: '#0066FF'}]} />
                <Text style={styles.paymentLabel}>Cash Payments</Text>
              </View>
              <Text style={styles.paymentValue}>RS. {currentData.paymentBreakdown.cash.amount} ({currentData.paymentBreakdown.cash.percentage}%)</Text>
            </View>
            
            <View style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.dot, {backgroundColor: '#22C55E'}]} />
                <Text style={styles.paymentLabel}>QR Payments</Text>
              </View>
              <Text style={styles.paymentValue}>RS. {currentData.paymentBreakdown.qr.amount} ({currentData.paymentBreakdown.qr.percentage}%)</Text>
            </View>
          </View>
        </View> */}
        
       
        
        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods Distribution</Text>
          {currentData.moneyCollected.value > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={getPaymentChartData()}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                absolute={false}
              />
              
              {/* Total Revenue Display Below Chart */}
              <View style={styles.totalRevenueContainer}>
                <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
                <Text style={styles.totalRevenueValue}>RS {currentData.moneyCollected.value}</Text>
                <Text style={styles.totalRevenuePeriod}>
                  {timeFilter === 'today' ? 'Today' : 
                   timeFilter === 'lastWeek' ? 'Last Week' : 
                   timeFilter === 'lastMonth' ? 'Last Month' : 
                   'Custom Period'}
                </Text>
              </View>
              
              {/* Enhanced Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { 
                    backgroundColor: currentData.paymentBreakdown.cash.amount > 0 ? '#0066FF' : '#E5E5E5' 
                  }]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendLabel}>Cash Payments (CONDUCTOR)</Text>
                    <Text style={[
                      styles.legendAmount, 
                      currentData.paymentBreakdown.cash.amount === 0 && styles.legendAmountZero
                    ]}>
                      RS {currentData.paymentBreakdown.cash.amount}
                    </Text>
                    <Text style={[
                      styles.legendPercent,
                      currentData.paymentBreakdown.cash.amount === 0 && styles.legendPercentZero
                    ]}>
                      {currentData.paymentBreakdown.cash.percentage}% of total revenue
                      {currentData.paymentBreakdown.cash.amount === 0 && ' (No cash collected)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { 
                    backgroundColor: currentData.paymentBreakdown.qr.amount > 0 ? '#22C55E' : '#E5E5E5' 
                  }]} />
                  <View style={styles.legendContent}>
                    <Text style={styles.legendLabel}>QR/Digital Payments (ONLINE)</Text>
                    <Text style={[
                      styles.legendAmount, 
                      currentData.paymentBreakdown.qr.amount === 0 && styles.legendAmountZero
                    ]}>
                      RS {currentData.paymentBreakdown.qr.amount}
                    </Text>
                    <Text style={[
                      styles.legendPercent,
                      currentData.paymentBreakdown.qr.amount === 0 && styles.legendPercentZero
                    ]}>
                      {currentData.paymentBreakdown.qr.percentage}% of total revenue
                      {currentData.paymentBreakdown.qr.amount === 0 && ' (Free/Zero-amount tickets)'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="pie-chart-outline" size={48} color="#CCC" />
              <Text style={styles.noDataTitle}>No Data Available</Text>
              <Text style={styles.noDataMessage}>
                No ticket data found for the selected period.
              </Text>
            </View>
          )}
        </View>
        
        {/* Add bottom padding for scrolling */}
        <View style={{height: 20}} />
      </ScrollView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Select {datePickerMode === 'from' ? 'From' : 'To'} Date
              </Text>
              <DateTimePicker
                value={datePickerMode === 'from' ? fromDate : toDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#0066FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 8,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    marginRight: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 12,
  },
  trendUp: {
    color: '#22C55E',
  },
  trendDown: {
    color: '#EF4444',
  },
  trendSame: {
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  activeRouteContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  activeRouteName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeRoutePassengers: {
    fontSize: 14,
    color: '#666',
  },
  paymentBreakdownContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#333',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 180,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dateRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dateRangeSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0066FF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 24,
  },
  chart: {
    height: 250,
    marginBottom: 16,
  },
  totalRevenueContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    width: '100%',
 
  },
  totalRevenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalRevenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 4,
  },
  totalRevenuePeriod: {
    fontSize: 12,
    color: '#999',
  },
  chartLegend: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 2,
  },
  legendContent: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 18,
    color: '#0066FF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  legendPercent: {
    fontSize: 13,
    color: '#666',
  },
  legendAmountZero: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  legendPercentZero: {
    fontSize: 13,
    color: '#999',
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // No data state
  noDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Load data state
  loadDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadDataTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066FF',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadDataMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  loadDataButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    shadowColor: '#0066FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadDataButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});