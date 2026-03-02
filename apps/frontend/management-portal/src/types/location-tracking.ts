// Location Tracking Feature - Type Definitions
// =============================================================================
// Comprehensive types for the MOT Location Tracking feature.
// Use these types throughout the location tracking components and data services.

import type { LucideIcon } from 'lucide-react';

// ── Core Location Types ─────────────────────────────────────────────────────

/**
 * GeoJSON Point representation for bus location
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Real-time location data for a bus
 */
export interface BusLocationData {
  busId: string;
  tripId?: string;
  location: GeoPoint;
  speed: number; // km/h
  heading: number; // degrees (0-360)
  timestamp: string;
  accuracy?: number; // meters
}

/**
 * Current movement status of a bus
 */
export type BusMovementStatus = 'moving' | 'idle' | 'stopped';

/**
 * Device connectivity status
 */
export type DeviceStatus = 'online' | 'offline' | 'unknown';

/**
 * Trip operational status
 */
export type TripStatus = 
  | 'scheduled'
  | 'in_transit'
  | 'delayed'
  | 'on_time'
  | 'completed'
  | 'cancelled';

// ── Bus & Trip Data Types ───────────────────────────────────────────────────

/**
 * Basic bus information
 */
export interface BusInfo {
  id: string;
  registrationNumber: string;
  make?: string;
  model?: string;
  capacity: number;
  type?: 'standard' | 'express' | 'luxury' | 'minibus';
  operatorId?: string;
  operatorName?: string;
}

/**
 * Route information
 */
export interface RouteInfo {
  id: string;
  name: string;
  shortName?: string;
  startStop: string;
  endStop: string;
  totalStops: number;
  estimatedDuration: number; // minutes
  distance?: number; // km
}

/**
 * Schedule information
 */
export interface ScheduleInfo {
  id: string;
  departureTime: string;
  arrivalTime: string;
  frequency?: string;
}

/**
 * Stop information for next/upcoming stops
 */
export interface StopInfo {
  id: string;
  name: string;
  estimatedArrival: string;
  scheduledArrival?: string;
  distance?: number; // km from current location
}

/**
 * Alert/notification for a bus
 */
export interface BusAlert {
  id: string;
  type: 'delay' | 'breakdown' | 'accident' | 'route_deviation' | 'maintenance' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

/**
 * Complete tracked bus data
 */
export interface TrackedBus {
  id: string;
  bus: BusInfo;
  route?: RouteInfo;
  schedule?: ScheduleInfo;
  trip?: {
    id: string;
    status: TripStatus;
    progress: number; // 0-100 percentage
    passengersOnboard?: number;
  };
  location: BusLocationData;
  deviceStatus: DeviceStatus;
  movementStatus: BusMovementStatus;
  nextStop?: StopInfo;
  upcomingStops?: StopInfo[];
  alerts?: BusAlert[];
  lastUpdate: string;
}

// ── Filter Types ────────────────────────────────────────────────────────────

export interface TrackingFilterState {
  search: string;
  routeId: string;
  operatorId: string;
  tripStatus: string;
  deviceStatus: string;
  movementStatus: string;
  showOnlyActive: boolean;
  showOfflineDevices: boolean;
}

export interface TrackingFilterOptions {
  routes: Array<{ id: string; name: string }>;
  operators: Array<{ id: string; name: string }>;
  tripStatuses: TripStatus[];
}

// ── Statistics Types ────────────────────────────────────────────────────────

export interface TrackingStats {
  totalBusesTracking: number;
  activeBuses: number;
  idleBuses: number;
  offlineBuses: number;
  busesOnTime: number;
  busesDelayed: number;
  averageSpeed: number;
  totalPassengers: number;
  activeRoutes: number;
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface TrackingStatsChange {
  totalBusesTracking: string;
  activeBuses: string;
  idleBuses: string;
  offlineBuses: string;
  busesOnTime: string;
  busesDelayed: string;
  averageSpeed: string;
  totalPassengers: string;
}

// ── Map Configuration Types ─────────────────────────────────────────────────

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type MapViewMode = 'standard' | 'fullscreen' | 'split';

export interface MapSettings {
  center: MapCenter;
  zoom: number;
  viewMode: MapViewMode;
  showTrafficLayer: boolean;
  showRouteOverlay: boolean;
  clusterMarkers: boolean;
  autoCenter: boolean;
}

// ── Component Props Types ───────────────────────────────────────────────────

export interface TrackingStatsCardMetric {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  trendPositiveIsGood: boolean;
  color: 'blue' | 'teal' | 'green' | 'red' | 'purple' | 'amber';
  sparkData: number[];
  icon: LucideIcon;
}

// ── Real-time Update Types ──────────────────────────────────────────────────

export interface LocationUpdate {
  busId: string;
  location: GeoPoint;
  speed: number;
  heading: number;
  timestamp: string;
  movementStatus: BusMovementStatus;
}

export interface StatusUpdate {
  busId: string;
  deviceStatus?: DeviceStatus;
  tripStatus?: TripStatus;
  alerts?: BusAlert[];
  timestamp: string;
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface TrackingApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
