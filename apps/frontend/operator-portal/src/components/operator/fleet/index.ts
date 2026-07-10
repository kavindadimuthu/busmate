// Fleet management components for the Operator portal.
// Real data from core-service (via BusOperatorOperationsService) — operators can view
// but not edit fleet data (bus registration remains an NTC/MOT regulatory function).

export { FleetStatsCards } from './FleetStatsCards';
export { FleetFilterBar }  from './FleetFilterBar';
export { FleetTable }      from './FleetTable';
export { fleetColumns }    from './FleetColumns';
export { BusSummaryCard }  from './BusSummaryCard';
export type { FleetFilters, BusStatus, FleetStatistics } from '@/hooks/operator/fleet/useFleetManagement';
