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
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('kavinda@gmail.com'); // Remove pre-filled demo values
  const [password, setPassword] = useState('123456'); // Remove pre-filled demo values
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const result = await signIn(email, password);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid email or password');
    }
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
            {/* Header Section with Logo */}
            <LinearGradient
              colors={['#004CFF', '#004CFF']}
              style={{
                paddingTop: 40,
                paddingBottom: 60,
                paddingHorizontal: 24,
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
                minHeight: height * 0.4,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {/* Logo */}
              <View style={{
                width: 100,
                height: 100,
                backgroundColor: 'white',
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                // shadowColor: '#000',
                // shadowOffset: { width: 0, height: 8 },
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
                  fontSize: 32,
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: 8,
                  letterSpacing: -0.5
                }}>
                  Welcome Back
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Sign in to continue your smart journey with BusMate
                </Text>
              </View>
            </LinearGradient>

            {/* Login Form */}
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
              <View style={{ marginBottom: 32 }}>
                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
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
                      placeholder="Enter your email"
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

                {/* Password Input */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 8
                  }}>
                    Password
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: passwordFocused ? '#004CFF' : '#E5E7EB',
                    paddingHorizontal: 16,
                    shadowColor: passwordFocused ? '#004CFF' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: passwordFocused ? 0.1 : 0.05,
                    shadowRadius: 8,
                    elevation: passwordFocused ? 4 : 2
                  }}>
                    <Lock size={20} color={passwordFocused ? '#004CFF' : '#9CA3AF'} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: '#111827',
                        paddingVertical: 16,
                        paddingLeft: 12,
                        fontWeight: '500'
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{
                        padding: 4,
                        marginLeft: 8
                      }}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => router.push('/auth/forgot-password')}
                  style={{
                    alignSelf: 'flex-end',
                    paddingVertical: 8,
                    paddingHorizontal: 4
                  }}
                >
                  <Text style={{
                    color: '#004CFF',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  marginBottom: 24
                }}
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
                        Signing In...
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
                        Sign In
                      </Text>
                      <ArrowRight size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Demo Credentials Info */}
              {/* <View style={{
                backgroundColor: '#E0F2FE',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: '#0891B2'
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#0F172A',
                  marginBottom: 4
                }}>
                  Demo Account
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#475569',
                  lineHeight: 18
                }}>
                  Use the pre-filled credentials to explore the app, or create your own account below.
                </Text>
              </View> */}

              {/* Sign Up Link */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 32
              }}>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 16,
                  fontWeight: '500'
                }}>
                  Don't have an account? 
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/signup')}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 8
                  }}
                >
                  <Text style={{
                    color: '#004CFF',
                    fontSize: 16,
                    fontWeight: '700'
                  }}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}