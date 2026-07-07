import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  ArrowUpDown,
  Clock,
  Heart,
  ChevronRight,
  Search,
  Bus,
  Navigation,
  ArrowRight
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { MockUserService } from '@/services/mockUserService';
import AppHeader from '@/components/ui/AppHeader';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Get user's favorite routes from mock data
  const favoriteRoutes = user?.email ? MockUserService.getFavoriteRoutes(user.email) : [];

  const navigateToSearch = (from: string, to: string) => {
    // Navigate to search screen with pre-filled values
    router.push({
      pathname: '/search/results',
      params: { 
        from, 
        to,
        date: new Date().toISOString().split('T')[0],
        passengers: '1'
      }
    });
  };

  const handleToggleFavorite = (routeId: string) => {
    // TODO: Implement favorite toggle logic
    console.log('Toggle favorite for route:', routeId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Favorite Routes" />

      <ScrollView style={styles.content}>
        {favoriteRoutes.length > 0 ? (
          <>
            {/* Favorites count */}
            <Text style={styles.countText}>
              {favoriteRoutes.length} saved route{favoriteRoutes.length !== 1 ? 's' : ''}
            </Text>
            
            {/* Favorite routes list */}
            <View style={styles.routesContainer}>
              {favoriteRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeCard}
                  activeOpacity={0.7}
                  onPress={() => navigateToSearch(route.from, route.to)}
                >
                  {/* Route Information */}
                  <View style={styles.routeContent}>
                    <View style={styles.locationContainer}>
                      {/* Location labels above route path */}
                      <View style={styles.locationLabels}>
                        <Text style={styles.fromLocationLabel}>{route.from}</Text>
                        <Text style={styles.toLocationLabel}>{route.to}</Text>
                      </View>
                      
                      <View style={styles.routePathContainer}>
                        <View style={styles.originDot} />
                        <View style={styles.routeLine} />
                        <View style={styles.routeIcon}>
                          <Bus size={16} color="#6B7280" />
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.destinationDot} />
                      </View>

                      {/* Route Details */}
                      <View style={styles.routeMetrics}>
                        <View style={styles.metricItem}>
                          <Clock size={14} color="#6B7280" />
                          <Text style={styles.metricText}>{route.frequentTime}</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricText}>Last used {route.lastUsed}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.routeFooter}>
                    <TouchableOpacity 
                      style={styles.searchRouteButton}
                      onPress={() => navigateToSearch(route.from, route.to)}
                    >
                      <Search size={16} color="#004CFF" />
                      <Text style={styles.searchRouteText}>Search Buses</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.favoriteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(route.id);
                      }}
                    >
                      <Heart
                        size={20}
                        color="#FF3831"
                        fill="#FF3831"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Add New Route Card */}
              <TouchableOpacity
                style={styles.addRouteCard}
                onPress={() => router.push('/search')}
                activeOpacity={0.7}
              >
                <View style={styles.addRouteIconContainer}>
                  <View style={styles.addRouteIcon}>
                    <Navigation size={24} color="#004CFF" />
                  </View>
                </View>
                <View style={styles.addRouteContent}>
                  <Text style={styles.addRouteTitle}>Find New Route</Text>
                  <Text style={styles.addRouteSubtitle}>Discover new destinations</Text>
                </View>
                <ArrowRight size={20} color="#004CFF" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Heart size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No Favorite Routes Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Save your frequently used routes for quick access
            </Text>
            <TouchableOpacity 
              style={styles.findRoutesButton}
              onPress={() => router.push('/search')}
            >
              <Search size={18} color="#FFFFFF" />
              <Text style={styles.findRoutesText}>Find Routes</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 8,
  },
  routesContainer: {
    marginBottom: 24,
    gap: 16,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  routeContent: {
    marginBottom: 16,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fromLocationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  toLocationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  routePathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#004CFF',
    shadowColor: '#004CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3831',
    shadowColor: '#FF3831',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  routeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metricDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  searchRouteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5EFFF',
  },
  searchRouteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004CFF',
  },
  favoriteButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  addRouteCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#E5EFFF',
    borderStyle: 'dashed',
  },
  addRouteIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRouteIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRouteContent: {
    flex: 1,
  },
  addRouteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  addRouteSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  findRoutesButton: {
    flexDirection: 'row',
    backgroundColor: '#004CFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  findRoutesText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});