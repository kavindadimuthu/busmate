import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSeatView } from '@/hooks/Journey/useSeatView';
import { Passenger } from '@/types/Journey/seat';

export default function SeatViewScreen() {
  const {
    seatData,
    filteredPassengers,
    tripData,
    busLayout,
    stats,
    activeTab,
    searchQuery,
    loading,
    error,
    setActiveTab,
    setSearchQuery,
    setError,
    getSeatStyle,
    handleSeatPress,
  } = useSeatView();

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading seat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setError(null)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Function to render a seat
  const renderSeat = (row: string, col: number) => {
    const seatId = `${row}${col}`;
    const seatStatus = seatData[seatId] || 0;
    const styleName = getSeatStyle(seatStatus);
    
    return (
      <TouchableOpacity
        key={seatId}
        style={[styles.seat, styles[styleName]]}
        onPress={() => handleSeatPress(seatId)}
      >
        <Text style={[
          styles.seatText,
          seatStatus !== 0 && styles.seatTextWhite
        ]}>
          {seatId}
        </Text>
      </TouchableOpacity>
    );
  };

  // Function to render a row of seats
  const renderRow = (row: string) => {
    if (!busLayout) return null;
    
    return (
      <View key={row} style={styles.seatRow}>
        {busLayout.cols.map(col => {
          // Create gap in the middle (aisle)
          if (col === 3) {
            return (
              <React.Fragment key={`gap-${row}-${col}`}>
                <View style={styles.aisle} />
                {renderSeat(row, col)}
              </React.Fragment>
            );
          }
          return renderSeat(row, col);
        })}
      </View>
    );
  };

  // Render passenger item
  const renderPassengerItem = ({ item }: { item: Passenger }) => (
    <TouchableOpacity 
      style={styles.passengerCard}
      onPress={() => router.push({ 
        pathname: '/Journey/passengerCard', 
        params: { id: item.id } 
      })}
    >
      <View style={styles.passengerInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        
        <View style={styles.passengerDetails}>
          <Text style={styles.passengerName}>{item.name}</Text>
          <Text style={styles.passengerMobile}>Mobile: {item.mobile}</Text>
        </View>
      </View>
      
      <View style={styles.passengerActions}>
        <View style={styles.seatBadge}>
          <Text style={styles.seatBadgeText}>{item.seat}</Text>
        </View>
        
        {item.isValidated ? (
          <View style={styles.validatedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </View>
        )}
        
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'seatView' && styles.activeTab]}
          onPress={() => setActiveTab('seatView')}
        >
          <Ionicons name="car-outline" size={18} color={activeTab === 'seatView' ? "#fff" : "#333"} />
          <Text style={[styles.tabText, activeTab === 'seatView' && styles.activeTabText]}>
            Seat View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'passengerList' && styles.activeTab]}
          onPress={() => setActiveTab('passengerList')}
        >
          <MaterialIcons 
            name="format-list-bulleted" 
            size={18} 
            color={activeTab === 'passengerList' ? "#fff" : "#333"} 
          />
          <Text style={[styles.tabText, activeTab === 'passengerList' && styles.activeTabText]}>
            Passenger List ({filteredPassengers.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Seat View Tab */}
      {activeTab === 'seatView' && busLayout && (
        <ScrollView style={styles.container}>
          {/* Driver Seat */}
          <View style={styles.driverContainer}>
            <View style={styles.driverSeat}>
              <Ionicons name="person" size={20} color="#fff" />
              <Text style={styles.driverText}>Driver</Text>
            </View>
          </View>
          
          {/* Seat Layout */}
          <View style={styles.busLayout}>
            {busLayout.rows.map(row => renderRow(row))}
          </View>
          
          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Seat Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.availableSeats}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.bookedValidated}</Text>
                <Text style={styles.statLabel}>Validated</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.bookedNotValidated}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.blockedSeats}</Text>
                <Text style={styles.statLabel}>Blocked</Text>
              </View>
            </View>
          </View>
          
          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Legend</Text>
            
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, styles.seatBookedValidated]} />
                <Text style={styles.legendText}>Booked & Validated</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, styles.seatBookedNotValidated]} />
                <Text style={styles.legendText}>Booked, Not Validated</Text>
              </View>
            </View>
            
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, styles.seatAvailable]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, styles.seatBlocked]} />
                <Text style={styles.legendText}>Blocked/Canceled</Text>
              </View>
            </View>
          </View>
          
          <View style={{height: 40}} />
        </ScrollView>
      )}
      
      {/* Passenger List Tab */}
      {activeTab === 'passengerList' && tripData && (
        <View style={styles.passengerListContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search passengers..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Trip Summary */}
          <View style={styles.tripSummaryCard}>
            <View style={styles.tripSummaryLeft}>
              <View style={styles.busIconContainer}>
                <Ionicons name="bus" size={24} color="#0066FF" />
              </View>
              <View>
                <Text style={styles.tripIdText}>Trip #{tripData.id}</Text>
                <Text style={styles.passengerCountText}>{tripData.totalPassengers} passengers</Text>
              </View>
            </View>
            
            <View style={styles.tripSummaryRight}>
              <Text style={styles.validatedText}>{tripData.validatedPassengers} Validated</Text>
              <Text style={styles.pendingText}>{tripData.pendingPassengers} Pending</Text>
            </View>
          </View>
          
          {/* Passenger List */}
          <FlatList
            data={filteredPassengers}
            renderItem={renderPassengerItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#999" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No passengers match your search' : 'No passengers found'}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// Keep all your existing styles and add these new ones:
const styles = StyleSheet.create({
  // ... (keep all your existing styles)
  
  // Add these new styles:
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  driverContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
    marginRight: 85,
  },
  driverSeat: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  seatTextWhite: {
    color: '#FFFFFF',
  },
  seatBadgeText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // ... (rest of your existing styles)
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
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  
  // Seat View Styles
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  layoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
  },
  helpButton: {
    position: 'absolute',
    right: 0,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  busLayout: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  seatRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  aisle: {
    width: 16,
  },
  seat: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 4,
  },
  seatAvailable: {
    backgroundColor: '#F5F5F5',
  },
  seatBookedValidated: {
    backgroundColor: '#22C55E',
  },
  seatBookedNotValidated: {
    backgroundColor: '#F5C518',
  },
  seatBlocked: {
    backgroundColor: '#FF3B30',
  },
  seatText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#333',
  },
  legendContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColorBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
  
  // Passenger List Styles
  passengerListContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  tripSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripIdText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  passengerCountText: {
    fontSize: 14,
    color: '#666',
  },
  tripSummaryRight: {
    alignItems: 'flex-end',
  },
  validatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 2,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  passengerMobile: {
    fontSize: 14,
    color: '#666',
  },
  passengerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatBadge: {
    backgroundColor: '#0066FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  validatedBadge: {
    marginRight: 12,
  },
  pendingBadge: {
    marginRight: 12,
  },
});