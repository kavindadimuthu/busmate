import { Stack } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="inbox" />
      <Stack.Screen name="[id]/detail" />
    </Stack>
  );
}