import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Share,
  Alert,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  Bell, 
  Clock, 
  Bus, 
  AlertTriangle, 
  Tag, 
  Shield,
  Share2,
  Star,
  Trash2
} from 'lucide-react-native';
import AppHeader from '../../../components/ui/AppHeader';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [notification, setNotification] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  
  // Mock notifications data - in a real app, this would come from API/database
  const notificationsData = {
    '1': {
      id: '1',
      title: 'Low Wallet Balance',
      message: 'Your wallet balance is below LKR 500. Please top up your wallet to continue using our services without interruption. You can top up using our app with credit card, debit card or online banking.',
      timestamp: 'Today, 10:30 AM',
      type: 'alert',
      isImportant: true,
      actionText: 'Top Up Now',
      actionRoute: '/wallet/topup',
      detailedMessage: 'Your current balance is LKR 350. To ensure uninterrupted service, we recommend maintaining a minimum balance of LKR 500 in your wallet. You can add funds to your wallet using any of our supported payment methods including credit/debit cards and online banking.',
    },
    '2': {
      id: '2',
      title: 'Upcoming Trip Reminder',
      message: 'Your trip from Colombo to Kandy is scheduled for tomorrow at 9:00 AM.',
      timestamp: 'Yesterday, 15:45 PM',
      type: 'reminder',
      isImportant: true,
      actionText: 'View Ticket',
      actionRoute: '/tickets/BKG123456/detail',
      detailedMessage: 'Your upcoming trip details:\n\nDeparture: Colombo Central Bus Station\nDestination: Kandy Bus Terminal\nDate: June 23, 2025\nTime: 9:00 AM\nBus: AC Express\nSeat: 23B\nBooking Reference: BKG123456\n\nPlease arrive at least 15 minutes before departure. Your e-ticket is available in the Tickets section.',
      additionalInfo: 'Weather forecast for Kandy tomorrow: Partly cloudy, 28°C',
    },
    '3': {
      id: '3',
      title: 'Weekend Special Offer',
      message: 'Enjoy 20% off on all bookings this weekend. Use code WEEKEND20.',
      timestamp: 'Jun 20, 2025',
      type: 'promotion',
      isImportant: false,
      actionText: 'Book Now',
      actionRoute: '/search',
      detailedMessage: 'Limited time offer: Get 20% off on all bus bookings made during this weekend (June 22-23, 2025).\n\nHow to avail:\n1. Search for your preferred route\n2. Select your seats\n3. Apply promo code WEEKEND20 at checkout\n4. Enjoy your discounted journey!\n\nTerms & Conditions:\n- Valid for bookings made between June 22-23, 2025\n- Valid for travel dates between June 22-30, 2025\n- Cannot be combined with other offers\n- Maximum discount: LKR 500',
      imageUrl: 'https://example.com/promo/weekend20.png',
    },
    '4': {
      id: '4',
      title: 'Travel Card Activated',
      message: 'Your travel card has been successfully activated. You can now use it for all your journeys.',
      timestamp: 'Jun 19, 2025',
      type: 'info',
      isImportant: false,
      actionText: 'View Card',
      actionRoute: '/wallet',
      detailedMessage: 'Your travel card has been successfully activated and is now ready to use. You can use your travel card for contactless payments on all participating buses and transport services.\n\nCard Number: **** **** **** 5678\nExpiry: 06/2028\n\nYour card is linked to your wallet balance. Remember to maintain sufficient funds in your wallet for smooth journeys.',
    },
    '5': {
      id: '5',
      title: 'Route Schedule Change',
      message: 'The schedule for Route 138 has been updated. Please check the new timings.',
      timestamp: 'Jun 18, 2025',
      type: 'alert',
      isImportant: true,
      detailedMessage: 'Due to ongoing road construction on Galle Road, the schedule for Route 138 (Colombo-Galle Express) has been updated.\n\nNew departure times from Colombo:\n- 6:30 AM (previously 6:00 AM)\n- 9:30 AM (previously 9:00 AM)\n- 12:30 PM (unchanged)\n- 3:30 PM (previously 3:00 PM)\n- 6:30 PM (unchanged)\n\nNew departure times from Galle:\n- 8:30 AM (previously 8:00 AM)\n- 11:30 AM (previously 11:00 AM)\n- 2:30 PM (unchanged)\n- 5:30 PM (previously 5:00 PM)\n- 8:30 PM (unchanged)\n\nThese changes are effective from June 19, 2025 until further notice.',
    }
  };

  useEffect(() => {
    // In a real app, we would fetch the notification from an API
    if (id && notificationsData[id]) {
      setNotification(notificationsData[id]);
      setIsStarred(notificationsData[id].isImportant);
    }
  }, [id]);

  // Handle sharing notification
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${notification.title}\n\n${notification.detailedMessage || notification.message}`,
        title: 'Share Notification'
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while sharing');
    }
  };

  // Handle starring/unstarring notification
  const handleStar = () => {
    setIsStarred(!isStarred);
    Alert.alert(
      isStarred ? "Removed from important" : "Marked as important",
      isStarred ? "Notification removed from important" : "Notification marked as important"
    );
  };

  // Handle notification deletion
  const handleDelete = () => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            router.back();
          }
        }
      ]
    );
  };

  // Handle action button press
  const handleAction = () => {
    if (notification?.actionRoute) {
      router.push(notification.actionRoute);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={24} color="#FF3831" />;
      case 'reminder': return <Clock size={24} color="#F59E0B" />;
      case 'promotion': return <Tag size={24} color="#8B5CF6" />;
      case 'booking': return <Bus size={24} color="#004CFF" />;
      case 'security': return <Shield size={24} color="#FF3831" />;
      default: return <Bell size={24} color="#6B7280" />;
    }
  };

  // Get background color for the notification type badge
  const getTypeBgColor = (type) => {
    switch (type) {
      case 'alert': return '#FEE2E2';
      case 'reminder': return '#FEF3C7';
      case 'promotion': return '#F3E8FF';
      case 'booking': return '#EBF2FF';
      case 'security': return '#FEE2E2';
      default: return '#F3F4F9';
    }
  };

  // Get text color for the notification type badge
  const getTypeTextColor = (type) => {
    switch (type) {
      case 'alert': return '#B91C1C';
      case 'reminder': return '#B45309';
      case 'promotion': return '#6D28D9';
      case 'booking': return '#1E40AF';
      case 'security': return '#B91C1C';
      default: return '#6B7280';
    }
  };

  // Format notification type for display
  const formatType = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1);
  };

  // Custom right element for header
  const headerRightElement = notification && (
    <TouchableOpacity
      onPress={handleShare}
      style={styles.actionButton}
    >
      <Share2 size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  // If no notification found, show error state
  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Notification" statusBarStyle="light-content" />
        
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Notification not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Remove StatusBar component as it's now handled by AppHeader */}
      
      {/* Using the AppHeader component */}
      <AppHeader 
        title="Notification"
        rightElement={headerRightElement}
        statusBarStyle="light-content"
      />

      <ScrollView style={styles.content}>
        {/* Notification Header */}
        <View style={styles.notificationHeader}>
          <View style={[
            styles.typeIndicator,
            { backgroundColor: getTypeBgColor(notification.type) }
          ]}>
            {getNotificationIcon(notification.type)}
            <Text style={[
              styles.typeText,
              { color: getTypeTextColor(notification.type) }
            ]}>
              {formatType(notification.type)}
            </Text>
          </View>

          <Text style={styles.timestamp}>{notification.timestamp}</Text>
          
          <Text style={styles.title}>{notification.title}</Text>
        </View>

        {/* Notification Body */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {notification.detailedMessage || notification.message}
          </Text>

          {notification.additionalInfo && (
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoText}>{notification.additionalInfo}</Text>
            </View>
          )}

          {notification.imageUrl && (
            <Image 
              source={{ uri: notification.imageUrl }} 
              style={styles.promoImage}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Action Button */}
        {notification.actionText && (
          <TouchableOpacity 
            style={styles.actionButtonContainer}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>{notification.actionText}</Text>
          </TouchableOpacity>
        )}

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handleStar}
          >
            <Star 
              size={20} 
              color={isStarred ? "#F59E0B" : "#9CA3AF"} 
              fill={isStarred ? "#F59E0B" : "transparent"} 
            />
            <Text style={styles.footerButtonText}>
              {isStarred ? "Important" : "Mark as important"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerButton}
            onPress={handleDelete}
          >
            <Trash2 size={20} color="#FF3831" />
            <Text style={[styles.footerButtonText, { color: "#FF3831" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  notificationHeader: {
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
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  messageContainer: {
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
  message: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  additionalInfo: {
    backgroundColor: '#F3F4F9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  promoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonContainer: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  }
});