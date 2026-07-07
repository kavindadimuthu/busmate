import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Bell,
  MessageSquare,
  Clock,
  Tag,
  Check,
  Shield
} from 'lucide-react-native';
import AppHeader from '@/components/ui/AppHeader';

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: true,
    categories: {
      bookings: true,
      scheduleChanges: true,
      promotions: false,
      paymentAlerts: true,
      accountSecurity: true
    }
  });

  const togglePushNotifications = () => {
    setPreferences(prev => ({
      ...prev,
      pushEnabled: !prev.pushEnabled
    }));
  };

  const toggleEmailNotifications = () => {
    setPreferences(prev => ({
      ...prev,
      emailEnabled: !prev.emailEnabled
    }));
  };

  const toggleSmsNotifications = () => {
    setPreferences(prev => ({
      ...prev,
      smsEnabled: !prev.smsEnabled
    }));
  };

  const toggleCategory = (category) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  const savePreferences = () => {
    // Simulate API call
    Alert.alert(
      "Settings Saved", 
      "Your notification preferences have been updated.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Notification Preferences" />

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Bell size={24} color="#004CFF" />
          </View>
          <Text style={styles.infoTitle}>Stay Informed</Text>
          <Text style={styles.infoText}>
            Customize how and when you want to receive notifications about your bookings, promotions, and account.
          </Text>
        </View>

        {/* Notification Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Methods</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={togglePushNotifications}
          >
            <View style={styles.optionInfo}>
              <Bell size={20} color="#004CFF" />
              <Text style={styles.optionText}>Push Notifications</Text>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.pushEnabled && styles.toggleButtonActive
            ]}>
              {preferences.pushEnabled && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={toggleEmailNotifications}
          >
            <View style={styles.optionInfo}>
              <MessageSquare size={20} color="#004CFF" />
              <Text style={styles.optionText}>Email Notifications</Text>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.emailEnabled && styles.toggleButtonActive
            ]}>
              {preferences.emailEnabled && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.optionItemLast]}
            onPress={toggleSmsNotifications}
          >
            <View style={styles.optionInfo}>
              <MessageSquare size={20} color="#004CFF" />
              <Text style={styles.optionText}>SMS Notifications</Text>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.smsEnabled && styles.toggleButtonActive
            ]}>
              {preferences.smsEnabled && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notification Categories */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Categories</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleCategory('bookings')}
          >
            <View style={styles.optionInfo}>
              <Clock size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Bookings & Trips</Text>
                <Text style={styles.optionSubtext}>Reminders, updates, and confirmations</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.categories.bookings && styles.toggleButtonActive
            ]}>
              {preferences.categories.bookings && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleCategory('scheduleChanges')}
          >
            <View style={styles.optionInfo}>
              <Clock size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Schedule Changes</Text>
                <Text style={styles.optionSubtext}>Bus delays and route changes</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.categories.scheduleChanges && styles.toggleButtonActive
            ]}>
              {preferences.categories.scheduleChanges && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleCategory('promotions')}
          >
            <View style={styles.optionInfo}>
              <Tag size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Promotions & Offers</Text>
                <Text style={styles.optionSubtext}>Discounts and special deals</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.categories.promotions && styles.toggleButtonActive
            ]}>
              {preferences.categories.promotions && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleCategory('paymentAlerts')}
          >
            <View style={styles.optionInfo}>
              <Bell size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Payment Alerts</Text>
                <Text style={styles.optionSubtext}>Transaction confirmations and wallet updates</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.categories.paymentAlerts && styles.toggleButtonActive
            ]}>
              {preferences.categories.paymentAlerts && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.optionItemLast]}
            onPress={() => toggleCategory('accountSecurity')}
          >
            <View style={styles.optionInfo}>
              <Shield size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Account Security</Text>
                <Text style={styles.optionSubtext}>Login alerts and password changes</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              preferences.categories.accountSecurity && styles.toggleButtonActive
            ]}>
              {preferences.categories.accountSecurity && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            You can change your notification preferences at any time. Some critical notifications about your account and bookings cannot be disabled.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={savePreferences}
          style={styles.saveButton}
        >
          <Check size={20} color="white" />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#EBF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  noteContainer: {
    paddingHorizontal: 16,
    marginBottom: 120,
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});