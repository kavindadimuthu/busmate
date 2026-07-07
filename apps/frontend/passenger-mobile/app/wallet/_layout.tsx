import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="topup" />
      <Stack.Screen name="request-card" />
      <Stack.Screen name="block-card" />
    </Stack>
  );
}