import { useAuth } from '@/hooks/auth/useAuth';
import { useOngoingTrip } from '@/hooks/employee/useOngoingTrip';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { ongoingTrip } = useOngoingTrip();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/Authentication/login');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  // Use auth context data with ongoing trip data and fallbacks
  const userInfo = {
    fullName: user?.fullName || user?.name || "Conductor Name",
    conductorId: user?.employeeId || "CON-2024-001",
    email: user?.email || "conductor@busmate.lk",
    contactNumber: user?.contactNumber || "+94 77 123 4567",
    role: user?.role || "conductor",
    busId: ongoingTrip?.busPlateNumber || ongoingTrip?.busId || user?.busId || "NB-2845",
    route: ongoingTrip?.routeName || 
           (ongoingTrip?.fromLocation && ongoingTrip?.toLocation ? 
            `${ongoingTrip.fromLocation} - ${ongoingTrip.toLocation}` : null) ||
           ongoingTrip?.route || 
           user?.route || 
           "Colombo - Kandy"
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
      barStyle="light-content"
       backgroundColor="#0066FF" 
       translucent={false}
       />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conductor Profile</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.profileCard}>
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
          
          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Ionicons name="person-circle" size={16} color="#0066FF" />
            <Text style={styles.roleBadgeText}>Bus Conductor</Text>
          </View>
          
          {/* Profile Information */}
          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="person" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.fullName}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Conductor ID</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="card" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.conductorId}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="mail" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Contact Number</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="call" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.contactNumber}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Assigned Bus</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="bus" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.busId}</Text>
              {ongoingTrip && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.fieldLabel}>Assigned Route</Text>
            <View style={styles.fieldContainer}>
              <Ionicons name="map" size={22} color="#999" style={styles.fieldIcon} />
              <Text style={styles.fieldText}>{userInfo.route}</Text>
              {ongoingTrip && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Ongoing</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            router.push('/profile/edit_profile');
          }}
        >
          <Ionicons name="create-outline" size={20} color="white" style={styles.editButtonIcon} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        {/* Menu Options */}
        <View style={styles.menuContainer}>
          {/* Change Password Section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/change_password')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={20} color="#666" />
              </View>
              <View>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutMenuItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out" size={20} color="#FF3B30" />
              </View>
              <View>
                <Text style={[styles.menuTitle, styles.logoutTitle]}>Sign Out</Text>
                <Text style={styles.menuSubtitle}>Sign out of conductor account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Busmate LK Conductor App v1.0.0</Text>
        
        {/* Bottom padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    marginTop: 20, // Added margin to separate from title
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20, // Adjusted to center vertically
  },
  logoutButton: {
    padding: 4,
    marginTop: 20, // Added margin to separate from title
  },
  container: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  roleBadgeText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoSection: {
    width: '100%',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 12,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#0066FF',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButtonIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#F0F2F5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutIconContainer: {
    backgroundColor: '#FEF2F2',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
  },
  logoutTitle: {
    color: '#FF3B30',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
});