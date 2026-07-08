import { AuthProvider } from '@/contexts/AuthContext';
import { EmployeeScheduleProvider } from '@/contexts/EmployeeScheduleContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { initializeApiClients } from '@/lib/api-client/apiConfig';
import { Stack } from 'expo-router';

initializeApiClients();

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
