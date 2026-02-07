import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Bus, 
  MapPin, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Info,
  Calendar,
  Route as RouteIcon
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RouteMap from "@/components/RouteMap";
import { PassengerQueryService } from "@/generated/api-client/route-management";
import type { 
  FindMyBusDetailsResponse,
  ScheduleStopDetails,
  ScheduleCalendarInfo,
  ScheduleExceptionInfo
} from "@/generated/api-client/route-management";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StopViewMode = 'all' | 'with-times' | 'origin-destination';
type TimeDisplayMode = 'resolved' | 'verified' | 'unverified' | 'calculated';

/**
 * FindMyBusDetailPage - Comprehensive detail page for bus schedule/trip
 * 
 * URL Pattern:
 * /findmybus/detail?scheduleId=X&fromStopId=Y&toStopId=Z&tripId=T&date=YYYY-MM-DD&timePreference=DEFAULT
 */
const FindMyBusDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract URL parameters
  const scheduleId = searchParams.get('scheduleId');
  const fromStopId = searchParams.get('fromStopId');
  const toStopId = searchParams.get('toStopId');
  const tripId = searchParams.get('tripId') || undefined;
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const timePreferenceParam = (searchParams.get('timePreference') || 'DEFAULT') as 'VERIFIED_ONLY' | 'PREFER_UNVERIFIED' | 'PREFER_CALCULATED' | 'DEFAULT';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FindMyBusDetailsResponse | null>(null);
  const [stopViewMode, setStopViewMode] = useState<StopViewMode>('all');
  const [timeDisplayMode, setTimeDisplayMode] = useState<TimeDisplayMode>('resolved');
  const [showExceptions, setShowExceptions] = useState(false);

  // Fetch data using new API
  useEffect(() => {
    const fetchData = async () => {
      if (!scheduleId || !fromStopId || !toStopId) {
        setError("Missing required parameters. Please go back and select a bus.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await PassengerQueryService.findMyBusDetails(
          scheduleId,
          fromStopId,
          toStopId,
          tripId,
          dateParam,
          timePreferenceParam
        );

        if (!response.success) {
          setError(response.message || "Failed to load details");
          return;
        }

        setData(response);
      } catch (err: unknown) {
        console.error("Failed to fetch details:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load details. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, fromStopId, toStopId, tripId, dateParam, timePreferenceParam]);

  // Helper functions
  const formatTime = (timeString?: string | null) => {
    if (!timeString) return null;
    try {
      const fullDateString = timeString.includes('T') ? timeString : `2000-01-01T${timeString}`;
      const date = new Date(fullDateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      return timeString;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get time source badge config
  const getTimeSourceConfig = (source?: string) => {
    switch (source) {
      case 'VERIFIED':
        return { 
          label: 'Verified', 
          icon: CheckCircle, 
          className: 'bg-green-100 text-green-700 border-green-200',
          tooltip: 'Time verified by official sources'
        };
      case 'UNVERIFIED':
        return { 
          label: 'Unverified', 
          icon: AlertCircle, 
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          tooltip: 'Time submitted by users, not officially verified'
        };
      case 'CALCULATED':
        return { 
          label: 'Calculated', 
          icon: Calculator, 
          className: 'bg-blue-50 text-blue-600 border-blue-200',
          tooltip: 'Time calculated based on average travel times'
        };
      default:
        return null;
    }
  };

  // Get operating days from calendar
  const getOperatingDays = (calendar?: ScheduleCalendarInfo): string[] => {
    if (!calendar) return [];
    const days: string[] = [];
    if (calendar.monday) days.push('Mon');
    if (calendar.tuesday) days.push('Tue');
    if (calendar.wednesday) days.push('Wed');
    if (calendar.thursday) days.push('Thu');
    if (calendar.friday) days.push('Fri');
    if (calendar.saturday) days.push('Sat');
    if (calendar.sunday) days.push('Sun');
    return days;
  };

  // Filter stops based on view mode
  const getFilteredStops = (stops?: ScheduleStopDetails[]): ScheduleStopDetails[] => {
    if (!stops) return [];
    
    switch (stopViewMode) {
      case 'with-times':
        return stops.filter(s => s.resolvedArrivalTime || s.resolvedDepartureTime);
      case 'origin-destination':
        return stops.filter(s => s.isOrigin || s.isDestination);
      case 'all':
      default:
        return stops;
    }
  };

  // Get display time based on mode
  const getDisplayTime = (stop: ScheduleStopDetails, type: 'arrival' | 'departure'): { time: string | null; source: string | null } => {
    switch (timeDisplayMode) {
      case 'verified':
        return { 
          time: type === 'arrival' ? stop.arrivalTime || null : stop.departureTime || null,
          source: 'VERIFIED'
        };
      case 'unverified':
        return { 
          time: type === 'arrival' ? stop.arrivalTimeUnverified || null : stop.departureTimeUnverified || null,
          source: 'UNVERIFIED'
        };
      case 'calculated':
        return { 
          time: type === 'arrival' ? stop.arrivalTimeCalculated || null : stop.departureTimeCalculated || null,
          source: 'CALCULATED'
        };
      case 'resolved':
      default:
        return { 
          time: type === 'arrival' ? stop.resolvedArrivalTime || null : stop.resolvedDepartureTime || null,
          source: type === 'arrival' ? stop.arrivalTimeSource || null : stop.departureTimeSource || null
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading details...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Details</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <CardContent>
              <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Not Found</h3>
              <p className="text-muted-foreground mb-6">The requested details could not be found.</p>
              <Button onClick={() => navigate('/findmybus')}>
                Go to Search
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const { route, schedule, trip, journeySummary } = data;
  const filteredStops = getFilteredStops(schedule?.stops);
  const operatingDays = getOperatingDays(schedule?.calendar);
  
  // Prepare stops for map
  const stopsForMap = (schedule?.stops || []).map((stop) => ({
    name: stop.stop?.name || '',
    km: stop.distanceFromStartKm || 0,
    location: stop.stop?.location ? {
      latitude: stop.stop.location.latitude || 0,
      longitude: stop.stop.location.longitude || 0,
    } : undefined
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-10 relative">
        <img
          src="/Autobus-de-luxe.jpg"
          alt="Bus background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1200px]">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex gap-2 sm:gap-3 md:gap-4 items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="-ml-1 sm:-ml-2 bg-gray-200/90 hover:bg-gray-200/100 rounded-full hover:shadow transition-all p-1.5 sm:p-2 h-auto"
          >
            <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-foreground" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              {journeySummary?.originStop?.name || 'Origin'} to {journeySummary?.destinationStop?.name || 'Destination'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {formatDate(data.queryDate)} • {route?.routeNumber ? `Route ${route.routeNumber}` : route?.name}
            </p>
          </div>
        </div>

        {/* Journey Summary Card */}
        <Card className="mb-4 sm:mb-5 md:mb-6 bg-muted/30">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {route?.routeNumber && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Route No</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold">{route.routeNumber}</p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Route</p>
                <p className="text-sm sm:text-base md:text-lg font-semibold truncate">{route?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Departure</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold">
                    {formatTime(journeySummary?.departureFromOrigin) || 'N/A'}
                  </p>
                  {journeySummary?.departureTimeSource && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getTimeSourceConfig(journeySummary.departureTimeSource)?.className}`}>
                            {journeySummary.departureTimeSource?.charAt(0)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getTimeSourceConfig(journeySummary.departureTimeSource)?.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Arrival</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold">
                    {formatTime(journeySummary?.arrivalAtDestination) || 'N/A'}
                  </p>
                  {journeySummary?.arrivalTimeSource && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getTimeSourceConfig(journeySummary.arrivalTimeSource)?.className}`}>
                            {journeySummary.arrivalTimeSource?.charAt(0)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getTimeSourceConfig(journeySummary.arrivalTimeSource)?.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Duration</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">
                  {formatDuration(journeySummary?.estimatedDurationMinutes) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Distance</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">
                  {journeySummary?.distanceKm ? `${journeySummary.distanceKm.toFixed(1)} km` : 'N/A'}
                </p>
              </div>
            </div>
            
            {journeySummary?.statusMessage && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {journeySummary.statusMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Map */}
        <Card className="mb-4 sm:mb-5 md:mb-6">
          <CardContent className="p-0">
            {stopsForMap.length >= 2 ? (
              <div className="min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
                <RouteMap stops={stopsForMap} routeName={route?.name || 'Route'} />
              </div>
            ) : (
              <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground px-4">
                  <MapPin className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">Map unavailable - insufficient stop data</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Left Column: Stop List */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Stop List ({schedule?.stops?.length || 0} stops)
                  </h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={stopViewMode} onValueChange={(value) => setStopViewMode(value as StopViewMode)}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] text-xs sm:text-sm h-8">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stops</SelectItem>
                      <SelectItem value="with-times">With Times</SelectItem>
                      <SelectItem value="origin-destination">Origin & Dest</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeDisplayMode} onValueChange={(value) => setTimeDisplayMode(value as TimeDisplayMode)}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] text-xs sm:text-sm h-8">
                      <SelectValue placeholder="Time Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Resolved Times</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified Only</SelectItem>
                      <SelectItem value="calculated">Calculated Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                {filteredStops.length > 0 ? (
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    {filteredStops.map((stop, index) => {
                      const arrivalInfo = getDisplayTime(stop, 'arrival');
                      const departureInfo = getDisplayTime(stop, 'departure');
                      const displayTime = departureInfo.time || arrivalInfo.time;
                      const displaySource = departureInfo.source || arrivalInfo.source;
                      
                      return (
                        <div key={stop.scheduleStopId || index} className="flex gap-2 sm:gap-3 md:gap-4">
                          <div className="flex-shrink-0 w-16 sm:w-20 md:w-24">
                            <div className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                              {formatTime(displayTime) || '-'}
                            </div>
                            {displaySource && timeDisplayMode === 'resolved' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getTimeSourceConfig(displaySource)?.className}`}>
                                      {getTimeSourceConfig(displaySource)?.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getTimeSourceConfig(displaySource)?.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                              <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                                  stop.isOrigin ? 'bg-green-500 ring-2 ring-green-200' : 
                                  stop.isDestination ? 'bg-red-500 ring-2 ring-red-200' : 
                                  'bg-blue-500'
                                }`} />
                                {index < filteredStops.length - 1 && (
                                  <div className="w-0.5 h-8 sm:h-9 bg-border mt-1" />
                                )}
                              </div>

                              <div className={`flex-1 min-w-0 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-sm ${
                                stop.isOrigin ? 'bg-green-50 border border-green-200' :
                                stop.isDestination ? 'bg-red-50 border border-red-200' :
                                'bg-gray-200/60'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                    {stop.stop?.name}
                                  </p>
                                  {stop.isOrigin && (
                                    <Badge className="bg-green-500 text-white text-[9px] px-1 py-0">Origin</Badge>
                                  )}
                                  {stop.isDestination && (
                                    <Badge className="bg-red-500 text-white text-[9px] px-1 py-0">Dest</Badge>
                                  )}
                                </div>
                                
                                <div className="flex gap-3 sm:gap-4 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                                  <span>Stop #{stop.stopOrder}</span>
                                  {stop.distanceFromStartKm !== undefined && (
                                    <span>{stop.distanceFromStartKm.toFixed(1)} km</span>
                                  )}
                                </div>
                                
                                {(arrivalInfo.time || departureInfo.time) && (
                                  <div className="flex gap-3 sm:gap-4 mt-1.5 text-[10px] sm:text-xs">
                                    {arrivalInfo.time && (
                                      <div>
                                        <span className="text-muted-foreground">Arr: </span>
                                        <span className="font-medium">{formatTime(arrivalInfo.time)}</span>
                                      </div>
                                    )}
                                    {departureInfo.time && (
                                      <div>
                                        <span className="text-muted-foreground">Dep: </span>
                                        <span className="font-medium">{formatTime(departureInfo.time)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-10 md:py-12 text-muted-foreground">
                    <MapPin className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No stops available for this view mode</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Schedule, Trip & Route Details */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Schedule Details */}
            <Card>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Details
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {schedule?.name && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Schedule:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{schedule.name}</span>
                    </div>
                  )}
                  {schedule?.scheduleType && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Type:</span>
                      <Badge variant="secondary" className="text-xs">{schedule.scheduleType}</Badge>
                    </div>
                  )}
                  
                  {operatingDays.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Operating Days</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {operatingDays.map((day) => (
                          <Badge key={day} variant="secondary" className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                      {schedule?.calendar?.operatingDaysSummary && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {schedule.calendar.operatingDaysSummary}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-1.5 sm:pt-2">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Operating on {formatDate(data.queryDate)}</p>
                    <div>
                      {schedule?.isActiveOnDate !== false ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm">
                          No
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(schedule?.effectiveStartDate || schedule?.effectiveEndDate) && (
                    <div className="pt-1.5 sm:pt-2 border-t">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Effective Period</p>
                      <p className="text-xs sm:text-sm">
                        {formatDate(schedule.effectiveStartDate)} - {formatDate(schedule.effectiveEndDate) || 'Ongoing'}
                      </p>
                    </div>
                  )}

                  {schedule?.exceptions && schedule.exceptions.length > 0 && (
                    <div className="pt-1.5 sm:pt-2 border-t">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary hover:underline text-xs sm:text-sm"
                        onClick={() => setShowExceptions(true)}
                      >
                        View schedule exceptions ({schedule.exceptions.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trip & Bus Details */}
            {trip && (
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Trip & Bus Details
                  </h2>
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    {trip.status && (
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Trip Status:</span>
                        <Badge variant={trip.status === 'active' ? 'default' : 'secondary'} 
                               className={trip.status === 'active' ? 'bg-green-600' : ''}>
                          {trip.status}
                        </Badge>
                      </div>
                    )}
                    {trip.bus?.plateNumber && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Bus Plate:</span>
                        <span className="font-medium text-xs sm:text-sm text-right">{trip.bus.plateNumber}</span>
                      </div>
                    )}
                    {trip.bus?.model && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Bus Model:</span>
                        <span className="font-medium text-xs sm:text-sm text-right">{trip.bus.model}</span>
                      </div>
                    )}
                    {trip.bus?.capacity && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Capacity:</span>
                        <span className="font-medium text-xs sm:text-sm text-right">{trip.bus.capacity} passengers</span>
                      </div>
                    )}
                    {trip.operator?.name && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Operator:</span>
                        <span className="font-medium text-xs sm:text-sm text-right">{trip.operator.name}</span>
                      </div>
                    )}
                    {trip.operator?.operatorType && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Operator Type:</span>
                        <Badge variant="outline" className="text-xs">{trip.operator.operatorType}</Badge>
                      </div>
                    )}
                    {trip.psp?.permitNumber && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">PSP Number:</span>
                        <span className="font-medium text-xs sm:text-sm text-right">{trip.psp.permitNumber}</span>
                      </div>
                    )}
                    {trip.delayMinutes !== undefined && trip.delayMinutes !== 0 && (
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Delay:</span>
                        <Badge variant={trip.delayMinutes > 0 ? 'destructive' : 'default'} 
                               className={trip.delayMinutes < 0 ? 'bg-green-600' : ''}>
                          {trip.delayMinutes > 0 ? `+${trip.delayMinutes}` : trip.delayMinutes} min
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Route Details */}
            <Card>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <RouteIcon className="h-5 w-5" />
                  Route Details
                </h2>
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  {route?.name && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Route Name:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.name}</span>
                    </div>
                  )}
                  {route?.routeNumber && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Route Number:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.routeNumber}</span>
                    </div>
                  )}
                  {route?.roadType && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Road Type:</span>
                      <Badge variant="outline" className="text-xs">{route.roadType}</Badge>
                    </div>
                  )}
                  {route?.routeThrough && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Via:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.routeThrough}</span>
                    </div>
                  )}
                  {route?.totalDistanceKm && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Total Distance:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.totalDistanceKm.toFixed(1)} km</span>
                    </div>
                  )}
                  {route?.direction && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Direction:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.direction}</span>
                    </div>
                  )}
                  {route?.routeGroup?.name && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Route Group:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{route.routeGroup.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Exceptions Modal */}
      <Dialog open={showExceptions} onOpenChange={setShowExceptions}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Schedule Exceptions</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
            {schedule?.exceptions && schedule.exceptions.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {schedule.exceptions.map((exception: ScheduleExceptionInfo, index: number) => (
                  <div key={exception.id || index} className={`p-2.5 sm:p-3 border rounded-lg ${
                    exception.affectsQueryDate ? 'bg-red-50 border-red-200' : 'bg-muted/50'
                  }`}>
                    <div className="flex gap-2 mb-1.5 sm:mb-2">
                      <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 ${
                        exception.affectsQueryDate ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs sm:text-sm">
                          {formatDate(exception.exceptionDate)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                          {exception.reason || 'No description available'}
                        </p>
                        <div className="flex gap-2 mt-1.5 sm:mt-2">
                          {exception.exceptionType && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {exception.exceptionType}
                            </Badge>
                          )}
                          {exception.affectsQueryDate && (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs">
                              Affects Selected Date
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <p className="text-sm sm:text-base">No exceptions found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FindMyBusDetailPage;
