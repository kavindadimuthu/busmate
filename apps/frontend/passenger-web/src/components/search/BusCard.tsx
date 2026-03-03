import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BusFront, Clock, ArrowRight, Route, CheckCircle, AlertCircle, Calculator } from "lucide-react";
import type { BusResult } from "@busmate/api-client-route";

interface BusCardProps {
  bus: BusResult;
  fromStopName?: string;
  toStopName?: string;
  fromStopId?: string;
  toStopId?: string;
  searchDate?: string;
  timePreference?: 'VERIFIED_ONLY' | 'PREFER_UNVERIFIED' | 'PREFER_CALCULATED' | 'DEFAULT';
  onViewDetails?: () => void;
}

// Utility function to calculate duration from arrival and departure times if api does not provide duration
const calculateDuration = (departureTime?: string, arrivalTime?: string) => {
  if (!departureTime || !arrivalTime) return undefined;

  // Create valid date objects by prefixing time strings with a date
  const baseDate = "1970-01-01T";
  const departure = new Date(baseDate + departureTime);
  const arrival = new Date(baseDate + arrivalTime);

  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
    return undefined;
  }

  const durationInMinutes = (arrival.getTime() - departure.getTime()) / (1000 * 60);

  // Convert minutes to hours and minutes format
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = Math.round(durationInMinutes % 60);

  // return finalized duration string in human readable format
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// Helper function to format time
const formatTime = (timeString?: string) => {
  if (!timeString) return "";

  try {
    // Handle different time formats from API
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      // If it's not a valid date, assume it's a LocalTime format like "HH:mm:ss" or "HH:mm"
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      return timeString;
    }
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return timeString;
  }
};

// Helper function to format duration
const formatDuration = (minutes?: number) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Helper function to get departure time (prioritize actual over scheduled)
const getDepartureTime = (bus: BusResult) => {
  return bus.actualDepartureTime || bus.departureAtOrigin || null;
};

// Helper function to get arrival time (prioritize actual over scheduled)
const getArrivalTime = (bus: BusResult) => {
  return bus.actualArrivalTime || bus.arrivalAtDestination || null;
};

// Helper function to get time source badge config
const getTimeSourceConfig = (source?: string) => {
  switch (source) {
    case 'VERIFIED':
      return { 
        label: 'Verified', 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-700 border-green-200',
        tooltip: 'Time verified by official sources'
      };
    case 'UNVERIFIED':
      return { 
        label: 'Unverified', 
        variant: 'secondary' as const, 
        icon: AlertCircle, 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        tooltip: 'Time submitted by users, not officially verified'
      };
    case 'CALCULATED':
      return { 
        label: 'Calculated', 
        variant: 'outline' as const, 
        icon: Calculator, 
        className: 'bg-blue-50 text-blue-600 border-blue-200',
        tooltip: 'Time calculated based on average travel times'
      };
    default:
      return null;
  }
};

