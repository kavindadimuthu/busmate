import { useAuth } from '@/hooks/auth/useAuth';
import { useEmployeeProfile } from '@/hooks/employee/useEmployeeProfile';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { updateProfile, isLoading, error, clearError } = useEmployeeProfile();
  
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        contactNumber: user.contactNumber || '',
      });
    }
  }, [user]);

  // Clear errors when component unmounts or user changes
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (!/^0[0-9]{9}$/.test(formData.contactNumber.trim())) {
      errors.contactNumber = 'Please enter a valid Sri Lankan phone number (0XXXXXXXXX)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await updateProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.contactNumber.trim(),
      });
      
      if (result && result.success) {
        Alert.alert(
          'Success', 
          'Profile updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', result?.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.emptySpace} />
      </View> */}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('@/assets/images/profilePic.jpg')} 
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Full Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Conductor Name</Text>
            <TextInput
              style={[styles.input, validationErrors.fullName && styles.inputError]}
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
            />
            {validationErrors.fullName && (
              <Text style={styles.validationError}>{validationErrors.fullName}</Text>
            )}
          </View>
          
          {/* Username */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.username || ''}
              editable={false}
            />
          </View>
          
          {/* Email Address */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
               style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
            />
          </View>
          
          {/* Contact Number */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <TextInput
              style={[styles.input, validationErrors.contactNumber && styles.inputError]}
              value={formData.contactNumber}
              onChangeText={(text) => handleInputChange('contactNumber', text)}
              keyboardType="phone-pad"
              placeholder="0XXXXXXXXX"
            />
            {validationErrors.contactNumber && (
              <Text style={styles.validationError}>{validationErrors.contactNumber}</Text>
            )}
          </View>
          
          {/* Assigned Bus */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Assigned Bus</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.busId || 'Not Assigned'}
              editable={false}
            />
          </View>
          
          {/* Assigned Route */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Assigned Route</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.route || 'Not Assigned'}
              editable={false}
            />
          </View>
          
          {/* National ID */}
          {/* <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>NIC / National ID</Text>
            <TextInput
              style={styles.input}
              value={userInfo.nationalId}
              onChangeText={(text) => handleInputChange('nationalId', text)}
            />
          </View> */}
          
          {/* Address */}
          {/* <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={userInfo.address}
              onChangeText={(text) => handleInputChange('address', text)}
              multiline={true}
              numberOfLines={3}
            />
          </View> */}
          
          {/* Change Password Section */}
          <TouchableOpacity 
            style={styles.passwordHeader}
            onPress={() => router.push('/profile/change_password')}
          >
            <Text style={styles.passwordHeaderText}>Change Password</Text>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          {/* Display API errors */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Save Changes Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]} 
            onPress={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          
          {/* Add bottom padding for scrolling */}
          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  emptySpace: {
    width: 28, // Match the size of the back button for alignment
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileImageContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0066FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 1,
    backgroundColor: '#ffebee',
  },
  validationError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  disabledInput: {
    opacity: 0.7,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  passwordHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
});
