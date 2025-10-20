import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function NotifyPassengersScreen() {
  const { ongoingTrip } = useOngoingTrip();
  
  // Get trip info from ongoing trip or use fallback
  const getTripInfo = () => {
    if (ongoingTrip) {
      return {
        from: ongoingTrip.fromLocation || ongoingTrip.route?.split(' - ')[0] || "Start Location",
        to: ongoingTrip.toLocation || ongoingTrip.route?.split(' - ')[1] || "End Location",
        time: ongoingTrip.startTime || "N/A",
        busId: ongoingTrip.busPlateNumber || ongoingTrip.busId || "N/A",
        route: ongoingTrip.routeName || ongoingTrip.route || "N/A"
      };
    }
    
    // Fallback when no ongoing trip
    return {
      from: "No Active Trip",
      to: "",
      time: "",
      busId: "N/A",
      route: "N/A"
    };
  };

  const tripInfo = getTripInfo();
  
  // Type for alert items
  type AlertItem = {
    message: string;
    time: string;
    timestamp: Date;
  };
  
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);

  // State for custom message input
  const [customMessage, setCustomMessage] = useState('');
  
  // State for showing all alerts in dropdown
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // Helper function to format time difference
  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Update timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentAlerts(prevAlerts => 
        prevAlerts.map(alert => ({
          ...alert,
          time: getTimeAgo(alert.timestamp)
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Template messages - contextual based on ongoing trip
  const getNotificationTemplates = () => {
    const baseTemplates = [
      {
        id: 'trip-started',
        title: 'Trip Started',
        message: ongoingTrip 
          ? `Trip from ${tripInfo.from} to ${tripInfo.to} has started. Please be at your pickup point.`
          : 'Trip has started. Please be at your pickup point.',
        icon: 'bus',
        iconType: 'ionicons',
        bgColor: '#EEF3FF',
        iconColor: '#0066FF'
      },
      {
        id: 'break-time',
        title: 'Break Time',
        message: 'Bus is taking a break. Nearby rest stop available.',
        icon: 'fast-food-outline',
        iconType: 'ionicons',
        bgColor: '#FFEDE6',
        iconColor: '#FF6A33'
      },
      {
        id: '10-min-away',
        title: '10 Minutes Away',
        message: 'Bus will reach your stop in 10 minutes. Be ready.',
        icon: 'time',
        iconType: 'ionicons',
        bgColor: '#FFFBE6',
        iconColor: '#F5C518'
      },
      {
        id: 'arriving-soon',
        title: 'Arriving Soon',
        message: 'Bus arriving shortly. Please come to the pickup point.',
        icon: 'location',
        iconType: 'ionicons',
        bgColor: '#E6FFF0',
        iconColor: '#00CC66'
      },
      {
        id: 'trip-completed',
        title: 'Trip Completed',
        message: ongoingTrip 
          ? `Trip from ${tripInfo.from} to ${tripInfo.to} completed. Thank you for riding with Busmate LK!`
          : 'Trip completed. Thank you for riding with Busmate LK!',
        icon: 'checkmark',
        iconType: 'ionicons',
        bgColor: '#E6FFF0',
        iconColor: '#00CC66'
      },
      {
        id: 'delayed',
        title: 'Delayed',
        message: 'Bus delayed due to traffic. We appreciate your patience.',
        icon: 'warning',
        iconType: 'ionicons',
        bgColor: '#FFE6E6',
        iconColor: '#FF3B30'
      },
      {
        id: 'route-changed',
        title: 'Route Changed',
        message: 'Route has changed slightly due to roadworks.',
        icon: 'map',
        iconType: 'material',
        bgColor: '#F5E6FF',
        iconColor: '#8E44AD'
      }
    ];

    return baseTemplates;
  };

  const notificationTemplates = getNotificationTemplates();

  type NotificationTemplate = {
    id: string;
    title: string;
    message: string;
    icon: string;
    iconType: string;
    bgColor: string;
    iconColor: string;
  };

  const handleSendNotification = (template: NotificationTemplate) => {
    // Check if there's an ongoing trip
    if (!ongoingTrip) {
      Alert.alert(
        "No Active Trip",
        "You need to have an active trip to send notifications to passengers.",
        [{ text: "OK" }]
      );
      return;
    }

    // In a real app, this would send the notification to passengers
    console.log(`Sending notification: ${template.title} for trip: ${tripInfo.from} to ${tripInfo.to}`);
    
    // Create timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add to recent alerts
    const newAlert: AlertItem = {
      message: template.message,
      time: getTimeAgo(now),
      timestamp: now
    };
    
    setRecentAlerts([newAlert, ...recentAlerts]);
    
    // Show confirmation
    Alert.alert(
      "Notification Sent",
      `Your "${template.title}" message has been sent to all passengers on the ${tripInfo.from} to ${tripInfo.to} trip.`,
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>Notify Pre-Booked Passengers</Text>
        <Text style={styles.headerSubtitle}>
        Send quick updates to passengers who booked online
        </Text>
      </View>
      </View> */}
      
      {/* Trip Info Banner */}
      <View style={[styles.tripBanner, !ongoingTrip && styles.noTripBanner]}>
        {ongoingTrip ? (
          <>
            <Text style={styles.tripText}>
              Trip: {tripInfo.from} to {tripInfo.to}
            </Text>
            <Text style={styles.tripSubText}>
              Bus: {tripInfo.busId} • Departure: {tripInfo.time}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.tripText}>No Active Trip</Text>
            <Text style={styles.tripSubText}>
              Start a trip to send notifications to passengers
            </Text>
          </>
        )}
      </View>
      
      <ScrollView style={styles.container}>
      {/* Notification Templates */}
      {notificationTemplates.map((template) => (
        <View key={template.id} style={styles.messageCard}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: template.bgColor }]}>
          {template.iconType === 'ionicons' ? (
            <Ionicons name={template.icon as any} size={24} color={template.iconColor} />
          ) : template.iconType === 'material' ? (
            <MaterialIcons name={template.icon as any} size={24} color={template.iconColor} />
          ) : (
            <FontAwesome5 name={template.icon} size={20} color={template.iconColor} />
          )}
          </View>
          <View style={styles.messageContent}>
          <Text style={styles.messageTitle}>{template.title}</Text>
          <Text style={styles.messageText}>{template.message}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !ongoingTrip && styles.disabledButton
          ]}
          onPress={() => handleSendNotification(template)}
          disabled={!ongoingTrip}
        >
          <Text style={[
            styles.sendButtonText,
            !ongoingTrip && styles.disabledButtonText
          ]}>
            Send
          </Text>
        </TouchableOpacity>
        </View>
      ))}
      
      {/* Recent Alerts Section */}
      <View style={styles.recentAlertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts Sent</Text>
          {recentAlerts.length > 0 && (
            <Text style={styles.alertCount}>({recentAlerts.length})</Text>
          )}
        </View>
        
        {recentAlerts.length === 0 ? (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.noAlertsText}>No alerts sent yet</Text>
            <Text style={styles.noAlertsSubText}>Send notifications to see them here</Text>
          </View>
        ) : (
          <>
            {/* Show first 3 alerts */}
            {recentAlerts.slice(0, 3).map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            ))}
            
            {/* Show dropdown for more alerts if there are more than 3 */}
            {recentAlerts.length > 3 && (
              <>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllAlerts(!showAllAlerts)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllAlerts ? 'Show Less' : `Show ${recentAlerts.length - 3} More Alerts`}
                  </Text>
                  <Ionicons 
                    name={showAllAlerts ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#0066FF" 
                  />
                </TouchableOpacity>
                
                {/* Dropdown content */}
                {showAllAlerts && (
                  <View style={styles.dropdownContainer}>
                    {recentAlerts.slice(3).map((alert, index) => (
                      <View key={index + 3} style={styles.alertItem}>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        <Text style={styles.alertTime}>{alert.time}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
      
      {/* Add bottom padding for scrolling */}
      <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Custom Message Text Field and Button */}
      {/* <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Send Custom Message</Text>
      <View style={{ backgroundColor: '#F5F7FA', borderRadius: 8, marginBottom: 8 }}>
        <TextInput
        style={{
          minHeight: 60,
          maxHeight: 120,
          padding: 12,
          fontSize: 15,
          backgroundColor: ongoingTrip ? '#F5F7FA' : '#f0f0f0',
          borderRadius: 8,
          textAlignVertical: 'top',
          color: ongoingTrip ? '#000' : '#999',
        }}
        placeholder={ongoingTrip ? "Type your message here..." : "Start a trip to send custom messages"}
        multiline
        value={customMessage}
        onChangeText={setCustomMessage}
        editable={!!ongoingTrip}
        />
      </View>
      <TouchableOpacity
        style={[
        styles.customMessageButton,
        { backgroundColor: (customMessage.trim() && ongoingTrip) ? '#22C55E' : '#A7F3D0' }
        ]}
        disabled={!customMessage.trim() || !ongoingTrip}
        onPress={() => {
        if (customMessage.trim() && ongoingTrip) {
          handleSendNotification({
          id: 'custom',
          title: 'Custom Message',
          message: customMessage,
          icon: 'chatbubble-ellipses-outline',
          iconType: 'ionicons',
          bgColor: '#E6F7FF',
          iconColor: '#22C55E'
          });
          setCustomMessage('');
        }
        }}
      >
        <Text style={styles.customMessageButtonText}>
          {ongoingTrip ? 'Send Custom Message' : 'Start Trip to Send Messages'}
        </Text>
      </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  tripBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0052CC',
  },
  noTripBanner: {
    backgroundColor: '#666666',
  },
  tripText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  tripSubText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
  },
  sendButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  },
  recentAlertsSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noAlertsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  showMoreText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  dropdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  alertItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  customMessageButton: {
    position: 'relative',
    bottom: 16,
    // left: 16,
    // right: 16,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  customMessageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
