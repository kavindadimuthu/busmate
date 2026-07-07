import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function JourneyLayout() {
  const router = useRouter();
  
  // Custom back button that takes users back to the home page
  const BackToHomeButton = () => (
    <TouchableOpacity 
      onPress={() => router.push("/")}
      style={{ marginLeft: 8, marginRight: 8 }}
    >
      <Ionicons name="home-outline" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
  
  // Regular back button for nested navigation
  const BackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 8, marginRight: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color="#ffffff" />
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
      {/* Schedules is the entry point from home page */}
      <Stack.Screen 
        name="schedules" 
        options={{ 
          title: "My Schedules",
          headerTitleStyle: {
            fontWeight: '600',
          },
          // Use home button as this is entry point from home
          headerLeft: () => <BackButton />,
        }} 
      />
      
      {/* All other Journey screens should have a regular back button */}
      <Stack.Screen 
        name="passengerCard" 
        options={{
          title: "Passenger Details",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
      
      <Stack.Screen 
        name="seatView" 
        options={{
          title: "Seat Map",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
      
      <Stack.Screen 
        name="stopView" 
        options={{
          title: "Trip Stops",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
      
      <Stack.Screen 
        name="journeyReport" 
        options={{
          title: "Journey Report",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
      
      <Stack.Screen 
        name="tripOverview" 
        options={{
          title: "Trip Overview",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
    
      <Stack.Screen 
        name="trip_details" 
        options={{
          title: "Trip Details",
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}