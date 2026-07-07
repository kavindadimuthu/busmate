import { Stack } from 'expo-router';

export default function TrackingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="input" />
      <Stack.Screen name="map" />
    </Stack>
  );
}