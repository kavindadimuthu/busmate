import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthGuard from '@/components/Login/AuthGuard';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';

export default function TabLayout() {
  // Set global status bar configuration for tab screens
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#0066FF', true);
  }, []);
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0066FF',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#E0E0E0',
            paddingTop: 5,
            paddingBottom: 5,
          
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journey"
          options={{
            title: 'Journey',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}