'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  TrackedBus,
  TrackingStats,
  TrackingFilterState,
  TrackingFilterOptions,
  TrackingStatsCardMetric,
  MapCenter,
  MapViewMode,
} from '@/types/location-tracking';
import {
  getTrackedBuses,
  getTrackingStats,
  getTrackingStatsMetrics,
  getTrackingFilterOptions,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  AUTO_REFRESH_INTERVAL,
} from '@/_temp_/data/location-tracking';

// ── Types ─────────────────────────────────────────────────────────

interface UseLocationTrackingOptions {
  /** Auto-refresh interval in milliseconds (default: 3000) */
  refreshInterval?: number;
  /** Enable auto-refresh by default (default: true) */
  autoRefreshEnabled?: boolean;
  /** Enable smooth position interpolation between data updates */
  enableInterpolation?: boolean;
}

interface UseLocationTrackingReturn {
  // Data
  buses: TrackedBus[];
  filteredBuses: TrackedBus[];
  stats: TrackingStats;
  statsMetrics: TrackingStatsCardMetric[];
  filterOptions: TrackingFilterOptions;

  // Filters
  filters: TrackingFilterState;
  setFilters: (filters: TrackingFilterState) => void;

  // Selection
  selectedBus: TrackedBus | null;
  setSelectedBus: (bus: TrackedBus | null) => void;

  // Map State
  mapCenter: MapCenter;
  setMapCenter: (center: MapCenter) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  viewMode: MapViewMode;
  setViewMode: (mode: MapViewMode) => void;

  // UI State
  statsCollapsed: boolean;
  setStatsCollapsed: (collapsed: boolean) => void;

  // Loading & Error
  isLoading: boolean;
  error: string | null;

  // Refresh
  refresh: () => void;
  lastUpdate: Date | null;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;

  // Actions
  focusOnBus: (bus: TrackedBus) => void;
  resetView: () => void;
}

// ── Interpolation Helpers ─────────────────────────────────────────

interface BusPositionSnapshot {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

/**
 * Linearly interpolate between two coordinate snapshots.
 */
function lerpPosition(
  from: BusPositionSnapshot,
  to: BusPositionSnapshot,
  t: number
): { lat: number; lng: number; heading: number; speed: number } {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
    heading: from.heading + (to.heading - from.heading) * clamped,
    speed: from.speed + (to.speed - from.speed) * clamped,
  };
}

/**
 * Apply interpolated positions to an array of buses.
 */
function applyInterpolation(
  buses: TrackedBus[],
  prevSnapshots: Map<string, BusPositionSnapshot>,
  currentSnapshots: Map<string, BusPositionSnapshot>,
  progress: number
): TrackedBus[] {
  return buses.map((bus) => {
    const prev = prevSnapshots.get(bus.id);
    const curr = currentSnapshots.get(bus.id);

    if (!prev || !curr) return bus;

    const interp = lerpPosition(prev, curr, progress);

    return {
      ...bus,
      location: {
        ...bus.location,
        location: {
          ...bus.location.location,
          coordinates: [interp.lng, interp.lat] as [number, number],
        },
        speed: Math.round(interp.speed),
        heading: Math.round(interp.heading),
      },
    };
  });
}

// ── Hook ──────────────────────────────────────────────────────────

