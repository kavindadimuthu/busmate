/**
 * Route Workspace Zod Schemas
 *
 * Provides runtime validation for:
 *   1. API responses received from the backend (prefixed with `Api`)
 *   2. Workspace data parsed from YAML / JSON user input (unprefixed)
 *
 * Why Zod?
 *   TypeScript types are erased at runtime. When the backend returns an
 *   unexpected payload — either due to a bug or a version mismatch — the
 *   application silently operates on bad data, leading to subtle runtime
 *   errors.  Zod schemas catch these mismatches early and produce
 *   descriptive error messages.
 */

import { z } from 'zod';
import { DirectionEnum, RoadTypeEnum, StopExistenceType } from '@/types/RouteWorkspaceData';

// ============================================================================
// SECTION 1: API Response Schemas
//   These mirror the shapes returned by the generated OpenAPI client.
//   Each field is optional / nullable because the backend may omit fields
//   that are not relevant or not yet populated.
// ============================================================================

/** LocationDto as returned by the route-management API */
export const ApiLocationSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  addressSinhala: z.string().nullable().optional(),
  citySinhala: z.string().nullable().optional(),
  stateSinhala: z.string().nullable().optional(),
  countrySinhala: z.string().nullable().optional(),
  addressTamil: z.string().nullable().optional(),
  cityTamil: z.string().nullable().optional(),
  stateTamil: z.string().nullable().optional(),
  countryTamil: z.string().nullable().optional(),
}).nullish();

/** RouteStopResponse as returned by the route-management API */
export const ApiRouteStopResponseSchema = z.object({
  id: z.string().nullable().optional(),
  stopId: z.string().nullable().optional(),
  stopName: z.string().nullable().optional(),
  location: ApiLocationSchema,
  stopOrder: z.number().nullable().optional(),
  distanceFromStartKm: z.number().nullable().optional(),
  distanceFromStartKmUnverified: z.number().nullable().optional(),
  distanceFromStartKmCalculated: z.number().nullable().optional(),
});

/** RouteResponse as returned by the route-management API */
export const ApiRouteResponseSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  nameSinhala: z.string().nullable().optional(),
  nameTamil: z.string().nullable().optional(),
  routeNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  roadType: z.string().nullable().optional(),
  routeThrough: z.string().nullable().optional(),
  routeThroughSinhala: z.string().nullable().optional(),
  routeThroughTamil: z.string().nullable().optional(),
  routeGroupId: z.string().nullable().optional(),
  startStopId: z.string().nullable().optional(),
  endStopId: z.string().nullable().optional(),
  distanceKm: z.number().nullable().optional(),
  estimatedDurationMinutes: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  routeStops: z.array(ApiRouteStopResponseSchema).nullable().optional(),
});

/** RouteGroupResponse as returned by the route-management API */
export const ApiRouteGroupResponseSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  nameSinhala: z.string().nullable().optional(),
  nameTamil: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  routes: z.array(ApiRouteResponseSchema).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

/** RouteGroupStopDetailResponse as returned by the route-management API */
export const ApiRouteGroupStopDetailSchema = z.object({
  routeId: z.string().nullable().optional(),
  routeName: z.string().nullable().optional(),
  routeStopId: z.string().nullable().optional(),
  stopOrder: z.number().nullable().optional(),
  distanceFromStartKm: z.number().nullable().optional(),
  stopId: z.string().nullable().optional(),
  stopName: z.string().nullable().optional(),
  stopNameSinhala: z.string().nullable().optional(),
  stopNameTamil: z.string().nullable().optional(),
  stopDescription: z.string().nullable().optional(),
  location: ApiLocationSchema,
  isAccessible: z.boolean().nullable().optional(),
});

// Inferred TypeScript types from the API schemas
export type ApiRouteGroupResponse = z.infer<typeof ApiRouteGroupResponseSchema>;
export type ApiRouteGroupStopDetail = z.infer<typeof ApiRouteGroupStopDetailSchema>;

// ============================================================================
// SECTION 2: Workspace Data Schemas
//   These validate the structure of workspace data when parsing user-supplied
//   YAML or JSON text (e.g. pasted into the Textual Mode editor).
// ============================================================================

