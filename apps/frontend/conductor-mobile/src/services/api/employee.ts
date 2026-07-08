import {
  ConductorTripApiResponse,
  ShiftStatus
} from '@/types/employee';
import { apiClient } from '../apiClient';

export const employeeApi = {
// Fetch employee schedule by conductorId - Schedule Management Service
  getSchedule: async (conductorId: string): Promise<ConductorTripApiResponse[]> => {
    return apiClient.authenticatedRequest<ConductorTripApiResponse[]>(`/trips/conductor/${conductorId}`, {}, 'schedule');
  },
// Fetch shift status for a conductor - Schedule Management Service
  getShiftStatus: async (conductorId: string): Promise<ShiftStatus> => {
    return apiClient.authenticatedRequest<ShiftStatus>(`/conductor/shift-status?conductorId/${conductorId}`, {}, 'schedule');
  },
// Start shifts for a conductor - Schedule Management Service
  startShift: async (conductorId: string): Promise<{ success: boolean; shiftId: string }> => {
    return apiClient.authenticatedRequest<{ success: boolean; shiftId: string }>(`/conductor/shift/start`, {
      method: 'POST',
      body: JSON.stringify({ conductorId }),
    }, 'schedule');
  },
// End shifts for a conductor - Schedule Management Service
  endShift: async (shiftId: string): Promise<{ success: boolean; summary: any }> => {
    return apiClient.authenticatedRequest<{ success: boolean; summary: any }>(`/conductor/shift/end`, {
      method: 'POST',
      body: JSON.stringify({ shiftId }),
    }, 'schedule');
  },

  // Start trip - Schedule Management Service
  startTrip: async (tripId: string): Promise<ConductorTripApiResponse> => {
    return apiClient.authenticatedRequest<ConductorTripApiResponse>(`/trips/${tripId}/start`, {
      method: 'PATCH',
    }, 'schedule');
  },

  // End trip - Schedule Management Service
  endTrip: async (tripId: string): Promise<ConductorTripApiResponse> => {
    return apiClient.authenticatedRequest<ConductorTripApiResponse>(`/trips/${tripId}/complete`, {
      method: 'PATCH',
    }, 'schedule');
  },
};
