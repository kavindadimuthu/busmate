// Fleet management components for the Operator portal.
// Real data from core-service. Operators register and maintain their own buses (INC-018);
// MOT can see every bus and suspend one.

export { FleetStatsCards } from './FleetStatsCards';
export { FleetFilterBar }  from './FleetFilterBar';
export { FleetTable }      from './FleetTable';
export { fleetColumns }    from './FleetColumns';
export type { FleetFilters, BusStatus, FleetStatistics } from '@/hooks/operator/fleet/useFleetManagement';
