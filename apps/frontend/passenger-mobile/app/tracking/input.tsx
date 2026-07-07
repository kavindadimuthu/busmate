import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bus, Route, Map, MapPin, Clock } from 'lucide-react-native';
import AppHeader from '../../components/ui/AppHeader';

interface RecentSearch {
  id: string;
  type: 'route' | 'bus';
  value: string;
  timestamp: Date;
}

interface PopularRoute {
  id: string;
  routeNumber: string;
  from: string;
  to: string;
}

export default function TrackInputScreen() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'route' | 'bus'>('route');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
    { id: '1', type: 'route', value: 'Route 138: Colombo Fort - Kadawatha', timestamp: new Date() },
    { id: '2', type: 'bus', value: 'SL-6743 (SLTB Express)', timestamp: new Date() },
    { id: '3', type: 'route', value: 'Route 001: Colombo Fort - Kandy', timestamp: new Date() },
  ]);
  
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([
    { id: '1', routeNumber: '138', from: 'Colombo Fort', to: 'Kadawatha' },
    { id: '2', routeNumber: '001', from: 'Colombo Fort', to: 'Kandy' },
    { id: '3', routeNumber: '122', from: 'Colombo Fort', to: 'Gampaha' },
    { id: '4', routeNumber: '177', from: 'Kadawatha', to: 'Galle' },
    { id: '5', routeNumber: '245', from: 'Kandy', to: 'Nuwara Eliya' },
    { id: '6', routeNumber: '099', from: 'Colombo', to: 'Jaffna' }
  ]);

  const handleSearch = () => {
    if (!searchText.trim()) return;
    
    setIsLoading(true);
    
    // In a real app, this would call an API to search for the bus/route
    setTimeout(() => {
      // Add to recent searches
      const newSearch = {
        id: Date.now().toString(),
        type: searchType,
        value: searchText,
        timestamp: new Date()
      };
      
      setRecentSearches(prev => [newSearch, ...prev.slice(0, 4)]);
      
      // Navigate to map screen with the search parameters
      router.push({
        pathname: '/tracking/map',
        params: {
          searchType,
          searchValue: searchText
        }
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleSelectRoute = (route: PopularRoute) => {
    const routeValue = `Route ${route.routeNumber}: ${route.from} - ${route.to}`;
    
    // Add to recent searches
    const newSearch = {
      id: Date.now().toString(),
      type: 'route',
      value: routeValue,
      timestamp: new Date()
    };
    
    setRecentSearches(prev => [newSearch, ...prev.slice(0, 4)]);
    
    // Navigate to map with the route info
    router.push({
      pathname: '/tracking/map',
      params: {
        searchType: 'route',
        searchValue: routeValue,
        routeNumber: route.routeNumber,
        from: route.from,
        to: route.to
      }
    });
  };
  
  const handleRecentSearch = (search: RecentSearch) => {
    // Navigate to map with the recent search info
    router.push({
      pathname: '/tracking/map',
      params: {
        searchType: search.type,
        searchValue: search.value
      }
    });
  };
  
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader title="Track Bus" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          {/* Search Type Toggle */}
          <View style={styles.searchTypeContainer}>
            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                searchType === 'route' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('route')}
            >
              <Route size={16} color={searchType === 'route' ? '#FFFFFF' : '#6B7280'} />
              <Text 
                style={[
                  styles.searchTypeText,
                  searchType === 'route' && styles.searchTypeTextActive
                ]}
              >
                Track by Route
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                searchType === 'bus' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('bus')}
            >
              <Bus size={16} color={searchType === 'bus' ? '#FFFFFF' : '#6B7280'} />
              <Text 
                style={[
                  styles.searchTypeText,
                  searchType === 'bus' && styles.searchTypeTextActive
                ]}
              >
                Track by Bus ID
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <Text style={styles.inputLabel}>
              {searchType === 'route' ? 'Enter Route Number' : 'Enter Bus ID'}
            </Text>
            <View style={styles.inputWrapper}>
              {searchType === 'route' ? (
                <Route size={18} color="#6B7280" />
              ) : (
                <Bus size={18} color="#6B7280" />
              )}
              <TextInput
                style={styles.input}
                placeholder={searchType === 'route' ? "e.g. 138, 001, etc." : "e.g. SL-1234, NW-5678"}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            
            {/* Search Button */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isLoading || !searchText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Map size={18} color="#FFFFFF" />
                  <Text style={styles.searchButtonText}>Track Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              
              {recentSearches.map((search) => (
                <TouchableOpacity
                  key={search.id}
                  style={styles.recentSearchItem}
                  onPress={() => handleRecentSearch(search)}
                >
                  <View style={styles.recentSearchIcon}>
                    {search.type === 'route' ? (
                      <Route size={16} color="#004CFF" />
                    ) : (
                      <Bus size={16} color="#004CFF" />
                    )}
                  </View>
                  <Text style={styles.recentSearchText}>{search.value}</Text>
                  <View style={styles.recentSearchTime}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.recentSearchTimeText}>
                      {search.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Routes */}
          {searchType === 'route' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              <View style={styles.routesGrid}>
                {popularRoutes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={styles.routeCard}
                    onPress={() => handleSelectRoute(route)}
                  >
                    <View style={styles.routeNumberContainer}>
                      <Text style={styles.routeNumber}>{route.routeNumber}</Text>
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeFrom}>{route.from}</Text>
                      <View style={styles.routeArrow}>
                        <View style={styles.routeArrowLine} />
                        <MapPin size={12} color="#FF3831" />
                      </View>
                      <Text style={styles.routeTo}>{route.to}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpTextContainer}>
            <Text style={styles.helpText}>
              Live tracking allows you to see the real-time location of buses on their routes.
              Select a route number or enter a specific bus ID to begin tracking.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  sectionContainer: {
    padding: 24,
    gap: 24,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchTypeButtonActive: {
    backgroundColor: '#004CFF',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  searchTypeTextActive: {
    color: '#FFFFFF',
  },
  searchInputContainer: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004CFF',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentSearchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  recentSearchTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentSearchTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeNumberContainer: {
    backgroundColor: '#EBF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  routeInfo: {
    gap: 8,
  },
  routeFrom: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  routeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeArrowLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  routeTo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  helpTextContainer: {
    backgroundColor: '#EBF2FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#004CFF',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
});