import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TicketIcon = ({ size = 64, color = "#FF3831" }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <Text style={{ fontSize: size * 0.8, color }}>🎫</Text>
  </View>
);

export default function Onboarding3Screen() {
  const router = useRouter();
  const safeAreaStyle = useSafeAreaContainerStyles();

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      // Continue anyway
      router.push('/auth/login');
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#004CFF" barStyle="light-content" />
      <SafeAreaView style={safeAreaStyle}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
          {/* Skip Button */}
          <View style={{ alignItems: 'flex-end', marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ color: '#6B7280', fontSize: 16 }}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Icon */}
            <View style={{
              width: 128,
              height: 128,
              backgroundColor: 'rgba(255, 56, 49, 0.1)',
              borderRadius: 64,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 48
            }}>
              <TicketIcon size={64} color="#FF3831" />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 24
            }}>
              Book Tickets
            </Text>
            
            {/* Description */}
            <Text style={{
              fontSize: 16,
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 24,
              paddingHorizontal: 16
            }}>
              Reserve your seats and manage your tickets digitally with QR codes
            </Text>
          </View>

          {/* Bottom Navigation */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Progress Dots */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{
                width: 12,
                height: 12,
                backgroundColor: '#D1D5DB',
                borderRadius: 6
              }} />
              <View style={{
                width: 12,
                height: 12,
                backgroundColor: '#D1D5DB',
                borderRadius: 6
              }} />
              <View style={{
                width: 12,
                height: 12,
                backgroundColor: '#004CFF',
                borderRadius: 6
              }} />
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              style={{
                backgroundColor: '#004CFF',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600'
              }}>
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}