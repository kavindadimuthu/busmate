import { notificationApi } from '@/services/api/notification';
import { Notification as ApiNotification } from '@/types/notification';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationType = 'shift' | 'qr' | 'system' | 'bus' | 'feature' | 'maintenance' | 'warning' | 'info';
type FilterCategory = 'all' | 'shift' | 'route' | 'system' | 'general';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  category: FilterCategory;
  messageType?: 'info' | 'warning' | 'error' | 'success';
}

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }

      const response = await notificationApi.getNotificationsList();

      // Filter to only notifications for conductors or for all
      const allowed = (aud?: string) => {
        const a = (aud || '').toLowerCase();
        return a.includes('conductor') || a === 'all' || a.includes('all') || a.includes('everyone') || a.includes('public') || a.includes('global');
      };

      const filteredForConductor = response.notifications.filter((n) => {
        // Filter by audience and ensure notification has required fields
        return allowed(n.targetAudience) && n.notificationId && (n.title || n.body);
      });

      // Transform API notifications to local format
      const transformedNotifications: Notification[] = filteredForConductor.map((apiNotif: ApiNotification) => {
        // Calculate relative time
        const createdDate = new Date(apiNotif.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = '';
        if (diffMins < 1) {
          timeAgo = 'Just now';
        } else if (diffMins < 60) {
          timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        // Map message type to notification type and category
        let type: NotificationType = 'system';
        let category: FilterCategory = 'general';

        switch (apiNotif.messageType) {
          case 'warning':
            type = 'warning';
            category = 'system';
            break;
          case 'info':
            type = 'info';
            category = 'general';
            break;
          case 'error':
            type = 'system';
            category = 'system';
            break;
          case 'success':
            type = 'feature';
            category = 'general';
            break;
        }

        // Try to determine category from target audience
        if (apiNotif.targetAudience?.toLowerCase().includes('conductor')) {
          category = 'shift';
        } else if (apiNotif.targetAudience?.toLowerCase().includes('route') ||
          apiNotif.targetAudience?.toLowerCase().includes('fleet')) {
          category = 'route';
        }

        return {
          id: apiNotif.notificationId,
          type,
          title: apiNotif.title || 'No Title',
          description: apiNotif.body || 'No Description',
          time: timeAgo,
          isRead: false, // Default to unread
          category,
          messageType: apiNotif.messageType,
        };
      });

      setNotifications(transformedNotifications);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      console.log('Error details:', {
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      });
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
      // Keep existing notifications on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle pull to refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(true);
  };

  // Filter notifications based on active filter and search query
  const filteredNotifications = notifications.filter((notification) => {
    // First filter by category
    const categoryMatch = activeFilter === 'all' || notification.category === activeFilter;

    // Then filter by search query if any
    const searchMatch = !searchQuery ||
      (notification.title && notification.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (notification.description && notification.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return categoryMatch && searchMatch;
  });

  // Function to handle mark all as read
  const handleMarkAllRead = () => {
    console.log('Mark all notifications as read');
    // In a real app, we would update the state here
  };

  // Function to render notification icon based on type
  const renderNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'shift':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#EEF3FF' }]}>
            <Ionicons name="time" size={20} color="#0066FF" />
          </View>
        );
      case 'qr':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#E6FEF0' }]}>
            <MaterialIcons name="campaign" size={20} color="#22C55E" />
          </View>
        );
      case 'system':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
          </View>
        );
      case 'bus':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#EEF3FF' }]}>
            <Ionicons name="bus" size={20} color="#0066FF" />
          </View>
        );
      case 'feature':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#E6FEF0' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          </View>
        );
      case 'maintenance':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FFF8E6' }]}>
            <MaterialCommunityIcons name="tools" size={20} color="#F5A623" />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FFF8E6' }]}>
            <Ionicons name="warning" size={20} color="#F5A623" />
          </View>
        );
      case 'info':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#EEF3FF' }]}>
            <Ionicons name="information-circle" size={20} color="#0066FF" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#EEF3FF' }]}>
            <Ionicons name="notifications" size={20} color="#0066FF" />
          </View>
        );
    }
  };

  // Render item for FlatList
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => router.push({ pathname: '/Notification/notificationDetail', params: { notificationId: item.id } })}
    >
      {renderNotificationIcon(item.type)}

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadIndicator} />}
        </View>

        <Text style={styles.notificationDescription} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  // Filter categories
  const filterCategories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'shift', label: 'Shift' },
    { id: 'route', label: 'Route' },
    { id: 'system', label: 'System' },
    { id: 'general', label: 'General' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadButton} onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark All Read</Text>
        </TouchableOpacity>
      </View> */}

      {/* Subtitle */}
      {/* <View style={styles.subtitleContainer}> */}
      {/* <Text style={styles.subtitle}>Important updates for conductors</Text> */}
      {/* </View> */}

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {filterCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterButton,
              activeFilter === category.id && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter(category.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === category.id && styles.activeFilterText
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        /* Notifications List */
        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
              </Text>
            </View>
          }
        />
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
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markReadButton: {
    padding: 4,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  subtitleContainer: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterScrollView: {
    flexGrow: 0,
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
    marginLeft: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});