import { Stack } from 'expo-router';

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="results" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="seat-selection" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="success" />
    </Stack>
  );
}