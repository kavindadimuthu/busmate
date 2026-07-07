import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Bell,
  AlertTriangle,
  Clock,
  Bus,
  Ticket,
  Navigation,
  Settings,
  Calendar,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { PassengerApIsService } from '@/lib/api-client/route-management';
import { PassengerControllerService } from '@/lib/api-client/user-management';
import type { 
  PassengerRouteResponse,
  PassengerNearbyStopsResponse,
  PassengerTripResponse,
  PassengerStopResponse
} from '@/lib/api-client/route-management';

// Interface definitions
interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
  route: string;
}

interface NearbyStop {
  id: string;
  name: string;
  distance: string;
  routeCount: number;
  nextArrival?: string;
}

interface LiveAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [recentRoutes, setRecentRoutes] = useState<PassengerRouteResponse[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<PassengerTripResponse[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'search',
      title: 'Find Routes',
      icon: Search,
      color: '#004CFF',
      backgroundColor: '#EBF2FF',
      route: '/search'
    },
    {
      id: 'tickets',
      title: 'My Tickets',
      icon: Ticket,
      color: '#FF8A00',
      backgroundColor: '#FFF4EB',
      route: '/tickets'
    },
    {
      id: 'track',
      title: 'Track Bus',
      icon: Navigation,
      color: '#1DD724',
      backgroundColor: '#EBFFF4',
      route: '/location'
    },
    // {
    //   id: 'schedule',
    //   title: 'Schedules',
    //   icon: Calendar,
    //   color: '#8B5CF6',
    //   backgroundColor: '#F3F1FF',
    //   route: '/schedules'
    // }
  ];

  // Utility functions
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // API Integration functions
  const fetchNearbyStops = async (latitude: number, longitude: number) => {
    try {
      const response = await PassengerApIsService.findNearbyStops(
        latitude, 
        longitude, 
        5, // 5km radius
        10, // limit to 10 stops
        true // include routes
      );
      
      const stops: NearbyStop[] = response.stops?.map(stop => ({
        id: stop.stopId || '',
        name: stop.name || 'Unknown Stop',
        distance: stop.distance ? `${stop.distance.toFixed(1)}km` : 'Unknown',
        routeCount: stop.routeCount || 0,
        nextArrival: stop.upcomingTrips?.[0]?.departureTime || undefined
      })) || [];
      
      setNearbyStops(stops);
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
    }
  };

  const fetchRecentRoutes = async () => {
    try {
      const response = await PassengerApIsService.getAllRoutes(
        undefined, // direction
        undefined, // searchText
        0, // page
        5 // size - get 5 popular routes
      );
      
      setRecentRoutes(response.content || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchUpcomingTrips = async () => {
    try {
      const response = await PassengerApIsService.getActiveTrips(
        undefined, // routeId
        undefined, // operatorType
        undefined, // operatorId
        userLocation?.lat,
        userLocation?.lng,
        10, // 10km radius
        0, // page
        3 // limit to 3 trips
      );
      
      setUpcomingTrips(response.content || []);
    } catch (error) {
      console.error('Error fetching upcoming trips:', error);
    }
  };

  const initializeData = async () => {
    setLoading(true);
    
    // Mock user location for now - in real app, get from device GPS
    const mockLocation = { lat: 6.9271, lng: 79.8612 }; // Colombo coordinates
    setUserLocation(mockLocation);
    
    // Mock alerts
    setLiveAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'Service Advisory',
        message: 'Slight delays on Route 138 due to heavy traffic',
        timestamp: '15 mins ago'
      },
      {
        id: '2',
        type: 'info',
        title: 'New Route',
        message: 'Route 240 now available with express service',
        timestamp: '2 hours ago'
      }
    ]);

    try {
      await Promise.all([
        fetchNearbyStops(mockLocation.lat, mockLocation.lng),
        fetchRecentRoutes(),
        fetchUpcomingTrips()
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  };

  useEffect(() => {
    initializeData();
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    router.push(action.route as any);
  };

  const handleNearbyStopPress = (stop: NearbyStop) => {
    // Navigate to search with this stop pre-selected
    router.push('/search');
  };

  const handleRoutePress = (route: PassengerRouteResponse) => {
    router.push('/search');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#004CFF" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004CFF" translucent={false} />
      
      {/* Enhanced Header with Gradient */}
      <View style={styles.modernHeader}>
        <View style={styles.headerGradientOverlay} />
        <View style={styles.headerLeft}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user?.profileImage || 'https://iamkavinda.vercel.app/assets/profile-photo-CCXUFtA8.jpeg' }} 
              style={styles.profileImage}
            />
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{user?.name ?? 'Welcome, Passenger'}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.location}>Colombo, Sri Lanka</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => router.push('/notifications/inbox')}
            activeOpacity={0.7}
          >
            <Bell size={20} color="rgba(255,255,255,0.9)" />
            {liveAlerts.length > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Settings size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Search Section */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.modernSearchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.95}
          >
            <View style={styles.searchIconContainer}>
              <Search size={22} color="#004CFF" />
            </View>
            <Text style={styles.modernSearchPlaceholder}>Where would you like to go?</Text>
            <View style={styles.voiceSearchButton}>
              <Zap size={18} color="#6B7280" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Live Alerts Section */}
        {liveAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            {liveAlerts.slice(0, 1).map(alert => (
              <TouchableOpacity key={alert.id} style={styles.alertCard} activeOpacity={0.8}>
                <View style={styles.alertIcon}>
                  <AlertTriangle size={16} color="#F59E0B" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
                <Text style={styles.alertTime}>{alert.timestamp}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Enhanced Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.modernQuickActions}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.modernActionCard}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.85}
              >
                <View style={[styles.modernActionIcon, { backgroundColor: action.backgroundColor }]}>
                  <action.icon size={22} color={action.color} />
                </View>
                <Text style={styles.modernActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Stops Section */}
        {nearbyStops.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Stops</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {nearbyStops.slice(0, 4).map(stop => (
                <TouchableOpacity
                  key={stop.id}
                  style={styles.nearbyStopCard}
                  onPress={() => handleNearbyStopPress(stop)}
                  activeOpacity={0.9}
                >
                  <View style={styles.stopHeader}>
                    <View style={styles.stopIconContainer}>
                      <MapPin size={16} color="#004CFF" />
                    </View>
                    <Text style={styles.stopDistance}>{stop.distance}</Text>
                  </View>
                  <Text style={styles.stopName} numberOfLines={2}>{stop.name}</Text>
                  <View style={styles.stopFooter}>
                    <Text style={styles.routeCount}>{stop.routeCount} routes</Text>
                    {stop.nextArrival && (
                      <Text style={styles.nextArrival}>{stop.nextArrival}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Active/Upcoming Trips Section */}
        {upcomingTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Trips</Text>
              <TouchableOpacity onPress={() => router.push('/tickets')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {upcomingTrips.slice(0, 3).map(trip => (
                <TouchableOpacity
                  key={trip.tripId}
                  style={styles.tripCard}
                  onPress={() => router.push('/search')}
                  activeOpacity={0.9}
                >
                  <View style={styles.tripCardHeader}>
                    <View style={styles.routeBadge}>
                      <Bus size={14} color="#004CFF" />
                      <Text style={styles.routeName}>{trip.routeName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#1DD72415' }]}>
                      <Text style={[styles.statusText, { color: '#1DD724' }]}>Active</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tripRouteContainer}>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopNameText} numberOfLines={1}>
                        {trip.departureStop?.name || 'Departure'}
                      </Text>
                      <Text style={styles.stopTime}>
                        {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </Text>
                    </View>
                    <View style={styles.routeLineContainer}>
                      <ArrowRight size={16} color="#6B7280" />
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopNameText} numberOfLines={1}>
                        {trip.arrivalStop?.name || 'Arrival'}
                      </Text>
                      <Text style={styles.stopTime}>
                        {trip.scheduledArrival ? new Date(trip.scheduledArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.tripFooter}>
                    <Text style={styles.fareText}>
                      {trip.fare ? `LKR ${trip.fare.toFixed(2)}` : 'Fare: TBA'}
                    </Text>
                    <Text style={styles.durationText}>
                      {trip.duration ? `${trip.duration}min` : '~45min'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Routes Section */}
        {recentRoutes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.routesContainer}>
              {recentRoutes.slice(0, 3).map((route, index) => (
                <TouchableOpacity 
                  key={route.routeId || index} 
                  style={styles.routeCard}
                  activeOpacity={0.9}
                  onPress={() => handleRoutePress(route)}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeTitle}>{route.routeName || `Route ${index + 1}`}</Text>
                      <Text style={styles.routeDistance}>
                        {route.distance ? `${route.distance}km` : '~25km'} • 
                        {route.estimatedDuration ? ` ${route.estimatedDuration}min` : ' ~45min'}
                      </Text>
                    </View>
                    <View style={styles.routeRating}>
                      <Star size={14} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.ratingText}>
                        {route.popularity || (4.5 - index * 0.2).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeStops}>
                    <View style={styles.stopPoint}>
                      <Text style={styles.stopNameText} numberOfLines={1}>
                        {route.fromStop?.name || 'Origin Stop'}
                      </Text>
                    </View>
                    <View style={styles.routeArrow}>
                      <ArrowRight size={16} color="#6B7280" />
                    </View>
                    <View style={styles.stopPoint}>
                      <Text style={styles.stopNameText} numberOfLines={1}>
                        {route.toStop?.name || 'Destination Stop'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeFooter}>
                    <Text style={styles.fareInfo}>
                      {route.fareInfo?.minimumFare ? `From LKR ${route.fareInfo.minimumFare}` : 'From LKR 50'}
                    </Text>
                    <Text style={styles.scheduleCount}>
                      {route.scheduleCount || 12} trips/day
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Travel Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <TrendingUp size={20} color="#1DD724" />
              <Text style={styles.insightTitle}>Best Time to Travel</Text>
              <Text style={styles.insightValue}>6:00 - 8:00 AM</Text>
              <Text style={styles.insightDesc}>Less crowded routes</Text>
            </View>
            <View style={styles.insightCard}>
              <Zap size={20} color="#FF8A00" />
              <Text style={styles.insightTitle}>Fastest Route</Text>
              <Text style={styles.insightValue}>Express 138</Text>
              <Text style={styles.insightDesc}>30% faster</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },

  // Modern header styles
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#004CFF',
    borderBottomWidth: 1,
    borderBottomColor: '#003CC7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,76,255,0.95)',
    borderRadius: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
    zIndex: 1,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#004CFF',
  },
  userInfo: {
    flex: 1,
    zIndex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Content and sections
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Search section styles
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  modernSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernSearchPlaceholder: {
    flex: 1,
    fontSize: 17,
    color: '#374151',
    fontWeight: '500',
  },
  voiceSearchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Alerts section
  alertsSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: '#A16207',
  },
  alertTime: {
    fontSize: 12,
    color: '#A16207',
    fontWeight: '500',
  },

  // Quick actions section
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  modernQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modernActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.06)',
  },
  modernActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Section styles
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingVertical: 28,
    borderRadius: 24,
    marginHorizontal: 20,
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Horizontal scroll
  horizontalScroll: {
    paddingLeft: 20,
  },

  // Nearby stops styles
  nearbyStopCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stopName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 36,
    lineHeight: 20,
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeCount: {
    fontSize: 12,
    color: '#64748B',
  },
  nextArrival: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },

  // Trip card styles
  tripCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004CFF',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tripRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  stopTime: {
    fontSize: 12,
    color: '#64748B',
  },
  routeLineContainer: {
    marginHorizontal: 8,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Routes section
  routesContainer: {
    paddingHorizontal: 20,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  routeDistance: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  routeStops: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopPoint: {
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 12,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  scheduleCount: {
    fontSize: 12,
    color: '#64748B',
  },

  // Insights styles
  insightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  insightValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  insightDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});