import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { notificationApi } from '@/services/api/notification';
import { Notification } from '@/types/notification';

/**
 * Test component to verify notification API integration
 * This can be removed after testing
 */
export const NotificationAPITest: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing notification API...');
      
      const response = await notificationApi.getNotificationsList();
      console.log('API Response:', response);
      
      setNotifications(response.notifications);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification API Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testAPI} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Test API'}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <ScrollView style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Results ({notifications.length}):</Text>
        {notifications.map((notif, index) => (
          <View key={notif.notificationId} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>
              {index + 1}. {notif.title}
            </Text>
            <Text style={styles.notificationBody}>{notif.body}</Text>
            <Text style={styles.notificationMeta}>
              Type: {notif.messageType} | Audience: {notif.targetAudience}
            </Text>
            <Text style={styles.notificationDate}>
              {new Date(notif.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0066FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#c00',
  },
  resultContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#999',
  },
});
