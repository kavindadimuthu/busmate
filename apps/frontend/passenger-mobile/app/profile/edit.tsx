import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Camera, 
  User, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Check,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/ui/AppHeader';
import { PassengerControllerService, PassengerDTO, PassengerUpdateDTO } from '@/lib/api-client/user-management';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { user, updateUserProfile } = useAuth();
  const [profileData, setProfileData] = useState<PassengerDTO | null>(null);
  const safeAreaStyle = useSafeAreaContainerStyles();
  
  // Initialize form with empty defaults - will be populated from API
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phoneNumber: '',
    notification_preferences: '',
  });

  // Fetch current profile data
  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingProfile(true);
      const response = await PassengerControllerService.getPassengerById(user.id);
      setProfileData(response);
      
      // Populate form with API data
      setFormData({
        fullName: response.fullName || '',
        username: response.username || '',
        phoneNumber: '', // phoneNumber is not returned by getPassengerById, will be handled in update
        notification_preferences: response.notification_preferences || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      Alert.alert(
        'Error',
        'Failed to load profile information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User ID not found. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare update data according to PassengerUpdateDTO
      const updateData: PassengerUpdateDTO = {
        fullName: formData.fullName.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        username: formData.username.trim() || undefined,
        notification_preferences: formData.notification_preferences.trim() || undefined,
      };

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof PassengerUpdateDTO] === undefined || updateData[key as keyof PassengerUpdateDTO] === '') {
          delete updateData[key as keyof PassengerUpdateDTO];
        }
      });

      // Call the API
      const response = await PassengerControllerService.updatePassenger(user.id, updateData);
      
      // Update the user profile in AuthContext with the updated data
      await updateUserProfile({
        name: updateData.fullName || user.name,
        phone: updateData.phoneNumber || user.phone,
        // Note: email and other fields are not updated as they're not part of the update API
      });
      
      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.status === 400) {
        errorMessage = 'Invalid profile data. Please check your inputs.';
      } else if (error.status === 404) {
        errorMessage = 'Profile not found. Please contact support.';
      } else if (error.status === 401) {
        errorMessage = 'You are not authorized to update this profile.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => console.log("Camera") },
        { text: "Choose from Gallery", onPress: () => console.log("Gallery") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Use placeholder image instead of problematic asset images
  const getProfileImage = (imagePath: string | undefined) => {
    return { uri: 'https://iamkavinda.vercel.app/assets/profile-photo-CCXUFtA8.jpeg' };
  };

  // Show loading state while fetching profile data
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={safeAreaStyle}>
        <AppHeader title="Edit Profile" />
        <View style={[styles.content, styles.centered]}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeAreaStyle}>
      <AppHeader title="Edit Profile" />

      <ScrollView style={styles.content}>
        {/* Profile Image Section */}
        <View style={styles.photoSection}>
          <Image 
            source={getProfileImage(user?.profileImage)}
            style={styles.profileImage} 
          />
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handleChangePhoto}
          >
            <Camera size={18} color="white" />
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your username"
                value={formData.username}
                onChangeText={(text) => handleChange('username', text)}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notification Preferences</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your notification preferences"
                value={formData.notification_preferences}
                onChangeText={(text) => handleChange('notification_preferences', text)}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            By updating your profile, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <>
              <Check size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    right: '35%',
    bottom: 25,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#004CFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    marginTop: 8,
    color: '#004CFF',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  noteContainer: {
    marginBottom: 120,
    paddingHorizontal: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#004CFF',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});