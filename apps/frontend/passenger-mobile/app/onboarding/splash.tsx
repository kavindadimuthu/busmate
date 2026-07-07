import React, { useEffect, useState } from 'react';
import { View, Text, Image, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation completes
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/onboarding/language');
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, router]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#004CFF', '#004CFF']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width,
          height,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
        >
          <View style={{
            width: 120,
            height: 120,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
            elevation: 8,
          }}>
            <Image
              source={require('@/assets/images/busmate_lk_icon.png')}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </View>
          
          <Text style={{
            color: 'white',
            fontSize: 32,
            fontWeight: 'bold',
            fontFamily: 'Inter-Bold',
            marginBottom: 8,
          }}>
            BusMate
          </Text>
          
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 18,
            fontFamily: 'Inter-Medium',
          }}>
            Sri Lanka
          </Text>
        </Animated.View>
        
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 64,
            opacity: fadeAnim,
          }}
        >
          <Text style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 14,
            fontFamily: 'Inter-Regular',
            textAlign: 'center',
          }}>
            Your Smart Journey Starts Here
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}