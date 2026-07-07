// import { useState, useEffect, useCallback } from 'react';
// import { JourneyData, Stop, StopActionResult } from '@/types/Journey/stop';
// import { stopApi } from '@/services/Journey/stopApi';

// export function useStopView(journeyId?: string) {
//   // Data state
//   const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

//   // Fetch journey data
//   useEffect(() => {
//     const fetchJourneyData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         console.log('Loading journey data...');
        
//         let journey: JourneyData;
        
//         if (journeyId) {
//           journey = await stopApi.getJourneyById(journeyId);
//         } else {
//           journey = await stopApi.getCurrentJourney();
//         }
        
//         setJourneyData(journey);
//         console.log(`Loaded journey: ${journey.route.name}`);
//       } catch (err) {
//         console.error('Failed to load journey:', err);
//         setError(err instanceof Error ? err.message : 'Failed to load journey data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchJourneyData();
//   }, [journeyId]);

//   // Auto-update location every 30 seconds
//   useEffect(() => {
//     if (!journeyData) return;

//     const updateLocation = async () => {
//       try {
//         const location = await stopApi.getCurrentLocation();
//         setCurrentLocation(location);
//       } catch (error) {
//         console.error('Failed to update location:', error);
//       }
//     };

//     // Initial location update
//     updateLocation();

//     // Set up interval for location updates
//     const locationInterval = setInterval(updateLocation, 30000);

//     return () => clearInterval(locationInterval);
//   }, [journeyData]);

//   // Mark stop as arrived
//   const markStopArrived = useCallback(async (stopId: number) => {
//     if (!journeyData) return;

//     try {
//       setActionLoading(true);
//       const result = await stopApi.markStopArrived(journeyData.id, stopId);
      
//       if (result.success && result.updatedStop) {
//         setJourneyData(prev => {
//           if (!prev) return null;
          
//           return {
//             ...prev,
//             stops: prev.stops.map(stop => 
//               stop.id === stopId ? result.updatedStop! : stop
//             )
//           };
//         });
        
//         console.log(result.message);
//       }
      
//       return result;
//     } catch (error) {
//       console.error('Failed to mark arrival:', error);
//       return {
//         success: false,
//         message: 'Failed to mark arrival'
//       };
//     } finally {
//       setActionLoading(false);
//     }
//   }, [journeyData]);

//   // Mark stop as departed
//   const markStopDeparted = useCallback(async (stopId: number) => {
//     if (!journeyData) return;

//     try {
//       setActionLoading(true);
//       const result = await stopApi.markStopDeparted(journeyData.id, stopId);
      
//       if (result.success && result.updatedStop) {
//         setJourneyData(prev => {
//           if (!prev) return null;
          
//           return {
//             ...prev,
//             stops: prev.stops.map(stop => 
//               stop.id === stopId ? result.updatedStop! : stop
//             )
//           };
//         });
        
//         console.log(result.message);
//       }
      
//       return result;
//     } catch (error) {
//       console.error('Failed to mark departure:', error);
//       return {
//         success: false,
//         message: 'Failed to mark departure'
//       };
//     } finally {
//       setActionLoading(false);
//     }
//   }, [journeyData]);

//   // Update stop delay
//   const updateStopDelay = useCallback(async (stopId: number, delayMinutes: number) => {
//     if (!journeyData) return;

//     try {
//       setActionLoading(true);
//       const result = await stopApi.updateStopDelay(journeyData.id, stopId, delayMinutes);
      
//       if (result.success && result.updatedStop) {
//         setJourneyData(prev => {
//           if (!prev) return null;
          
//           return {
//             ...prev,
//             stops: prev.stops.map(stop => 
//               stop.id === stopId ? result.updatedStop! : stop
//             )
//           };
//         });
        
//         console.log(result.message);
//       }
      
//       return result;
//     } catch (error) {
//       console.error('Failed to update delay:', error);
//       return {
//         success: false,
//         message: 'Failed to update delay'
//       };
//     } finally {
//       setActionLoading(false);
//     }
//   }, [journeyData]);

//   // Refresh journey data
//   const refreshJourney = useCallback(async () => {
//     if (!journeyData) return;

//     try {
//       setLoading(true);
//       const updatedJourney = await stopApi.getJourneyById(journeyData.id);
//       setJourneyData(updatedJourney);
//     } catch (error) {
//       console.error('Failed to refresh journey:', error);
//       setError('Failed to refresh journey data');
//     } finally {
//       setLoading(false);
//     }
//   }, [journeyData]);

//   // Get stop status for styling
//   const getStopStatusStyle = useCallback((stop: Stop) => {
//     if (stop.status === 'current') return 'current';
//     if (stop.completed) return 'completed';
//     if (stop.status === 'late') return 'late';
//     if (stop.status === 'ontime') return 'ontime';
//     return 'upcoming';
//   }, []);

//   // Calculate journey progress
//   const getJourneyProgress = useCallback(() => {
//     if (!journeyData) return { completed: 0, total: 0, percentage: 0 };
    
//     const completed = journeyData.stops.filter(stop => stop.completed).length;
//     const total = journeyData.stops.length;
//     const percentage = Math.round((completed / total) * 100);
    
//     return { completed, total, percentage };
//   }, [journeyData]);

//   // Get current stop
//   const getCurrentStop = useCallback(() => {
//     if (!journeyData) return null;
//     return journeyData.stops.find(stop => stop.status === 'current') || null;
//   }, [journeyData]);

//   // Get next upcoming stop
//   const getNextStop = useCallback(() => {
//     if (!journeyData) return null;
//     const currentStopIndex = journeyData.stops.findIndex(stop => stop.status === 'current');
//     if (currentStopIndex >= 0 && currentStopIndex < journeyData.stops.length - 1) {
//       return journeyData.stops[currentStopIndex + 1];
//     }
//     return null;
//   }, [journeyData]);

//   return {
//     // Data
//     journeyData,
//     currentLocation,
//     loading,
//     error,
//     actionLoading,
    
//     // Actions
//     markStopArrived,
//     markStopDeparted,
//     updateStopDelay,
//     refreshJourney,
//     setError,
    
//     // Computed values
//     getStopStatusStyle,
//     getJourneyProgress,
//     getCurrentStop,
//     getNextStop,
//   };
// }