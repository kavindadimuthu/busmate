import schedules from '../../data/Journey/schedules.json';
import { Schedule } from '../../types/Journey/schedule';

// Mock API service - only fetches data, doesn't filter
export const api = {
  schedules: {
    /**
     * Get all schedules
     * @returns Promise that resolves to array of schedules
     */
    getAll: async (): Promise<Schedule[]> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return schedules as Schedule[];
    },
    
    /**
     * Get a specific schedule by ID
     * @param id The schedule ID to find
     * @returns Promise that resolves to a schedule or undefined if not found
     */
    getById: async (id: string): Promise<Schedule | undefined> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return (schedules as Schedule[]).find(schedule => schedule.id === id);
    },
    
    /**
     * Creates a test schedule with today's date for development
     */
    
  }
};