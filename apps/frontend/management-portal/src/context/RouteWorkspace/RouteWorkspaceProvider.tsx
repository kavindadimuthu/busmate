'use client';

import { ReactNode, useState, useCallback } from 'react';
import { RouteWorkspaceContext, WorkspaceMode } from './RouteWorkspaceContext';
import { RouteWorkspaceData, createEmptyRouteWorkspaceData, RouteGroup, Route, RouteStop, createEmptyRoute, moveRouteStop, DirectionEnum, StopExistenceType, createEmptyLocation } from '@/types/RouteWorkspaceData';
import { serializeToYaml, parseFromYaml, serializeToJson, parseFromJson } from '@/services/routeWorkspaceSerializer';
import { 
  generateRouteFromCorresponding as generateRouteFromCorrespondingService,
  findRouteByDirection,
  findRouteIndexByDirection,
  AutoGenerationOptions,
  RouteAutoGenerationResult
} from '@/services/routeAutoGeneration';
import { RouteManagementService, BusStopManagementService } from '../../../generated/api-clients/route-management';

interface RouteWorkspaceProviderProps {
  children: ReactNode;
}

export function RouteWorkspaceProvider({ children }: RouteWorkspaceProviderProps) {
  // Mode and loading state
  const [mode, setMode] = useState<WorkspaceMode>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeGroupId, setRouteGroupId] = useState<string | null>(null);
  
  const [data, setData] = useState<RouteWorkspaceData>(createEmptyRouteWorkspaceData());
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [coordinateEditingMode, setCoordinateEditingModeState] = useState<{ routeIndex: number; stopIndex: number } | null>(null);
  const [mapActions, setMapActions] = useState<{ fitBoundsToRoute: (() => void) | null }>({
    fitBoundsToRoute: null,
  });

  // Load existing route group for editing
  const loadRouteGroup = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Fetch the route group data
      const routeGroupResponse = await RouteManagementService.getRouteGroupById(id);
      
      if (!routeGroupResponse) {
        throw new Error('Route group not found');
      }

      // Fetch all stop details for the route group in one API call
      const allStopDetails = await BusStopManagementService.getStopsByRouteGroup(id);
      
      // Create a map of routeStopId -> stop details for quick lookup
      const stopDetailsMap = new Map(
        allStopDetails.map(detail => [detail.routeStopId || '', detail])
      );

      // Build routes with stop details
      const routes: Route[] = [];
      
      for (const routeResponse of routeGroupResponse.routes || []) {
        const routeStops: RouteStop[] = [];
        
        for (const routeStopResponse of routeResponse.routeStops || []) {
          // Get full stop details from the map
          const stopDetail = stopDetailsMap.get(routeStopResponse.id || '');
          
          let stopData;
          if (stopDetail && stopDetail.stopId) {
            // Use the detailed stop information from the API
            stopData = {
              id: stopDetail.stopId || '',
              name: stopDetail.stopName || '',
              nameSinhala: stopDetail.stopNameSinhala,
              nameTamil: stopDetail.stopNameTamil,
              description: stopDetail.stopDescription,
              location: stopDetail.location ? {
                latitude: stopDetail.location.latitude || 0,
                longitude: stopDetail.location.longitude || 0,
                address: stopDetail.location.address,
                city: stopDetail.location.city,
                state: stopDetail.location.state,
                zipCode: stopDetail.location.zipCode,
                country: stopDetail.location.country,
                addressSinhala: stopDetail.location.addressSinhala,
                citySinhala: stopDetail.location.citySinhala,
                stateSinhala: stopDetail.location.stateSinhala,
                countrySinhala: stopDetail.location.countrySinhala,
                addressTamil: stopDetail.location.addressTamil,
                cityTamil: stopDetail.location.cityTamil,
                stateTamil: stopDetail.location.stateTamil,
                countryTamil: stopDetail.location.countryTamil,
              } : createEmptyLocation(),
              isAccessible: stopDetail.isAccessible,
              type: StopExistenceType.EXISTING,
            };
          } else if (routeStopResponse.stopId) {
            // Fallback: use basic info from routeStopResponse if detail not found
            stopData = {
              id: routeStopResponse.stopId || '',
              name: routeStopResponse.stopName || '',
              location: routeStopResponse.location ? {
                latitude: routeStopResponse.location.latitude || 0,
                longitude: routeStopResponse.location.longitude || 0,
                address: routeStopResponse.location.address,
                city: routeStopResponse.location.city,
                state: routeStopResponse.location.state,
                zipCode: routeStopResponse.location.zipCode,
                country: routeStopResponse.location.country,
                addressSinhala: routeStopResponse.location.addressSinhala,
                citySinhala: routeStopResponse.location.citySinhala,
                stateSinhala: routeStopResponse.location.stateSinhala,
                countrySinhala: routeStopResponse.location.countrySinhala,
                addressTamil: routeStopResponse.location.addressTamil,
                cityTamil: routeStopResponse.location.cityTamil,
                stateTamil: routeStopResponse.location.stateTamil,
                countryTamil: routeStopResponse.location.countryTamil,
              } : createEmptyLocation(),
              type: StopExistenceType.EXISTING,
            };
          } else {
            // No stopId, create from basic info
            stopData = {
              id: '',
              name: routeStopResponse.stopName || '',
              location: routeStopResponse.location ? {
                latitude: routeStopResponse.location.latitude || 0,
                longitude: routeStopResponse.location.longitude || 0,
                address: routeStopResponse.location.address,
                city: routeStopResponse.location.city,
                state: routeStopResponse.location.state,
                zipCode: routeStopResponse.location.zipCode,
                country: routeStopResponse.location.country,
                addressSinhala: routeStopResponse.location.addressSinhala,
                citySinhala: routeStopResponse.location.citySinhala,
                stateSinhala: routeStopResponse.location.stateSinhala,
                countrySinhala: routeStopResponse.location.countrySinhala,
                addressTamil: routeStopResponse.location.addressTamil,
                cityTamil: routeStopResponse.location.cityTamil,
                stateTamil: routeStopResponse.location.stateTamil,
                countryTamil: routeStopResponse.location.countryTamil,
              } : createEmptyLocation(),
              type: StopExistenceType.NEW,
            };
          }

          routeStops.push({
            id: routeStopResponse.id,  // Preserve route stop ID for updates
            orderNumber: routeStopResponse.stopOrder ?? routeStops.length,
            distanceFromStart: routeStopResponse.distanceFromStartKm ?? null,
            stop: stopData,
          });
        }

        routes.push({
          id: routeResponse.id,
          name: routeResponse.name || '',
          nameSinhala: routeResponse.nameSinhala,
          nameTamil: routeResponse.nameTamil,
          routeNumber: routeResponse.routeNumber,
          description: routeResponse.description,
          direction: (routeResponse.direction as DirectionEnum) || DirectionEnum.OUTBOUND,
          roadType: routeResponse.roadType as any || 'NORMALWAY',
          routeThrough: routeResponse.routeThrough,
          routeThroughSinhala: routeResponse.routeThroughSinhala,
          routeThroughTamil: routeResponse.routeThroughTamil,
          distanceKm: routeResponse.distanceKm,
          estimatedDurationMinutes: routeResponse.estimatedDurationMinutes,
          startStopId: routeResponse.startStopId,
          endStopId: routeResponse.endStopId,
          routeStops,
        });
      }

      // Set the loaded data
      setData({
        routeGroup: {
          id: routeGroupResponse.id,
          name: routeGroupResponse.name || '',
          nameSinhala: routeGroupResponse.nameSinhala,
          nameTamil: routeGroupResponse.nameTamil,
          description: routeGroupResponse.description,
          routes,
        },
      });

      setRouteGroupId(id);
      setMode('edit');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      const errorMessage = error.body?.message || error.message || 'Failed to load route group';
      console.error('Failed to load route group:', error);
      setLoadError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Reset to create mode
  const resetToCreateMode = useCallback(() => {
    setData(createEmptyRouteWorkspaceData());
    setMode('create');
    setRouteGroupId(null);
    setLoadError(null);
    setSelectedRouteIndex(null);
    setSelectedStopIndex(null);
    setCoordinateEditingModeState(null);
  }, []);

  const updateRouteGroup = useCallback((routeGroup: Partial<RouteGroup>) => {
    setData(prevData => ({
      ...prevData,
      routeGroup: {
        ...prevData.routeGroup,
        ...routeGroup,
      },
    }));
  }, []);

  const updateFromYaml = useCallback((yamlText: string) => {
    try {
      const parsedData = parseFromYaml(yamlText);
      
      if (parsedData.routeGroup) {
        setData(prevData => ({
          ...prevData,
          routeGroup: {
            name: parsedData.routeGroup?.name || prevData.routeGroup.name,
            nameSinhala: parsedData.routeGroup?.nameSinhala || prevData.routeGroup.nameSinhala,
            nameTamil: parsedData.routeGroup?.nameTamil || prevData.routeGroup.nameTamil,
            description: parsedData.routeGroup?.description || prevData.routeGroup.description,
            routes: parsedData.routeGroup?.routes || prevData.routeGroup.routes,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to update from YAML:', error);
    }
  }, []);

  const getYaml = useCallback(() => {
    return serializeToYaml(data);
  }, [data]);

  const updateFromJson = useCallback((jsonText: string) => {
    try {
      const parsedData = parseFromJson(jsonText);
      
      if (parsedData.routeGroup) {
        setData(prevData => ({
          ...prevData,
          routeGroup: {
            name: parsedData.routeGroup?.name || prevData.routeGroup.name,
            nameSinhala: parsedData.routeGroup?.nameSinhala || prevData.routeGroup.nameSinhala,
            nameTamil: parsedData.routeGroup?.nameTamil || prevData.routeGroup.nameTamil,
            description: parsedData.routeGroup?.description || prevData.routeGroup.description,
            routes: parsedData.routeGroup?.routes || prevData.routeGroup.routes,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to update from JSON:', error);
    }
  }, []);

  const getJson = useCallback(() => {
    return serializeToJson(data);
  }, [data]);

  const getRouteGroupData = useCallback(() => {
    return data.routeGroup;
  }, [data]);

  const updateRoute = useCallback((routeIndex: number, route: Partial<Route>) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routes[routeIndex]) {
        routes[routeIndex] = { ...routes[routeIndex], ...route };
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const updateRouteStop = useCallback((routeIndex: number, stopIndex: number, routeStop: Partial<RouteStop>) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routes[routeIndex]) {
        const routeStops = [...routes[routeIndex].routeStops];
        if (routeStops[stopIndex]) {
          routeStops[stopIndex] = { ...routeStops[stopIndex], ...routeStop };
          routes[routeIndex] = { ...routes[routeIndex], routeStops };
        }
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const addRoute = useCallback((route: Route) => {
    setData(prevData => ({
      ...prevData,
      routeGroup: {
        ...prevData.routeGroup,
        routes: [...prevData.routeGroup.routes, route],
      },
    }));
  }, []);

  const replaceRoute = useCallback((routeIndex: number, route: Route) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routeIndex >= 0 && routeIndex < routes.length) {
        routes[routeIndex] = route;
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const addRouteStop = useCallback((routeIndex: number, routeStop: RouteStop) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routes[routeIndex]) {
        routes[routeIndex] = {
          ...routes[routeIndex],
          routeStops: [...routes[routeIndex].routeStops, routeStop],
        };
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const removeRouteStop = useCallback((routeIndex: number, stopIndex: number) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routes[routeIndex]) {
        const routeStops = routes[routeIndex].routeStops.filter((_, idx) => idx !== stopIndex);
        routes[routeIndex] = { ...routes[routeIndex], routeStops };
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const reorderRouteStop = useCallback((routeIndex: number, fromIndex: number, toIndex: number) => {
    setData(prevData => {
      const routes = [...prevData.routeGroup.routes];
      if (routes[routeIndex]) {
        const reorderedStops = moveRouteStop(routes[routeIndex].routeStops, fromIndex, toIndex);
        routes[routeIndex] = { ...routes[routeIndex], routeStops: reorderedStops };
      }
      return {
        ...prevData,
        routeGroup: {
          ...prevData.routeGroup,
          routes,
        },
      };
    });
  }, []);

  const setActiveRouteIndex = useCallback((index: number) => {
    setData(prevData => ({
      ...prevData,
      activeRouteIndex: index,
    }));
  }, []);

  const getRouteIndexByDirection = useCallback((direction: DirectionEnum): number => {
    return findRouteIndexByDirection(data.routeGroup.routes, direction);
  }, [data.routeGroup.routes]);

  const generateRouteFromCorresponding = useCallback((
    targetDirection: DirectionEnum,
    options?: AutoGenerationOptions
  ): RouteAutoGenerationResult => {
    // Determine the source direction (opposite of target)
    const sourceDirection = targetDirection === DirectionEnum.OUTBOUND
      ? DirectionEnum.INBOUND
      : DirectionEnum.OUTBOUND;

    // Find the source route
    const sourceRoute = findRouteByDirection(data.routeGroup.routes, sourceDirection);

    if (!sourceRoute) {
      return {
        success: false,
        route: createEmptyRoute(),
        message: `No ${sourceDirection} route found to generate from. Please create the ${sourceDirection} route first.`,
        warnings: [],
      };
    }

    // Generate the route using the service
    const result = generateRouteFromCorrespondingService(sourceRoute, options);

    if (result.success) {
      // Find if a route with the target direction already exists
      const existingIndex = findRouteIndexByDirection(data.routeGroup.routes, targetDirection);

      if (existingIndex >= 0) {
        // Replace the existing route, preserving its ID
        setData(prevData => {
          const routes = [...prevData.routeGroup.routes];
          const existingRouteId = routes[existingIndex].id;
          routes[existingIndex] = {
            ...result.route,
            id: existingRouteId, // Preserve the existing route ID
          };
          return {
            ...prevData,
            routeGroup: {
              ...prevData.routeGroup,
              routes,
            },
          };
        });
      } else {
        // Add as new route (ID will be undefined, which is correct for new routes)
        setData(prevData => ({
          ...prevData,
          routeGroup: {
            ...prevData.routeGroup,
            routes: [...prevData.routeGroup.routes, result.route],
          },
        }));
      }
    }

    return result;
  }, [data.routeGroup.routes]);

  const setSelectedStop = useCallback((routeIndex: number, stopIndex: number) => {
    setSelectedRouteIndex(routeIndex);
    setSelectedStopIndex(stopIndex);
  }, []);

  const clearSelectedStop = useCallback(() => {
    setSelectedRouteIndex(null);
    setSelectedStopIndex(null);
  }, []);

  const setCoordinateEditingMode = useCallback((routeIndex: number | null, stopIndex: number | null) => {
    if (routeIndex !== null && stopIndex !== null) {
      setCoordinateEditingModeState({ routeIndex, stopIndex });
    } else {
      setCoordinateEditingModeState(null);
    }
  }, []);

  const clearCoordinateEditingMode = useCallback(() => {
    setCoordinateEditingModeState(null);
  }, []);

  const registerMapAction = useCallback((action: 'fitBoundsToRoute', callback: () => void) => {
    setMapActions(prev => ({ ...prev, [action]: callback }));
  }, []);

  const unregisterMapAction = useCallback((action: 'fitBoundsToRoute') => {
    setMapActions(prev => ({ ...prev, [action]: null }));
  }, []);

  return (
    <RouteWorkspaceContext.Provider
      value={{
        // Mode and loading state
        mode,
        isLoading,
        loadError,
        routeGroupId,
        loadRouteGroup,
        resetToCreateMode,
        // Data and operations
        data,
        updateRouteGroup,
        updateFromYaml,
        getYaml,
        updateFromJson,
        getJson,
        getRouteGroupData,
        updateRoute,
        updateRouteStop,
        addRoute,
        replaceRoute,
        addRouteStop,
        removeRouteStop,
        reorderRouteStop,
        setActiveRouteIndex,
        getRouteIndexByDirection,
        generateRouteFromCorresponding,
        selectedRouteIndex,
        selectedStopIndex,
        setSelectedStop,
        clearSelectedStop,
        coordinateEditingMode,
        setCoordinateEditingMode,
        clearCoordinateEditingMode,
        mapActions,
        registerMapAction,
        unregisterMapAction,
      }}
    >
      {children}
    </RouteWorkspaceContext.Provider>
  );
}
