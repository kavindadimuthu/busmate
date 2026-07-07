import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="favorites" />
      {/* Payment routes */}
      <Stack.Screen name="(payment)" options={{ headerShown: false }} />
      <Stack.Screen name="notification-preferences" />
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="logout" />
    </Stack>
  );
}