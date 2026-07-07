import { apiClient } from '../apiClient';

export interface StopLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  location: StopLocation;
  isAccessible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export const stopsApi = {
  // Get stop by ID
  getStopById: async (stopId: string): Promise<Stop> => {
    try {
      console.log(`🚏 Fetching stop data for ID: ${stopId}`);
      
      const response = await apiClient.authenticatedRequest<Stop>(
        `/stops/${stopId}`, 
        {}, 
        'schedule' // Assuming stops API is part of schedule service
      );
      
      console.log(`✅ Stop data retrieved: ${response.name}`);
      return response;
    } catch (error: any) {
      console.warn(`⚠️ Could not fetch stop ${stopId}:`, error.message);
      
      // Return a fallback stop object
      return {
        id: stopId,
        name: 'Unknown Stop',
        description: 'Stop information not available',
        location: {
          latitude: 0,
          longitude: 0,
          address: 'Unknown',
          city: 'Unknown',
          state: 'Unknown',
          zipCode: 'Unknown',
          country: 'Unknown'
        },
        isAccessible: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system'
      };
    }
  },

  // Get multiple stops by IDs
  getStopsByIds: async (stopIds: string[]): Promise<Map<string, Stop>> => {
    const stopMap = new Map<string, Stop>();
    
    // Fetch all stops concurrently
    const stopPromises = stopIds.map(async (id) => {
      try {
        const stop = await stopsApi.getStopById(id);
        return { id, stop };
      } catch (error) {
        console.warn(`Failed to fetch stop ${id}:`, error);
        return {
          id,
          stop: {
            id,
            name: id === 'start' ? 'Boarding Stop' : id === 'end' ? 'Alighting Stop' : 'Unknown Stop',
            description: 'Location information not available',
            location: {
              latitude: 0,
              longitude: 0,
              address: 'Unknown',
              city: 'Unknown',
              state: 'Unknown',
              zipCode: 'Unknown',
              country: 'Unknown'
            },
            isAccessible: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            updatedBy: 'system'
          }
        };
      }
    });

    const results = await Promise.all(stopPromises);
    
    results.forEach(({ id, stop }) => {
      stopMap.set(id, stop);
    });

    return stopMap;
  }
};