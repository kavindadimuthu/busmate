import { useTicket } from '@/contexts/TicketContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  View,
  SafeAreaView
} from 'react-native';

export default function TicketPrintingScreen() {
  const [progress, setProgress] = useState(0);
  const [isPrintingComplete, setIsPrintingComplete] = useState(false);
  const progressAnimation = new Animated.Value(0);
  const { ticketData } = useTicket();
  
  // Simulate printing progress
  useEffect(() => {
    // Start progress animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
    
    // Update progress state for additional logic if needed
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 0.02;
        if (newProgress >= 1) {
          clearInterval(interval);
          setIsPrintingComplete(true);
          // Navigate to confirmation screen after completion
          setTimeout(() => {
            router.replace('/Ticket/ticketIssuePage');
          }, 100);
          return 1;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate width for progress bar
  const width = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Calculate progress bar color based on completion
  const progressBarColor = progress >= 1 ? '#00FF00' : '#FFFFFF'; 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Upper shadow */}
      {/* <View style={styles.upperShadow} /> */}
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Ticket Info (faded in background) */}
        {/* <View style={styles.ticketInfoContainer}>
          <Text style={styles.busNumber}>Bus 4.50</Text>
          <Text style={styles.destination}>Downtown</Text>
        </View> */}
        
        {/* QR Code */}
        {/* <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR Code</Text>
          </View>
        </View> */}
        
        {/* Printing Message */}
        <Text style={styles.printingText}>
          {isPrintingComplete ? 'Ticket Generated!' : 'Generating Ticket...'}
        </Text>
        <Text style={styles.waitText}>
          {isPrintingComplete ? 'Ticket processing completed' : 'Please wait while we process your ticket'}
        </Text>
        
        {/* Route Information */}
        {ticketData && (
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {ticketData.from} → {ticketData.to}
            </Text>
            <Text style={styles.fareText}>{ticketData.fare}</Text>
          </View>
        )}
        
        {/* Progress Percentage */}
        <Text style={[styles.percentageText, isPrintingComplete && styles.completedText]}>
          {Math.round(progress * 100)}%
        </Text>
        
        {/* Loading Spinner */}
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width, backgroundColor: progressBarColor }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  upperShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#000',
    opacity: 0.2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  ticketInfoContainer: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    opacity: 0.6,
  },
  busNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  destination: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  qrContainer: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '600',
  },
  qrImage: {
    width: 120,
    height: 120,
    opacity: 0.8,
  },
  printingText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  waitText: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.9,
    marginBottom: 25,
    fontWeight: '400',
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  spinner: {
    marginBottom: 30,
    transform: [{ scale: 1.2 }],
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  routeInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  fareText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  completedText: {
    color: '#FFFFFF',
  },
});