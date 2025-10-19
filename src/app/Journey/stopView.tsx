import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView
} from 'react-native';
import { useOngoingTrip } from '../../hooks/employee/useOngoingTrip';
import { journeyApi } from '../../services/api/journey';
import { EnhancedStop, RouteStop, ScheduleStop } from '../../types/journey';

export default function StopViewScreen() {
  const { ongoingTrip } = useOngoingTrip();
  const [stops, setStops] = useState<EnhancedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Function to merge route stops with schedule times
  const mergeRouteAndScheduleData = (routeStops: RouteStop[], scheduleStops: ScheduleStop[]): EnhancedStop[] => {
    return routeStops.map((routeStop) => {
      // Find matching schedule stop by stopId
      const scheduleStop = scheduleStops.find(ss => ss.stopId === routeStop.stopId);
      
      return {
        stopId: routeStop.stopId,
        stopName: routeStop.stopName,
        stopOrder: routeStop.stopOrder,
        distanceFromStart: routeStop.distanceFromStartKm,
        latitude: routeStop.location?.latitude,
        longitude: routeStop.location?.longitude,
        // Use schedule times if available, otherwise indicate not available
        arrivalTime: scheduleStop?.arrivalTime?.substring(0, 5) || 'N/A',
        departureTime: scheduleStop?.departureTime?.substring(0, 5) || 'N/A',
        actualArrivalTime: undefined, // Will be set when conductor marks arrival
        actualDepartureTime: undefined, // Will be set when conductor marks departure
        status: 'pending' as const,
        hasScheduledTime: !!scheduleStop // Flag to track if this stop has scheduled times
      };
    });
  };

  // Fetch stops data function
  const fetchStops = async (isRefresh = false) => {
    if (!ongoingTrip?.scheduleId || !ongoingTrip?.RouteId) {
      setError('No ongoing trip found. Please start a trip first.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      
      console.log('🚌 Fetching stops data for:');
      console.log('� Schedule ID:', ongoingTrip.scheduleId);
      console.log('🛣️  Route ID:', ongoingTrip.RouteId);
      
      // Make both API calls in parallel
      const [routeStops, scheduleStops] = await Promise.all([
        journeyApi.getRouteStops(ongoingTrip.RouteId).catch(err => {
          console.warn('Route stops failed:', err);
          return []; // Return empty array if route stops fail
        }),
        journeyApi.getScheduleStops(ongoingTrip.scheduleId).catch(err => {
          console.warn('Schedule stops failed:', err);
          return []; // Return empty array if schedule stops fail
        })
      ]);
      
      console.log('✅ Route stops received:', routeStops.length, 'stops');
      console.log('📅 Schedule stops received:', scheduleStops.length, 'stops');
      
      if (!routeStops || routeStops.length === 0) {
        throw new Error('No stops found for this route. Please contact support.');
      }
      
      // Sort route stops by order to ensure correct sequence
      const sortedRouteStops = routeStops.sort((a, b) => a.stopOrder - b.stopOrder);
      
      // Merge route data with schedule times
      const enhancedStops = mergeRouteAndScheduleData(sortedRouteStops, scheduleStops);
      
     console.log(
        '🔧 Enhanced stops with merged data:\n' +
        JSON.stringify(enhancedStops.map((s: EnhancedStop) => ({
          name: s.stopName,
          arrivalTime: s.arrivalTime,
          departureTime: s.departureTime,
          distance: s.distanceFromStart,
          hasScheduledTime: s.hasScheduledTime,
          hasLocation: !!(s.latitude && s.longitude)
        })), null, 2)
     );
      
      setStops(enhancedStops);
      
      // Find current stop index (first stop that hasn't departed yet)
      const currentIndex = enhancedStops.findIndex((stop: EnhancedStop) => 
        stop.status !== 'departed'
      );
      setCurrentStopIndex(currentIndex >= 0 ? currentIndex : 0);
      
    } catch (err) {
      console.error(' Error fetching stops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to load stop information';
      setError(errorMessage);
      setStops([]); // Clear any existing stops
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchStops(true);
  };

  // Fetch stops data when component mounts
  useEffect(() => {
    fetchStops();
  }, [ongoingTrip?.scheduleId, ongoingTrip?.RouteId]);

  // Get route information
  const startStop = stops.length > 0 ? stops[0] : null;
  const endStop = stops.length > 0 ? stops[stops.length - 1] : null;
  const currentStop = stops[currentStopIndex] || null;
  const nextStop = currentStopIndex < stops.length - 1 ? stops[currentStopIndex + 1] : null;
  
  // Get completed stops
  const completedStops = stops.filter(stop => stop.status === 'departed');
  const latestPassedStop = completedStops.length > 0 ? completedStops[completedStops.length - 1] : null;
  
  // Helper functions for time formatting and calculations
  const formatTime = (timeString: string): string => {
    try {
      return new Date(`2000-01-01T${timeString}:00`).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'Asia/Colombo'
      });
    } catch {
      return timeString;
    }
  };

  // Get current time in Sri Lankan timezone
  const getCurrentSriLankanTime = () => {
    const now = new Date();
    const sriLankanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
    return sriLankanTime.toTimeString().substring(0, 5); // HH:MM format
    
  };


  // Calculate time difference for completed stops
  const getTimeDifference = (stop: EnhancedStop) => {
    if (!stop.hasScheduledTime || !stop.actualArrivalTime || !stop.arrivalTime || stop.arrivalTime === 'N/A') {
      return { text: 'No schedule', color: '#999', status: 'no_schedule' };
    }
    
    const expectedTime = new Date(`2000-01-01T${stop.arrivalTime}:00`);
    const actualTime = new Date(`2000-01-01T${stop.actualArrivalTime}:00`);
    const diffMinutes = Math.round((actualTime.getTime() - expectedTime.getTime()) / (1000 * 60));
    
    if (diffMinutes > 5) {
      return { text: `${diffMinutes} min late`, color: '#FF3B30', status: 'late' };
    } else if (diffMinutes > 0) {
      return { text: `${diffMinutes} min late`, color: '#FF9500', status: 'slightly_late' };
    } else if (diffMinutes < -2) {
      return { text: `${Math.abs(diffMinutes)} min early`, color: '#33CC33', status: 'early' };
    } else {
      return { text: 'On time', color: '#33CC33', status: 'on_time' };
    }
  };
  
  // Get stop status by index
  const getStopStatus = (stopIndex: number) => {
    const stop = stops[stopIndex];
    if (!stop) return 'upcoming';
    return stop.status === 'departed' ? 'completed' : 
           stop.status === 'arrived' ? 'current' : 
           stopIndex === currentStopIndex ? 'current' : 'upcoming';
  };

  // Handle stop action
  const handleStopAction = (stopIndex: number, action: 'arrived' | 'departed') => {
    const stop = stops[stopIndex];
    if (!stop) return;
    
    Alert.alert(
      `Mark ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Mark ${stop.stopName} as ${action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const currentTime = getCurrentSriLankanTime();
            
            // Update the local state with real-time timestamps
            const updatedStops = stops.map((s, index) => {
              if (index === stopIndex) {
                if (action === 'arrived') {
                  return { 
                    ...s, 
                    status: 'arrived', 
                    actualArrivalTime: currentTime 
                  };
                } else {
                  return { 
                    ...s, 
                    status: 'departed', 
                    actualDepartureTime: currentTime 
                  };
                }
              }
              return s;
            }) as EnhancedStop[];
            
            setStops(updatedStops);
            
            // Move to next stop if departed
            if (action === 'departed' && stopIndex === currentStopIndex) {
              setCurrentStopIndex(Math.min(stopIndex + 1, stops.length - 1));
            }
            
            // TODO: Persist to backend API when available
            try {
              if (action === 'arrived' && ongoingTrip?.scheduleId) {
                // await journeyApi.recordStopArrival(ongoingTrip.scheduleId, stop.stopId, new Date().toISOString());
                console.log('Recording arrival for stop:', stop.stopName, 'at', currentTime);
              }
              if (action === 'departed' && ongoingTrip?.scheduleId) {
                // await journeyApi.recordStopDeparture(ongoingTrip.scheduleId, stop.stopId, new Date().toISOString());
                console.log('Recording departure for stop:', stop.stopName, 'at', currentTime);
              }
            } catch (err) {
              console.warn('Failed to persist stop action to server', err);
            }
            
            Alert.alert('Success', `${stop.stopName} marked as ${action} at ${formatTime(currentTime)}`);
          }
        }
      ]
    );
  };

  // Render status indicator for a stop
  const renderStatusIndicator = (stopIndex: number) => {
    const status = getStopStatus(stopIndex);
    const stop = stops[stopIndex];
    
    if (!stop) return null;
    
    if (status === 'upcoming') {
      return <Text style={styles.notVisitedText}>—</Text>;
    }

    if (status === 'current') {
      const isArrived = stop.status === 'arrived';
      
      return (
        <View>
          <View style={styles.nextStopBadge}>
            <Text style={styles.nextStopText}>
              {isArrived ? 'Ready to Depart' : 'Current Stop'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, isArrived && styles.departButton]}
            onPress={() => handleStopAction(stopIndex, isArrived ? 'departed' : 'arrived')}
          >
            <Text style={styles.actionButtonText}>
              {isArrived ? 'Mark Departed' : 'Mark Arrived'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'completed') {
      const timeDiff = getTimeDifference(stop);
      const isLate = timeDiff.status === 'late' || timeDiff.status === 'slightly_late';
      return (
        <View>
          <View style={isLate ? styles.lateBadge : styles.onTimeBadge}>
            <Ionicons 
              name={isLate ? "time" : "checkmark"} 
              size={12} 
              color={isLate ? "#FF3B30" : "#22C55E"} 
            />
            <Text style={isLate ? styles.lateText : styles.onTimeText}>
              {timeDiff.text}
            </Text>
          </View>
          <Text style={isLate ? styles.actualTimeLate : styles.actualTimeOnTime}>
            Actual: {stop.actualDepartureTime ? formatTime(stop.actualDepartureTime) : 'N/A'}
          </Text>
        </View>
      );
    }

    return null;
  };

  // Render time marker (circle) for a stop
  const renderTimeMarker = (stopIndex: number) => {
    const status = getStopStatus(stopIndex);
    const stop = stops[stopIndex];
    
    if (!stop) return null;
    
    if (status === 'current') {
      return (
        <View style={styles.currentStopMarker}>
          <View style={styles.currentStopInner} />
        </View>
      );
    }

    if (status === 'completed') {
      const timeDiff = getTimeDifference(stop);
      const isLate = timeDiff.status === 'late';
      
      if (isLate) {
        return (
          <View style={styles.lateStopMarker}>
            <Ionicons name="time" size={20} color="white" />
          </View>
        );
      }
      
      return (
        <View style={styles.completedStopMarker}>
          <Ionicons name="checkmark" size={20} color="white" />
        </View>
      );
    }

    return <View style={styles.upcomingStopMarker} />;
  };

  // Calculate progress
  const totalStops = stops.length;
  const completedStopsCount = completedStops.length;
  const progressPercentage = totalStops > 0 ? Math.round((completedStopsCount / totalStops) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading stop information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Stops</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {(ongoingTrip?.scheduleId || ongoingTrip?.RouteId) && (
            <Text style={styles.errorDetails}>
              {ongoingTrip?.scheduleId && `Schedule ID: ${ongoingTrip.scheduleId}`}
              {ongoingTrip?.scheduleId && ongoingTrip?.RouteId && '\n'}
              {ongoingTrip?.RouteId && `Route ID: ${ongoingTrip.RouteId}`}
            </Text>
          )}
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchStops()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Pull down to refresh or contact support if the problem persists
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" translucent={false} />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stop View</Text>
        <View style={{ width: 24 }} />
      </View> */}
      
      {/* Route Info Banner */}
      <View style={styles.routeBanner}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeNumber}>Route  {ongoingTrip?.routeName || 'N/A'}</Text>
          <Text style={styles.routeName}>
            {startStop?.stopName || 'Start'} → {endStop?.stopName || 'End'}
          </Text>
        </View>
        
        <View style={styles.journeyInfo}>
          <Text style={styles.journeyLabel}>Journey Started</Text>
          <Text style={styles.journeyTime}>
            {startStop ? formatTime(startStop.departureTime) : '--:--'}
          </Text>
          <Text style={styles.progressText}>{completedStopsCount}/{totalStops} stops</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066FF']}
            tintColor="#0066FF"
            title="Pull to refresh stops..."
            titleColor="#666"
          />
        }
      >
        {/* Latest Passed Stop Card */}
        {latestPassedStop && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Passed Stop</Text>
            <View style={styles.passedStopCard}>
              <View style={styles.passedStopIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              </View>
              <View style={styles.passedStopInfo}>
                <Text style={styles.passedStopName}>{latestPassedStop.stopName}</Text>
                <Text style={styles.passedStopTime}>
                  Completed at {latestPassedStop.actualDepartureTime ? 
                    formatTime(latestPassedStop.actualDepartureTime) : 'N/A'}
                </Text>
                <Text style={styles.passedStopStatus}>
                  {latestPassedStop.hasScheduledTime ? 
                    getTimeDifference(latestPassedStop).text : 
                    'No schedule to compare'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Next Stop Card */}
        {nextStop && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Stop</Text>
            <View style={styles.nextStopCard}>
              <Ionicons name="location" size={24} color="#0066FF" />
              <View style={styles.nextStopInfo}>
                <Text style={styles.nextStopLabel}>Next Stop</Text>
                <Text style={styles.nextStopName}>
                  {nextStop.stopName} - {nextStop.hasScheduledTime ? 
                    `ETA ${formatTime(nextStop.arrivalTime)}` : 
                    'ETA not available'}
                </Text>
                <Text style={styles.nextStopDistance}>
                  {nextStop.distanceFromStart - (currentStop?.distanceFromStart || 0)} km away
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Journey Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressBarLabel}>Journey Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressBarText}>{progressPercentage}% Complete</Text>
        </View>
        
        {/* All Stops Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>All Stops</Text>
          {stops.map((stop, index) => {
            const isLast = index === stops.length - 1;
            
            return (
              <View key={stop.stopId} style={styles.timelineItem}>
                {/* Time Marker and Connecting Line */}
                <View style={styles.timelineMarkerContainer}>
                  {renderTimeMarker(index)}
                  {!isLast && <View style={styles.timelineConnector} />}
                </View>
                
                {/* Stop Information */}
                <View 
                  style={[
                    styles.stopInfoCard,
                    getStopStatus(index) === 'current' && styles.currentStopCard
                  ]}
                >
                  <View style={styles.stopMainInfo}>
                    <Text style={styles.stopName}>
                      {index + 1}. {stop.stopName}
                    </Text>
                    {stop.hasScheduledTime ? (
                      <Text style={styles.expectedTime}>
                        Expected Time: {formatTime(stop.departureTime)}
                      </Text>
                    ) : (
                      <Text style={styles.noScheduleTime}>
                        Expected time not available
                      </Text>
                    )}
                    <Text style={styles.kmInfo}> 
                      {stop.distanceFromStart} km from start
                    </Text>
                    
                  </View>
                  
                  <View style={styles.stopStatusContainer}>
                    {renderStatusIndicator(index)}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Journey Summary */}
        <View style={styles.summarySeparator} />
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValueGreen}>{completedStopsCount}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>On Time</Text>
            <Text style={styles.summaryValue}>
              {completedStops.filter(stop => {
                const timeDiff = getTimeDifference(stop);
                return timeDiff.status === 'on_time' || timeDiff.status === 'early';
              }).length}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ETA Final</Text>
            <Text style={styles.summaryValue}>
              {endStop && endStop.hasScheduledTime ? 
                formatTime(endStop.arrivalTime) : 
                'Not available'}
            </Text>
          </View>
        </View>
        
        {/* Additional Journey Stats */}
        <View style={styles.additionalStatsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Distance:</Text>
            <Text style={styles.statValue}>
              {endStop ? endStop.distanceFromStart : 0} km
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Progress:</Text>
            <Text style={styles.statValue}>
              {currentStop ? currentStop.distanceFromStart : 0} km
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Journey Progress:</Text>
            <Text style={styles.statValue}>{progressPercentage}%</Text>
          </View>
        </View>
        
        {/* Bottom padding for scroll */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  errorSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
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
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  
  // Passed Stop Card
  passedStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  passedStopIcon: {
    marginRight: 12,
  },
  passedStopInfo: {
    flex: 1,
  },
  passedStopName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  passedStopTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  passedStopStatus: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  
  // KM Info
  kmInfo: {
    fontSize: 12,
    color: '#999',
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorDetails: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Route Banner
  routeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  routeInfo: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  journeyInfo: {
    alignItems: 'flex-end',
  },
  journeyLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  journeyTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 12,
    color: '#0066FF',
    marginTop: 2,
  },
  
  // Content
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    padding: 16,
  },
  
  // Next Stop Card
  nextStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nextStopInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nextStopLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 4,
  },
  nextStopName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 2,
  },
  nextStopDistance: {
    fontSize: 14,
    color: '#666',
  },
  
  // Progress Bar
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  
  // Timeline
  timelineContainer: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineMarkerContainer: {
    alignItems: 'center',
    width: 40,
  },
  timelineConnector: {
    width: 2,
    height: 80,
    backgroundColor: '#E0E0E0',
  },
  completedStopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStopInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  lateStopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingStopMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  
  // Stop Info Cards
  stopInfoCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  currentStopCard: {
    borderWidth: 2,
    borderColor: '#0066FF',
    backgroundColor: '#FFFFFF',
  },
  stopMainInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  expectedTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  noScheduleTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  stopStatusContainer: {
    alignItems: 'flex-end',
  },
  
  // Status Badges
  onTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onTimeText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
    marginLeft: 3,
  },
  lateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lateText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 3,
  },
  nextStopBadge: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  nextStopText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '500',
  },
  
  // Action Button
  actionButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  departButton: {
    backgroundColor: '#22C55E',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Time Display
  actualTimeOnTime: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 4,
    textAlign: 'right',
  },
  actualTimeLate: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
    textAlign: 'right',
  },
  departureTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  notVisitedText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  finalStopText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Summary
  summarySeparator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueGreen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  
  // Additional Stats
  additionalStatsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValueRed: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
});