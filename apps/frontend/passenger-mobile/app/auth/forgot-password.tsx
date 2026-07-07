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
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResetSent(true);
      setCountdown(60);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = () => {
    if (countdown === 0) {
      handleSendResetLink();
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

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
            {/* Header Section */}
            <LinearGradient
              colors={['#004CFF', '#004CFF']}
              style={{
                paddingTop: 20,
                paddingBottom: 50,
                paddingHorizontal: 24,
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* Back Button */}
              <TouchableOpacity
                onPress={handleBackToLogin}
                style={{
                  position: 'absolute',
                  top: 20,
                  left: 24,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <ArrowLeft size={20} color="white" />
              </TouchableOpacity>

              {/* Icon */}
              <View style={{
                width: 80,
                height: 80,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                marginTop: 40
              }}>
                {resetSent ? (
                  <CheckCircle size={40} color="white" />
                ) : (
                  <Mail size={40} color="white" />
                )}
              </View>

              {/* Title and Description */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  {resetSent ? 'Check Your Email' : 'Forgot Password?'}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  lineHeight: 24,
                  paddingHorizontal: 20
                }}>
                  {resetSent 
                    ? 'We\'ve sent a password reset link to your email address'
                    : 'Don\'t worry! Enter your email and we\'ll send you a reset link'
                  }
                </Text>
              </View>
            </LinearGradient>

            {/* Content Section */}
            <View style={{
              flex: 1,
              backgroundColor: '#F8FAFF',
              paddingHorizontal: 24,
              paddingTop: 32,
              marginTop: -20,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32
            }}>
              {!resetSent ? (
                // Email Input Form
                <>
                  <View style={{ marginBottom: 32 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: 8
                    }}>
                      Email Address
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'white',
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: emailFocused ? '#004CFF' : '#E5E7EB',
                      paddingHorizontal: 16,
                      shadowColor: emailFocused ? '#004CFF' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: emailFocused ? 0.1 : 0.05,
                      shadowRadius: 8,
                      elevation: emailFocused ? 4 : 2
                    }}>
                      <Mail size={20} color={emailFocused ? '#004CFF' : '#9CA3AF'} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email address"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: '#111827',
                          paddingVertical: 16,
                          paddingLeft: 12,
                          fontWeight: '500'
                        }}
                      />
                    </View>
                  </View>

                  {/* Send Reset Link Button */}
                  <TouchableOpacity
                    onPress={handleSendResetLink}
                    disabled={isLoading}
                    style={{ marginBottom: 24 }}
                  >
                    <LinearGradient
                      colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#004CFF', '#0066FF']}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 18,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#004CFF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isLoading ? 0 : 0.3,
                        shadowRadius: 12,
                        elevation: isLoading ? 0 : 8
                      }}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color="white" size="small" />
                          <Text style={{
                            color: 'white',
                            fontSize: 18,
                            fontWeight: '700',
                            marginLeft: 12
                          }}>
                            Sending Link...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={{
                            color: 'white',
                            fontSize: 18,
                            fontWeight: '700',
                            marginRight: 8
                          }}>
                            Send Reset Link
                          </Text>
                          <ArrowRight size={20} color="white" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Help Text */}
                  <View style={{
                    backgroundColor: '#F0F9FF',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                    borderLeftWidth: 4,
                    borderLeftColor: '#0EA5E9'
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#0F172A',
                      marginBottom: 4
                    }}>
                      Need Help?
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#475569',
                      lineHeight: 18
                    }}>
                      If you don't receive the email, check your spam folder or contact our support team.
                    </Text>
                  </View>
                </>
              ) : (
                // Success State
                <>
                  {/* Success Message */}
                  <View style={{
                    backgroundColor: '#F0FDF4',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#BBF7D0'
                  }}>
                    <CheckCircle size={48} color="#16A34A" style={{ marginBottom: 16 }} />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#166534',
                      marginBottom: 8,
                      textAlign: 'center'
                    }}>
                      Reset Link Sent!
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#15803D',
                      textAlign: 'center',
                      lineHeight: 20
                    }}>
                      We've sent a password reset link to
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#166534',
                      marginTop: 4
                    }}>
                      {email}
                    </Text>
                  </View>

                  {/* Instructions */}
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 12
                    }}>
                      What's Next?
                    </Text>
                    <View style={{ gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#EBF2FF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          marginTop: 2
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#004CFF' }}>1</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>
                          Check your email inbox for the reset link
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#EBF2FF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          marginTop: 2
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#004CFF' }}>2</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>
                          Click the link to create a new password
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#EBF2FF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          marginTop: 2
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#004CFF' }}>3</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>
                          Sign in with your new password
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Resend Link */}
                  <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: '#6B7280',
                      marginBottom: 12,
                      textAlign: 'center'
                    }}>
                      Didn't receive the email?
                    </Text>
                    
                    {countdown > 0 ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={{
                          fontSize: 14,
                          color: '#6B7280'
                        }}>
                          Resend in {countdown}s
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendLink}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 24,
                          backgroundColor: '#F8FAFF',
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: '#E5EFFF'
                        }}
                      >
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#004CFF'
                        }}>
                          Resend Link
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* Back to Login */}
              <TouchableOpacity
                onPress={handleBackToLogin}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingBottom: 32
                }}
              >
                <ArrowLeft size={16} color="#6B7280" />
                <Text style={{
                  color: '#6B7280',
                  fontSize: 16,
                  fontWeight: '500',
                  marginLeft: 8
                }}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}