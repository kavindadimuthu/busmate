import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';

export default function TicketLayout() {
  const router = useRouter();
  
  
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
          backgroundColor: '#0066FF', 
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerLeft: () => <BackButton />,
      }}
    >
      {/* <Stack.Screen 
        name="index" 
        options={{
          title: "Tickets",
        }}
      /> */}
      
      {/* <Stack.Screen 
        name="ticketDetails" 
        options={{
          title: "Ticket Details",
          presentation: 'card',
        }}
      /> */}
      
      <Stack.Screen 
        name="qrScanner" 
        options={{
          title: "Scan Ticket",
          headerShown: true, 
          presentation: 'fullScreenModal',
        }}
      />
      
      <Stack.Screen 
        name="scanHistory" 
        options={{
          title: "Scan History",
          presentation: 'card',
        }}
      />
      
      <Stack.Screen 
        name="ticketPrintingpage" 
        options={{
          headerShown: false, 
          title: "Printing Ticket",
          
        }}
      />
      
      <Stack.Screen 
        name="ticketIssuePage" 
        options={{
          title: "TIcket Details",
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}