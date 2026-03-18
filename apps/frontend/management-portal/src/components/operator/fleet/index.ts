// Fleet management components for the Operator portal.
// These are read-only components – operators can view but not edit fleet data.

// ── Pattern-based components (new architecture) ───────────────────
export { FleetStatsCardsNew }                from './fleet-stats-cards';
export { FleetFilterBar, type FleetFilters } from './fleet-filter-bar';
export { FleetTableNew }                     from './fleet-table';
export { fleetColumns }                      from './fleet-columns';

// ── Legacy components (kept for the bus details page) ────────────
export { FleetStatsCards }                   from './FleetStatsCards';
export { FleetFilters as LegacyFleetFilters } from './FleetFilters';
export { FleetTable }                        from './FleetTable';

// Bus details page components
export { BusSummaryCard }    from './BusSummaryCard';
export { BusSeatingView }    from './BusSeatingView';
export { BusMaintenanceTab } from './BusMaintenanceTab';
export { BusLocationTab }    from './BusLocationTab';
export { BusTripsTab }       from './BusTripsTab';
export { BusDetailsTabs }    from './BusDetailsTabs';
