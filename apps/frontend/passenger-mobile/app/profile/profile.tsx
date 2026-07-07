import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/ui/AppHeader';
import { PassengerControllerService, PassengerDTO } from '@/lib/api-client/user-management';

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<PassengerDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await PassengerControllerService.getPassengerById(user.id);
      setProfileData(response);
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      Alert.alert(
        'Error',
        'Failed to load profile information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile Information" />
        <View style={[styles.content, styles.centered]}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading profile information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback if user is not loaded or profile data is not available
  if (!user || !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile Information" />
        <View style={styles.content}>
          <Text>Failed to load profile information.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use placeholder image instead of problematic asset images
  const getProfileImage = (imagePath: string | undefined) => {
    return { uri: 'https://iamkavinda.vercel.app/assets/profile-photo-CCXUFtA8.jpeg' };
  };

  // Format member since date for display
  const formatMemberSince = (memberSince: string) => {
    if (!memberSince) return 'Recently';
    return memberSince;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Profile Information" />

      <ScrollView style={styles.content}>
        {/* Profile Image Section */}
        <View style={styles.photoSection}>
          <Image 
            source={getProfileImage(user?.profileImage)}
            style={styles.profileImage} 
          />
          <Text style={styles.nameText}>{profileData.fullName || profileData.username || 'Unknown'}</Text>
          <Text style={styles.memberSinceText}>
            {profileData.accountStatus === 'ACTIVE' ? 'Active Member' : 'Member'} 
            {profileData.isVerified && ' • Verified'}
          </Text>
        </View>

        <View style={styles.infoCardContainer}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{profileData.fullName || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{profileData.username || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{profileData.email || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{profileData.role || 'Passenger'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={[styles.infoValue, {color: profileData.accountStatus === 'ACTIVE' ? '#10B981' : '#EF4444'}]}>
                  {profileData.accountStatus || 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Verified</Text>
                <Text style={[styles.infoValue, {color: profileData.isVerified ? '#10B981' : '#EF4444'}]}>
                  {profileData.isVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Preferences Card */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notification Preferences</Text>
                <Text style={styles.infoValue}>
                  {profileData.notification_preferences || 'Default settings'}
                </Text>
              </View>
            </View>
          </View>

          {/* System Information Card */}
          {/* <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>System Information</Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#004CFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>{profileData.userId || 'Not available'}</Text>
              </View>
            </View>
          </View> */}
        </View>
      </ScrollView>

      {/* Edit Button */}
      <View style={styles.editButtonContainer}>
        <TouchableOpacity
          onPress={() => router.push('/profile/edit')}
          style={styles.editButton}
        >
          <Edit2 size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
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
    paddingBottom: 100,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberSinceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoCardContainer: {
    marginBottom: 110,
  },
  infoCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  editButtonContainer: {
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
  editButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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