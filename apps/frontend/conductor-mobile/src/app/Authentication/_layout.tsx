import { Stack } from 'expo-router';

export default function AuthenticationLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false, // This hides the header for all screens in this group
      header: () => null, // Extra certainty that header won't show
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      {/* <Stack.Screen name="forgot-password" options={{ headerShown: false }} /> */}
      
    </Stack>
  );
}