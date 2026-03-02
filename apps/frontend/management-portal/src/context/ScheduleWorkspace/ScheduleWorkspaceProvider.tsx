'use client';

import { ReactNode, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ScheduleWorkspaceContext, ScheduleWorkspaceMode } from './ScheduleWorkspaceContext';
import {
  ScheduleWorkspaceData,
  createEmptyScheduleWorkspaceData,
  createEmptyCalendar,
  createEmptySchedule,
  createScheduleForRoute,
  Schedule,
  ScheduleStop,
  ScheduleCalendar,
  ScheduleException,
  RouteReference,
  RouteStopReference,
  isScheduleValid,
  validateAllSchedules as validateAllSchedulesHelper,
  scheduleToApiRequest,
  calculateTimeOffset,
  ScheduleTypeEnum,
  ScheduleStatusEnum,
  ExceptionTypeEnum,
  scheduleResponseToWorkspace,
  routeResponseToReference,
  routeStopsToReferences,
} from '@/types/ScheduleWorkspaceData';
import {
  RouteManagementService,
  ScheduleManagementService,
  ScheduleRequest,
  ScheduleResponse,
  RouteResponse,
} from '../../../generated/api-clients/route-management';
import {
  serializeSchedulesToYaml,
  parseSchedulesFromYaml,
  mergeSchedulesWithRouteContext,
  serializeSchedulesToJson,
  parseSchedulesFromJson,
} from '@/services/scheduleWorkspaceSerializer';

interface ScheduleWorkspaceProviderProps {
  children: ReactNode;
}

