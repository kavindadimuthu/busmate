import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import RouteMap from "@/components/RouteMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Clock, 
  MapPin, 
  Bus, 
  ArrowRight, 
  Star, 
  Users, 
  Wifi, 
  Snowflake, 
  Tv, 
  Coffee,
  Shield,
  Phone,
  Calendar,
  Route,
  ArrowLeft,
  Fuel,
  Settings,
  Building2,
  UserCheck,
  Calculator,
  ChevronDown,
  Map,
  Loader2
} from "lucide-react";
import { PassengerApIsService } from "@/generated/api-client/route-management";
import type { 
  PassengerTripResponse, 
  PassengerRouteResponse,
  PassengerIntermediateStop
} from "@/generated/api-client/route-management";

// This component now uses real API data via PassengerAPIsService

const TripDetails = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<PassengerTripResponse | null>(null);
  const [routeData, setRouteData] = useState<PassengerRouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromStop, setFromStop] = useState("");
  const [toStop, setToStop] = useState("");
  const [passengerType, setPassengerType] = useState("adult");
  const [calculatedFare, setCalculatedFare] = useState(0);
  const [isRouteMapOpen, setIsRouteMapOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);

  // Fetch trip details when component mounts
  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const trip = await PassengerApIsService.getTripDetails(tripId, true, true);
        setTripData(trip);
        
        // If we have a routeId, fetch detailed route information
        if (trip.routeId) {
          try {
            const route = await PassengerApIsService.getRouteDetails(trip.routeId, true, true);
            setRouteData(route);
          } catch (routeError) {
            console.warn('Could not fetch route details:', routeError);
            // Not a critical error, we can still show trip details
          }
        }
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  // Helper function to format time (will be updated to work with API data)
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    try {
      // Handle different time formats from API
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return timeString;
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // Helper function to format duration (will be updated to work with API data)
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Loading Trip Details...</h1>
            <p className="text-muted-foreground">Please wait while we fetch the trip information.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Trip</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-x-4">
              <Button onClick={() => navigate("/findmybus")} className="bg-gradient-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Trip Not Found</h1>
            <Button onClick={() => navigate("/findmybus")} className="bg-gradient-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'ac':
      case 'air conditioning':
        return <Snowflake className="h-4 w-4" />;
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'entertainment':
        return <Tv className="h-4 w-4" />;
      case 'comfortable seats':
      case 'reclining seats':
        return <Users className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <div className="pt-24 pb-8 relative">
        {/* Background image (low opacity) */}
        <img
          src="/Autobus-de-luxe.jpg"
          alt="Bus background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
        {/* Keep the existing gradient/color effect above the image */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/findmybus")}
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search Results
        </Button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {tripData.bus?.plateNumber ? `Bus ${tripData.bus.plateNumber}` : 'Bus Details'} - {tripData.operator?.name || 'Bus Service'}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{tripData.departureStop?.name || 'Origin'}</span>
          </div>
          <ArrowRight className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{tripData.arrivalStop?.name || 'Destination'}</span>
          </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant={tripData.bus?.type === "Luxury" ? "default" : "secondary"} className="px-3 py-1">
            {tripData.bus?.type || 'Regular Service'}
          </Badge>
          {tripData.operator && (
            <div className="flex items-center gap-1 text-white/90">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{tripData.operator.type || 'Bus Service'}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-white/90">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(tripData.duration)}</span>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Main Details Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Route and Schedule Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary" />
                    Route & Schedule Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Main Departure/Arrival - Keep at top for readability */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {formatTime(tripData.scheduledDeparture) || formatTime(tripData.estimatedDeparture) || 'TBD'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tripData.estimatedDeparture ? 'Estimated Departure' : 'Scheduled Departure'}
                      </div>
                      <div className="text-sm font-medium text-foreground mt-1">
                        {tripData.departureStop?.name || 'Origin'}
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">
                        {formatTime(tripData.scheduledArrival) || formatTime(tripData.estimatedArrival) || 'TBD'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tripData.estimatedArrival ? 'Estimated Arrival' : 'Scheduled Arrival'}
                      </div>
                      <div className="text-sm font-medium text-foreground mt-1">
                        {tripData.arrivalStop?.name || 'Destination'}
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Route Information */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold">{tripData.distance ? `${tripData.distance} km` : (routeData?.distance ? `${routeData.distance} km` : 'N/A')}</div>
                      <div className="text-xs text-muted-foreground">Total Distance</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold">{(() => {
                        // Calculate unique stops count
                        if (tripData.intermediateStops) {
                          const uniqueStops = new Set();
                          
                          // Add departure stop if it exists
                          if (tripData.departureStop?.name) {
                            uniqueStops.add(tripData.departureStop.name);
                          }
                          
                          // Add intermediate stops
                          tripData.intermediateStops.forEach(stop => {
                            if (stop.name) uniqueStops.add(stop.name);
                          });
                          
                          // Add arrival stop if it exists and is different from departure
                          if (tripData.arrivalStop?.name && 
                              tripData.arrivalStop.name !== tripData.departureStop?.name) {
                            uniqueStops.add(tripData.arrivalStop.name);
                          }
                          
                          return uniqueStops.size;
                        }
                        
                        return routeData?.stops?.length || 'N/A';
                      })()}</div>
                      <div className="text-xs text-muted-foreground">Total Stops</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold">{formatDuration(tripData.duration) || formatDuration(routeData?.estimatedDuration)}</div>
                      <div className="text-xs text-muted-foreground">Journey Time</div>
                    </div>
                  </div>
                  
                  {/* Collapsible Route Map */}
                  {(routeData?.stops || tripData.intermediateStops) && (
                    <Collapsible open={isRouteMapOpen} onOpenChange={setIsRouteMapOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Map className="h-4 w-4 text-primary" />
                            Interactive Route Map
                          </h4>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isRouteMapOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        <RouteMap 
                          stops={(() => {
                            if (routeData?.stops) {
                              // Use route data if available
                              return routeData.stops.map(stop => ({ 
                                name: stop.name || '', 
                                km: 0, // Route data might not have distance info
                                location: stop.location ? {
                                  latitude: stop.location.latitude || 0,
                                  longitude: stop.location.longitude || 0
                                } : undefined
                              }));
                            } else if (tripData.intermediateStops) {
                              const uniqueStops: Array<{ name: string; km: number; location?: { latitude: number; longitude: number } }> = [];
                              const addedNames = new Set<string>();
                              
                              // Add departure stop if not already in intermediate stops
                              if (tripData.departureStop?.name) {
                                const hasOriginInIntermediate = tripData.intermediateStops.some(stop => 
                                  stop.name === tripData.departureStop?.name
                                );
                                if (!hasOriginInIntermediate) {
                                  uniqueStops.push({
                                    name: tripData.departureStop.name,
                                    km: 0,
                                    location: tripData.departureStop.location ? {
                                      latitude: tripData.departureStop.location.latitude || 0,
                                      longitude: tripData.departureStop.location.longitude || 0
                                    } : undefined
                                  });
                                  addedNames.add(tripData.departureStop.name);
                                }
                              }
                              
                              // Add intermediate stops
                              tripData.intermediateStops.forEach((stop, index) => {
                                const stopName = stop.name || `Stop ${index + 1}`;
                                if (!addedNames.has(stopName)) {
                                  uniqueStops.push({
                                    name: stopName,
                                    km: stop.distanceFromStart || index + 1,
                                    location: stop.location ? {
                                      latitude: stop.location.latitude || 0,
                                      longitude: stop.location.longitude || 0
                                    } : undefined
                                  });
                                  addedNames.add(stopName);
                                }
                              });
                              
                              // Add arrival stop if not already added and different from departure
                              if (tripData.arrivalStop?.name && 
                                  tripData.arrivalStop.name !== tripData.departureStop?.name &&
                                  !addedNames.has(tripData.arrivalStop.name)) {
                                const maxDistance = uniqueStops.length > 0 ? Math.max(...uniqueStops.map(s => s.km)) : 0;
                                uniqueStops.push({
                                  name: tripData.arrivalStop.name,
                                  km: tripData.distance || maxDistance + 1,
                                  location: tripData.arrivalStop.location ? {
                                    latitude: tripData.arrivalStop.location.latitude || 0,
                                    longitude: tripData.arrivalStop.location.longitude || 0
                                  } : undefined
                                });
                              }
                              
                              // Sort by distance and filter out stops without valid coordinates
                              return uniqueStops
                                .sort((a, b) => a.km - b.km)
                                .filter(stop => stop.location?.latitude && stop.location?.longitude);
                            }
                            
                            return [];
                          })()}
                          routeName={tripData.routeName || routeData?.routeName || 'Route'}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <Separator className="my-4" />
                  
                  {/* Collapsible Detailed Schedule with Stops */}
                  {(tripData.intermediateStops || routeData?.stops) && (
                    <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                          <h4 className="font-semibold">Scheduled Stop Times</h4>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isScheduleOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        {/* Build a complete, non-duplicated list of stops */}
                        {(() => {
                          const allStops: Array<{
                            name: string;
                            distance: number;
                            time: string;
                            isOrigin?: boolean;
                            isDestination?: boolean;
                          }> = [];

                          // Check if intermediateStops already includes origin/destination
                          const hasOriginInIntermediate = tripData.intermediateStops?.some(stop => 
                            stop.name === tripData.departureStop?.name
                          );
                          const hasDestinationInIntermediate = tripData.intermediateStops?.some(stop => 
                            stop.name === tripData.arrivalStop?.name
                          );

                          // Add departure stop only if not already in intermediateStops
                          if (!hasOriginInIntermediate && tripData.departureStop?.name) {
                            allStops.push({
                              name: tripData.departureStop.name,
                              distance: 0,
                              time: formatTime(tripData.scheduledDeparture) || formatTime(tripData.estimatedDeparture) || 'TBD',
                              isOrigin: true
                            });
                          }

                          // Add intermediate stops
                          if (tripData.intermediateStops) {
                            tripData.intermediateStops.forEach((stop, index) => {
                              allStops.push({
                                name: stop.name || `Stop ${index + 1}`,
                                distance: stop.distanceFromStart || index + 1,
                                time: formatTime(stop.estimatedArrivalTime) || formatTime(stop.estimatedDepartureTime) || 'TBD',
                                isOrigin: stop.name === tripData.departureStop?.name,
                                isDestination: stop.name === tripData.arrivalStop?.name
                              });
                            });
                          }

                          // Add arrival stop only if not already in intermediateStops
                          if (!hasDestinationInIntermediate && tripData.arrivalStop?.name && 
                              tripData.arrivalStop.name !== tripData.departureStop?.name) {
                            allStops.push({
                              name: tripData.arrivalStop.name,
                              distance: tripData.distance || (allStops.length > 0 ? Math.max(...allStops.map(s => s.distance)) + 1 : 1),
                              time: formatTime(tripData.scheduledArrival) || formatTime(tripData.estimatedArrival) || 'TBD',
                              isDestination: true
                            });
                          }

                          // Sort by distance to ensure proper order
                          allStops.sort((a, b) => a.distance - b.distance);

                          return allStops.map((stop, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-muted/50">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  stop.isOrigin ? 'bg-green-500' : 
                                  stop.isDestination ? 'bg-red-500' : 'bg-primary'
                                }`}></div>
                                <div>
                                  <div className="font-medium">
                                    {stop.name}
                                    {stop.isOrigin && <span className="text-xs text-green-600 ml-1">(Origin)</span>}
                                    {stop.isDestination && <span className="text-xs text-red-600 ml-1">(Destination)</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{stop.distance} km</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-primary">{stop.time}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  <Separator className="my-4" />
                  
                  {/* Schedule Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Route ID:</span>
                        <span className="font-medium">{tripData.routeId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Schedule ID:</span>
                        <span className="font-medium">{tripData.scheduleId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">{tripData.status || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available Seats:</span>
                        <span className="font-medium">{tripData.availableSeats ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delay:</span>
                        <span className="font-medium">{tripData.delay ? `${tripData.delay} min` : 'On Time'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Booking Available:</span>
                        <span className="font-medium">{tripData.bookingAvailable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bus and Operator Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Bus & Operator Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Operator Information */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                        <h4 className="font-semibold text-primary mb-3">Operator Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{tripData.operator?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="outline" className="text-xs">{tripData.operator?.type || 'N/A'}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-medium text-xs">{tripData.operator?.id || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bus Information */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg">
                        <h4 className="font-semibold text-secondary mb-3">Bus Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Plate Number:</span>
                            <span className="font-medium">{tripData.bus?.plateNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{tripData.bus?.type || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span className="font-medium">{tripData.bus?.capacity ? `${tripData.bus.capacity} passengers` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Bus Features */}
                  {tripData.bus?.features && (
                    <div>
                      <h4 className="font-semibold mb-3">Bus Features & Amenities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {tripData.bus.features.hasAirConditioning && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <Snowflake className="h-4 w-4" />
                            <span>Air Conditioning</span>
                          </div>
                        )}
                        {tripData.bus.features.hasWiFi && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <Wifi className="h-4 w-4" />
                            <span>WiFi</span>
                          </div>
                        )}
                        {tripData.bus.features.hasToilet && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <Settings className="h-4 w-4" />
                            <span>Toilet</span>
                          </div>
                        )}
                        {tripData.bus.features.isAccessible && (
                          <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                            <Shield className="h-4 w-4" />
                            <span>Accessible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trip Information Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Trip Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trip ID:</span>
                        <span className="font-medium">{tripData.tripId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="text-xs">{tripData.status || 'Unknown'}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fare:</span>
                        <span className="font-medium">{tripData.fare ? `Rs. ${tripData.fare}` : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available Seats:</span>
                        <span className="font-medium">{tripData.availableSeats ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Booking Available:</span>
                        <span className="font-medium">{tripData.bookingAvailable ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delay:</span>
                        <span className="font-medium">{tripData.delay ? `${tripData.delay} min` : 'On Time'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="space-y-6">
              
              {/* Fare Calculator */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Trip Fare Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show available stops for selection if we have intermediate stops */}
                  {(tripData.intermediateStops && tripData.intermediateStops.length > 0) && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">From Stop</label>
                        <Select value={fromStop} onValueChange={setFromStop}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select starting stop" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={tripData.departureStop?.name || 'Origin'}>
                              {tripData.departureStop?.name || 'Origin'}
                            </SelectItem>
                            {tripData.intermediateStops.map((stop, index) => (
                              <SelectItem key={index} value={stop.name || `Stop ${index + 1}`}>
                                {stop.name || `Stop ${index + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">To Stop</label>
                        <Select value={toStop} onValueChange={setToStop}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination stop" />
                          </SelectTrigger>
                          <SelectContent>
                            {tripData.intermediateStops.map((stop, index) => (
                              <SelectItem key={index} value={stop.name || `Stop ${index + 1}`}>
                                {stop.name || `Stop ${index + 1}`}
                              </SelectItem>
                            ))}
                            <SelectItem value={tripData.arrivalStop?.name || 'Destination'}>
                              {tripData.arrivalStop?.name || 'Destination'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {/* Display main fare information */}
                  <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {tripData.fare ? `Rs. ${tripData.fare}` : 'Contact for Fare'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fromStop && toStop ? 'Calculated Fare' : 'Base Trip Fare'}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Trip Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-medium">{tripData.distance ? `${tripData.distance} km` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{formatDuration(tripData.duration) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available Seats:</span>
                        <span className="font-medium">{tripData.availableSeats ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="text-xs">{tripData.status || 'Unknown'}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    onClick={() => window.location.href = `/booking/${tripData.tripId}`}
                    disabled={!tripData.bookingAvailable}
                  >
                    {tripData.bookingAvailable ? 'Book Now' : 'Booking Not Available'}
                  </Button>
                  
                  <div className="text-center">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Operator
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Trip Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground mb-1">Route Information</div>
                    <div className="text-muted-foreground text-xs">
                      Route ID: {tripData.routeId || 'N/A'} | Schedule ID: {tripData.scheduleId || 'N/A'}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="font-medium text-foreground mb-1">Trip Status</div>
                    <div className="text-muted-foreground text-xs">
                      Current Status: {tripData.status || 'Unknown'}
                      {tripData.delay && ` | Delay: ${tripData.delay} minutes`}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="font-medium text-foreground mb-1">Booking Information</div>
                    <div className="text-muted-foreground text-xs">
                      Booking Available: {tripData.bookingAvailable ? 'Yes' : 'No'}
                      {tripData.availableSeats !== undefined && ` | Available Seats: ${tripData.availableSeats}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;