import { Stack } from 'expo-router';

export default function TicketsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/detail" />
      <Stack.Screen name="[id]/qr" />
      <Stack.Screen name="cancel" />
    </Stack>
  );
}