export function ScheduleWorkspaceProvider({ children }: ScheduleWorkspaceProviderProps) {
  // Mode and loading state
  const [mode, setMode] = useState<ScheduleWorkspaceMode>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize with empty data - routes will be loaded via API
  const [data, setData] = useState<ScheduleWorkspaceData>(() => createEmptyScheduleWorkspaceData());

  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [selectedExceptionIndex, setSelectedExceptionIndex] = useState<number | null>(null);

  // Load available routes on mount
  useEffect(() => {
    loadAvailableRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear highlight after a delay
  useEffect(() => {
    if (data.highlightedScheduleIndex !== null) {
      const timer = setTimeout(() => {
        setData(prev => ({ ...prev, highlightedScheduleIndex: null }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [data.highlightedScheduleIndex]);

  // Load existing schedules for a route from API
  const loadSchedulesForRoute = useCallback(async (routeId: string): Promise<boolean> => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // Fetch route details to get route stops
      const routeDetails = await RouteManagementService.getRouteById(routeId);
      const routeStops = routeStopsToReferences(routeDetails.routeStops);
      
      // Fetch schedules for the route from API
      const schedulesResponse = await ScheduleManagementService.getSchedulesByRoute(routeId);
      const schedules = (schedulesResponse.content || []).map(response => 
        scheduleResponseToWorkspace(response, routeStops)
      );
      
      if (schedules.length > 0) {
        setMode('edit');
        setData(prev => ({
          ...prev,
          schedules,
          activeScheduleIndex: 0,
          routeStops,
        }));
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load schedules');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Reset to create mode
  const resetToCreateMode = useCallback(async () => {
    setMode('create');
    setLoadError(null);
    
    // Reload available routes
    try {
      const routes = await RouteManagementService.getAllRoutesAsList();
      const routeReferences = routes.map(routeResponseToReference);
      
      setData({
        ...createEmptyScheduleWorkspaceData(),
        availableRoutes: routeReferences,
      });
    } catch (error) {
      console.error('Failed to reload routes:', error);
      setData(createEmptyScheduleWorkspaceData());
    }
    
    setSelectedStopIndex(null);
    setSelectedExceptionIndex(null);
  }, []);

  // Set selected route and load its data from API
  const setSelectedRoute = useCallback(async (routeId: string) => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Find the route in available routes
      const selectedRoute = data.availableRoutes.find(r => r.id === routeId);
      if (!selectedRoute) {
        throw new Error('Route not found');
      }

      // Fetch the full route details to get route stops
      const routeDetails = await RouteManagementService.getRouteById(routeId);
      const routeStops = routeStopsToReferences(routeDetails.routeStops);

      // Fetch existing schedules for this route
      const schedulesResponse = await ScheduleManagementService.getSchedulesByRoute(routeId);
      let schedules = (schedulesResponse.content || []).map(response => 
        scheduleResponseToWorkspace(response, routeStops)
      );
      
      // If no existing schedules, create one empty schedule for the route
      if (schedules.length === 0) {
        setMode('create');
        schedules = [
          createScheduleForRoute(
            routeId,
            selectedRoute.name,
            selectedRoute.routeGroupId || '',
            selectedRoute.routeGroupName || '',
            routeStops,
            'Schedule 1'
          ),
        ];
      } else {
        setMode('edit');
      }

      setData(prev => ({
        ...prev,
        selectedRouteId: routeId,
        selectedRouteName: selectedRoute.name,
        selectedRouteGroupId: selectedRoute.routeGroupId || null,
        selectedRouteGroupName: selectedRoute.routeGroupName || null,
        schedules,
        activeScheduleIndex: schedules.length > 0 ? 0 : null,
        highlightedScheduleIndex: null,
        routeStops,
      }));
    } catch (error) {
      console.error('Failed to load route data:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load route data');
    } finally {
      setIsLoading(false);
    }
  }, [data.availableRoutes]);

  // Load available routes from API
  const loadAvailableRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const routes = await RouteManagementService.getAllRoutesAsList();
      const routeReferences = routes.map(routeResponseToReference);
      setData(prev => ({ ...prev, availableRoutes: routeReferences }));
    } catch (error) {
      console.error('Failed to load routes:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // YAML SERIALIZATION (for textual mode)
  // ============================================================================

  // Get current data as YAML string
  const getYaml = useCallback((): string => {
    return serializeSchedulesToYaml(data);
  }, [data]);

  // Update data from YAML string - returns error message or null on success
  const updateFromYaml = useCallback((yamlText: string): string | null => {
    try {
      const { schedules: parsedSchedules, error } = parseSchedulesFromYaml(yamlText);
      
      if (error) {
        return error;
      }

      if (parsedSchedules.length === 0 && yamlText.trim()) {
        // If YAML is not empty but no schedules parsed, don't update
        return null;
      }

      // Merge parsed schedules with current route context
      const mergedSchedules = mergeSchedulesWithRouteContext(parsedSchedules, data);

      // Update data with merged schedules
      setData(prev => ({
        ...prev,
        schedules: mergedSchedules,
        // Adjust active index if needed
        activeScheduleIndex: mergedSchedules.length > 0 
          ? Math.min(prev.activeScheduleIndex ?? 0, mergedSchedules.length - 1)
          : null,
      }));

      return null;
    } catch (error) {
      console.error('Failed to parse YAML:', error);
      return error instanceof Error ? error.message : 'Failed to parse YAML';
    }
  }, [data]);

  // ============================================================================
  // JSON SERIALIZATION (for textual mode)
  // ============================================================================

  // Get current data as JSON string
  const getJson = useCallback((): string => {
    return serializeSchedulesToJson(data);
  }, [data]);

  // Update data from JSON string - returns error message or null on success
  const updateFromJson = useCallback((jsonText: string): string | null => {
    try {
      const { schedules: parsedSchedules, error } = parseSchedulesFromJson(jsonText);
      
      if (error) {
        return error;
      }

      if (parsedSchedules.length === 0 && jsonText.trim()) {
        // If JSON is not empty but no schedules parsed, don't update
        return null;
      }

      // Merge parsed schedules with current route context
      const mergedSchedules = mergeSchedulesWithRouteContext(parsedSchedules, data);

      // Update data with merged schedules
      setData(prev => ({
        ...prev,
        schedules: mergedSchedules,
        // Adjust active index if needed
        activeScheduleIndex: mergedSchedules.length > 0 
          ? Math.min(prev.activeScheduleIndex ?? 0, mergedSchedules.length - 1)
          : null,
      }));

      return null;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return error instanceof Error ? error.message : 'Failed to parse JSON';
    }
  }, [data]);

  // Active schedule index management
  const setActiveScheduleIndex = useCallback((index: number | null) => {
    setData(prev => ({ ...prev, activeScheduleIndex: index }));
  }, []);

  // Highlighted schedule index (for grid highlighting)
  const setHighlightedScheduleIndex = useCallback((index: number | null) => {
    setData(prev => ({ ...prev, highlightedScheduleIndex: index }));
  }, []);

  // Add new schedule
  const addNewSchedule = useCallback(() => {
    setData(prev => {
      if (!prev.selectedRouteId) return prev;
      
      const newSchedule = createScheduleForRoute(
        prev.selectedRouteId,
        prev.selectedRouteName || '',
        prev.selectedRouteGroupId || '',
        prev.selectedRouteGroupName || '',
        prev.routeStops,
        `Schedule ${prev.schedules.length + 1}`
      );
      
      const newSchedules = [...prev.schedules, newSchedule];
      return {
        ...prev,
        schedules: newSchedules,
        activeScheduleIndex: newSchedules.length - 1,
      };
    });
  }, []);

  // Remove schedule
  const removeSchedule = useCallback(async (scheduleIndex: number) => {
    setData(prev => {
      if (scheduleIndex < 0 || scheduleIndex >= prev.schedules.length) return prev;
      
      const scheduleToRemove = prev.schedules[scheduleIndex];
      
      // If schedule has an ID, it exists in the backend and needs to be deleted via API
      if (scheduleToRemove.id) {
        setIsLoading(true);
        
        ScheduleManagementService.deleteSchedule(scheduleToRemove.id)
          .then(() => {
            console.log(`Successfully deleted schedule "${scheduleToRemove.name}" from backend`);
            // After successful backend deletion, remove from local state
            setData(current => {
              const newSchedules = current.schedules.filter((_, i) => i !== scheduleIndex);
              let newActiveIndex = current.activeScheduleIndex;
              
              if (newActiveIndex !== null) {
                if (newActiveIndex === scheduleIndex) {
                  newActiveIndex = newSchedules.length > 0 ? Math.min(scheduleIndex, newSchedules.length - 1) : null;
                } else if (newActiveIndex > scheduleIndex) {
                  newActiveIndex = newActiveIndex - 1;
                }
              }
              
              return {
                ...current,
                schedules: newSchedules,
                activeScheduleIndex: newActiveIndex,
              };
            });
          })
          .catch((error) => {
            console.error(`Failed to delete schedule "${scheduleToRemove.name}":`, error);
            setLoadError(error instanceof Error ? error.message : 'Failed to delete schedule');
          })
          .finally(() => {
            setIsLoading(false);
          });
        
        return prev; // Return current state while API call is in progress
      }
      
      // For new schedules (no ID), just remove from local state immediately
      const newSchedules = prev.schedules.filter((_, i) => i !== scheduleIndex);
      let newActiveIndex = prev.activeScheduleIndex;
      
      if (newActiveIndex !== null) {
        if (newActiveIndex === scheduleIndex) {
          newActiveIndex = newSchedules.length > 0 ? Math.min(scheduleIndex, newSchedules.length - 1) : null;
        } else if (newActiveIndex > scheduleIndex) {
          newActiveIndex = newActiveIndex - 1;
        }
      }
      
      return {
        ...prev,
        schedules: newSchedules,
        activeScheduleIndex: newActiveIndex,
      };
    });
  }, []);

  // Duplicate schedule
  const duplicateSchedule = useCallback((scheduleIndex: number) => {
    setData(prev => {
      if (scheduleIndex < 0 || scheduleIndex >= prev.schedules.length) return prev;
      
      const original = prev.schedules[scheduleIndex];
      const duplicate: Schedule = {
        ...original,
        id: undefined, // Remove ID so it's treated as new
        name: `${original.name} (Copy)`,
        scheduleStops: original.scheduleStops.map(stop => ({ ...stop, id: undefined })),
        exceptions: original.exceptions.map(exc => ({ ...exc, id: `exc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
      };
      
      const newSchedules = [...prev.schedules, duplicate];
      return {
        ...prev,
        schedules: newSchedules,
        activeScheduleIndex: newSchedules.length - 1,
      };
    });
  }, []);

  // Get active schedule
  const getActiveSchedule = useCallback((): Schedule | null => {
    if (data.activeScheduleIndex === null || data.activeScheduleIndex >= data.schedules.length) {
      return null;
    }
    return data.schedules[data.activeScheduleIndex];
  }, [data.activeScheduleIndex, data.schedules]);

  // Update active schedule metadata
  const updateActiveSchedule = useCallback((scheduleUpdate: Partial<Schedule>) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      newSchedules[prev.activeScheduleIndex] = {
        ...newSchedules[prev.activeScheduleIndex],
        ...scheduleUpdate,
      };
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  // Update schedule stop for active schedule
  const updateScheduleStop = useCallback((stopIndex: number, scheduleStopUpdate: Partial<ScheduleStop>) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      const newStops = [...schedule.scheduleStops];
      
      if (stopIndex >= 0 && stopIndex < newStops.length) {
        newStops[stopIndex] = { ...newStops[stopIndex], ...scheduleStopUpdate };
        newSchedules[prev.activeScheduleIndex] = { ...schedule, scheduleStops: newStops };
      }
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  // Update schedule stop by schedule index (for grid editing)
  const updateScheduleStopByScheduleIndex = useCallback((
    scheduleIndex: number,
    stopIndex: number,
    scheduleStopUpdate: Partial<ScheduleStop>
  ) => {
    setData(prev => {
      if (scheduleIndex < 0 || scheduleIndex >= prev.schedules.length) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[scheduleIndex];
      const newStops = [...schedule.scheduleStops];
      
      if (stopIndex >= 0 && stopIndex < newStops.length) {
        newStops[stopIndex] = { ...newStops[stopIndex], ...scheduleStopUpdate };
        newSchedules[scheduleIndex] = { ...schedule, scheduleStops: newStops };
      }
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  // Set all stop times for active schedule
  const setAllStopTimes = useCallback((baseTime: string, intervalMinutes: number) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      const newStops = schedule.scheduleStops.map((stop, index) => ({
        ...stop,
        arrivalTime: calculateTimeOffset(baseTime, index * intervalMinutes),
        departureTime: calculateTimeOffset(baseTime, index * intervalMinutes + 2),
      }));
      newSchedules[prev.activeScheduleIndex] = { ...schedule, scheduleStops: newStops };
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  // Clear all stop times for active schedule
  const clearAllStopTimes = useCallback(() => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      const newStops = schedule.scheduleStops.map(stop => ({
        ...stop,
        arrivalTime: '',
        departureTime: '',
      }));
      newSchedules[prev.activeScheduleIndex] = { ...schedule, scheduleStops: newStops };
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  // Calendar operations for active schedule
  const updateCalendar = useCallback((calendarUpdate: Partial<ScheduleCalendar>) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      newSchedules[prev.activeScheduleIndex] = {
        ...schedule,
        calendar: { ...schedule.calendar, ...calendarUpdate },
      };
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const setAllDays = useCallback((enabled: boolean) => {
    updateCalendar({
      monday: enabled, tuesday: enabled, wednesday: enabled, thursday: enabled,
      friday: enabled, saturday: enabled, sunday: enabled,
    });
  }, [updateCalendar]);

  const setWeekdaysOnly = useCallback(() => {
    updateCalendar({
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
      saturday: false, sunday: false,
    });
  }, [updateCalendar]);

  const setWeekendsOnly = useCallback(() => {
    updateCalendar({
      monday: false, tuesday: false, wednesday: false, thursday: false, friday: false,
      saturday: true, sunday: true,
    });
  }, [updateCalendar]);

  // Exception operations for active schedule
  const addException = useCallback((exception: ScheduleException) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      newSchedules[prev.activeScheduleIndex] = {
        ...schedule,
        exceptions: [...schedule.exceptions, exception],
      };
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const updateException = useCallback((exceptionIndex: number, exceptionUpdate: Partial<ScheduleException>) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      const newExceptions = [...schedule.exceptions];
      
      if (exceptionIndex >= 0 && exceptionIndex < newExceptions.length) {
        newExceptions[exceptionIndex] = { ...newExceptions[exceptionIndex], ...exceptionUpdate };
        newSchedules[prev.activeScheduleIndex] = { ...schedule, exceptions: newExceptions };
      }
      
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const removeException = useCallback((exceptionIndex: number) => {
    setData(prev => {
      if (prev.activeScheduleIndex === null) return prev;
      
      const newSchedules = [...prev.schedules];
      const schedule = newSchedules[prev.activeScheduleIndex];
      newSchedules[prev.activeScheduleIndex] = {
        ...schedule,
        exceptions: schedule.exceptions.filter((_, i) => i !== exceptionIndex),
      };
      
      return { ...prev, schedules: newSchedules };
    });
    
    if (selectedExceptionIndex === exceptionIndex) {
      setSelectedExceptionIndex(null);
    }
  }, [selectedExceptionIndex]);

  // Get all schedules
  const getAllSchedules = useCallback(() => data.schedules, [data.schedules]);

  // Validate all schedules
  const validateAllSchedules = useCallback(() => {
    return validateAllSchedulesHelper(data.schedules);
  }, [data.schedules]);

  // Submit all schedules
  const submitAllSchedules = useCallback(async () => {
    const validation = validateAllSchedulesHelper(data.schedules);
    
    if (!validation.valid) {
      console.error('Schedule validation failed:', validation.scheduleErrors);
      throw new Error(`Validation failed for ${validation.invalidCount} schedule(s)`);
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const results: { schedule: Schedule; success: boolean; error?: string; id?: string }[] = [];

      for (const schedule of data.schedules) {
        try {
          const apiRequest = scheduleToApiRequest(schedule) as ScheduleRequest;

          if (schedule.id) {
            // Update existing schedule with full details (stops, calendar, exceptions)
            await ScheduleManagementService.updateScheduleFull(schedule.id, apiRequest);
            results.push({ schedule, success: true, id: schedule.id });
          } else {
            // Create new schedule with full details
            const response = await ScheduleManagementService.createScheduleFull(apiRequest);
            results.push({ schedule, success: true, id: response.id });
          }
        } catch (error) {
          console.error(`Failed to save schedule "${schedule.name}":`, error);
          results.push({
            schedule,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Check if all succeeded
      const failedCount = results.filter(r => !r.success).length;
      if (failedCount > 0) {
        throw new Error(`${failedCount} schedule(s) failed to save`);
      }

      // Reload schedules from server to get updated data
      if (data.selectedRouteId) {
        await setSelectedRoute(data.selectedRouteId);
      }

      console.log('All schedules saved successfully:', results);
    } catch (error) {
      console.error('Failed to submit schedules:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to submit schedules');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [data.schedules, data.selectedRouteId, setSelectedRoute]);

  const contextValue = useMemo(() => ({
    mode,
    isLoading,
    loadError,
    loadSchedulesForRoute,
    resetToCreateMode,
    data,
    getYaml,
    updateFromYaml,
    getJson,
    updateFromJson,
    setSelectedRoute,
    loadAvailableRoutes,
    activeScheduleIndex: data.activeScheduleIndex,
    setActiveScheduleIndex,
    highlightedScheduleIndex: data.highlightedScheduleIndex,
    setHighlightedScheduleIndex,
    addNewSchedule,
    removeSchedule,
    duplicateSchedule,
    updateActiveSchedule,
    getActiveSchedule,
    updateScheduleStop,
    setAllStopTimes,
    clearAllStopTimes,
    updateScheduleStopByScheduleIndex,
    updateCalendar,
    setAllDays,
    setWeekdaysOnly,
    setWeekendsOnly,
    addException,
    updateException,
    removeException,
    selectedStopIndex,
    setSelectedStopIndex,
    selectedExceptionIndex,
    setSelectedExceptionIndex,
    getAllSchedules,
    validateAllSchedules,
    submitAllSchedules,
  }), [
    mode, isLoading, loadError, loadSchedulesForRoute, resetToCreateMode, data,
    getYaml, updateFromYaml, getJson, updateFromJson,
    setSelectedRoute, loadAvailableRoutes, setActiveScheduleIndex, setHighlightedScheduleIndex,
    addNewSchedule, removeSchedule, duplicateSchedule, updateActiveSchedule, getActiveSchedule,
    updateScheduleStop, setAllStopTimes, clearAllStopTimes, updateScheduleStopByScheduleIndex,
    updateCalendar, setAllDays, setWeekdaysOnly, setWeekendsOnly,
    addException, updateException, removeException,
    selectedStopIndex, selectedExceptionIndex, getAllSchedules, validateAllSchedules, submitAllSchedules,
  ]);

  return (
    <ScheduleWorkspaceContext.Provider value={contextValue}>
      {children}
    </ScheduleWorkspaceContext.Provider>
  );
}
