import EmployeeScheduleCard from '@/components/Journey/EmployeeScheduleCard';
import { useEmployeeScheduleContext } from '@/contexts/EmployeeScheduleContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView
} from 'react-native';

type TimeFilter = 'today' | 'upcoming' | 'past';



export default function SchedulesScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { 
    schedules,
    filteredSchedules, 
    loading, 
    error, 
    activeTab, 
    setActiveTab,
    retry,
    refreshSchedules
  } = useEmployeeScheduleContext();

  // State for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Set initial tab from route params
  useEffect(() => {
    if (tab && (tab === 'today' || tab === 'upcoming' || tab === 'past')) {
      setActiveTab(tab as TimeFilter);
    }
  }, [tab, setActiveTab]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSchedules();
    } catch (error) {
      console.error('Failed to refresh schedules:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSchedules]);

  // Handle tab press
  const handleTabPress = (tab: TimeFilter) => {
    setActiveTab(tab);
  };

  // Render based on loading/error states
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => retry()} // This will trigger the useEffect to fetch again
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" translucent={false} />
      
     
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]} 
          onPress={() => handleTabPress('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => handleTabPress('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => handleTabPress('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>
      
      {/* Schedule List */}
      {filteredSchedules.length > 0 ? (
        <FlatList
          data={filteredSchedules}
          renderItem={({item}) => <EmployeeScheduleCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066FF']} // Android
              tintColor="#0066FF" // iOS
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>No schedules found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: 16,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 12,
  }
});