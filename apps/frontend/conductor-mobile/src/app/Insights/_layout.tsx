import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function InsightsLayout() {
  const router = useRouter();
  
  // Back button component to return to previous screen
  const BackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 8 , marginRight: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
  );
  
  // Home button component to return directly to home screen
  const HomeButton = () => (
    <TouchableOpacity 
      onPress={() => router.push("/(tabs)/home")}
      style={{ marginLeft: 8 ,marginRight: 8 }}
    >
      <Ionicons name="home-outline" size={24} color="white" />
    </TouchableOpacity>
  );
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066FF', // Blue header that matches your app theme
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {/* Main insights screen config */}
      <Stack.Screen 
        name="insights" 
        options={{
          title: "Performance Insights",
          headerLeft: () => <BackButton />, // Use home button if this is a top-level screen
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '600',
          },
        }}
      />
      
      {/* Add configurations for any other screens in the Insights folder */}
      
      
     
      
      
    </Stack>
  );
}