import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function TicketPrintingScreen() {
  const [progress, setProgress] = useState(0);
  const [isPrintingComplete, setIsPrintingComplete] = useState(false);
  const progressAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);
  
  // Simulate printing progress with 4 second timing
  useEffect(() => {
    // Start progress animation - 4 seconds total
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 10000, 
      useNativeDriver: false,
    }).start();
    
    // Pulse animation for dynamic effect
    const pulseSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseSequence.start();
    
    // Update progress state - complete in 4 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 0.0125; // Adjusted increment for 4 second completion (1/80 = 0.0125)
        if (newProgress >= 1) {
          clearInterval(interval);
          setIsPrintingComplete(true);
          pulseSequence.stop(); // Stop pulse when complete
          // Navigate to confirmation screen after completion
          setTimeout(() => {
            router.replace('/Ticket/ticketIssuePage');
          }, 3000);
          return 1;
        }
        return newProgress;
      });
    }, 50); // Keep 50ms interval for smooth animation
    
    return () => {
      clearInterval(interval);
      pulseSequence.stop();
    };
  }, []);
  
  // Calculate width for progress bar with smooth animation
  const width = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Dynamic progress bar color that changes as it fills
  const progressBarColor = progressAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#4DABF7', '#51CF66', '#12B886'], // Blue to green gradient
  });

  // Scale animation for percentage text
  const percentageScale = pulseAnimation; 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Upper shadow */}
      {/* <View style={styles.upperShadow} /> */}
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        
        {/* Animated Icon Container */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: percentageScale }] }]}>
          <View style={styles.ticketIcon}>
            <Text style={styles.ticketEmoji}>🎫</Text>
          </View>
        </Animated.View>
        
        {/* Printing Message */}
        <Text style={styles.printingText}>
          {isPrintingComplete ? 'Ticket Generated!' : 'Generating Ticket...'}
        </Text>
        <Text style={styles.waitText}>
          {isPrintingComplete ? 'Ticket processing completed' : 'Please wait while we process your ticket'}
        </Text>
        

        
        {/* Progress Percentage with animation */}
        <Animated.Text style={[
          styles.percentageText, 
          isPrintingComplete && styles.completedText,
          { transform: [{ scale: percentageScale }] }
        ]}>
          {Math.round(progress * 100)}%
        </Animated.Text>
        
        {/* Dynamic Loading Indicators */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
          <View style={styles.dots}>
            <Text style={styles.dotText}>
              {isPrintingComplete ? '✓' : '●●●'}
            </Text>
          </View>
        </View>
        
        {/* Enhanced Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[
            styles.progressBar, 
            { 
              width, 
              backgroundColor: progressBarColor,
              shadowColor: progressBarColor,
            }
          ]} />
          <View style={styles.progressBarGlow} />
        </View>
        
        {/* Processing Steps */}
        <View style={styles.stepsContainer}>
          <View style={[styles.step, progress > 0.15 && styles.stepActive]}>
            <Text style={styles.stepText}>Validating</Text>
          </View>
          <View style={[styles.step, progress > 0.45 && styles.stepActive]}>
            <Text style={styles.stepText}>Processing</Text>
          </View>
          <View style={[styles.step, progress > 0.75 && styles.stepActive]}>
            <Text style={styles.stepText}>Finalizing</Text>
          </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  ticketIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  ticketEmoji: {
    fontSize: 40,
  },
  printingText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  waitText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 25,
    fontWeight: '400',
    textAlign: 'center',
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  spinner: {
    marginBottom: 10,
    transform: [{ scale: 1.3 }],
  },
  dots: {
    alignItems: 'center',
  },
  dotText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginBottom: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  progressBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  stepActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#FFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  completedText: {
    color: '#FFFFFF',
  },
});