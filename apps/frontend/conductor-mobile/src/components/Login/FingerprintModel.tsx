import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FingerprintModalProps {
  visible: boolean;
  onCancel: () => void;
  onAuthenticate: () => void;
}

export default function FingerprintModal({ visible, onCancel, onAuthenticate }: FingerprintModalProps) {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState('Place your finger on the sensor');
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      startPulseAnimation();
      resetState();
      // Automatically trigger biometric authentication when modal opens
      handleBiometricAuth();
    } else {
      stopPulseAnimation();
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setAuthMessage('Place your finger on the sensor');
    setIsAuthenticating(false);
    setAuthFailed(false);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthFailed(false);
      setAuthMessage('Authenticating...');

      // Check if biometric authentication is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
          setAuthMessage('Fingerprint authentication not supported');
        setAuthFailed(true);
        Alert.alert('Error', 'Fingerprint authentication is not supported on this device');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setAuthMessage('No fingerprint credentials found');
        setAuthFailed(true);
        Alert.alert('Error', 'No fingerprint is set up on this device');
        return;
      }

      // Always show fingerprint message regardless of device capabilities
      setAuthMessage('Use your Fingerprint');

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate as Conductor',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setAuthMessage('Authentication successful!');
        setAuthFailed(false);
        // Small delay to show success message
        setTimeout(() => {
          onAuthenticate();
        }, 500);
      } else {
        setAuthFailed(true);
        // Handle different failure scenarios
        if (result.error === 'user_cancel') {
          setAuthMessage('Authentication cancelled by user');
          setTimeout(() => {
            onCancel();
          }, 1000);
        } else if (result.error === 'system_cancel') {
          setAuthMessage('Authentication cancelled by system');
        } else if (result.error === 'user_fallback') {
          setAuthMessage('Fallback authentication selected');
        } else if (result.error === 'app_cancel') {
          setAuthMessage('Authentication cancelled by app');
        } else {
          setAuthMessage('Authentication failed. Please try again.');
        }
        
        console.log('Biometric authentication failed:', result.error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setAuthMessage('Authentication error occurred');
      setAuthFailed(true);
      Alert.alert('Error', 'An error occurred during authentication. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRetry = () => {
    handleBiometricAuth();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Fingerprint Authentication</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.fingerprintContainer,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isAuthenticating ? 0.7 : 1,
                },
              ]}
            >
              {isAuthenticating ? (
                <ActivityIndicator size="large" color="#0066FF" />
              ) : authFailed ? (
                <Ionicons name="close-circle" size={80} color="#FF3B30" />
              ) : authMessage.includes('successful') ? (
                <Ionicons name="checkmark-circle" size={80} color="#00CC66" />
              ) : (
                <Ionicons name="finger-print" size={80} color="#0066FF" />
              )}
            </Animated.View>

            <Text style={[
              styles.message,
              authFailed && styles.errorMessage,
              authMessage.includes('successful') && styles.successMessage
            ]}>
              {authMessage}
            </Text>

            <View style={styles.buttonContainer}>
              {!isAuthenticating && authFailed && !authMessage.includes('cancelled') && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              
              {!authMessage.includes('successful') && (
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  fingerprintContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E6F0FF',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  errorMessage: {
    color: '#FF3B30',
  },
  successMessage: {
    color: '#00CC66',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});