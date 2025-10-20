import { useTicket } from '@/contexts/TicketContext';
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
  const { ticketData } = useTicket();
  
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
        
        {/* Enhanced Route Information with Visual Journey */}
        {ticketData && (
          <View style={styles.routeInfo}>
            <View style={styles.journeyContainer}>
              {/* From Stop */}
              <View style={styles.stopContainer}>
                <View style={styles.stopIcon}>
                  <Text style={styles.stopIconText}>🚏</Text>
                </View>
                <View style={styles.stopDetails}>
                  <Text style={styles.stopLabel}>FROM</Text>
                  <Text style={styles.stopName}>{ticketData.from}</Text>
                </View>
              </View>
              
              {/* Journey Line with Arrow */}
              <View style={styles.journeyLine}>
                <View style={styles.dottedLine} />
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.dottedLine} />
              </View>
              
              {/* To Stop */}
              <View style={styles.stopContainer}>
                <View style={[styles.stopIcon, styles.destinationIcon]}>
                  <Text style={styles.stopIconText}>🎯</Text>
                </View>
                <View style={styles.stopDetails}>
                  <Text style={styles.stopLabel}>TO</Text>
                  <Text style={styles.stopName}>{ticketData.to}</Text>
                </View>
              </View>
            </View>
            
            {/* Ticket Details */}
            <View style={styles.ticketDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>💰 Fare:</Text>
                <Text style={styles.fareText}>{ticketData.fare}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>👥 Passengers:</Text>
                <Text style={styles.passengerText}>{ticketData.passengers}</Text>
              </View>
            </View>
          </View>
        )}
        
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
  routeInfo: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fareText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  passengerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  
  // Enhanced journey visualization styles
  journeyContainer: {
    width: '100%',
    paddingVertical: 15,
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 15,
  },
  stopIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationIcon: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stopIconText: {
    fontSize: 20,
  },
  stopDetails: {
    flex: 1,
  },
  stopLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  stopName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  journeyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 30,
  },
  dottedLine: {
    height: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  arrowContainer: {
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
});