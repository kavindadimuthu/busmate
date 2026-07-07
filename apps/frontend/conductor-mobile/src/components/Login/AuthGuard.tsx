import { useAuth } from '@/hooks/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && (!isAuthenticated )) {
      router.replace('/Authentication/login');
    }
  }, [isAuthenticated, isLoading, user?.role]);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="bus" size={40} color="white" />
          </View>
          <Text style={styles.appName}>Busmate LK</Text>
          <Text style={styles.subtitle}>Conductor App</Text>
        </View>
        <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated ) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="bus" size={40} color="white" />
          </View>
          <Text style={styles.appName}>Busmate LK</Text>
          <Text style={styles.subtitle}>Conductor App</Text>
        </View>
        <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  // Render protected content if authenticated conductor
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});