import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function NotificationLayout() {
  const router = useRouter();
  
  // Custom back button for returning to the previous screen
  const BackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 8, marginRight: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
  );
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066FF', // Blue header to match your app's design
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="conductor_notification" 
        options={{
          title: "Conductor Notifications",
          headerLeft: () => <BackButton />,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="notify_passengers" 
        options={{
          title: "Notify Pre-Booked Passengers",
          headerLeft: () => <BackButton />,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  );
}