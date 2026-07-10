// Trips management components for the Operator portal.
// Real data from core-service (via BusOperatorOperationsService/TripService) - operators can
// view their trips and assign their own vehicles/conductors to them.

export { TripStatsCards } from './TripStatsCards';
export { TripFilterBar } from './TripFilterBar';
export { TripTable } from './TripTable';
export { tripColumns } from './tripColumns';
export { TripSummary } from './TripSummary';
export { TripAssignmentPanel } from './TripAssignmentPanel';
export type { TripFilters, TripStatus, TripStatistics } from '@/hooks/operator/trips/useTripsManagement';