/** Location as stored in the workspace */
export const WorkspaceLocationSchema = z.object({
  latitude: z.number().default(0),
  longitude: z.number().default(0),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  addressSinhala: z.string().optional(),
  citySinhala: z.string().optional(),
  stateSinhala: z.string().optional(),
  countrySinhala: z.string().optional(),
  addressTamil: z.string().optional(),
  cityTamil: z.string().optional(),
  stateTamil: z.string().optional(),
  countryTamil: z.string().optional(),
});

/** Stop as stored in the workspace */
export const WorkspaceStopSchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  nameSinhala: z.string().optional(),
  nameTamil: z.string().optional(),
  description: z.string().optional(),
  location: WorkspaceLocationSchema.optional(),
  isAccessible: z.boolean().optional(),
  type: z.nativeEnum(StopExistenceType).default(StopExistenceType.NEW),
});

/** RouteStop as stored in the workspace */
export const WorkspaceRouteStopSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.number().default(0),
  distanceFromStart: z.number().nullable().default(null),
  stop: WorkspaceStopSchema,
});

/** Route as stored in the workspace */
export const WorkspaceRouteSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  nameSinhala: z.string().optional(),
  nameTamil: z.string().optional(),
  routeNumber: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(DirectionEnum).default(DirectionEnum.OUTBOUND),
  roadType: z.nativeEnum(RoadTypeEnum).default(RoadTypeEnum.NORMALWAY),
  routeThrough: z.string().optional(),
  routeThroughSinhala: z.string().optional(),
  routeThroughTamil: z.string().optional(),
  distanceKm: z.number().optional(),
  estimatedDurationMinutes: z.number().optional(),
  startStopId: z.string().optional(),
  endStopId: z.string().optional(),
  routeStops: z.array(WorkspaceRouteStopSchema).default([]),
});

/** RouteGroup as stored in the workspace */
export const WorkspaceRouteGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  nameSinhala: z.string().optional(),
  nameTamil: z.string().optional(),
  description: z.string().optional(),
  routes: z.array(WorkspaceRouteSchema).default([]),
});

/** Full workspace data */
export const WorkspaceDataSchema = z.object({
  routeGroup: WorkspaceRouteGroupSchema,
  activeRouteIndex: z.number().optional(),
  activeDirection: z.enum(['outbound', 'inbound']).optional(),
});

export type WorkspaceDataValidated = z.infer<typeof WorkspaceDataSchema>;

// ============================================================================
// SECTION 3: Validation Helpers
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates the route group API response at runtime.
 * Logs a warning and returns null on failure (soft validation) to avoid
 * crashing the UI if a minor field changes on the server side.
 */
export function validateRouteGroupApiResponse(
  data: unknown
): ValidationResult<ApiRouteGroupResponse> {
  const result = ApiRouteGroupResponseSchema.safeParse(data);
  if (!result.success) {
    const formatted = result.error.flatten();
    console.warn('[RouteWorkspace] API response validation warning:', formatted);
    return {
      success: false,
      error: `API response validation failed: ${JSON.stringify(formatted.fieldErrors)}`,
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates the route group stop details API response at runtime.
 * Returns null on failure (soft validation).
 */
export function validateStopDetailsApiResponse(
  data: unknown
): ValidationResult<ApiRouteGroupStopDetail[]> {
  const result = z.array(ApiRouteGroupStopDetailSchema).safeParse(data);
  if (!result.success) {
    const formatted = result.error.flatten();
    console.warn('[RouteWorkspace] Stop details API response validation warning:', formatted);
    return {
      success: false,
      error: `Stop details response validation failed: ${JSON.stringify(formatted.fieldErrors)}`,
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates workspace data parsed from YAML or JSON text.
 * Returns a structured error on failure so the caller can show the user a
 * meaningful message.
 */
export function validateWorkspaceData(data: unknown): ValidationResult<WorkspaceDataValidated> {
  const result = WorkspaceDataSchema.safeParse(data);
  if (!result.success) {
    const formatted = result.error.flatten();
    return {
      success: false,
      error: `Invalid workspace data: ${JSON.stringify(formatted.fieldErrors)}`,
    };
  }
  return { success: true, data: result.data };
}
