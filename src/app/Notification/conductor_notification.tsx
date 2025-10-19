import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

type NotificationType = 'shift' | 'qr' | 'system' | 'bus' | 'feature' | 'maintenance';
type FilterCategory = 'all' | 'shift' | 'route' | 'system' | 'general';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  category: FilterCategory;
}

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'shift',
      title: 'Shift Time Changed',
      description: 'Your evening shift now starts at 3:00 PM due to route delay.',
      time: '10 mins ago',
      isRead: false,
      category: 'shift',
    },
    {
      id: '2',
      type: 'qr',
      title: 'QR Payment System Update',
      description: 'New QR payment system deployed. Check tutorial.',
      time: '25 mins ago',
      isRead: false,
      category: 'system',
    },
    {
      id: '3',
      type: 'system',
      title: 'System Maintenance',
      description: 'Maintenance tonight from 10:00 PM to 12:00 AM.',
      time: '1 hour ago',
      isRead: true,
      category: 'system',
    },
    {
      id: '4',
      type: 'bus',
      title: 'Bus Assignment Changed',
      description: 'You have been assigned to bus #B12 for tomorrow.',
      time: '3 hours ago',
      isRead: true,
      category: 'general',
    },
    {
      id: '5',
      type: 'feature',
      title: 'New Feature Added',
      description: 'Real-time seat view now available in your dashboard.',
      time: '1 day ago',
      isRead: true,
      category: 'system',
    },
    {
      id: '6',
      type: 'maintenance',
      title: 'Vehicle Maintenance Alert',
      description: 'Bus KD-4578 scheduled for maintenance at 2:00 PM.',
      time: '2 days ago',
      isRead: true,
      category: 'route',
    },
  ];

  // Filter notifications based on active filter and search query
  const filteredNotifications = notifications.filter((notification) => {
    // First filter by category
    const categoryMatch = activeFilter === 'all' || notification.category === activeFilter;
    
    // Then filter by search query if any
    const searchMatch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    <TouchableOpacity style={styles.notificationItem}>
      {renderNotificationIcon(item.type)}
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadIndicator} />}
        </View>
        
        <Text style={styles.notificationDescription}>{item.description}</Text>
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

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
      />
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
});