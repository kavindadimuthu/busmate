import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Filter } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import BusRouteCard from '../../components/BusRouteCard';
import RouteFilterModal from '../../components/modals/NewRouteFilterModal';
import AppHeader from '../../components/ui/AppHeader';
import { PassengerApIsService, PassengerTripResponse } from '../../lib/api-client/route-management';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

interface FilterOptionsType {
  travelDate: Date;
  departureTimeFrom?: string;
  departureTimeTo?: string;
  operatorType?: 'PRIVATE' | 'CTB';
  operatorId?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed';
  passengers: number;
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [trips, setTrips] = useState<PassengerTripResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safeAreaStyle = useSafeAreaContainerStyles();

  // Parse parameters from search
  const fromStopId = params.fromStopId as string;
  const toStopId = params.toStopId as string;
  const fromStopName = params.fromStopName as string || 'Origin';
  const toStopName = params.toStopName as string || 'Destination';
  const passengers = parseInt(params.passengers as string) || 1;
  
  // Parse travel date
  const travelDate = (() => {
    if (params.travelDate && typeof params.travelDate === 'string' && params.travelDate.trim() !== '') {
      const parsedDate = new Date(params.travelDate);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  })();
  
  // Parse filter options from params or use defaults
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>(() => {
    if (params.filters) {
      try {
        const parsed = JSON.parse(params.filters as string);
        return {
          travelDate: parsed.travelDate ? new Date(parsed.travelDate) : travelDate,
          departureTimeFrom: params.departureTimeFrom as string || parsed.departureTimeFrom,
          departureTimeTo: params.departureTimeTo as string || parsed.departureTimeTo,
          operatorType: params.operatorType as ('PRIVATE' | 'CTB') || parsed.operatorType,
          operatorId: params.operatorId as string || parsed.operatorId,
          status: parsed.status,
          passengers: passengers
        };
      } catch (e) {
        console.error('Error parsing filter options:', e);
      }
    }
    return {
      travelDate: travelDate,
      departureTimeFrom: params.departureTimeFrom as string,
      departureTimeTo: params.departureTimeTo as string,
      operatorType: params.operatorType as ('PRIVATE' | 'CTB'),
      operatorId: params.operatorId as string,
      status: undefined,
      passengers: passengers
    };
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'cheapest', label: 'Cheapest' },
    { id: 'fastest', label: 'Fastest' },
    { id: 'highest-rated', label: 'Highest Rated' }
  ];

    // Fetch trips from API based on search criteria and filters
  useEffect(() => {
    const fetchTrips = async () => {
      if (!fromStopId || !toStopId) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await PassengerApIsService.searchTrips(
          fromStopId,
          toStopId,
          undefined, // routeId
          filterOptions.travelDate.toISOString().split('T')[0], // travelDate in YYYY-MM-DD format
          filterOptions.departureTimeFrom, // departureTimeFrom
          filterOptions.departureTimeTo, // departureTimeTo
          filterOptions.operatorType, // operatorType
          filterOptions.operatorId, // operatorId
          filterOptions.status, // status
          0, // page
          50 // size
        );

        let fetchedTrips = response.content || [];

        // Apply sorting based on selected filter
        switch (selectedFilter) {
          case 'cheapest':
            fetchedTrips.sort((a, b) => (a.fare || 0) - (b.fare || 0));
            break;
          case 'fastest':
            fetchedTrips.sort((a, b) => (a.duration || 0) - (b.duration || 0));
            break;
          case 'highest-rated':
            // Rating might not be available in trip response, skip for now
            break;
          default:
            // Keep original order
            break;
        }

        setTrips(fetchedTrips);
      } catch (err) {
        console.error('Error fetching trips:', err);
        setError('Failed to fetch trip information. Please try again.');
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [fromStopId, toStopId, filterOptions, selectedFilter]);

  const applyFilters = (newFilters: FilterOptionsType) => {
    setFilterOptions(newFilters);
  };

  const handleTripPress = (trip: PassengerTripResponse) => {
    router.push({
      pathname: '/search/schedule',
      params: {
        tripId: trip.tripId || '',
        fromStopName,
        toStopName,
        passengers: passengers.toString()
      }
    });
  };

  return (
    <SafeAreaView style={safeAreaStyle}>
      {/* Header */}
      <AppHeader 
        title={`${fromStopName} → ${toStopName}`}
        rightElement={
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />
      
      {/* Search Info */}
      {/* <View style={styles.searchInfoContainer}>
        <Text style={styles.searchInfoText}>
          {searchDate.toLocaleDateString()} • {passengers} passenger{passengers !== 1 ? 's' : ''}
        </Text>
      </View> */}

      {/* Quick Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[
                styles.quickFilterButton,
                selectedFilter === filter.id && styles.quickFilterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004CFF" />
            <Text style={styles.loadingText}>Searching for trips...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {trips.length} trip{trips.length !== 1 ? 's' : ''} found
            </Text>

            {trips.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsTitle}>No trips found</Text>
                <Text style={styles.noResultsText}>
                  Try adjusting your filters or search criteria
                </Text>
              </View>
            ) : (
              trips.map((trip) => (
                <BusRouteCard 
                  key={trip.tripId}
                  trip={trip} 
                  onPress={() => handleTripPress(trip)}
                  showAmenities={false}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <RouteFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterOptions={filterOptions}
        onApplyFilters={applyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  searchInfoContainer: {
    backgroundColor: '#004CFF',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 12,
  },
  quickFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterButtonActive: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});