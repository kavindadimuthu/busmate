import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Bus, 
  Clock, 
  MapPin, 
  Navigation,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Wifi,
  Wind,
  Battery,
  Users,
  ChevronDown,
  AlertTriangle,
  ChevronLeft
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RouteMap from "@/components/RouteMap";
import { TripManagementService, ScheduleManagementService } from "@/generated/api-client/route-management";
import type { TripResponse, ScheduleResponse, ScheduleStopResponse, ScheduleCalendarResponse } from "@/generated/api-client/route-management";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StopViewMode = 'timings' | 'arrival-departure' | 'all';

interface DetailData {
  // Common fields
  routeName?: string;
  routeNumber?: string;
  roadType?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: number;
  // Schedule data
  operatingDays?: string[];
  scheduleExceptions?: any[];
  // Bus data
  busPlateNumber?: string;
  busModel?: string;
  busCapacity?: number;
  operatorName?: string;
  driverName?: string;
  conductorName?: string;
  contactNumber?: string;
  // Stops
  stops: ScheduleStopResponse[];
}

/**
 * FindMyBusDetailPage - Unified detail page showing bus result details
 * 
 * URL Pattern:
 * - /findmybus/detail?type=trip&id=X
 * - /findmybus/detail?type=schedule&id=X&date=YYYY-MM-DD
 */
const FindMyBusDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const type = searchParams.get('type') as 'trip' | 'schedule' | null;
  const id = searchParams.get('id');
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetailData | null>(null);
  const [stopViewMode, setStopViewMode] = useState<StopViewMode>('timings');
  const [showExceptions, setShowExceptions] = useState(false);

  // Fetch data based on type
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !type) {
        setError("Invalid URL parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let detailData: DetailData;

        if (type === 'trip') {
          const tripResponse = await TripManagementService.getTripById(id);
          let scheduleData: ScheduleResponse | undefined;
          
          if (tripResponse.scheduleId) {
            try {
              scheduleData = await ScheduleManagementService.getScheduleById(tripResponse.scheduleId);
            } catch (err) {
              console.error("Failed to fetch schedule data:", err);
            }
          }

          const stops = scheduleData?.scheduleStops?.sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)) || [];
          const firstStop = stops[0];
          const lastStop = stops[stops.length - 1];

          detailData = {
            routeName: tripResponse.routeName,
            routeNumber: scheduleData?.routeName?.match(/\d+-\d+/)?.[0],
            origin: firstStop?.stopName,
            destination: lastStop?.stopName,
            departureTime: tripResponse.scheduledDepartureTime || tripResponse.actualDepartureTime,
            arrivalTime: tripResponse.scheduledArrivalTime || tripResponse.actualArrivalTime,
            operatingDays: scheduleData?.scheduleCalendars ? getOperatingDays(scheduleData.scheduleCalendars) : [],
            scheduleExceptions: scheduleData?.scheduleExceptions,
            busPlateNumber: tripResponse.busPlateNumber,
            busModel: tripResponse.busModel,
            operatorName: tripResponse.operatorName,
            stops,
          };
        } else {
          const scheduleResponse = await ScheduleManagementService.getScheduleById(id);
          const stops = scheduleResponse.scheduleStops?.sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)) || [];
          const firstStop = stops[0];
          const lastStop = stops[stops.length - 1];
          

          detailData = {
            routeName: scheduleResponse.routeName,
            routeNumber: scheduleResponse.routeName?.match(/\d+-\d+/)?.[0],
            origin: firstStop?.stopName,
            destination: lastStop?.stopName,
            departureTime: firstStop?.departureTime,
            arrivalTime: lastStop?.arrivalTime,
            operatingDays: scheduleResponse.scheduleCalendars ? getOperatingDays(scheduleResponse.scheduleCalendars) : [],
            scheduleExceptions: scheduleResponse.scheduleExceptions,
            stops,
          };
        }

        setData(detailData);
      } catch (err: any) {
        console.error(`Failed to fetch ${type} details:`, err);
        setError(err.message || `Failed to load details. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type, dateParam]);

  // Helper functions
  const formatTime = (timeString?: string | null) => {
    if (!timeString) return null;
    try {
      // If it's just time (HH:MM:SS), prepend a dummy date to create a valid Date object
      const fullDateString = timeString.includes('T') ? timeString : `2000-01-01T${timeString}`;
      const date = new Date(fullDateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
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

  const getOperatingDays = (calendar: ScheduleCalendarResponse[]): string[] => {
    // Default all 7 weekdays
    const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (!calendar || calendar.length === 0) return defaultDays;
    
    const cal = calendar[0];
    const days: string[] = [];
    if (cal.monday) days.push('Mon');
    if (cal.tuesday) days.push('Tue');
    if (cal.wednesday) days.push('Wed');
    if (cal.thursday) days.push('Thu');
    if (cal.friday) days.push('Fri');
    if (cal.saturday) days.push('Sat');
    if (cal.sunday) days.push('Sun');
    
    // If no days are configured, return default all 7 days
    return days.length > 0 ? days : defaultDays;
  };

  const getDayOfWeekIndex = () => {
    const date = new Date(dateParam);
    return date.getDay();
  };

  const isOperatingToday = (): boolean => {
    if (!data?.operatingDays || data.operatingDays.length === 0) return false;
    const dayIndex = getDayOfWeekIndex();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return data.operatingDays.includes(dayNames[dayIndex]);
  };

  const calculateDuration = () => {
    if (!data?.departureTime || !data?.arrivalTime) return null;
    try {
      // Convert time strings to Date objects, handling HH:MM:SS format
      const departureStr = data.departureTime.includes('T') ? data.departureTime : `2000-01-01T${data.departureTime}`;
      const arrivalStr = data.arrivalTime.includes('T') ? data.arrivalTime : `2000-01-01T${data.arrivalTime}`;
      const departure = new Date(departureStr);
      const arrival = new Date(arrivalStr);
      if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return null;
      const diffMs = arrival.getTime() - departure.getTime();
      return Math.floor(diffMs / 60000); // Convert to minutes
    } catch {
      return null;
    }
  };

  // Filter stops based on view mode
  const getFilteredStops = () => {
    if (!data?.stops) return [];
    
    switch (stopViewMode) {
      case 'timings':
        return data.stops.filter(s => s.arrivalTime || s.departureTime);
      case 'arrival-departure':
        return data.stops.filter(s => s.arrivalTime && s.departureTime);
      case 'all':
        return data.stops;
      default:
        return data.stops;
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

  const duration = calculateDuration();
  const filteredStops = getFilteredStops();
  const stopsForMap = data.stops.map((stop, index) => ({
    name: stop.stopName || '',
    km: index * 10, // Approximate distance based on order
    location: stop.location ? {
      latitude: stop.location.latitude || 0,
      longitude: stop.location.longitude || 0,
    } : undefined
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-8 relative">
      {/* Header Section */}
      {/* Background image (low opacity) */}
        <img
          src="/Autobus-de-luxe.jpg"
          alt="Bus background"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
        {/* Keep the existing gradient/color effect above the image */}
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
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            {data.origin || 'Origin'} to {data.destination || 'Destination'}
          </h1>
        </div>

        {/* Bus Summary Card */}
        <Card className="mb-4 sm:mb-5 md:mb-6 bg-muted/30">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {data.routeNumber && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Route No</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">{data.routeNumber || 'N/A'}</p>
              </div>
                )}
              <div className={data.routeNumber ? "col-span-2 sm:col-span-1 lg:col-span-1" : "col-span-2"}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Route</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold truncate">{data.routeName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Departure</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">{formatTime(data.departureTime) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Arrival</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">{formatTime(data.arrivalTime) || 'N/A'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Duration</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold">{formatDuration(duration || undefined) || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Map */}
        <Card className="mb-4 sm:mb-5 md:mb-6">
          <CardContent className="p-0">
            {stopsForMap.length >= 2 ? (
              <div className="min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
                <RouteMap stops={stopsForMap} routeName={data.routeName || 'Route'} />
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Stop List</h2>
                <Select value={stopViewMode} onValueChange={(value) => setStopViewMode(value as StopViewMode)}>
                  <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] text-sm">
                    <SelectValue placeholder="Select view mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timings">Stops with timings</SelectItem>
                    <SelectItem value="arrival-departure">Arrival/Departure times</SelectItem>
                    <SelectItem value="all">All stops</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                {filteredStops.length > 0 ? (
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    {filteredStops.map((stop, index) => (
                      <div key={stop.id || index} className="flex gap-2 sm:gap-3 md:gap-4">
                        {/* Time Column */}
                        <div className="flex-shrink-0 w-12 sm:w-14 md:w-16">
                          <div className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                            {formatTime(stop.departureTime || stop.arrivalTime) || '-'}
                          </div>
                        </div>

                        {/* Timeline & Stop Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                            {/* Timeline Indicator */}
                            <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === filteredStops.length - 1 ? 'bg-red-500' : 
                                'bg-blue-500'
                              }`} />
                              {index < filteredStops.length - 1 && (
                                <div className="w-0.5 h-8 sm:h-9 bg-border mt-1" />
                              )}
                            </div>

                            {/* Stop Details */}
                            <div className="flex-1 min-w-0 bg-gray-200/60 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-sm">
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                {stop.stopName}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                Stop {stop.stopOrder}
                              </p>
                              
                              {stopViewMode === 'arrival-departure' && (
                                <div className="flex gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Arr: </span>
                                    <span className="font-medium">
                                      {stop.arrivalTime ? formatTime(stop.arrivalTime) : '-'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Dep: </span>
                                    <span className="font-medium">
                                      {stop.departureTime ? formatTime(stop.departureTime) : '-'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

          {/* Right Column: Schedule & Bus Details */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Schedule Details */}
            {data.operatingDays && data.operatingDays.length > 0 && (
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Schedule Details</h2>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Operating Days */}
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Operating Days</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {data.operatingDays.map((day) => (
                          <Badge key={day} variant="secondary" className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Operating Today */}
                    <div className="pt-1.5 sm:pt-2">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Operating Today</p>
                      <div>
                        {isOperatingToday() ? (
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

                    {/* Exceptions */}
                    {data.scheduleExceptions && data.scheduleExceptions.length > 0 && (
                      <div className="pt-1.5 sm:pt-2 border-t">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary hover:underline text-xs sm:text-sm"
                          onClick={() => setShowExceptions(true)}
                        >
                          View schedule exceptions ({data.scheduleExceptions.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bus Details */}
            <Card>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Bus Details</h2>
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  {data.busPlateNumber && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Bus Plate:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.busPlateNumber}</span>
                    </div>
                  )}
                  {data.operatorName && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Operator:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.operatorName}</span>
                    </div>
                  )}
                  {data.busModel && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Vehicle Type:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.busModel}</span>
                    </div>
                  )}
                  {data.busCapacity && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Capacity:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.busCapacity} passengers</span>
                    </div>
                  )}
                  {data.driverName && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Driver:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.driverName}</span>
                    </div>
                  )}
                  {data.conductorName && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Conductor:</span>
                      <span className="font-medium text-xs sm:text-sm text-right">{data.conductorName}</span>
                    </div>
                  )}
                  {data.contactNumber && (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Contact:</span>
                      <a 
                        href={`tel:${data.contactNumber}`} 
                        className="font-medium text-primary hover:underline flex items-center gap-1 text-xs sm:text-sm"
                      >
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        {data.contactNumber}
                      </a>
                    </div>
                  )}
                  {!data.busPlateNumber && !data.operatorName && !data.busModel && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                      Bus details not available
                    </p>
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
            {data?.scheduleExceptions && data.scheduleExceptions.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {data.scheduleExceptions.map((exception: any, index: number) => (
                  <div key={exception.id || index} className="p-2.5 sm:p-3 border rounded-lg bg-muted/50">
                    <div className="flex gap-2 mb-1.5 sm:mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs sm:text-sm">
                          {exception.exceptionDate || exception.date || 'Exception'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                          {exception.description || exception.reason || 'No description available'}
                        </p>
                        {exception.type && (
                          <Badge variant="outline" className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                            {exception.type}
                          </Badge>
                        )}
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
