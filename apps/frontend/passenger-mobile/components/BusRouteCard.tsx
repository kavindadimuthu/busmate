import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Snowflake, Wifi, Zap, ArrowRight } from 'lucide-react-native';

import { PassengerTripResponse } from '../lib/api-client/route-management';

interface BusRouteCardProps {
  trip: PassengerTripResponse;
  onPress: () => void;
  showAmenities?: boolean;
}

export default function BusRouteCard({ trip, onPress, showAmenities = true }: BusRouteCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'ac': return <Snowflake size={16} color="#004CFF" />;
      case 'wifi': return <Wifi size={16} color="#004CFF" />;
      case 'charging': return <Zap size={16} color="#004CFF" />;
      default: return null;
    }
  };

  const getBusTypeColor = (busType?: string) => {
    switch (busType?.toLowerCase()) {
      case 'normal': return '#FFF3E0';  // light reddish yellow
      case 'semi-luxury': return '#E1F5FE';  // medium-blue
      case 'luxury': return '#E8F5E9';  // green
      case 'xl': return '#EDE7F6';  // purplish indigo
      default: return '#E6F2FF';
    }
  };

  const getBusTypeTextColor = (busType?: string) => {
    switch (busType?.toLowerCase()) {
      case 'normal': return '#FF8F00';  // darker reddish yellow
      case 'semi-luxury': return '#0288D1';  // darker medium-blue
      case 'luxury': return '#1DD724';  // darker green
      case 'xl': return '#673AB7';  // darker purplish indigo
      default: return '#004CFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.resultCard}
    >
            <View style={styles.cardHeader}>
        <Image 
          source={{ uri: 'https://lesscarmorelife.com/wp-content/uploads/2023/03/img_3289.jpg?w=2046' }} 
          style={styles.busImage} 
        />
        <View style={styles.cardHeaderInfo}>
          <View style={styles.routeDetailsRow}>
            {/* <Text style={styles.routeDetails}> */}
              {/* {trip.routeName || 'Route'}  */}
              {/* {trip.routeName || 'Route'} | {trip.departureStop?.name} */}
            {/* </Text> */}
            {/* <ArrowRight size={16} color="#6B7280" style={styles.arrowIcon} />
            <Text style={styles.routeDetails}>
              {trip.arrivalStop?.name}
            </Text> */}
          </View>
          <Text style={styles.routeDetails}>
              {trip.departureStop?.name} - {trip.arrivalStop?.name} 
              {/* {trip.routeName || 'Route'} | {trip.departureStop?.name} */}
            </Text>
          {/* <Text style={styles.operatorName}>{trip.operator?.name || 'Unknown Operator'}</Text> */}
        </View>
      </View>

            <View style={styles.timeContainer}>
        <View style={styles.timePoint}>
          <Text style={styles.time}>
            {trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            }) : '--:--'}
          </Text>
          <Text style={styles.location}>{trip.departureStop?.name || 'Origin'}</Text>
        </View>
        
        <View style={styles.journeyLine}>
          <View style={styles.dot} />
          <View style={styles.line} />
          <Text style={styles.duration}>
            {trip.duration ? `${Math.floor(trip.duration / 60)}h ${trip.duration % 60}m` : '--h --m'}
          </Text>
          <View style={styles.line} />
          <View style={styles.dot} />
        </View>
        
        <View style={styles.timePoint}>
          <Text style={styles.time}>
            {trip.scheduledArrival ? new Date(trip.scheduledArrival).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            }) : '--:--'}
          </Text>
          <Text style={styles.location}>{trip.arrivalStop?.name || 'Destination'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
                <View style={styles.leftSection}>
          <View style={[
            styles.busTypeTag,
            { backgroundColor: getBusTypeColor(trip.bus?.type || 'luxury') }
          ]}>
            <Text style={[
              styles.busTypeText,
              { color: getBusTypeTextColor(trip.bus?.type || 'luxury') }
            ]}>
              {trip.bus?.type || 'Bus'}
            </Text>
          </View>
          {showAmenities && trip.bus?.features && (
            <View style={styles.amenitiesContainer}>
              {trip.bus.features.hasAirConditioning && (
                <View style={styles.amenityIcon}>
                  {getAmenityIcon('ac')}
                </View>
              )}
              {trip.bus.features.hasWiFi && (
                <View style={styles.amenityIcon}>
                  {getAmenityIcon('wifi')}
                </View>
              )}
              {trip.bus.features.hasToilet && (
                <View style={styles.amenityIcon}>
                  {getAmenityIcon('charging')}
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.availableSeats}>{trip.availableSeats || 0} seats left</Text>
          <Text style={styles.price}>LKR {trip.fare || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  busImage: {
    width: 60,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  routeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  operatorName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timePoint: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  journeyLine: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004CFF',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  busTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  busTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  availableSeats: {
    fontSize: 12,
    color: '#1DD724',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004CFF',
    marginTop: 2,
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
});