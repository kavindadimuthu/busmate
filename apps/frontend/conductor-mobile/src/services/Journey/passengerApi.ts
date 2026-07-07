import { PassengerDetails, PassengerAction, PassengerActionResult, ValidationStatus } from '@/types/Journey/passenger';

// Import your mock data
import passengerData from '@/data/Journey/passengers.json';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const passengerApi = {
  // Get passenger by ID
  async getPassengerById(id: string): Promise<PassengerDetails> {
    await delay(600);
    try {
      console.log(`Fetching passenger details for ID: ${id}`);
      const passenger = passengerData.passengers.find(p => p.id === id);
      
      if (!passenger) {
        throw new Error('Passenger not found');
      }
      
      return passenger as PassengerDetails;
    } catch (error) {
      console.error('Failed to fetch passenger:', error);
      throw new Error('Failed to load passenger details');
    }
  },

  // Get all passengers
  async getAllPassengers(): Promise<PassengerDetails[]> {
    await delay(800);
    try {
      console.log('Fetching all passengers...');
      return passengerData.passengers as PassengerDetails[];
    } catch (error) {
      console.error('Failed to fetch passengers:', error);
      throw new Error('Failed to load passengers');
    }
  },

  // Validate passenger ticket via QR
  async validatePassenger(passengerId: string): Promise<PassengerActionResult> {
    await delay(800);
    try {
      console.log(`Validating passenger via QR: ${passengerId}`);
      
      const passenger = passengerData.passengers.find(p => p.id === passengerId);
      if (!passenger) {
        throw new Error('Passenger not found');
      }

      // QR validation process
      const updatedPassenger: PassengerDetails = {
        ...passenger as PassengerDetails,
        isValidated: true,
        validationStatus: 'validated',
        validation: {
          ...passenger.validation,
          status: 'Ticket validated via QR code',
          timestamp: new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          validatedBy: 'Conductor-001',
          validationMethod: 'qr' // Always QR for this app
        }
      };

      return {
        success: true,
        message: 'Passenger ticket validated via QR code',
        updatedPassenger
      };
    } catch (error) {
      console.error('Failed to validate passenger:', error);
      return {
        success: false,
        message: 'Failed to validate passenger ticket'
      };
    }
  },

  // Revalidate passenger ticket via QR
  async revalidatePassenger(passengerId: string): Promise<PassengerActionResult> {
    await delay(700);
    try {
      console.log(`Re-validating passenger via QR: ${passengerId}`);
      
      const passenger = passengerData.passengers.find(p => p.id === passengerId);
      if (!passenger) {
        throw new Error('Passenger not found');
      }

      const updatedPassenger: PassengerDetails = {
        ...passenger as PassengerDetails,
        isValidated: true,
        validationStatus: 'validated',
        validation: {
          ...passenger.validation,
          status: 'Ticket re-validated via QR code',
          timestamp: new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          validatedBy: 'Conductor-001',
          validationMethod: 'qr' // Always QR
        }
      };

      return {
        success: true,
        message: 'Passenger ticket re-validated via QR code',
        updatedPassenger
      };
    } catch (error) {
      console.error('Failed to revalidate passenger:', error);
      return {
        success: false,
        message: 'Failed to re-validate passenger ticket'
      };
    }
  },

  // Invalidate passenger ticket (when QR scan fails or manual invalidation)
  async invalidatePassenger(passengerId: string, reason?: string): Promise<PassengerActionResult> {
    await delay(500);
    try {
      console.log(`Invalidating passenger: ${passengerId}`, reason ? `Reason: ${reason}` : '');
      
      const passenger = passengerData.passengers.find(p => p.id === passengerId);
      if (!passenger) {
        throw new Error('Passenger not found');
      }

      const updatedPassenger: PassengerDetails = {
        ...passenger as PassengerDetails,
        isValidated: false,
        validationStatus: 'cancelled',
        validation: {
          ...passenger.validation,
          status: `Ticket invalidated${reason ? ` - ${reason}` : ''}`,
          timestamp: new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          validationMethod: 'qr' // Keep as QR since that's your validation method
        },
        additionalNotes: reason
      };

      return {
        success: true,
        message: 'Passenger ticket invalidated',
        updatedPassenger
      };
    } catch (error) {
      console.error('Failed to invalidate passenger:', error);
      return {
        success: false,
        message: 'Failed to invalidate passenger ticket'
      };
    }
  },

  // Validate passenger by QR code data
  async validateByQRCode(qrData: string): Promise<PassengerActionResult> {
    await delay(600);
    try {
      console.log(`Processing QR code: ${qrData}`);
      
      // Parse QR code data (assuming it contains passenger ID or ticket ID)
      let passengerId: string;
      
      // QR code might contain different formats:
      // - Direct passenger ID: "1", "2", "3"
      // - Ticket ID: "#TK2024001234"
      // - JSON: {"id":"1","ticketId":"#TK2024001234"}
      
      if (qrData.startsWith('#TK')) {
        // Find passenger by ticket ID
        const passenger = passengerData.passengers.find(p => p.ticket.ticketId === qrData);
        if (!passenger) {
          throw new Error('Invalid QR code - ticket not found');
        }
        passengerId = passenger.id;
      } else if (qrData.startsWith('{')) {
        // Parse JSON QR code
        const qrJson = JSON.parse(qrData);
        passengerId = qrJson.id || qrJson.passengerId;
      } else {
        // Direct passenger ID
        passengerId = qrData;
      }
      
      // Validate the passenger
      return await this.validatePassenger(passengerId);
      
    } catch (error) {
      console.error('Failed to process QR code:', error);
      return {
        success: false,
        message: 'Invalid QR code or failed to validate ticket'
      };
    }
  },

  // Send message to passenger
  async sendMessage(passengerId: string, message: string): Promise<PassengerActionResult> {
    await delay(400);
    try {
      console.log(`Sending message to passenger ${passengerId}: ${message}`);
      
      // In real app, this would integrate with SMS/messaging service
      return {
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        message: 'Failed to send message'
      };
    }
  },

  // Update passenger details
  async updatePassengerDetails(passengerId: string, updates: Partial<PassengerDetails>): Promise<PassengerActionResult> {
    await delay(600);
    try {
      console.log(`Updating passenger ${passengerId}:`, updates);
      
      const passenger = passengerData.passengers.find(p => p.id === passengerId);
      if (!passenger) {
        throw new Error('Passenger not found');
      }

      const updatedPassenger: PassengerDetails = {
        ...passenger as PassengerDetails,
        ...updates
      };

      return {
        success: true,
        message: 'Passenger details updated successfully',
        updatedPassenger
      };
    } catch (error) {
      console.error('Failed to update passenger:', error);
      return {
        success: false,
        message: 'Failed to update passenger details'
      };
    }
  },

  // Search passengers
  async searchPassengers(query: string): Promise<PassengerDetails[]> {
    await delay(300);
    try {
      const passengers = passengerData.passengers as PassengerDetails[];
      return passengers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.contact.phone.includes(query) ||
        p.ticket.seatNumber.toLowerCase().includes(query.toLowerCase()) ||
        p.ticket.ticketId.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search passengers:', error);
      throw new Error('Failed to search passengers');
    }
  }
};