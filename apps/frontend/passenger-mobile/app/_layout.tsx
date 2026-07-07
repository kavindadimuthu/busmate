import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { StatusBar, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';
import { initializeApiClients } from '@/lib/api-client/apiConfig';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  useFrameworkReady();

  // Set status bar properties natively
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#004CFF');
      StatusBar.setTranslucent(false);
    }
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize API clients with proper base URLs
        initializeApiClients();
        
        // Wait for fonts to load
        if (fontsLoaded || fontError) {
          // Add any additional preparation here
          await new Promise((resolve) => setTimeout(resolve, 100));
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookingProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding/splash" />
            <Stack.Screen name="onboarding/language" />
            <Stack.Screen name="onboarding/onboarding1" />
            <Stack.Screen name="onboarding/onboarding2" />
            <Stack.Screen name="onboarding/onboarding3" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="tickets" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="tracking" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          {Platform.OS === 'ios' && <ExpoStatusBar style="light" />}
        </BookingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}