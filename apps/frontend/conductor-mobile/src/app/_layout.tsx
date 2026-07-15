import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { EmployeeScheduleProvider } from '@/contexts/EmployeeScheduleContext';
import { TicketProvider } from '@/contexts/TicketContext';
import { configureApiClients } from '@/lib/api/setup';
import { initSentry } from '@/lib/sentry';
import { Stack } from 'expo-router';

initSentry();
configureApiClients();

function RootLayout() {
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

// Sentry.wrap adds automatic navigation-aware breadcrumbs/tracing and root-level crash
// capture, on top of the manual init() above.
export default Sentry.wrap(RootLayout);
