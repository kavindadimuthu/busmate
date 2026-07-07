import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  Bus, 
  Route, 
  Navigation, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  Phone,
  Info,
  Clock
} from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AppHeader from '../../components/ui/AppHeader';

// Example bus stop interface
interface BusStop {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  estimatedTime?: string;
  isNext?: boolean;
}

// Bus location interface
interface BusLocation {
  id: string;
  routeNumber?: string;
  busId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  heading: number;
  speed: number;
  lastUpdated: Date;
  nextStop?: string;
  estimatedArrival?: string;
  delay?: number; // in minutes
  status: 'on-time' | 'delayed' | 'early';
}

export default function TrackingMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const searchType = params.searchType as 'route' | 'bus';
  const searchValue = params.searchValue as string;
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [routePath, setRoutePath] = useState<{latitude: number, longitude: number}[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [showAllStops, setShowAllStops] = useState(true);
  
  // Colombo coordinates as default center
  const initialRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  
  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to show your position on the map.');
        return;
      }
      
      try {
        // Get user's current location
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        // Load mock data based on search type
        loadMockData();
      } catch (error) {
        console.error('Error getting location', error);
        // Still load mock data even if location fails
        loadMockData();
      }
    })();
  }, []);
  
  const loadMockData = () => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      if (searchType === 'route') {
        // Mock data for route tracking (Route 138: Colombo Fort - Kadawatha)
        const mockBusStops: BusStop[] = [
          { 
            id: '1', 
            name: 'Colombo Fort', 
            location: { latitude: 6.9271, longitude: 79.8612 },
            estimatedTime: 'Departed'
          },
          { 
            id: '2', 
            name: 'Maradana', 
            location: { latitude: 6.9304, longitude: 79.8644 },
            estimatedTime: 'Departed'
          },
          { 
            id: '3', 
            name: 'Borella', 
            location: { latitude: 6.9126, longitude: 79.8777 },
            estimatedTime: 'Departed',
          },
          { 
            id: '4', 
            name: 'Kirulapone', 
            location: { latitude: 6.8904, longitude: 79.8798 },
            estimatedTime: '2 min',
            isNext: true
          },
          { 
            id: '5', 
            name: 'Nugegoda', 
            location: { latitude: 6.8649, longitude: 79.8996 },
            estimatedTime: '12 min'
          },
          { 
            id: '6', 
            name: 'Maharagama', 
            location: { latitude: 6.8427, longitude: 79.9198 },
            estimatedTime: '23 min'
          },
          { 
            id: '7', 
            name: 'Kadawatha', 
            location: { latitude: 6.9407, longitude: 79.9522 },
            estimatedTime: '38 min'
          }
        ];
        
        const mockBuses: BusLocation[] = [
          {
            id: '1',
            routeNumber: '138',
            busId: 'SL-6743',
            location: { latitude: 6.9000, longitude: 79.8780 },
            heading: 45,
            speed: 25,
            lastUpdated: new Date(),
            nextStop: 'Kirulapone',
            estimatedArrival: '2 min',
            status: 'on-time'
          },
          {
            id: '2',
            routeNumber: '138',
            busId: 'SL-8251',
            location: { latitude: 6.9238, longitude: 79.8650 },
            heading: 120,
            speed: 18,
            lastUpdated: new Date(),
            nextStop: 'Maradana',
            estimatedArrival: '3 min',
            delay: 5,
            status: 'delayed'
          }
        ];
        
        const mockRoutePath = [
          { latitude: 6.9271, longitude: 79.8612 }, // Colombo Fort
          { latitude: 6.9304, longitude: 79.8644 }, // Maradana
          { latitude: 6.9126, longitude: 79.8777 }, // Borella
          { latitude: 6.8904, longitude: 79.8798 }, // Kirulapone
          { latitude: 6.8649, longitude: 79.8996 }, // Nugegoda
          { latitude: 6.8427, longitude: 79.9198 }, // Maharagama
          { latitude: 6.9407, longitude: 79.9522 }  // Kadawatha
        ];
        
        setBusStops(mockBusStops);
        setBusLocations(mockBuses);
        setRoutePath(mockRoutePath);
        
        // Focus on first bus
        if (mockBuses.length > 0) {
          setSelectedBus(mockBuses[0]);
          
          // Zoom to show the route
          mapRef.current?.fitToCoordinates(mockRoutePath, {
            edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
            animated: true
          });
        }
      } else {
        // Mock data for specific bus tracking
        const mockBus: BusLocation = {
          id: '1',
          routeNumber: '001',
          busId: searchValue.split(' ')[0],
          location: { latitude: 6.8904, longitude: 79.8798 },
          heading: 45,
          speed: 32,
          lastUpdated: new Date(),
          nextStop: 'Nugegoda',
          estimatedArrival: '5 min',
          status: 'on-time'
        };
        
        // Some stops for this specific bus
        const mockStops: BusStop[] = [
          { 
            id: '1', 
            name: 'Colombo Fort', 
            location: { latitude: 6.9271, longitude: 79.8612 },
            estimatedTime: 'Departed'
          },
          { 
            id: '4', 
            name: 'Kirulapone', 
            location: { latitude: 6.8904, longitude: 79.8798 },
            estimatedTime: 'Departed'
          },
          { 
            id: '5', 
            name: 'Nugegoda', 
            location: { latitude: 6.8649, longitude: 79.8996 },
            estimatedTime: '5 min',
            isNext: true
          }
        ];
        
        setBusLocations([mockBus]);
        setBusStops(mockStops);
        setSelectedBus(mockBus);
        
        // Center on the bus with adequate zoom
        mapRef.current?.animateToRegion({
          latitude: mockBus.location.latitude,
          longitude: mockBus.location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02
        }, 500);
      }
      
      setLoading(false);
      setLastRefreshed(new Date());
    }, 1500);
  };
  
  const refreshData = () => {
    setRefreshing(true);
    
    // Simulate refreshing data
    setTimeout(() => {
      // In a real app, you would fetch updated location data here
      
      // For demo, let's move the buses a bit to simulate movement
      if (busLocations.length > 0) {
        const updatedBuses = busLocations.map(bus => ({
          ...bus,
          location: {
            latitude: bus.location.latitude + (Math.random() * 0.002 - 0.001),
            longitude: bus.location.longitude + (Math.random() * 0.002 - 0.001)
          },
          lastUpdated: new Date()
        }));
        
        setBusLocations(updatedBuses);
        
        // Update selected bus if there was one
        if (selectedBus) {
          const updatedSelectedBus = updatedBuses.find(bus => bus.id === selectedBus.id);
          if (updatedSelectedBus) {
            setSelectedBus(updatedSelectedBus);
          }
        }
      }
      
      setRefreshing(false);
      setLastRefreshed(new Date());
    }, 1000);
  };
  
  const centerOnBus = (bus: BusLocation) => {
    mapRef.current?.animateToRegion({
      latitude: bus.location.latitude,
      longitude: bus.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 500);
    
    setSelectedBus(bus);
  };
  
  const toggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };
  
  const toggleStopsVisibility = () => {
    setShowAllStops(!showAllStops);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getBusStatusColor = (status: 'on-time' | 'delayed' | 'early') => {
    switch (status) {
      case 'on-time': return '#1DD724';
      case 'delayed': return '#FF3831';
      case 'early': return '#FFB800';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader 
        title={searchType === 'route' ? 'Route Tracking' : 'Bus Tracking'}
        rightElement={
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshData}
            disabled={refreshing}
          >
            <RefreshCw 
              size={20} 
              color="#FFFFFF" 
              style={refreshing ? styles.rotating : undefined} 
            />
          </TouchableOpacity>
        }
      />
      
      {/* Search Value Display */}
      <View style={styles.searchValueContainer}>
        <Text style={styles.searchValueText}>{searchValue}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      ) : (
        <>
          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              mapType={mapType}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              rotateEnabled={true}
              loadingEnabled={true}
              zoomControlEnabled={true}
            >
              {/* Route Path */}
              {routePath.length > 0 && (
                <Polyline
                  coordinates={routePath}
                  strokeColor="#004CFF"
                  strokeWidth={3}
                  lineDashPattern={[1, 2]}
                />
              )}
              
              {/* Bus Stops */}
              {showAllStops && busStops.map(stop => (
                <Marker
                  key={stop.id}
                  coordinate={stop.location}
                  title={stop.name}
                  description={stop.estimatedTime ? `ETA: ${stop.estimatedTime}` : undefined}
                  pinColor={stop.isNext ? "#FF3831" : "#6B7280"}
                  tracksViewChanges={false}
                />
              ))}
              
              {/* Bus Locations */}
              {busLocations.map(bus => (
                <Marker
                  key={bus.id}
                  coordinate={bus.location}
                  title={`Bus ${bus.busId}`}
                  description={`Next stop: ${bus.nextStop}`}
                  tracksViewChanges={false}
                >
                  <View style={[
                    styles.busMarker, 
                    selectedBus?.id === bus.id && styles.selectedBusMarker
                  ]}>
                    <Bus 
                      size={16} 
                      color={selectedBus?.id === bus.id ? "#FFFFFF" : "#004CFF"} 
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
            
            {/* Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity 
                style={styles.mapControl}
                onPress={toggleMapType}
              >
                <Eye size={20} color="#004CFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mapControl}
                onPress={toggleStopsVisibility}
              >
                <Navigation size={20} color="#004CFF" />
              </TouchableOpacity>
              {userLocation && (
                <TouchableOpacity 
                  style={styles.mapControl}
                  onPress={() => {
                    mapRef.current?.animateToRegion({
                      ...userLocation,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01
                    }, 500);
                  }}
                >
                  <Info size={20} color="#004CFF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Last Updated */}
            <View style={styles.lastUpdatedContainer}>
              <Clock size={12} color="#6B7280" />
              <Text style={styles.lastUpdatedText}>
                Updated at {formatTime(lastRefreshed)}
              </Text>
            </View>
          </View>
          
          {/* Bus Info Panel */}
          {selectedBus && (
            <View style={styles.busInfoPanel}>
              <View style={styles.busInfoHeader}>
                <View>
                  <View style={styles.busRouteContainer}>
                    <Text style={styles.busRouteText}>
                      Route {selectedBus.routeNumber}
                    </Text>
                  </View>
                  <Text style={styles.busIdText}>Bus ID: {selectedBus.busId}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getBusStatusColor(selectedBus.status)}15` }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getBusStatusColor(selectedBus.status) }
                  ]}>
                    {selectedBus.status === 'on-time' ? 'On Time' : 
                     selectedBus.status === 'delayed' ? `Delayed ${selectedBus.delay} min` : 'Early'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.busInfoDetails}>
                <View style={styles.detailItem}>
                  <Navigation size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Next stop: {selectedBus.nextStop}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Estimated arrival: {selectedBus.estimatedArrival}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <AlertCircle size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Speed: {selectedBus.speed} km/h
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => {
                  Alert.alert('Report Issue', 'This feature will allow reporting issues with this bus in a real app.');
                }}
              >
                <Phone size={16} color="#004CFF" />
                <Text style={styles.reportButtonText}>Contact Driver</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  searchValueContainer: {
    backgroundColor: '#004CFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchValueText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lastUpdatedContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  busInfoPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  busInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  busRouteContainer: {
    backgroundColor: '#EBF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  busRouteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  busIdText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  busInfoDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2FF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#004CFF',
  },
  busMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedBusMarker: {
    backgroundColor: '#004CFF',
    transform: [{ scale: 1.2 }],
  },
});