import yaml from 'js-yaml';
import { RouteWorkspaceData, RouteGroup, Route, RouteStop, Stop, DirectionEnum, RoadTypeEnum, StopExistenceType } from '@/types/RouteWorkspaceData';

/**
 * Serialize RouteWorkspaceData to YAML format
 */
export function serializeToYaml(data: RouteWorkspaceData): string {
  const yamlData: any = {
    route_group: {
      name: data.routeGroup.name || '',
      name_sinhala: data.routeGroup.nameSinhala || '',
      name_tamil: data.routeGroup.nameTamil || '',
      description: data.routeGroup.description || '',
    }
  };

  // Add route group ID if it exists
  if (data.routeGroup.id) {
    yamlData.route_group.id = data.routeGroup.id;
  }

  // Add routes if they exist
  if (data.routeGroup.routes && data.routeGroup.routes.length > 0) {
    yamlData.route_group.routes = data.routeGroup.routes.map(route => {
      const routeObj: any = {
        name: route.name || '',
        name_sinhala: route.nameSinhala || '',
        name_tamil: route.nameTamil || '',
        route_number: route.routeNumber || '',
        description: route.description || '',
        direction: route.direction || 'OUTBOUND',
        road_type: route.roadType || 'NORMALWAY',
        route_through: route.routeThrough || '',
        route_through_sinhala: route.routeThroughSinhala || '',
        route_through_tamil: route.routeThroughTamil || '',
        distance_km: route.distanceKm || 0,
        estimated_duration_minutes: route.estimatedDurationMinutes || 0,
        start_stop_id: route.startStopId || '',
        end_stop_id: route.endStopId || '',
        route_stops: route.routeStops.map((routeStop, index) => {
          const stopObj: any = {
            id: routeStop.stop.id || '',
            name: routeStop.stop.name || '',
            name_sinhala: routeStop.stop.nameSinhala || '',
            name_tamil: routeStop.stop.nameTamil || '',
            type: routeStop.stop.type || 'new',
          };

          // Add description if exists
          if (routeStop.stop.description) {
            stopObj.description = routeStop.stop.description;
          }

          // Add isAccessible if defined
          if (routeStop.stop.isAccessible !== undefined) {
            stopObj.is_accessible = routeStop.stop.isAccessible;
          }

          // Add location if exists and has data
          if (routeStop.stop.location) {
            const loc = routeStop.stop.location;
            const locationObj: any = {};

            if (loc.latitude !== undefined && loc.latitude !== 0) locationObj.latitude = loc.latitude;
            if (loc.longitude !== undefined && loc.longitude !== 0) locationObj.longitude = loc.longitude;
            if (loc.address) locationObj.address = loc.address;
            if (loc.city) locationObj.city = loc.city;
            if (loc.state) locationObj.state = loc.state;
            if (loc.zipCode) locationObj.zip_code = loc.zipCode;
            if (loc.country) locationObj.country = loc.country;
            if (loc.addressSinhala) locationObj.address_sinhala = loc.addressSinhala;
            if (loc.citySinhala) locationObj.city_sinhala = loc.citySinhala;
            if (loc.stateSinhala) locationObj.state_sinhala = loc.stateSinhala;
            if (loc.countrySinhala) locationObj.country_sinhala = loc.countrySinhala;
            if (loc.addressTamil) locationObj.address_tamil = loc.addressTamil;
            if (loc.cityTamil) locationObj.city_tamil = loc.cityTamil;
            if (loc.stateTamil) locationObj.state_tamil = loc.stateTamil;
            if (loc.countryTamil) locationObj.country_tamil = loc.countryTamil;

            if (Object.keys(locationObj).length > 0) {
              stopObj.location = locationObj;
            }
          }

          return {
            route_stop: {
              id: routeStop.id || '',
              order_number: routeStop.orderNumber,
              distance_from_start: routeStop.distanceFromStart,
              stop_type: index === 0 ? 'S' : index === route.routeStops.length - 1 ? 'E' : 'I',
              stop: stopObj
            }
          };
        })
      };

      // Add route ID if it exists
      if (route.id) {
        routeObj.id = route.id;
      }

      return { route: routeObj };
    });
  }

  return yaml.dump(yamlData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
}

/**
 * Parse YAML format to RouteWorkspaceData
 */
export function parseFromYaml(yamlText: string): Partial<RouteWorkspaceData> {
  try {
    if (!yamlText.trim()) {
      return {};
    }

    const parsed = yaml.load(yamlText) as any;
    console.log("parsed data: ", parsed)
    
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const result: Partial<RouteWorkspaceData> = {};

    // Parse route group info
    if (parsed.route_group) {
      const routeGroup: Partial<RouteGroup> = {
        routes: []
      };
      
      // Add route group ID if exists
      if (parsed.route_group.id !== undefined) {
        routeGroup.id = String(parsed.route_group.id);
      }
      
      if (parsed.route_group.name !== undefined) {
        routeGroup.name = String(parsed.route_group.name);
      }
      if (parsed.route_group.name_sinhala !== undefined) {
        routeGroup.nameSinhala = String(parsed.route_group.name_sinhala);
      }
      if (parsed.route_group.name_tamil !== undefined) {
        routeGroup.nameTamil = String(parsed.route_group.name_tamil);
      }
      if (parsed.route_group.description !== undefined) {
        routeGroup.description = String(parsed.route_group.description);
      }

      // Parse routes
      if (parsed.route_group.routes && Array.isArray(parsed.route_group.routes)) {
        routeGroup.routes = parsed.route_group.routes.map((routeWrapper: any) => {
          const routeData = routeWrapper.route;
          
          const route: Route = {
            name: String(routeData.name || ''),
            nameSinhala: routeData.name_sinhala ? String(routeData.name_sinhala) : undefined,
            nameTamil: routeData.name_tamil ? String(routeData.name_tamil) : undefined,
            routeNumber: routeData.route_number ? String(routeData.route_number) : undefined,
            description: routeData.description ? String(routeData.description) : undefined,
            direction: routeData.direction as DirectionEnum || DirectionEnum.OUTBOUND,
            roadType: routeData.road_type as RoadTypeEnum || RoadTypeEnum.NORMALWAY,
            routeThrough: routeData.route_through ? String(routeData.route_through) : undefined,
            routeThroughSinhala: routeData.route_through_sinhala ? String(routeData.route_through_sinhala) : undefined,
            routeThroughTamil: routeData.route_through_tamil ? String(routeData.route_through_tamil) : undefined,
            distanceKm: routeData.distance_km ? Number(routeData.distance_km) : undefined,
            estimatedDurationMinutes: routeData.estimated_duration_minutes ? Number(routeData.estimated_duration_minutes) : undefined,
            startStopId: routeData.start_stop_id ? String(routeData.start_stop_id) : undefined,
            endStopId: routeData.end_stop_id ? String(routeData.end_stop_id) : undefined,
            routeStops: []
          };

          // Add route ID if exists
          if (routeData.id !== undefined) {
            route.id = String(routeData.id);
          }

          // Parse route stops
          if (routeData.route_stops && Array.isArray(routeData.route_stops)) {
            route.routeStops = routeData.route_stops.map((stopWrapper: any) => {
              const stopData = stopWrapper.route_stop;
              
              const stop: Stop = {
                id: String(stopData.stop.id || ''),
                name: String(stopData.stop.name || ''),
                nameSinhala: stopData.stop.name_sinhala ? String(stopData.stop.name_sinhala) : undefined,
                nameTamil: stopData.stop.name_tamil ? String(stopData.stop.name_tamil) : undefined,
                description: stopData.stop.description ? String(stopData.stop.description) : undefined,
                type: (stopData.stop.type as StopExistenceType) || StopExistenceType.NEW,
                isAccessible: stopData.stop.is_accessible !== undefined ? Boolean(stopData.stop.is_accessible) : undefined,
              };

              // Parse location if exists
              if (stopData.stop.location) {
                const locData = stopData.stop.location;
                stop.location = {
                  latitude: locData.latitude !== undefined ? Number(locData.latitude) : 0,
                  longitude: locData.longitude !== undefined ? Number(locData.longitude) : 0,
                  address: locData.address ? String(locData.address) : undefined,
                  city: locData.city ? String(locData.city) : undefined,
                  state: locData.state ? String(locData.state) : undefined,
                  zipCode: locData.zip_code ? String(locData.zip_code) : undefined,
                  country: locData.country ? String(locData.country) : undefined,
                  addressSinhala: locData.address_sinhala ? String(locData.address_sinhala) : undefined,
                  citySinhala: locData.city_sinhala ? String(locData.city_sinhala) : undefined,
                  stateSinhala: locData.state_sinhala ? String(locData.state_sinhala) : undefined,
                  countrySinhala: locData.country_sinhala ? String(locData.country_sinhala) : undefined,
                  addressTamil: locData.address_tamil ? String(locData.address_tamil) : undefined,
                  cityTamil: locData.city_tamil ? String(locData.city_tamil) : undefined,
                  stateTamil: locData.state_tamil ? String(locData.state_tamil) : undefined,
                  countryTamil: locData.country_tamil ? String(locData.country_tamil) : undefined,
                };
              }

              const routeStop: RouteStop = {
                id: stopData.id ? String(stopData.id) : undefined,
                orderNumber: stopData.order_number !== undefined ? Number(stopData.order_number) : 0,
                distanceFromStart: stopData.distance_from_start !== undefined ? Number(stopData.distance_from_start) : 
                                   stopData.distance_from_start_km !== undefined ? Number(stopData.distance_from_start_km) : null,
                stop: stop
              };

              return routeStop;
            });
          }

          return route;
        });
      }

      if (Object.keys(routeGroup).length > 0) {
        result.routeGroup = routeGroup as RouteGroup;
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return {};
  }
}

/**
 * Serialize RouteWorkspaceData to JSON format
 */
export function serializeToJson(data: RouteWorkspaceData): string {
  const jsonData: any = {
    route_group: {
      name: data.routeGroup.name || '',
      name_sinhala: data.routeGroup.nameSinhala || '',
      name_tamil: data.routeGroup.nameTamil || '',
      description: data.routeGroup.description || '',
    }
  };

  // Add route group ID if it exists
  if (data.routeGroup.id) {
    jsonData.route_group.id = data.routeGroup.id;
  }

  // Add routes if they exist
  if (data.routeGroup.routes && data.routeGroup.routes.length > 0) {
    jsonData.route_group.routes = data.routeGroup.routes.map(route => {
      const routeObj: any = {
        name: route.name || '',
        name_sinhala: route.nameSinhala || '',
        name_tamil: route.nameTamil || '',
        route_number: route.routeNumber || '',
        description: route.description || '',
        direction: route.direction || 'OUTBOUND',
        road_type: route.roadType || 'NORMALWAY',
        route_through: route.routeThrough || '',
        route_through_sinhala: route.routeThroughSinhala || '',
        route_through_tamil: route.routeThroughTamil || '',
        distance_km: route.distanceKm || 0,
        estimated_duration_minutes: route.estimatedDurationMinutes || 0,
        start_stop_id: route.startStopId || '',
        end_stop_id: route.endStopId || '',
        route_stops: route.routeStops.map((routeStop, index) => {
          const stopObj: any = {
            id: routeStop.stop.id || '',
            name: routeStop.stop.name || '',
            name_sinhala: routeStop.stop.nameSinhala || '',
            name_tamil: routeStop.stop.nameTamil || '',
            type: routeStop.stop.type || 'new',
          };

          // Add description if exists
          if (routeStop.stop.description) {
            stopObj.description = routeStop.stop.description;
          }

          // Add isAccessible if defined
          if (routeStop.stop.isAccessible !== undefined) {
            stopObj.is_accessible = routeStop.stop.isAccessible;
          }

          // Add location if exists and has data
          if (routeStop.stop.location) {
            const loc = routeStop.stop.location;
            const locationObj: any = {};

            if (loc.latitude !== undefined && loc.latitude !== 0) locationObj.latitude = loc.latitude;
            if (loc.longitude !== undefined && loc.longitude !== 0) locationObj.longitude = loc.longitude;
            if (loc.address) locationObj.address = loc.address;
            if (loc.city) locationObj.city = loc.city;
            if (loc.state) locationObj.state = loc.state;
            if (loc.zipCode) locationObj.zip_code = loc.zipCode;
            if (loc.country) locationObj.country = loc.country;
            if (loc.addressSinhala) locationObj.address_sinhala = loc.addressSinhala;
            if (loc.citySinhala) locationObj.city_sinhala = loc.citySinhala;
            if (loc.stateSinhala) locationObj.state_sinhala = loc.stateSinhala;
            if (loc.countrySinhala) locationObj.country_sinhala = loc.countrySinhala;
            if (loc.addressTamil) locationObj.address_tamil = loc.addressTamil;
            if (loc.cityTamil) locationObj.city_tamil = loc.cityTamil;
            if (loc.stateTamil) locationObj.state_tamil = loc.stateTamil;
            if (loc.countryTamil) locationObj.country_tamil = loc.countryTamil;

            if (Object.keys(locationObj).length > 0) {
              stopObj.location = locationObj;
            }
          }

          return {
            route_stop: {
              id: routeStop.id || '',
              order_number: routeStop.orderNumber,
              distance_from_start: routeStop.distanceFromStart,
              stop_type: index === 0 ? 'S' : index === route.routeStops.length - 1 ? 'E' : 'I',
              stop: stopObj
            }
          };
        })
      };

      // Add route ID if it exists
      if (route.id) {
        routeObj.id = route.id;
      }

      return { route: routeObj };
    });
  }

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Parse JSON format to RouteWorkspaceData
 */
export function parseFromJson(jsonText: string): Partial<RouteWorkspaceData> {
  try {
    if (!jsonText.trim()) {
      return {};
    }

    const parsed = JSON.parse(jsonText);
    console.log("parsed JSON data: ", parsed)
    
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const result: Partial<RouteWorkspaceData> = {};

    // Parse route group info
    if (parsed.route_group) {
      const routeGroup: Partial<RouteGroup> = {
        routes: []
      };
      
      // Add route group ID if exists
      if (parsed.route_group.id !== undefined) {
        routeGroup.id = String(parsed.route_group.id);
      }
      
      if (parsed.route_group.name !== undefined) {
        routeGroup.name = String(parsed.route_group.name);
      }
      if (parsed.route_group.name_sinhala !== undefined) {
        routeGroup.nameSinhala = String(parsed.route_group.name_sinhala);
      }
      if (parsed.route_group.name_tamil !== undefined) {
        routeGroup.nameTamil = String(parsed.route_group.name_tamil);
      }
      if (parsed.route_group.description !== undefined) {
        routeGroup.description = String(parsed.route_group.description);
      }

      // Parse routes
      if (parsed.route_group.routes && Array.isArray(parsed.route_group.routes)) {
        routeGroup.routes = parsed.route_group.routes.map((routeWrapper: any) => {
          const routeData = routeWrapper.route;
          
          const route: Route = {
            name: String(routeData.name || ''),
            nameSinhala: routeData.name_sinhala ? String(routeData.name_sinhala) : undefined,
            nameTamil: routeData.name_tamil ? String(routeData.name_tamil) : undefined,
            routeNumber: routeData.route_number ? String(routeData.route_number) : undefined,
            description: routeData.description ? String(routeData.description) : undefined,
            direction: routeData.direction as DirectionEnum || DirectionEnum.OUTBOUND,
            roadType: routeData.road_type as RoadTypeEnum || RoadTypeEnum.NORMALWAY,
            routeThrough: routeData.route_through ? String(routeData.route_through) : undefined,
            routeThroughSinhala: routeData.route_through_sinhala ? String(routeData.route_through_sinhala) : undefined,
            routeThroughTamil: routeData.route_through_tamil ? String(routeData.route_through_tamil) : undefined,
            distanceKm: routeData.distance_km ? Number(routeData.distance_km) : undefined,
            estimatedDurationMinutes: routeData.estimated_duration_minutes ? Number(routeData.estimated_duration_minutes) : undefined,
            startStopId: routeData.start_stop_id ? String(routeData.start_stop_id) : undefined,
            endStopId: routeData.end_stop_id ? String(routeData.end_stop_id) : undefined,
            routeStops: []
          };

          // Add route ID if exists
          if (routeData.id !== undefined) {
            route.id = String(routeData.id);
          }

          // Parse route stops
          if (routeData.route_stops && Array.isArray(routeData.route_stops)) {
            route.routeStops = routeData.route_stops.map((stopWrapper: any) => {
              const stopData = stopWrapper.route_stop;
              
              const stop: Stop = {
                id: String(stopData.stop.id || ''),
                name: String(stopData.stop.name || ''),
                nameSinhala: stopData.stop.name_sinhala ? String(stopData.stop.name_sinhala) : undefined,
                nameTamil: stopData.stop.name_tamil ? String(stopData.stop.name_tamil) : undefined,
                description: stopData.stop.description ? String(stopData.stop.description) : undefined,
                type: (stopData.stop.type as StopExistenceType) || StopExistenceType.NEW,
                isAccessible: stopData.stop.is_accessible !== undefined ? Boolean(stopData.stop.is_accessible) : undefined,
              };

              // Parse location if exists
              if (stopData.stop.location) {
                const locData = stopData.stop.location;
                stop.location = {
                  latitude: locData.latitude !== undefined ? Number(locData.latitude) : 0,
                  longitude: locData.longitude !== undefined ? Number(locData.longitude) : 0,
                  address: locData.address ? String(locData.address) : undefined,
                  city: locData.city ? String(locData.city) : undefined,
                  state: locData.state ? String(locData.state) : undefined,
                  zipCode: locData.zip_code ? String(locData.zip_code) : undefined,
                  country: locData.country ? String(locData.country) : undefined,
                  addressSinhala: locData.address_sinhala ? String(locData.address_sinhala) : undefined,
                  citySinhala: locData.city_sinhala ? String(locData.city_sinhala) : undefined,
                  stateSinhala: locData.state_sinhala ? String(locData.state_sinhala) : undefined,
                  countrySinhala: locData.country_sinhala ? String(locData.country_sinhala) : undefined,
                  addressTamil: locData.address_tamil ? String(locData.address_tamil) : undefined,
                  cityTamil: locData.city_tamil ? String(locData.city_tamil) : undefined,
                  stateTamil: locData.state_tamil ? String(locData.state_tamil) : undefined,
                  countryTamil: locData.country_tamil ? String(locData.country_tamil) : undefined,
                };
              }

              const routeStop: RouteStop = {
                id: stopData.id ? String(stopData.id) : undefined,
                orderNumber: stopData.order_number !== undefined ? Number(stopData.order_number) : 0,
                distanceFromStart: stopData.distance_from_start !== undefined ? Number(stopData.distance_from_start) : 
                                   stopData.distance_from_start_km !== undefined ? Number(stopData.distance_from_start_km) : null,
                stop: stop
              };

              return routeStop;
            });
          }

          return route;
        });
      }

      if (Object.keys(routeGroup).length > 0) {
        result.routeGroup = routeGroup as RouteGroup;
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return {};
  }
}
