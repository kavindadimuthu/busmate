import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { notificationApi } from '@/services/api/notification';
import type { Notification as ApiNotification } from '@/types/notification';

export default function NotificationDetailScreen() {
    const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
    const [notification, setNotification] = useState<ApiNotification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!notificationId) {
                    throw new Error('Missing notification ID');
                }
                const res = await notificationApi.getNotificationDetails(String(notificationId));
                setNotification(res.notification);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load notification details';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [notificationId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#0066FF" />
                <Text style={styles.loadingText}>Loading notification...</Text>
            </SafeAreaView>
        );
    }

    if (error || !notification) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Notification not found'}</Text>
            </SafeAreaView>
        );
    }

    const createdDate = new Date(notification.createdAt);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.title}>{notification.title}</Text>
                {notification.subject ? (
                    <Text style={styles.subject}>{notification.subject}</Text>
                ) : null}

                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Type:</Text>
                    <Text style={styles.metaValue}>{notification.messageType}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Audience:</Text>
                    <Text style={styles.metaValue}>{notification.targetAudience}</Text>
                </View>
                {notification.route ? (
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Route:</Text>
                        <Text style={styles.metaValue}>{notification.route}</Text>
                    </View>
                ) : null}
                {notification.city || notification.province ? (
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Location:</Text>
                        <Text style={styles.metaValue}>
                            {[notification.city, notification.province].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.sectionTitle}>Message</Text>
                <Text style={styles.body}>{notification.body}</Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Sent by: {notification.senderRole}</Text>
                    <Text style={styles.footerText}>{createdDate.toLocaleString()}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
    },
    errorText: {
        color: '#d00',
        fontSize: 16,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    subject: {
        fontSize: 16,
        color: '#555',
        marginTop: 4,
        marginBottom: 12,
    },
    sectionTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
    },
    body: {
        marginTop: 8,
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    metaRow: {
        marginTop: 8,
        flexDirection: 'row',
    },
    metaLabel: {
        width: 90,
        color: '#777',
    },
    metaValue: {
        flex: 1,
        color: '#333',
        fontWeight: '500',
    },
    footer: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        color: '#777',
        fontSize: 12,
    },
});
