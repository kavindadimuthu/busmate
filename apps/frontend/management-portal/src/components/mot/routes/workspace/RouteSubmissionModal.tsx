'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { 
  searchAllStopsExistence, 
  applyBulkSearchResultsToRouteStops,
  BulkStopExistenceSearchResult 
} from '@/services/routeWorkspaceValidation';
import { BusStopManagementService, StopRequest, StopBatchCreateRequest, RouteManagementService, RouteGroupRequest, RouteRequest } from '@busmate/api-client-route';
import { 
  RouteGroup, 
  Route, 
  RouteStop, 
  Stop, 
  StopExistenceType,
  DirectionEnum,
  RoadTypeEnum
} from '@/types/RouteWorkspaceData';
import { 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  CircleDot,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface RouteSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Submission flow states
type SubmissionStep = 'confirmation' | 'validating' | 'creating-stops' | 'building-route' | 'completed' | 'failed';

interface StepStatus {
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  message?: string;
  details?: string[];
}

interface SubmissionState {
  currentStep: SubmissionStep;
  steps: {
    validation: StepStatus;
    stopCreation: StepStatus;
    routeBuilding: StepStatus;
  };
  validationResults?: BulkStopExistenceSearchResult;
  stopsToCreate: Stop[];
  createdStops: { original: Stop; created: Stop }[];
  failedStops: { stop: Stop; error: string }[];
  finalRouteGroup?: any; // The final route group request object
  error?: string;
  createdRouteGroupId?: string;
}

const initialState: SubmissionState = {
  currentStep: 'confirmation',
  steps: {
    validation: { status: 'pending' },
    stopCreation: { status: 'pending' },
    routeBuilding: { status: 'pending' },
  },
  stopsToCreate: [],
  createdStops: [],
  failedStops: [],
};

export default function RouteSubmissionModal({ isOpen, onClose }: RouteSubmissionModalProps) {
  const { data, updateRoute, mode, routeGroupId } = useRouteWorkspace();
  const [state, setState] = useState<SubmissionState>(initialState);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });

  // ── Task 4.3: Submission Idempotency ──────────────────────────────────────
  // Prevents duplicate submissions when the user clicks "Proceed" more than
  // once (e.g., double-click, slow network, re-renders).
  //
  // We use both a boolean state (for disabling the button in the UI) and a
  // ref-based submission ID (to guard against race conditions in async flows
  // where state might be stale inside async callbacks).
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionIdRef = useRef<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState(initialState);
      setProgress({ current: 0, total: 0, label: '' });
      // Reset idempotency guards so the modal is ready for the next open
      setIsSubmitting(false);
      submissionIdRef.current = null;
    }
  }, [isOpen]);

  // Step 1: Validate all stops existence
  // Returns the list of stops that need to be created AND the validated routes with updated stop IDs
  const validateStops = useCallback(async (): Promise<{ 
    success: boolean; 
    stopsToCreate: Stop[];
    validatedRoutes: Route[];
  }> => {
    setState(prev => ({
      ...prev,
      currentStep: 'validating',
      steps: {
        ...prev.steps,
        validation: { status: 'in-progress', message: 'Validating stop existence...' }
      }
    }));

    try {
      const allRouteStops: { routeIndex: number; routeStop: RouteStop }[] = [];
      
      // Gather all route stops from all routes
      data.routeGroup.routes.forEach((route, routeIndex) => {
        route.routeStops.forEach(routeStop => {
          allRouteStops.push({ routeIndex, routeStop });
        });
      });

      if (allRouteStops.length === 0) {
        setState(prev => ({
          ...prev,
          steps: {
            ...prev.steps,
            validation: { 
              status: 'failed', 
              message: 'No stops to validate',
              details: ['Please add at least one stop to each route before submitting.']
            }
          },
          currentStep: 'failed',
          error: 'No stops found in any route'
        }));
        return { success: false, stopsToCreate: [], validatedRoutes: [] };
      }

      // Validate stops for each route and build validated routes array
      const stopsToCreate: Stop[] = [];
      const existingStops: Stop[] = [];
      const validationDetails: string[] = [];
      const validatedRoutes: Route[] = [];
      const skippedRouteLabels: string[] = [];
      // Track unique stops by coordinates to avoid duplicates across routes.
      // Coordinate-based deduplication is more precise than name-based: two stops
      // can share the same name but be at different locations (and vice versa).
      const seenNewStopCoords = new Set<string>();

      for (let routeIndex = 0; routeIndex < data.routeGroup.routes.length; routeIndex++) {
        const route = data.routeGroup.routes[routeIndex];
        const routeStops = route.routeStops;

        // Skip routes that have no stops with valid names — these are empty placeholder
        // routes (e.g. a default blank route that was never filled in). Including them
        // would cause existence-check errors for nameless stops and ultimately block
        // the entire submission.
        const hasAnyNamedStop = routeStops.some(rs => rs.stop.name?.trim());
        if (routeStops.length === 0 || !hasAnyNamedStop) {
          const routeLabel = route.name?.trim() || '(unnamed)';
          skippedRouteLabels.push(routeLabel);
          validationDetails.push(`Route "${routeLabel}" skipped — no valid stops`);
          continue;
        }

        setProgress({
          current: routeIndex + 1,
          total: data.routeGroup.routes.length,
          label: `Validating route: ${route.name}`
        });

        // Search for all stops existence
        const results = await searchAllStopsExistence(
          routeStops,
          (current, total, stopName) => {
            setProgress({
              current,
              total,
              label: `Checking: ${stopName}`
            });
          }
        );

        // Update route stops with validation results
        const updatedRouteStops = applyBulkSearchResultsToRouteStops(routeStops, results);
        
        // Still update the context for UI purposes (though it's async)
        updateRoute(routeIndex, { routeStops: updatedRouteStops });
        
        // Add the validated route to our array (this is what buildRouteGroup will use)
        validatedRoutes.push({
          ...route,
          routeStops: updatedRouteStops
        });

        // Categorize stops
        results.results.forEach(result => {
          if (result.result.found && result.result.stop) {
            existingStops.push(result.result.stop);
          } else if (!result.result.error) {
            // Stop not found and no error - needs to be created
            // Use the updated stop from the applied results
            const stopToCreate = updatedRouteStops.find(
              rs => rs.orderNumber === result.orderNumber
            )?.stop;
            if (stopToCreate && stopToCreate.name) {
              // Deduplicate by coordinates (more precise than name: two stops can share
              // the same name but sit at different locations).
              const coordKey = (stopToCreate.location &&
                (stopToCreate.location.latitude !== 0 || stopToCreate.location.longitude !== 0))
                ? `${stopToCreate.location.latitude.toFixed(7)},${stopToCreate.location.longitude.toFixed(7)}`
                : `name:${stopToCreate.name}`;
              if (!seenNewStopCoords.has(coordKey)) {
                seenNewStopCoords.add(coordKey);
                stopsToCreate.push({ ...stopToCreate });
              }
            }
          }
        });

        validationDetails.push(
          `Route "${route.name}": ${results.successCount} existing, ${results.notFoundCount} new, ${results.errorCount} errors`
        );
      }

      console.log('Validation complete. Stops to create:', stopsToCreate);
      console.log('Validated routes with updated stop IDs:', validatedRoutes.length);

      setState(prev => ({
        ...prev,
        validationResults: undefined, // We aggregated results
        stopsToCreate,
        steps: {
          ...prev.steps,
          validation: {
            status: 'completed',
            message: `Validation complete`,
            details: [
              `Found ${existingStops.length} existing stops`,
              `${stopsToCreate.length} new stops need to be created`,
              ...(skippedRouteLabels.length > 0
                ? [`${skippedRouteLabels.length} empty route(s) skipped: ${skippedRouteLabels.join(', ')}`]
                : []),
              ...validationDetails
            ]
          }
        }
      }));

      return { success: true, stopsToCreate, validatedRoutes };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        steps: {
          ...prev.steps,
          validation: { 
            status: 'failed', 
            message: 'Validation failed',
            details: [error.message || 'Unknown error occurred']
          }
        },
        currentStep: 'failed',
        error: error.message || 'Validation failed'
      }));
      return { success: false, stopsToCreate: [], validatedRoutes: [] };
    }
  }, [data.routeGroup.routes, updateRoute]);

  // Step 2: Create new stops using batch API
  // Accepts stopsToCreate directly and returns the created stops mapping for use by buildRouteGroup
  const createNewStops = useCallback(async (stopsToCreate: Stop[]): Promise<{ success: boolean; createdStops: { original: Stop; created: Stop }[] }> => {
    console.log("Creating new stops...", stopsToCreate);

    if (stopsToCreate.length === 0) {
      setState(prev => ({
        ...prev,
        currentStep: 'building-route',
        steps: {
          ...prev.steps,
          stopCreation: {
            status: 'skipped',
            message: 'No new stops to create',
            details: ['All stops already exist in the system']
          }
        }
      }));
      console.log("No new stops to create.");
      return { success: true, createdStops: [] };
    }

    setState(prev => ({
      ...prev,
      currentStep: 'creating-stops',
      steps: {
        ...prev.steps,
        stopCreation: {
          status: 'in-progress',
          message: `Creating ${stopsToCreate.length} new stops in batch...`
        }
      }
    }));

    setProgress({
      current: 0,
      total: stopsToCreate.length,
      label: 'Preparing batch stop creation...'
    });

    // Pre-validate stops before sending to API
    const validStops: Stop[] = [];
    const failedStops: { stop: Stop; error: string }[] = [];

    for (const stop of stopsToCreate) {
      if (!stop.name || stop.name.trim() === '') {
        failedStops.push({ stop, error: 'Stop name is required' });
        continue;
      }
      if (!stop.location || stop.location.latitude === 0 || stop.location.longitude === 0) {
        failedStops.push({ stop, error: 'Valid coordinates are required' });
        continue;
      }
      validStops.push(stop);
    }

    if (validStops.length === 0) {
      setState(prev => ({
        ...prev,
        failedStops,
        steps: {
          ...prev.steps,
          stopCreation: {
            status: 'failed',
            message: `All ${failedStops.length} stops failed validation`,
            details: failedStops.map(s => `✗ Failed: ${s.stop.name || 'unnamed'} - ${s.error}`)
          }
        },
        currentStep: 'failed',
        error: `All stops failed client-side validation.`
      }));
      return { success: false, createdStops: [] };
    }

    // Build batch request
    const batchRequest: StopBatchCreateRequest = {
      stops: validStops.map(stop => ({
        name: stop.name,
        nameSinhala: stop.nameSinhala,
        nameTamil: stop.nameTamil,
        description: stop.description,
        location: {
          latitude: stop.location!.latitude,
          longitude: stop.location!.longitude,
          address: stop.location!.address,
          city: stop.location!.city,
          state: stop.location!.state,
          zipCode: stop.location!.zipCode,
          country: stop.location!.country,
          addressSinhala: stop.location!.addressSinhala,
          citySinhala: stop.location!.citySinhala,
          stateSinhala: stop.location!.stateSinhala,
          countrySinhala: stop.location!.countrySinhala,
          addressTamil: stop.location!.addressTamil,
          cityTamil: stop.location!.cityTamil,
          stateTamil: stop.location!.stateTamil,
          countryTamil: stop.location!.countryTamil,
        },
        isAccessible: stop.isAccessible
      }))
    };

    setProgress({
      current: 1,
      total: 2,
      label: `Creating ${validStops.length} stops in batch...`
    });

    try {
      const batchResponse = await BusStopManagementService.createStopsBatch(batchRequest);

      console.log("Batch creation response:", batchResponse);

      const createdStops: { original: Stop; created: Stop }[] = [];

      // Process batch results
      if (batchResponse.results) {
        for (const resultItem of batchResponse.results) {
          // Find the original stop by name
          const originalStop = validStops.find(s => s.name === resultItem.requestedName);

          if (resultItem.success && resultItem.stop && originalStop) {
            const mappedCreatedStop: Stop = {
              id: resultItem.stop.id ?? '',
              name: resultItem.stop.name ?? '',
              nameSinhala: resultItem.stop.nameSinhala,
              nameTamil: resultItem.stop.nameTamil,
              description: resultItem.stop.description,
              location: {
                latitude: resultItem.stop.location?.latitude ?? 0,
                longitude: resultItem.stop.location?.longitude ?? 0,
                address: resultItem.stop.location?.address,
                city: resultItem.stop.location?.city,
                state: resultItem.stop.location?.state,
                zipCode: resultItem.stop.location?.zipCode,
                country: resultItem.stop.location?.country,
                addressSinhala: resultItem.stop.location?.addressSinhala,
                citySinhala: resultItem.stop.location?.citySinhala,
                stateSinhala: resultItem.stop.location?.stateSinhala,
                countrySinhala: resultItem.stop.location?.countrySinhala,
                addressTamil: resultItem.stop.location?.addressTamil,
                cityTamil: resultItem.stop.location?.cityTamil,
                stateTamil: resultItem.stop.location?.stateTamil,
                countryTamil: resultItem.stop.location?.countryTamil,
              },
              isAccessible: resultItem.stop.isAccessible,
              type: StopExistenceType.EXISTING
            };

            createdStops.push({ original: originalStop, created: mappedCreatedStop });
          } else if (!resultItem.success && originalStop) {
            failedStops.push({ stop: originalStop, error: resultItem.error || 'Unknown error' });
          }
        }
      }

      setProgress({
        current: 2,
        total: 2,
        label: 'Batch creation complete'
      });

      // ── Task 4.4: Batch context update — single pass, one call per route ──
      //
      // Problem with the previous approach:
      //   for (created of createdStops) {
      //     routes.forEach(route => route.routeStops.forEach(rs => {
      //       if (match) updateRoute(routeIndex, { routeStops: route.routeStops.map(...) });
      //     }));
      //   }
      //
      // This called `updateRoute` once per (createdStop × matching routeStop), so
      // for N created stops and M matching route stops it fired N×M state updates.
      // Each intermediate React setState call could be applied to stale state,
      // causing later updates to overwrite earlier ones (race condition). It could
      // also trigger N×M re-renders before the data was fully consistent.
      //
      // Fix: build a name→createdStop lookup map, then do a single O(routes) pass.
      // At most one `updateRoute` is called per route, ensuring each route's stops
      // are updated atomically in a single React state transition.

      // Build stop-name → created-stop mapping (primary key: name)
      const createdStopByName = new Map<string, Stop>(
        createdStops.map(({ original, created }) => [original.name, created])
      );

      // Single pass — one updateRoute call per route that had new stops swapped
      data.routeGroup.routes.forEach((route, routeIndex) => {
        const updatedRouteStops = route.routeStops.map(routeStop => {
          if (routeStop.stop.type === StopExistenceType.NEW && routeStop.stop.name) {
            const created = createdStopByName.get(routeStop.stop.name);
            if (created) {
              return { ...routeStop, stop: { ...created } };
            }
          }
          return routeStop;
        });

        // Skip routes where nothing changed to avoid unnecessary re-renders
        const hasChanges = updatedRouteStops.some((rs, idx) => rs !== route.routeStops[idx]);
        if (hasChanges) {
          updateRoute(routeIndex, { routeStops: updatedRouteStops });
        }
      });

      setState(prev => ({
        ...prev,
        createdStops,
        failedStops,
        steps: {
          ...prev.steps,
          stopCreation: {
            status: failedStops.length === 0 ? 'completed' : 'failed',
            message: failedStops.length === 0
              ? `Successfully created ${createdStops.length} stops`
              : `Created ${createdStops.length} stops, ${failedStops.length} failed`,
            details: [
              ...createdStops.map(s => `✓ Created: ${s.created.name} (ID: ${s.created.id})`),
              ...failedStops.map(s => `✗ Failed: ${s.stop.name} - ${s.error}`)
            ]
          }
        }
      }));

      if (failedStops.length > 0) {
        setState(prev => ({
          ...prev,
          currentStep: 'failed',
          error: `Failed to create ${failedStops.length} stops. Route group cannot be submitted with missing stops.`
        }));
        return { success: false, createdStops };
      }

      return { success: true, createdStops };
    } catch (error: any) {
      const errorMessage = error.body?.message || error.message || 'Batch stop creation failed';
      console.error('Batch stop creation failed:', error);

      setState(prev => ({
        ...prev,
        failedStops: stopsToCreate.map(s => ({ stop: s, error: errorMessage })),
        steps: {
          ...prev.steps,
          stopCreation: {
            status: 'failed',
            message: 'Batch stop creation failed',
            details: [errorMessage]
          }
        },
        currentStep: 'failed',
        error: errorMessage
      }));
      return { success: false, createdStops: [] };
    }
  }, [data.routeGroup.routes, updateRoute]);

  // Step 3: Build final route group object
  // Now accepts validatedRoutes and createdStops mapping to avoid relying on async React state updates
  const buildRouteGroup = useCallback(async (
    validatedRoutes: Route[],
    createdStopsMapping: { original: Stop; created: Stop }[]
  ) => {
    setState(prev => ({
      ...prev,
      currentStep: 'building-route',
      steps: {
        ...prev.steps,
        routeBuilding: { 
          status: 'in-progress', 
          message: 'Building route group...'
        }
      }
    }));

    setProgress({
      current: 1,
      total: 2,
      label: 'Preparing route group data...'
    });

    try {
      // Use the route group info from context, but use validatedRoutes for the routes themselves
      const routeGroup = data.routeGroup;
      
      // Build coordinate-keyed lookup (primary) and name-keyed lookup (fallback).
      // Using coordinates as the primary key handles:
      //   - Same-named stops at different locations (different stops, same name)
      //   - Reverse routes that share stops with the forward route by location
      const createdStopByCoord = new Map<string, string>(); // "lat,lng" → created id
      const createdStopByName = new Map<string, string>();   // name → created id (fallback)
      createdStopsMapping.forEach(({ original, created }) => {
        if (!created.id) return;
        if (original.location &&
            (original.location.latitude !== 0 || original.location.longitude !== 0)) {
          const coordKey = `${original.location.latitude.toFixed(7)},${original.location.longitude.toFixed(7)}`;
          createdStopByCoord.set(coordKey, created.id);
        }
        if (original.name) {
          createdStopByName.set(original.name, created.id);
        }
      });

      console.log('Created stops coord mapping:', Object.fromEntries(createdStopByCoord));

      // Helper: resolve the correct stop ID from created-stop mappings or pre-existing ID.
      const getStopId = (stop: Stop): string => {
        // 1. Coordinate lookup — most precise, handles duplicate names
        if (stop.location &&
            (stop.location.latitude !== 0 || stop.location.longitude !== 0)) {
          const coordKey = `${stop.location.latitude.toFixed(7)},${stop.location.longitude.toFixed(7)}`;
          if (createdStopByCoord.has(coordKey)) {
            return createdStopByCoord.get(coordKey)!;
          }
        }
        // 2. Name lookup — fallback when coordinates aren't exact matches
        if (stop.name && createdStopByName.has(stop.name)) {
          return createdStopByName.get(stop.name)!;
        }
        // 3. Use the stop's own ID (set during validation for existing stops)
        return stop.id || '';
      };
      
      // Validate all stops have IDs (either existing or from created mapping)
      // Use validatedRoutes which have the correct stop IDs from validation
      const stopsWithoutIds: string[] = [];
      validatedRoutes.forEach(route => {
        route.routeStops.forEach(routeStop => {
          const stopId = getStopId(routeStop.stop);
          if (!stopId || stopId.trim() === '') {
            stopsWithoutIds.push(routeStop.stop.name || `Order ${routeStop.orderNumber}`);
          }
        });
      });

      if (stopsWithoutIds.length > 0) {
        setState(prev => ({
          ...prev,
          steps: {
            ...prev.steps,
            routeBuilding: { 
              status: 'failed',
              message: 'Cannot build route group - some stops are missing IDs',
              details: stopsWithoutIds.map(name => `Missing ID: ${name}`)
            }
          },
          currentStep: 'failed',
          error: 'Some stops do not have valid IDs in the system'
        }));
        return false;
      }

      // Build the route group request object using validatedRoutes and the helper to get correct IDs
      const routeGroupRequest: RouteGroupRequest = {
        name: routeGroup.name,
        nameSinhala: routeGroup.nameSinhala,
        nameTamil: routeGroup.nameTamil,
        description: routeGroup.description,
        routes: validatedRoutes.map(route => {
          const routeStopsWithIds = route.routeStops.map((routeStop, index) => ({
            id: routeStop.id, // Include route stop ID for updates
            stopId: getStopId(routeStop.stop),
            stopOrder: index,
            distanceFromStartKm: routeStop.distanceFromStart || undefined
          }));

          return {
            id: route.id, // Include route ID for updates
            name: route.name,
            nameSinhala: route.nameSinhala,
            nameTamil: route.nameTamil,
            routeNumber: route.routeNumber,
            description: route.description,
            roadType: route.roadType,
            routeThrough: route.routeThrough,
            routeThroughSinhala: route.routeThroughSinhala,
            routeThroughTamil: route.routeThroughTamil,
            startStopId: routeStopsWithIds[0]?.stopId || '',
            endStopId: routeStopsWithIds[routeStopsWithIds.length - 1]?.stopId || '',
            distanceKm: route.distanceKm,
            estimatedDurationMinutes: route.estimatedDurationMinutes,
            direction: route.direction,
            routeStops: routeStopsWithIds
          };
        })
      };

      // Console log the final route group object
      console.log('='.repeat(80));
      console.log(`ROUTE GROUP ${mode === 'edit' ? 'UPDATE' : 'SUBMISSION'} - Final Request Object`);
      console.log('='.repeat(80));
      console.log(JSON.stringify(routeGroupRequest, null, 2));
      console.log('='.repeat(80));

      setProgress({
        current: 2,
        total: 2,
        label: mode === 'edit' ? 'Updating route group on server...' : 'Submitting route group to server...'
      });

      // Call the appropriate API based on mode
      let resultRouteGroup;
      if (mode === 'edit' && routeGroupId) {
        // Update existing route group
        resultRouteGroup = await RouteManagementService.updateRouteGroup(routeGroupId, routeGroupRequest);
        console.log('Route group updated successfully:', resultRouteGroup);
      } else {
        // Create new route group
        resultRouteGroup = await RouteManagementService.createRouteGroup(routeGroupRequest);
        console.log('Route group created successfully:', resultRouteGroup);
      }

      setState(prev => ({
        ...prev,
        finalRouteGroup: routeGroupRequest,
        steps: {
          ...prev.steps,
          routeBuilding: { 
            status: 'completed',
            message: mode === 'edit' ? 'Route group updated successfully' : 'Route group created successfully',
            details: [
              `Route Group: ${routeGroup.name}`,
              `Route Group ID: ${resultRouteGroup.id}`,
              `Routes: ${validatedRoutes.length}`,
              `Total Stops: ${validatedRoutes.reduce((acc, r) => acc + r.routeStops.length, 0)}`
            ]
          }
        },
        currentStep: 'completed',
        createdRouteGroupId: resultRouteGroup.id
      }));

      return true;
    } catch (error: any) {
      const errorMessage = error.body?.message || error.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} route group`;
      console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} route group:`, error);
      
      setState(prev => ({
        ...prev,
        steps: {
          ...prev.steps,
          routeBuilding: { 
            status: 'failed',
            message: `Failed to ${mode === 'edit' ? 'update' : 'create'} route group`,
            details: [errorMessage]
          }
        },
        currentStep: 'failed',
        error: errorMessage
      }));
      return false;
    }
  }, [data.routeGroup, mode, routeGroupId]);

  // Main submission flow
  const handleProceed = useCallback(async () => {
    // ── Task 4.3: Idempotency guard ──────────────────────────────────────────
    // Reject concurrent calls caused by rapid clicks or re-renders.
    if (isSubmitting) {
      console.warn('[RouteSubmissionModal] Submission already in progress — ignoring duplicate call.');
      return;
    }

    // Stamp this submission attempt with a unique ID so that, if an older
    // async call somehow survives long enough to reach the finally block, it
    // will detect the mismatch and skip clearing the flag.
    const submissionId = crypto.randomUUID();
    submissionIdRef.current = submissionId;
    setIsSubmitting(true);

    try {
      // Step 1: Validation - returns the stops that need to be created AND validated routes with correct IDs
      console.log("Step 1: Starting validation...");
      const validationResult = await validateStops();
      console.log("Step 1 complete. Success:", validationResult.success, "Stops to create:", validationResult.stopsToCreate.length, "Validated routes:", validationResult.validatedRoutes.length);
      
      if (!validationResult.success) return;

      // Step 2: Create stops - pass the stops directly and get the created mapping back
      console.log("Step 2: Creating new stops...");
      const creationResult = await createNewStops(validationResult.stopsToCreate);
      console.log("Step 2 complete. Success:", creationResult.success, "Created stops:", creationResult.createdStops.length);
      
      if (!creationResult.success) return;

      // Step 3: Build route group - pass the validated routes AND created stops mapping to avoid async state issues
      console.log("Step 3: Building route group...");
      await buildRouteGroup(validationResult.validatedRoutes, creationResult.createdStops);
      console.log("Step 3 complete.");
    } finally {
      // ── Task 4.3: Release submission lock ─────────────────────────────────
      // Only clear the flag if this is still the active submission attempt.
      // A stale async callback from a previous attempt should not clear the
      // flag of a newer, currently running submission.
      if (submissionIdRef.current === submissionId) {
        setIsSubmitting(false);
        submissionIdRef.current = null;
      }
    }
  }, [isSubmitting, validateStops, createNewStops, buildRouteGroup]);

  const handleClose = () => {
    setState(initialState);
    onClose();
  };

  const handleViewRouteGroup = () => {
    // For now, just log since API is not implemented
    console.log('Navigate to route group page (API not implemented yet)');
    handleClose();
  };

  // Render step indicator
  const renderStepIndicator = (step: StepStatus, label: string, stepNumber: number) => {
    const getIcon = () => {
      switch (step.status) {
        case 'completed':
          return <CheckCircle2 className="w-6 h-6 text-green-600" />;
        case 'failed':
          return <X className="w-6 h-6 text-red-600" />;
        case 'in-progress':
          return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
        case 'skipped':
          return <Check className="w-6 h-6 text-gray-400" />;
        default:
          return <CircleDot className="w-6 h-6 text-gray-300" />;
      }
    };

    const getStatusColor = () => {
      switch (step.status) {
        case 'completed':
          return 'border-green-600 bg-green-50';
        case 'failed':
          return 'border-red-600 bg-red-50';
        case 'in-progress':
          return 'border-blue-600 bg-blue-50';
        case 'skipped':
          return 'border-gray-300 bg-gray-50';
        default:
          return 'border-gray-200 bg-white';
      }
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${getStatusColor()} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {getIcon()}
          </div>
          <div className="grow">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Step {stepNumber}:</span>
              <span className="font-semibold text-gray-900">{label}</span>
            </div>
            {step.message && (
              <p className="text-sm text-gray-600 mt-1">{step.message}</p>
            )}
          </div>
        </div>
        {step.details && step.details.length > 0 && (
          <div className="mt-3 ml-9 space-y-1">
            {step.details.map((detail, idx) => (
              <p key={idx} className="text-xs text-gray-500">{detail}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render progress bar
  const renderProgressBar = () => {
    if (progress.total === 0) return null;

    const percentage = Math.round((progress.current / progress.total) * 100);

    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{progress.label}</span>
          <span>{progress.current} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Render confirmation view
  const renderConfirmation = () => {
    // Identify routes that are empty (no stop has a name) — they will be skipped
    // during submission. Show a warning so the user knows ahead of time.
    const emptyRoutes = data.routeGroup.routes.filter(
      route => !route.routeStops.some(rs => rs.stop.name?.trim())
    );
    const validRoutes = data.routeGroup.routes.filter(
      route => route.routeStops.some(rs => rs.stop.name?.trim())
    );

    return (
      <>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Update Route Group' : 'Submit Route Group'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Are you sure you want to update this route group?'
              : 'Are you sure you want to submit this route group?'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className={`p-4 rounded-lg space-y-2 ${mode === 'edit' ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <p className="font-medium text-gray-900">{data.routeGroup.name || 'Unnamed Route Group'}</p>
            {mode === 'edit' && routeGroupId && (
              <p className="text-xs text-gray-500">ID: {routeGroupId}</p>
            )}
            <div className="text-sm text-gray-600 space-y-1">
              <p>Routes: {validRoutes.length}{emptyRoutes.length > 0 ? ` (${emptyRoutes.length} empty, will be skipped)` : ''}</p>
              <p>Total Stops: {validRoutes.reduce((acc, r) => acc + r.routeStops.length, 0)}</p>
            </div>
          </div>

          {emptyRoutes.length > 0 && (
            <div className="mt-3 p-4 border border-amber-300 bg-amber-50 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">
                    {emptyRoutes.length === 1 ? '1 route has no stops and will be skipped:' : `${emptyRoutes.length} routes have no stops and will be skipped:`}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {emptyRoutes.map((r, i) => (
                      <li key={i} className="text-amber-700">
                        {r.name?.trim() ? `"${r.name}"` : '(unnamed route)'}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-amber-600 text-xs">
                    Only routes with at least one stop will be submitted.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={`mt-4 p-4 border rounded-lg ${mode === 'edit' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex gap-3">
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${mode === 'edit' ? 'text-yellow-600' : 'text-blue-600'}`} />
              <div className={`text-sm ${mode === 'edit' ? 'text-yellow-800' : 'text-blue-800'}`}>
                <p className="font-medium mb-1">{mode === 'edit' ? 'Update Process:' : 'Submission Process:'}</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Validate all stop existence in the system</li>
                  <li>Create any new stops that don't exist</li>
                  <li>{mode === 'edit' ? 'Update the route group' : 'Build and submit the route group'}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            className={mode === 'edit' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            disabled={validRoutes.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Processing...'}
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                {mode === 'edit' ? 'Update' : 'Proceed'}
              </>
            )}
          </Button>
        </DialogFooter>
      </>
    );
  };

  // Render processing view
  const renderProcessing = () => (
    <>
      <DialogHeader>
        <DialogTitle>{mode === 'edit' ? 'Updating Route Group' : 'Submitting Route Group'}</DialogTitle>
        <DialogDescription>
          {mode === 'edit' 
            ? 'Please wait while we process your update...' 
            : 'Please wait while we process your submission...'}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {renderStepIndicator(state.steps.validation, 'Stop Validation', 1)}
        {renderStepIndicator(state.steps.stopCreation, 'Create New Stops', 2)}
        {renderStepIndicator(state.steps.routeBuilding, mode === 'edit' ? 'Update Route Group' : 'Build Route Group', 3)}
        
        {renderProgressBar()}
      </div>
    </>
  );

  // Render completed view
  const renderCompleted = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-6 h-6" />
          {mode === 'edit' ? 'Update Complete' : 'Submission Complete'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'edit' 
            ? 'Your route group has been updated successfully.' 
            : 'Your route group has been created successfully.'}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="font-medium text-green-800">Summary</div>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>Route Group:</strong> {data.routeGroup.name}</p>
            <p><strong>Routes:</strong> {data.routeGroup.routes.length}</p>
            <p><strong>Total Stops:</strong> {data.routeGroup.routes.reduce((acc, r) => acc + r.routeStops.length, 0)}</p>
            {state.createdStops.length > 0 && (
              <p><strong>New Stops Created:</strong> {state.createdStops.length}</p>
            )}
          </div>
        </div>

        {state.createdRouteGroupId && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">{mode === 'edit' ? 'Route Group Updated' : 'Route Group Created'}</p>
                <p>ID: {state.createdRouteGroupId}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {renderStepIndicator(state.steps.validation, 'Stop Validation', 1)}
          {renderStepIndicator(state.steps.stopCreation, 'Create New Stops', 2)}
          {renderStepIndicator(state.steps.routeBuilding, 'Build Route Group', 3)}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={handleViewRouteGroup} 
          disabled={!state.createdRouteGroupId}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Route Group
        </Button>
        <Button onClick={handleClose}>
          Finish
        </Button>
      </DialogFooter>
    </>
  );

  // Render failed view
  const renderFailed = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-700">
          <X className="w-6 h-6" />
          Submission Failed
        </DialogTitle>
        <DialogDescription>
          There was an error during the submission process.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {renderStepIndicator(state.steps.validation, 'Stop Validation', 1)}
          {renderStepIndicator(state.steps.stopCreation, 'Create New Stops', 2)}
          {renderStepIndicator(state.steps.routeBuilding, 'Build Route Group', 3)}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );

  // Determine which view to render
  const renderContent = () => {
    switch (state.currentStep) {
      case 'confirmation':
        return renderConfirmation();
      case 'validating':
      case 'creating-stops':
      case 'building-route':
        return renderProcessing();
      case 'completed':
        return renderCompleted();
      case 'failed':
        return renderFailed();
      default:
        return renderConfirmation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
