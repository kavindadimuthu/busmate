import QuickActions from '@/components/Home/QuickActions';
import { useEmployeeScheduleContext } from '@/contexts/EmployeeScheduleContext';
import { useAuth } from '@/hooks/auth/useAuth';
import { useEmployeeProfile } from '@/hooks/employee/useEmployeeProfile';
import { formatDate, formatTime, useNextTrip } from '@/hooks/employee/useNextTrip';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const { user } = useAuth();
  const { fetchProfile, isLoading: profileLoading, error: profileError } = useEmployeeProfile();
  const { refreshSchedules } = useEmployeeScheduleContext();
  
  
  const { nextTrip, nextTripTab, loading: schedulesLoading } = useNextTrip();
  
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Shift state management
  const [shiftStarted, setShiftStarted] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(null);
  const [startingShift, setStartingShift] = useState(false);

  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProfile(),
        refreshSchedules()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, refreshSchedules]);

  
  const handleStartShift = async () => {
    if (shiftStarted) return; 
    
    try {
      setStartingShift(true);
      
      
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
    
      await new Promise(resolve => setTimeout(resolve, 1000));
         
      setShiftStarted(true);
      setShiftStartTime(timeString);
           
      Alert.alert(
        'Shift Started',
        `Your shift has been started at ${timeString}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to start shift:', error);
      Alert.alert('Error', 'Failed to start shift. Please try again.');
    } finally {
      setStartingShift(false);
    }
  };

  
  const handleEndShift = () => {
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: () => {
            setShiftStarted(false);
            setShiftStartTime(null);
            Alert.alert('Shift Ended', 'Your shift has been ended successfully.');
          },
        },
      ]
    );
  };

  useEffect(() => {
    // Fetch employee details if user exists but doesn't have employee data
    if (user?.id && !user.employeeId) {
      fetchProfile().catch(error => {
        console.error('Failed to fetch employee profile:', error);
        
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      });
    }
  }, [user?.id, user?.employeeId]); 
  
  const today = new Date().toLocaleDateString('en-LK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const [markTime, setMarkTime] = React.useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  
  const insets = useSafeAreaInsets();
  

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };
  
  const getFirstName = () => {
    
    if (user?.fullName) {
      return user.fullName.split(' ')[0];
    }
    if (user?.username) {
      return user.username;
    }
    return user?.name?.split(' ')[0] || 'Conductor';
  };
  
  const quickActions = [
    {
      label: 'View Schedules',
      icon: 'calendar',
      onPress: () => router.push('/Journey/schedules'),
    },
    {
      label: 'Notify Passengers',
      icon: 'notifications',
      onPress: () => router.push('/Notification/notify_passengers'),
    },
    {
      label: 'Tickets',
      icon: 'receipt-outline',
      onPress: () => router.push('/(tabs)/tickets'),
    },
    {
      label: 'Analytics',
      icon: 'bar-chart-outline',
      onPress: () => router.push('/Insights/insights'),
    },
  ];



  return (
    <SafeAreaView style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#0066FF" translucent={false} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="bus" size={16} color="white" />
          </View>
          <Text style={styles.logoText}>Busmate LK</Text>
          <View style={styles.roleIndicator}>
            <Text style={styles.roleText}>Conductor</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => { router.push('/Notification/conductor_notification'); }}
          >
            <Ionicons name="notifications-outline" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { router.push('/(tabs)/profile'); }}
          >
            <Image 
              source={require('@/assets/images/newprofile.webp')} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']} // Android
            tintColor="#FF6B6B" // iOS
          />
        }
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {`Good ${getGreeting()}, ${getFirstName()} `}<Text>👋</Text>
          </Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Profile Loading Indicator */}
        {profileLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Loading profile...</Text>
          </View>
        )}

        {/* Profile Error */}
        {profileError && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Error</Text>
            <Text style={styles.infoText}>{profileError}</Text>
            <TouchableOpacity 
              style={styles.shiftButton}
              onPress={() => fetchProfile()}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Shift Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Shift</Text>
          <Text style={styles.nameText}>
            Conductor: {user?.fullName || user?.name || 'Loading...'}
          </Text>
          {/* <Text style={styles.infoText}>
            Employee ID: { user?.employeeId || user?.id || 'Loading...'}
          </Text> */}
          <Text style={styles.infoText}>
            Date: {new Date().toLocaleDateString('en-LK', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          
          {/* Shift Control Buttons */}
          {shiftStarted ? (
            // Show both buttons side by side when shift is started
            <View style={styles.shiftButtonsContainer}>
              <TouchableOpacity 
                style={[styles.shiftButton, styles.shiftStartedButton, styles.halfWidthButton]}
                disabled={true}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Shift Started</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.endShiftButton, styles.halfWidthButton]}
                onPress={handleEndShift}
              >
                <Ionicons name="stop-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.endShiftButtonText}>End Shift</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Show only start shift button when shift is not started
            <TouchableOpacity 
              style={[styles.shiftButton, startingShift && styles.disabledButton]}
              onPress={handleStartShift}
              disabled={startingShift}
            >
              {startingShift ? (
                <>
                  <ActivityIndicator size="small" color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Starting Shift...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Start Shift @ {markTime}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Quick Actions Section */}
        <QuickActions actions={quickActions} />
        
        {/* Today's Assignment */}
       <Text style={styles.sectionTitle}> Your Next Trip</Text>
    <View style={styles.assignmentCard}>
      {schedulesLoading ? (
        <Text style={{ color: 'white' }}>Loading next trip...</Text>
      ) : nextTrip ? (
        <>
          <Text style={styles.routeText}>Route: {nextTrip.route}</Text>
          <Text style={styles.busIdText}>Bus: {nextTrip.busPlateNumber || nextTrip.busId}</Text>
          <Text style={styles.departureText}>
            Departure: {formatTime(nextTrip.startTime)}
          </Text>
          <Text style={styles.departureText}>
            Date: {formatDate(nextTrip.date)}
          </Text>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => router.push(`/Journey/schedules?tab=${nextTripTab}`)}
          >
            <Text style={styles.viewDetailsText}>Tap to View Trip Details</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: 'white' }}>No upcoming trips for today.</Text>
      )}
    </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0066FF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollContent: {
    flex: 1,
    marginTop: 70,
  },
  scrollContentContainer: {
    paddingTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 35,
    height: 35,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  roleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
    color: 'white',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
  },
  greetingSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  assignmentCard: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  routeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busIdText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  departureText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 16,
  },
  viewDetailsButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#0066FF',
    fontWeight: '500',
  },
  shiftButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  shiftStartedButton: {
    backgroundColor: '#4CAF50', // Green color for started shift
  },
  disabledButton: {
    opacity: 0.7,
  },
  shiftButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidthButton: {
    flex: 1,
  },
  endShiftButton: {
    backgroundColor: '#FF3B30', // Red background
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  endShiftButtonText: {
    color: 'white', // White text for better contrast on red background
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
});