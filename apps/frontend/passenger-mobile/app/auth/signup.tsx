import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StatusBar, 
  Alert, 
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Phone, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, text: '', color: '#E5E7EB' };
    if (password.length < 6) return { strength: 1, text: 'Weak', color: '#FF3831' };
    if (password.length < 8) return { strength: 2, text: 'Fair', color: '#F59E0B' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, text: 'Strong', color: '#1DD724' };
    }
    return { strength: 2, text: 'Good', color: '#0891B2' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <>
      <StatusBar backgroundColor="#004CFF" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#004CFF' }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section with Logo */}
            <LinearGradient
              colors={['#004CFF', '#004CFF']}
              style={{
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 24,
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
                alignItems: 'center'
              }}
            >
              {/* Logo */}
              <View style={{
                width: 80,
                height: 80,
                backgroundColor: 'white',
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 8
              }}>
                <Image
                  source={require('@/assets/images/busmate_lk_icon.png')}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
              </View>

              {/* Welcome Text */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: 8,
                  letterSpacing: -0.5
                }}>
                  Create Account
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Join BusMate for smarter travel across Sri Lanka
                </Text>
              </View>
            </LinearGradient>

            {/* Sign Up Form */}
            <View style={{
              flex: 1,
              backgroundColor: '#F8FAFF',
              paddingHorizontal: 24,
              paddingTop: 32,
              marginTop: -20,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32
            }}>
              {/* Form Fields */}
              <View style={{ marginBottom: 24 }}>
                {/* Full Name Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'name' && styles.inputWrapperFocused
                  ]}>
                    <User size={20} color={focusedField === 'name' ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={formData.name}
                      onChangeText={(value) => handleInputChange('name', value)}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused
                  ]}>
                    <Mail size={20} color={focusedField === 'email' ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Phone Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'phone' && styles.inputWrapperFocused
                  ]}>
                    <Phone size={20} color={focusedField === 'phone' ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange('phone', value)}
                      placeholder="Enter your phone number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField('')}
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused
                  ]}>
                    <Lock size={20} color={focusedField === 'password' ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      style={styles.textInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3].map((bar) => (
                            <View
                              key={bar}
                              style={[
                                styles.strengthBar,
                                { backgroundColor: bar <= passwordStrength.strength ? passwordStrength.color : '#E5E7EB' }
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                          {passwordStrength.text}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'confirmPassword' && styles.inputWrapperFocused
                  ]}>
                    <Lock size={20} color={focusedField === 'confirmPassword' ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      style={styles.textInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {/* Password Match Indicator */}
                  {formData.confirmPassword.length > 0 && (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <Check 
                        size={16} 
                        color={formData.password === formData.confirmPassword ? '#1DD724' : '#FF3831'} 
                      />
                      <Text style={{
                        marginLeft: 6,
                        fontSize: 14,
                        color: formData.password === formData.confirmPassword ? '#1DD724' : '#FF3831'
                      }}>
                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Terms and Conditions */}
                <TouchableOpacity
                  style={styles.termsContainer}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && <Check size={16} color="white" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text style={styles.termsLink}>Terms of Service</Text>
                      {' '}and{' '}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={{ marginBottom: 24 }}
              >
                <LinearGradient
                  colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#004CFF', '#0066FF']}
                  style={[styles.signUpButton, isLoading && { opacity: 0.7 }]}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.signUpButtonText}>Creating Account...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                      <ArrowRight size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/login')}
                  style={styles.signInButton}
                >
                  <Text style={styles.signInLinkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = {
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  inputWrapperFocused: {
    borderColor: '#004CFF',
    shadowColor: '#004CFF',
    shadowOpacity: 0.1,
    elevation: 4
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 16,
    paddingLeft: 12,
    fontWeight: '500'
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
    gap: 4
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500'
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  checkboxChecked: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF'
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  termsLink: {
    color: '#004CFF',
    fontWeight: '600'
  },
  signUpButton: {
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32
  },
  signInText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500'
  },
  signInButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  signInLinkText: {
    color: '#004CFF',
    fontSize: 16,
    fontWeight: '700'
  }
};