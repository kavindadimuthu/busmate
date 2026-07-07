import { AuthProvider } from '@/contexts/AuthContext';
import { EmployeeScheduleProvider } from '@/contexts/EmployeeScheduleContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <EmployeeScheduleProvider>
        <TicketProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="Authentication" />
            <Stack.Screen name="Journey" />
            <Stack.Screen name="Notification" />
            <Stack.Screen name="Insights" />
            <Stack.Screen name="profile" />
          </Stack>
        </TicketProvider>
      </EmployeeScheduleProvider>
    </AuthProvider>
  );
}
