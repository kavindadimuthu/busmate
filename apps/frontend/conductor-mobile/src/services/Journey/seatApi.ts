import { SeatData, Passenger, TripData, BusLayout } from '@/types/Journey/seat';

// Import your mock data
import seatData from '@/data/Journey/seats.json';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const seatApi = {
  // Get seat layout and status
  async getSeatData(): Promise<SeatData> {
    await delay(600);
    try {
      console.log('Fetching seat data...');
      return seatData.seatData as SeatData;
    } catch (error) {
      console.error('Failed to fetch seat data:', error);
      throw new Error('Failed to load seat data');
    }
  },

  // Get passenger list
  async getPassengers(): Promise<Passenger[]> {
    await delay(800);
    try {
      console.log('Fetching passengers...');
      return seatData.passengers as Passenger[];
    } catch (error) {
      console.error('Failed to fetch passengers:', error);
      throw new Error('Failed to load passenger data');
    }
  },

  // Get trip summary data
  async getTripData(): Promise<TripData> {
    await delay(500);
    try {
      console.log('Fetching trip data...');
      return seatData.tripData as TripData;
    } catch (error) {
      console.error('Failed to fetch trip data:', error);
      throw new Error('Failed to load trip data');
    }
  },

  // Get bus layout configuration
  async getBusLayout(): Promise<BusLayout> {
    await delay(300);
    try {
      console.log('Fetching bus layout...');
      return seatData.busLayout as BusLayout;
    } catch (error) {
      console.error('Failed to fetch bus layout:', error);
      throw new Error('Failed to load bus layout');
    }
  },

  // Update seat status (for future backend integration)
  async updateSeatStatus(seatId: string, status: number): Promise<boolean> {
    await delay(400);
    try {
      console.log(`Updating seat ${seatId} to status ${status}`);
      // In real app, this would make API call
      return true;
    } catch (error) {
      console.error('Failed to update seat:', error);
      throw new Error('Failed to update seat status');
    }
  },

  // Validate passenger (for future backend integration)
  async validatePassenger(passengerId: string): Promise<boolean> {
    await delay(500);
    try {
      console.log(`Validating passenger ${passengerId}`);
      // In real app, this would make API call
      return true;
    } catch (error) {
      console.error('Failed to validate passenger:', error);
      throw new Error('Failed to validate passenger');
    }
  },

  // Search passengers
  async searchPassengers(query: string): Promise<Passenger[]> {
    await delay(300);
    try {
      const passengers = seatData.passengers as Passenger[];
      return passengers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.mobile.includes(query) ||
        p.seat.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search passengers:', error);
      throw new Error('Failed to search passengers');
    }
  }
};