export default function BusCard({
  bus,
  fromStopName,
  toStopName,
  fromStopId,
  toStopId,
  searchDate,
  timePreference,
  onViewDetails,
}: BusCardProps) {
  const departureTime = getDepartureTime(bus);
  const arrivalTime = getArrivalTime(bus);

  // Get start and end stop times (for the entire route)
  const routeStartDepartureTime = bus.scheduleStartStopDepartureTime || departureTime;
  const routeEndArrivalTime = bus.scheduleEndStopArrivalTime || arrivalTime;
  const totalRouteDistance = bus.scheduleTotalDistanceKm || bus.distanceKm;

  // Generate detail link with new API parameters
  const getDetailLink = () => {
    if (!bus.scheduleId || !fromStopId || !toStopId) {
      // Fall back to route page if required params are missing
      if (bus.routeId) {
        return `/route/${bus.routeId}`;
      }
      return null;
    }
    
    const params = new URLSearchParams();
    params.set('scheduleId', bus.scheduleId);
    params.set('fromStopId', fromStopId);
    params.set('toStopId', toStopId);
    
    if (bus.tripId) {
      params.set('tripId', bus.tripId);
    }
    
    params.set('date', searchDate || new Date().toISOString().split("T")[0]);
    
    if (timePreference) {
      params.set('timePreference', timePreference);
    }
    
    return `/findmybus/detail?${params.toString()}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border rounded-xl sm:rounded-2xl w-full bg-card overflow-hidden">
      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-5">
        {/* TOP SECTION - Route Header with Info */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 sm:justify-between">
          {/* Left side - Route Number and Name */}
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <BusFront className="h-8 sm:h-10 w-8 sm:w-10 text-primary flex-shrink-0 mt-1" />
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-1">
                <span className="font-bold text-lg sm:text-xl text-foreground">
                  {bus.routeNumber || "N/A"}
                </span>
                <span className="sm:inline font-bold text-lg text-foreground">
                  |
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {bus.routeName || "Route Information"}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {bus.routeThrough ? `via ${bus.routeThrough}` : "No via info"}
              </p>
            </div>
          </div>

          {/* Right side - Route Start/End Times and Total Distance */}
          <div className="flex flex-col items-start sm:items-end gap-1 text-sm sm:text-base">
            {/* Route Start to End Times */}
            {routeStartDepartureTime && routeEndArrivalTime && (
              <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-semibold text-foreground whitespace-nowrap">
                {/* <span className="text-xs sm:text-sm text-muted-foreground">Start</span> */}
                <span>{formatTime(routeStartDepartureTime)}</span>
                <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span>{formatTime(routeEndArrivalTime)}</span>
                {/* <span className="text-xs sm:text-sm text-muted-foreground">End</span> */}
              </div>
            )}
            
            {/* Total Route Distance and Road Type */}
            <div className="flex gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              {totalRouteDistance && (
                <span>{totalRouteDistance.toFixed(1)} km total</span>
              )}
              {totalRouteDistance && bus.roadType && (
                <span>•</span>
              )}
              {bus.roadType && (
                <span>{bus.roadType}</span>
              )}
            </div>
          </div>
        </div>

        {/* BADGES ROW - Time Source, Operator and Bus Info */}
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {/* Time Source Badges */}
          {/* <TooltipProvider>
            {bus.departureAtOriginSource && getTimeSourceConfig(bus.departureAtOriginSource) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 ${getTimeSourceConfig(bus.departureAtOriginSource)?.className}`}
                  >
                    {React.createElement(getTimeSourceConfig(bus.departureAtOriginSource)!.icon, { className: "h-3 w-3" })}
                    {getTimeSourceConfig(bus.departureAtOriginSource)?.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTimeSourceConfig(bus.departureAtOriginSource)?.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider> */}
          
          {/* Trip Status Badge */}
          {bus.hasTripData && bus.tripStatus && (
            <Badge
              variant={bus.tripStatus === 'active' ? 'default' : 'secondary'}
              className={`text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 ${
                bus.tripStatus === 'active' ? 'bg-green-600' : ''
              }`}
            >
              {bus.tripStatus === 'active' ? 'Live' : bus.tripStatus}
            </Badge>
          )}
          
          {/* Already Departed Badge */}
          {bus.alreadyDeparted && (
            <Badge
              variant="destructive"
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1"
            >
              Departed
            </Badge>
          )}
          
          {bus.operatorName && (
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 hidden sm:inline-flex"
            >
              {bus.operatorName}
            </Badge>
          )}
          {bus.busPlateNumber && (
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1"
            >
              {bus.busPlateNumber}
            </Badge>
          )}
          {bus.busModel && (
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 md:inline-flex"
            >
              {bus.busModel}
            </Badge>
          )}
          {bus.busCapacity && (
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 lg:inline-flex"
            >
              Cap: {bus.busCapacity}
            </Badge>
          )}
        </div>

        <hr className="border-border" />

        {/* JOURNEY SECTION - Journey visualization */}
        <div className="space-y-3 sm:space-y-4">
          {/* Desktop Journey Timeline */}
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:px-4">
            {/* FROM Stop */}
            <div className="flex flex-col items-start flex-shrink-0">
              <p className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                {fromStopName || "Origin"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {departureTime ? formatTime(departureTime) : "N/A"}
              </p>
            </div>

            {/* Journey Visual */}
            <div className="flex flex-1 mx-4 sm:mx-6 items-center justify-center relative">
              {/* Horizontal Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-primary to-primary/50"></div>
              {/* Bus Icon Circle */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <BusFront className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* TO Stop */}
            <div className="flex flex-col items-start sm:items-end flex-shrink-0">
              <p className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                {toStopName || "Destination"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {arrivalTime ? formatTime(arrivalTime) : "N/A"}
              </p>
            </div>
          </div>

          {/* Mobile Journey Timeline - Vertical */}
          <div className="sm:hidden flex gap-4 px-2">
            {/* Vertical Path with Dots */}
            <div className="flex flex-col items-center gap-0">
              {/* Start Dot */}
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
              {/* Vertical Line */}
              <div className="w-1 h-8 bg-primary/50 flex-shrink-0"></div>
              {/* End Dot */}
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
            </div>

            {/* Stops Information */}
            <div className="flex flex-col justify-between flex-1 gap-2">
              {/* FROM Stop */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  {fromStopName || "Origin"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({departureTime ? formatTime(departureTime) : "N/A"})
                </p>
              </div>

              {/* TO Stop */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  {toStopName || "Destination"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({arrivalTime ? formatTime(arrivalTime) : "N/A"})
                </p>
              </div>
            </div>
          </div>

          {/* Info Row - Duration and Distance */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 sm:px-4">
            <div className="flex flex sm:flex-row pl-2 sm:pl-0 py-0.5 sm:py-0 sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-foreground">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="hidden sm:inline">Duration:</span>
                <span>
                  {/* {formatDuration(bus.estimatedDurationMinutes)} */}
                  {/* calculateDuration */}
                  {bus.estimatedDurationMinutes
                    ? formatDuration(bus.estimatedDurationMinutes)
                    : calculateDuration(departureTime, arrivalTime)}
                  </span>
              </div>
              <span className="hidden sm:block border-l-2 border-gray-300 h-5"></span>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-foreground">
                <Route className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="hidden sm:inline">Distance:</span>
                <span>
                  {bus.distanceKm
                    ? `${bus.distanceKm.toFixed(1)} km`
                    : "N/A"}
                </span>
              </div>
            </div>
            {/* Button */}
            {getDetailLink() ? (
              <Button
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white rounded-full transition-all duration-300"
                onClick={() => {
                  if (onViewDetails) {
                    onViewDetails();
                  } else {
                    window.location.href = getDetailLink()!;
                  }
                }}
              >
                View Details
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300"
                disabled
              >
                No Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
