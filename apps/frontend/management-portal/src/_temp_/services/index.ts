// =============================================================================
// Mock Location Tracking — Services Barrel Export
// =============================================================================

export { LocationSimulationService } from './LocationSimulationService';

// Singleton instance for convenient use throughout the app.
// Import this when you want a shared simulation across components.
import { LocationSimulationService } from './LocationSimulationService';

/**
 * Shared singleton instance of the simulation service.
 * Use `locationSimulator.start(cb)` / `locationSimulator.stop()`
 * for streaming, or `locationSimulator.getAllBusStates()` for snapshots.
 */
export const locationSimulator = new LocationSimulationService();
