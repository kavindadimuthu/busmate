import { JourneyData, Stop, StopActionResult, StopAction } from '@/types/Journey/stop';

// Import your mock data
import stopData from '@/data/Journey/stops.json';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const stopApi = {
  // Get journey data by ID
  async getJourneyById(journeyId: string): Promise<JourneyData> {
    await delay(600);
    try {
      console.log(`Fetching journey data for ID: ${journeyId}`);
      const journey = stopData.journeys.find(j => j.id === journeyId);
      
      if (!journey) {
        throw new Error('Journey not found');
      }
      
      return journey as JourneyData;
    } catch (error) {
      console.error('Failed to fetch journey:', error);
      throw new Error('Failed to load journey data');
    }
  },

  // Get current active journey
  async getCurrentJourney(): Promise<JourneyData> {
    await delay(500);
    try {
      console.log('Fetching current active journey...');
      const activeJourney = stopData.journeys.find(j => j.status === 'in_progress');
      
      if (!activeJourney) {
        throw new Error('No active journey found');
      }
      
      return activeJourney as JourneyData;
    } catch (error) {
      console.error('Failed to fetch current journey:', error);
      throw new Error('Failed to load current journey');
    }
  },

  // Mark stop as arrived
  async markStopArrived(journeyId: string, stopId: number): Promise<StopActionResult> {
    await delay(400);
    try {
      console.log(`Marking stop ${stopId} as arrived for journey ${journeyId}`);
      
      const journey = stopData.journeys.find(j => j.id === journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      const stop = journey.stops.find(s => s.id === stopId);
      if (!stop) {
        throw new Error('Stop not found');
      }

      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const updatedStop: Stop = {
        ...stop,
        actual: currentTime,
        arrivalTime: currentTime,
        status: 'completed',
        completed: true
      };

      return {
        success: true,
        message: `Arrived at ${stop.name}`,
        updatedStop
      };
    } catch (error) {
      console.error('Failed to mark stop arrived:', error);
      return {
        success: false,
        message: 'Failed to update stop status'
      };
    }
  },

  // Mark stop as departed
  async markStopDeparted(journeyId: string, stopId: number): Promise<StopActionResult> {
    await delay(400);
    try {
      console.log(`Marking stop ${stopId} as departed for journey ${journeyId}`);
      
      const journey = stopData.journeys.find(j => j.id === journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      const stop = journey.stops.find(s => s.id === stopId);
      if (!stop) {
        throw new Error('Stop not found');
      }

      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const updatedStop: Stop = {
        ...stop,
        departureTime: currentTime,
        status: 'completed'
      };

      return {
        success: true,
        message: `Departed from ${stop.name}`,
        updatedStop
      };
    } catch (error) {
      console.error('Failed to mark stop departed:', error);
      return {
        success: false,
        message: 'Failed to update departure status'
      };
    }
  },

  // Update stop delay
  async updateStopDelay(journeyId: string, stopId: number, delayMinutes: number): Promise<StopActionResult> {
    await delay(300);
    try {
      console.log(`Updating delay for stop ${stopId}: ${delayMinutes} minutes`);
      
      const journey = stopData.journeys.find(j => j.id === journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      const stop = journey.stops.find(s => s.id === stopId);
      if (!stop) {
        throw new Error('Stop not found');
      }

      const updatedStop: Stop = {
        ...stop,
        delayMinutes,
        status: delayMinutes > 0 ? 'late' : 'ontime'
      };

      return {
        success: true,
        message: `Updated delay for ${stop.name}`,
        updatedStop
      };
    } catch (error) {
      console.error('Failed to update stop delay:', error);
      return {
        success: false,
        message: 'Failed to update delay'
      };
    }
  },

  // Get real-time location updates
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    await delay(200);
    try {
      console.log('Getting current location...');
      
      // Simulate GPS coordinates
      return {
        lat: 6.9271 + (Math.random() - 0.5) * 0.01,
        lng: 79.9612 + (Math.random() - 0.5) * 0.01
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      throw new Error('Failed to get current location');
    }
  },

  // Update next stop ETA
  async updateNextStopETA(journeyId: string, newETA: string): Promise<StopActionResult> {
    await delay(300);
    try {
      console.log(`Updating next stop ETA to: ${newETA}`);
      
      const journey = stopData.journeys.find(j => j.id === journeyId);
      if (!journey) {
        throw new Error('Journey not found');
      }

      const updatedJourney: JourneyData = {
        ...journey as JourneyData,
        nextStop: {
          ...journey.nextStop,
          eta: newETA
        }
      };

      return {
        success: true,
        message: 'Next stop ETA updated',
        updatedJourney
      };
    } catch (error) {
      console.error('Failed to update ETA:', error);
      return {
        success: false,
        message: 'Failed to update ETA'
      };
    }
  },

  // Get journey history
  async getJourneyHistory(limit: number = 10): Promise<JourneyData[]> {
    await delay(800);
    try {
      console.log(`Fetching journey history (limit: ${limit})`);
      
      // In real app, this would fetch historical journey data
      return stopData.journeys.slice(0, limit) as JourneyData[];
    } catch (error) {
      console.error('Failed to fetch journey history:', error);
      throw new Error('Failed to load journey history');
    }
  }
};