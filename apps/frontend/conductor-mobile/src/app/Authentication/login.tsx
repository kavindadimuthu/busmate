import FingerprintModal from '@/components/Login/FingerprintModel';
import { useAuth } from '@/hooks/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, restoreSession, isBiometricSupported, hasBiometricCredentials } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Access Denied', result.error || 'Invalid credentials or not a Conductor.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprintAuth = () => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not supported or enabled on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasBiometricCredentials) {
      Alert.alert(
        'No Biometric Credentials',
        'Please set up fingerprint authentication in your device settings first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowFingerprint(true); 
  };

  const handleFingerprintSuccess = async () => {
    setShowFingerprint(false);
    setIsLoading(true);
    try {
      const result = await restoreSession();
      if (result.success) {
        router.replace('/(tabs)');
        return;
      }
      Alert.alert('Biometric Login Failed', result.error || 'No valid conductor session found. Please login with email and password first.');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore authentication data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFingerprint = () => {
    setShowFingerprint(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="bus" size={40} color="white" />
            </View>
            <Text style={styles.appName}>Busmate LK</Text>
            {/* <Text style={styles.tagline}>Conductor Mobile App</Text> */}
            <View style={styles.roleIndicator}>
              <Ionicons name="person-circle" size={16} color="#0066FF" />
              <Text style={styles.roleText}>Conductor Access Only</Text>
            </View>
          </View>
             
          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your conductor email"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#A0A0A0" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember me and Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Forgot Password', 'Contact your system administrator to reset your password.');
                }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            
            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login as Conductor</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* OR Separator - Only show if biometric is supported */}
          {isBiometricSupported && (
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
          )}

          {/* Fingerprint Login - Only show if supported */}
          {isBiometricSupported && (
            <TouchableOpacity 
              style={styles.fingerprintButton}
              onPress={handleFingerprintAuth}
              disabled={isLoading}
            >
              <View style={styles.fingerprintIconContainer}>
                <Ionicons name="finger-print" size={40} color="#0066FF" />
              </View>
              <Text style={styles.fingerprintText}>
                {hasBiometricCredentials ? 'Login with Biometric' : 'Setup Required'}
              </Text>
              {!hasBiometricCredentials && (
                <Text style={styles.fingerprintSubtext}>
                  Enable biometric authentication in device settings
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Help Text */}
          <Text style={styles.helpText}>
            Need help? Contact your Bus Operator.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Fingerprint Modal */}
      <FingerprintModal
        visible={showFingerprint}
        onCancel={handleCancelFingerprint}
        onAuthenticate={handleFingerprintSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
    marginLeft: 4,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066FF',
  },
  loginButton: {
    backgroundColor: '#0066FF',
    borderRadius: 50,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 16,
  },
  fingerprintButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  fingerprintIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E6F0FF',
  },
  fingerprintText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  fingerprintSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 'auto',
  }
});