export function useLocationTracking(
  options: UseLocationTrackingOptions = {}
): UseLocationTrackingReturn {
  const {
    refreshInterval: defaultInterval = AUTO_REFRESH_INTERVAL,
    autoRefreshEnabled = true,
    enableInterpolation = true,
  } = options;

  // Data State
  const [buses, setBuses] = useState<TrackedBus[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    totalBusesTracking: 0,
    activeBuses: 0,
    idleBuses: 0,
    offlineBuses: 0,
    busesOnTime: 0,
    busesDelayed: 0,
    averageSpeed: 0,
    totalPassengers: 0,
    activeRoutes: 0,
    alerts: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
  });
  const [statsMetrics, setStatsMetrics] = useState<TrackingStatsCardMetric[]>([]);
  const [filterOptions, setFilterOptions] = useState<TrackingFilterOptions>({
    routes: [],
    operators: [],
    tripStatuses: [],
  });

  // Filter State
  const [filters, setFilters] = useState<TrackingFilterState>({
    search: '',
    routeId: 'all',
    operatorId: 'all',
    tripStatus: 'all',
    deviceStatus: 'all',
    movementStatus: 'all',
    showOnlyActive: false,
    showOfflineDevices: true,
  });

  // Selection State
  const [selectedBus, setSelectedBus] = useState<TrackedBus | null>(null);

  // Map State
  const [mapCenter, setMapCenter] = useState<MapCenter>(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [viewMode, setViewMode] = useState<MapViewMode>('standard');

  // UI State
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refresh State
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(autoRefreshEnabled);
  const [refreshInterval, setRefreshInterval] = useState(defaultInterval / 1000);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interpolation State
  const [interpolatedBuses, setInterpolatedBuses] = useState<TrackedBus[]>([]);
  const prevSnapshotsRef = useRef<Map<string, BusPositionSnapshot>>(new Map());
  const currSnapshotsRef = useRef<Map<string, BusPositionSnapshot>>(new Map());
  const lastDataTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Capture position snapshots from bus data
  const captureSnapshots = useCallback(
    (busList: TrackedBus[]): Map<string, BusPositionSnapshot> => {
      const map = new Map<string, BusPositionSnapshot>();
      for (const bus of busList) {
        const [lng, lat] = bus.location.location.coordinates;
        map.set(bus.id, {
          lat,
          lng,
          heading: bus.location.heading,
          speed: bus.location.speed,
          timestamp: Date.now(),
        });
      }
      return map;
    },
    []
  );

  // Load data
  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        // Only show loading on initial load
        if (!lastUpdate) {
          setIsLoading(true);
        }
        setError(null);

        // Minimal delay for smooth UI updates (simulation is instant)
        await new Promise((resolve) => setTimeout(resolve, 50));

        const loadedBuses = getTrackedBuses(forceRefresh);
        const loadedStats = getTrackingStats();
        const loadedMetrics = getTrackingStatsMetrics();
        const loadedFilterOptions = getTrackingFilterOptions();

        // Shift current snapshots to previous for interpolation
        prevSnapshotsRef.current = currSnapshotsRef.current;
        currSnapshotsRef.current = captureSnapshots(loadedBuses);
        lastDataTimestampRef.current = Date.now();

        setBuses(loadedBuses);
        setStats(loadedStats);
        setStatsMetrics(loadedMetrics);
        setFilterOptions(loadedFilterOptions);
        setLastUpdate(new Date());

        // Update selected bus if one was selected
        if (selectedBus) {
          const updatedSelectedBus = loadedBuses.find(
            (b) => b.id === selectedBus.id
          );
          if (updatedSelectedBus) {
            setSelectedBus(updatedSelectedBus);
          }
        }
      } catch (err) {
        console.error('Error loading tracking data:', err);
        setError('Failed to load tracking data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [lastUpdate, selectedBus, captureSnapshots]
  );

  // Interpolation animation loop
  useEffect(() => {
    if (!enableInterpolation || buses.length === 0) {
      setInterpolatedBuses(buses);
      return;
    }

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastDataTimestampRef.current;
      const interval = refreshInterval * 1000;
      const progress = Math.min(1, elapsed / interval);

      const interpolated = applyInterpolation(
        buses,
        prevSnapshotsRef.current,
        currSnapshotsRef.current,
        progress
      );
      setInterpolatedBuses(interpolated);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [buses, enableInterpolation, refreshInterval]);

  // Initial load
  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadData(true);
      }, refreshInterval * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadData]);

  // The displayed buses — interpolated if enabled, raw otherwise
  const displayBuses = enableInterpolation ? interpolatedBuses : buses;

  // Filter buses
  const filteredBuses = useMemo(() => {
    return displayBuses.filter((bus) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          bus.bus.registrationNumber?.toLowerCase().includes(searchLower) ||
          bus.route?.name?.toLowerCase().includes(searchLower) ||
          bus.bus.operatorName?.toLowerCase().includes(searchLower) ||
          bus.bus.id?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.routeId !== 'all' && bus.route?.id !== filters.routeId) return false;
      if (filters.operatorId !== 'all' && bus.bus.operatorId !== filters.operatorId) return false;
      if (filters.tripStatus !== 'all' && bus.trip?.status !== filters.tripStatus) return false;
      if (filters.deviceStatus !== 'all' && bus.deviceStatus !== filters.deviceStatus) return false;
      if (filters.movementStatus !== 'all' && bus.movementStatus !== filters.movementStatus) return false;
      if (filters.showOnlyActive && bus.trip?.status !== 'in_transit' && bus.trip?.status !== 'on_time') return false;
      if (!filters.showOfflineDevices && bus.deviceStatus === 'offline') return false;
      return true;
    });
  }, [displayBuses, filters]);

  // Focus on a specific bus
  const focusOnBus = useCallback((bus: TrackedBus) => {
    const [lng, lat] = bus.location.location.coordinates;
    setMapCenter({ lat, lng });
    setMapZoom(15);
    setSelectedBus(bus);
  }, []);

  // Reset view to default
  const resetView = useCallback(() => {
    setMapCenter(DEFAULT_MAP_CENTER);
    setMapZoom(DEFAULT_MAP_ZOOM);
    setSelectedBus(null);
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  return {
    buses: displayBuses,
    filteredBuses,
    stats,
    statsMetrics,
    filterOptions,
    filters,
    setFilters,
    selectedBus,
    setSelectedBus,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    viewMode,
    setViewMode,
    statsCollapsed,
    setStatsCollapsed,
    isLoading,
    error,
    refresh,
    lastUpdate,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    focusOnBus,
    resetView,
  };
}
