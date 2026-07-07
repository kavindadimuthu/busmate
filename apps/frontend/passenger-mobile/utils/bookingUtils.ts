/**
 * Generates a unique transaction reference for payment processing
 * Format: TXN-YYYYMMDD-HHMMSS-XXXX (where XXXX is random)
 */
export const generateTransactionRef = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `TXN-${date}-${time}-${random}`;
};

/**
 * Utility function to find bus by plate number from the buses list
 */
export const findBusByPlateNumber = (buses: any[], plateNumber: string) => {
  return buses.find(bus => 
    bus.plateNumber && 
    bus.plateNumber.toLowerCase().trim() === plateNumber.toLowerCase().trim()
  );
};

/**
 * Format fare amount to LKR currency string
 */
export const formatFare = (amount: number): string => {
  return `LKR ${amount.toLocaleString()}`;
};

/**
 * Validate booking data before proceeding to payment
 */
export const validateBookingData = (bookingData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!bookingData.tripId) errors.push('Trip ID is required');
  if (!bookingData.busData?.id) errors.push('Bus information is required');
  if (!bookingData.fromStopId) errors.push('Departure stop is required');
  if (!bookingData.toStopId) errors.push('Arrival stop is required');
  if (!bookingData.fareAmount || bookingData.fareAmount <= 0) errors.push('Valid fare amount is required');
  if (!bookingData.passengerId) errors.push('Passenger information is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};