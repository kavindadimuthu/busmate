import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { useSeatMap } from '@/hooks/employee/useSeatMap';
import { SeatCell } from '@/types/seatMap';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

function methodLabel(cell: SeatCell): string {
  return String(cell.issueMethod).toUpperCase() === 'ONLINE' ? 'Online booking' : 'Cash (conductor)';
}

export default function SeatViewScreen() {
  const { ongoingTrip } = useOngoingTrip();
  const {
    bus, layout, seatOf, passengers, stats, loading, error,
    refresh, validateTicket, validatingTicketId,
  } = useSeatMap(ongoingTrip?.id, ongoingTrip?.busId);

  const [activeTab, setActiveTab] = useState<'seatView' | 'passengerList'>('seatView');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredPassengers = passengers.filter((p) =>
    (p.passengerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getSeatStyle = (cell: SeatCell) => {
    switch (cell.status) {
      case 'booked': return [styles.seat, styles.seatBooked];
      case 'validated': return [styles.seat, styles.seatValidated];
      case 'blocked': return [styles.seat, styles.seatBlocked];
      default: return [styles.seat, styles.seatAvailable];
    }
  };

  const promptValidate = (cell: SeatCell) => {
    if (!cell.ticketId) return;
    Alert.alert(
      `Validate seat ${cell.seatNumber}?`,
      `Passenger: ${cell.passengerId || 'Unknown'}\nFare: Rs. ${cell.fareAmount ?? 0}\nPayment: ${methodLabel(cell)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Validate',
          onPress: async () => {
            const ok = await validateTicket(cell.ticketId!);
            Alert.alert(ok ? 'Validated' : 'Failed', ok
              ? `Seat ${cell.seatNumber} validated.`
              : 'Could not validate this ticket.');
          },
        },
      ],
    );
  };

  const handleSeatPress = (cell: SeatCell) => {
    if (cell.status === 'available') {
      Alert.alert('Available Seat', `Seat ${cell.seatNumber} is available.`);
    } else if (cell.status === 'blocked') {
      Alert.alert('Blocked Seat', `Seat ${cell.seatNumber} is blocked.`);
    } else if (cell.status === 'validated') {
      Alert.alert(
        `Seat ${cell.seatNumber}`,
        `Passenger: ${cell.passengerId || 'Unknown'}\nStatus: Validated\nFare: Rs. ${cell.fareAmount ?? 0}\nPayment: ${methodLabel(cell)}`,
      );
    } else {
      // booked, not validated -> offer to validate
      promptValidate(cell);
    }
  };

  const renderSeat = (seatNumber: string) => {
    const cell = seatOf(seatNumber);
    return (
      <TouchableOpacity key={seatNumber} style={getSeatStyle(cell)} onPress={() => handleSeatPress(cell)}>
        <Text style={styles.seatText}>{seatNumber}</Text>
      </TouchableOpacity>
    );
  };

  // Loading / error
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading seat map...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Unable to Load Seat Map</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderPassengerItem = ({ item }: { item: SeatCell }) => {
    const online = String(item.issueMethod).toUpperCase() === 'ONLINE';
    return (
      <TouchableOpacity style={styles.passengerCard} onPress={() => handleSeatPress(item)}>
        <View style={styles.passengerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{item.passengerId || 'Passenger'}</Text>
            <View style={styles.methodRow}>
              <View style={[styles.methodBadge, online ? styles.onlineBadge : styles.cashBadge]}>
                <Text style={styles.methodBadgeText}>{online ? 'Online' : 'Cash'}</Text>
              </View>
              <Text style={styles.passengerMobile}>Rs. {item.fareAmount ?? 0}</Text>
            </View>
          </View>
        </View>
        <View style={styles.passengerActions}>
          <View style={styles.seatBadge}><Text style={styles.seatBadgeText}>Seat {item.seatNumber}</Text></View>
          {item.status === 'validated' ? (
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          ) : validatingTicketId === item.ticketId ? (
            <ActivityIndicator size="small" color="#0066FF" />
          ) : (
            <TouchableOpacity style={styles.validateBtn} onPress={() => promptValidate(item)}>
              <Text style={styles.validateBtnText}>Validate</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'seatView' && styles.activeTab]} onPress={() => setActiveTab('seatView')}>
          <Ionicons name="car-outline" size={18} color={activeTab === 'seatView' ? '#fff' : '#333'} />
          <Text style={[styles.tabText, activeTab === 'seatView' && styles.activeTabText]}>Seat View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'passengerList' && styles.activeTab]} onPress={() => setActiveTab('passengerList')}>
          <MaterialIcons name="format-list-bulleted" size={18} color={activeTab === 'passengerList' ? '#fff' : '#333'} />
          <Text style={[styles.tabText, activeTab === 'passengerList' && styles.activeTabText]}>Passengers ({passengers.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'seatView' && (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066FF']} tintColor="#0066FF" />}>
          {/* Bus info */}
          <View style={styles.busInfoBar}>
            <Text style={styles.busInfoText}>
              {bus?.plateNumber || ongoingTrip?.busPlateNumber || 'Bus'} · {layout.layoutName || `${stats.total} seats`}
            </Text>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}><View style={[styles.legendSeat, styles.seatAvailable]} /><Text style={styles.legendText}>Available</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendSeat, styles.seatBooked]} /><Text style={styles.legendText}>Booked</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendSeat, styles.seatValidated]} /><Text style={styles.legendText}>Validated</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendSeat, styles.seatBlocked]} /><Text style={styles.legendText}>Blocked</Text></View>
          </View>

          {/* Driver */}
          <View style={styles.driverContainer}>
            <View style={styles.driverSeat}><Ionicons name="person" size={20} color="#fff" /><Text style={styles.driverText}>Driver</Text></View>
          </View>

          {/* Dynamic seat layout from the real bus */}
          <View style={styles.busLayout}>
            {layout.rows.map((row, idx) => {
              if (row.back && row.back.length) {
                return (
                  <View key={`r${idx}`} style={styles.seatRow}>
                    {row.back.map((s) => renderSeat(s))}
                  </View>
                );
              }
              return (
                <View key={`r${idx}`} style={styles.seatRow}>
                  <View style={styles.seatPair}>{(row.left ?? []).map((s) => renderSeat(s))}</View>
                  <View style={styles.aisle} />
                  <View style={styles.seatPair}>{(row.right ?? []).map((s) => renderSeat(s))}</View>
                </View>
              );
            })}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Seat Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.available}</Text><Text style={styles.statLabel}>Available</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.booked}</Text><Text style={styles.statLabel}>Booked</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#0066FF' }]}>{stats.validated}</Text><Text style={styles.statLabel}>Validated</Text></View>
            </View>
            <View style={[styles.statsGrid, { marginTop: 12 }]}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.online}</Text><Text style={styles.statLabel}>Online</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#0891B2' }]}>{stats.cash}</Text><Text style={styles.statLabel}>Cash</Text></View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'passengerList' && (
        <View style={styles.passengerListContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput style={styles.searchInput} placeholder="Search passenger or seat..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#999" />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color="#999" /></TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={filteredPassengers}
            renderItem={renderPassengerItem}
            keyExtractor={(item) => item.ticketId || item.seatNumber}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066FF']} tintColor="#0066FF" />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color="#CCCCCC" />
                <Text style={styles.emptyText}>{searchQuery ? 'No passengers found' : 'No passengers booked yet'}</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0066FF' },
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: '#F5F5F7' },
  errorTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  retryButton: { backgroundColor: '#0066FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  activeTab: { backgroundColor: '#0066FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 6 },
  activeTabText: { color: '#FFFFFF' },
  busInfoBar: { marginHorizontal: 16, marginTop: 16 },
  busInfoText: { fontSize: 14, fontWeight: '600', color: '#333' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, paddingVertical: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  legendItem: { alignItems: 'center' },
  legendSeat: { width: 20, height: 20, borderRadius: 4, marginBottom: 4, borderWidth: 1 },
  legendText: { fontSize: 12, color: '#666' },
  driverContainer: { alignItems: 'flex-start', marginVertical: 16, marginLeft: 24 },
  driverSeat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  driverText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  busLayout: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  seatRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  seatPair: { flexDirection: 'row' },
  aisle: { width: 24, height: 40 },
  seat: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 3, borderWidth: 1 },
  seatAvailable: { backgroundColor: '#E8F5E8', borderColor: '#22C55E' },
  seatBooked: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  seatValidated: { backgroundColor: '#DBEAFE', borderColor: '#0066FF' },
  seatBlocked: { backgroundColor: '#FECACA', borderColor: '#EF4444' },
  seatText: { fontSize: 12, fontWeight: '600', color: '#333' },
  statsContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, marginBottom: 24, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  passengerListContainer: { flex: 1, backgroundColor: '#F5F5F7' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12 },
  passengerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  passengerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  passengerDetails: { flex: 1 },
  passengerName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  methodRow: { flexDirection: 'row', alignItems: 'center' },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  onlineBadge: { backgroundColor: '#EDE9FE' },
  cashBadge: { backgroundColor: '#CFFAFE' },
  methodBadgeText: { fontSize: 11, fontWeight: '600', color: '#333' },
  passengerMobile: { fontSize: 14, color: '#666' },
  passengerActions: { flexDirection: 'row', alignItems: 'center' },
  seatBadge: { backgroundColor: '#F0F6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  seatBadgeText: { fontSize: 12, fontWeight: '600', color: '#0066FF' },
  validateBtn: { backgroundColor: '#0066FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  validateBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, textAlign: 'center' },
});
