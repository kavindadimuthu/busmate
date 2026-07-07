import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  Clock, 
  Bus, 
  AlertTriangle, 
  Tag, 
  Shield, 
  Trash2, 
  Check
} from 'lucide-react-native';
import AppHeader from '../../components/ui/AppHeader';

export default function NotificationsInboxScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filter options
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'important', label: 'Important' },
    { id: 'alerts', label: 'Alerts' },
  ];

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Low Wallet Balance',
      message: 'Your wallet balance is below LKR 500. Top up your wallet to continue using our services.',
      timestamp: 'Today, 10:30 AM',
      type: 'alert',
      isRead: false,
      isImportant: true,
    },
    {
      id: '2',
      title: 'Upcoming Trip Reminder',
      message: 'Your trip from Colombo to Kandy is scheduled for tomorrow at 9:00 AM.',
      timestamp: 'Yesterday, 15:45 PM',
      type: 'reminder',
      isRead: true,
      isImportant: true,
    },
    {
      id: '3',
      title: 'Weekend Special Offer',
      message: 'Enjoy 20% off on all bookings this weekend. Use code WEEKEND20.',
      timestamp: 'Jun 20, 2025',
      type: 'promotion',
      isRead: false,
      isImportant: false,
    },
    {
      id: '4',
      title: 'Travel Card Activated',
      message: 'Your travel card has been successfully activated. You can now use it for all your journeys.',
      timestamp: 'Jun 19, 2025',
      type: 'info',
      isRead: true,
      isImportant: false,
    },
    {
      id: '5',
      title: 'Route Schedule Change',
      message: 'The schedule for Route 138 has been updated. Please check the new timings.',
      timestamp: 'Jun 18, 2025',
      type: 'alert',
      isRead: false,
      isImportant: true,
    },
    {
      id: '6',
      title: 'Password Changed',
      message: 'Your account password was recently changed. If you did not make this change, please contact support.',
      timestamp: 'Jun 16, 2025',
      type: 'security',
      isRead: true,
      isImportant: true,
    },
    {
      id: '7',
      title: 'Booking Confirmed',
      message: 'Your booking from Galle to Matara has been confirmed. Ticket #BKG7890.',
      timestamp: 'Jun 15, 2025',
      type: 'booking',
      isRead: true,
      isImportant: false,
    }
  ]);

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const grouped = {};
    
    notifications
      .filter(notification => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'unread') return !notification.isRead;
        if (selectedFilter === 'important') return notification.isImportant;
        if (selectedFilter === 'alerts') return notification.type === 'alert' || notification.type === 'security';
        return true;
      })
      .forEach(notification => {
        const date = notification.timestamp.includes(', ')
          ? notification.timestamp.split(', ')[0]
          : notification.timestamp;
        
        if (!grouped[date]) {
          grouped[date] = [];
        }
        
        grouped[date].push(notification);
      });
    
    return grouped;
  };

  const groupedNotifications = groupNotificationsByDate();

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    setNotifications(updatedNotifications);
    Alert.alert("Success", "All notifications marked as read");
  };

  // Delete all read notifications
  const deleteAllRead = () => {
    Alert.alert(
      "Delete Read Notifications",
      "Are you sure you want to delete all read notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            const updatedNotifications = notifications.filter(notification => !notification.isRead);
            setNotifications(updatedNotifications);
          }
        }
      ]
    );
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={20} color="#FF3831" />;
      case 'reminder': return <Clock size={20} color="#F59E0B" />;
      case 'promotion': return <Tag size={20} color="#8B5CF6" />;
      case 'booking': return <Bus size={20} color="#004CFF" />;
      case 'security': return <Shield size={20} color="#FF3831" />;
      default: return <Bell size={20} color="#6B7280" />;
    }
  };

  // Get notification background color
  const getNotificationBgColor = (type, isRead) => {
    if (!isRead) return '#F9FAFB';
    return 'white';
  };

  // Handle notification press
  const handleNotificationPress = (id) => {
    // Mark as read
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    
    setNotifications(updatedNotifications);
    
    // Navigate to detail view
    router.push(`/notifications/${id}/detail`);
  };

  // Custom right element for the header
  const headerRightElement = (
    <TouchableOpacity
      onPress={markAllAsRead}
      style={styles.actionButton}
    >
      <Check size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Remove StatusBar component as it's now handled by AppHeader */}
      
      {/* Using the AppHeader component */}
      <AppHeader 
        title="Notifications"
        rightElement={headerRightElement}
        statusBarStyle="light-content"
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text 
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.id && styles.filterTabTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.content}>
        {Object.keys(groupedNotifications).length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={60} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? "You have no notifications yet"
                : `No ${selectedFilter} notifications found`
              }
            </Text>
          </View>
        ) : (
          Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              
              {dateNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification.id)}
                  style={[
                    styles.notificationCard,
                    { backgroundColor: getNotificationBgColor(notification.type, notification.isRead) }
                  ]}
                >
                  <View style={[
                    styles.notificationIconContainer,
                    notification.isImportant && styles.importantIndicator
                  ]}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <Text 
                      numberOfLines={2} 
                      style={styles.notificationMessage}
                    >
                      {notification.message}
                    </Text>
                    <Text style={styles.timeText}>
                      {notification.timestamp.includes(', ') 
                        ? notification.timestamp.split(', ')[1] 
                        : notification.timestamp}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {/* Delete read notifications button */}
        {notifications.some(notification => notification.isRead) && (
          <TouchableOpacity 
            onPress={deleteAllRead}
            style={styles.deleteAllContainer}
          >
            <Trash2 size={16} color="#6B7280" />
            <Text style={styles.deleteAllText}>Delete read notifications</Text>
          </TouchableOpacity>
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
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
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
  notificationCard: {
    flexDirection: 'row',
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
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  importantIndicator: {
    borderWidth: 2,
    borderColor: '#FF3831',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  deleteAllText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  }
});