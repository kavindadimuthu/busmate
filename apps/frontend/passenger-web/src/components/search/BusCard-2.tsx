import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, BusFront, Clock, ArrowRight, Route } from "lucide-react";

// Helper functions kept for formatting (but using static values)
const formatTime = (timeString?: string) => {
  if (!timeString) return "";
  const date = new Date(`2025-01-01T${timeString}`);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export default function BusCard2() {
  // 🔥 Hardcoded sample data
  const bus = {
    routeNumber: "138",
    routeName: "Maharagama – Pettah",
    routeThrough: "Nugegoda, Kirulapone",
    distanceKm: 14.5,
    roadType: "NORMALWAY",
    operatorType: "SLTB",
    operatorName: "Maharagama Depot",
    busPlateNumber: "WP ND-4567",
    busModel: "Ashok Leyland",
    busCapacity: 54,
    estimatedDurationMinutes: 55,
  };

  const fromStopName = "Nugegoda";
  const toStopName = "Townhall";

  const routeOriginDepartureTime = "07:30";
  const routeDestinationArrivalTime = "08:30";
  const departureTime = "07:45";
  const arrivalTime = "08:15";

  const detailLink = "/findmybus/detail?type=trip&id=99999";

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
                <span className="font-bold text-lg sm:text-xl text-foreground">{bus.routeNumber}</span>
                <span className="sm:inline font-bold text-lg text-foreground">|</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {bus.routeName}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                via {bus.routeThrough}
              </p>
            </div>
          </div>

          {/* Right side - Time and Distance info */}
          <div className="flex flex-col items-start sm:items-end gap-1 text-sm sm:text-base">
            <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg font-semibold text-foreground whitespace-nowrap">
              <span>{formatTime(routeOriginDepartureTime)}</span>
              <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
              <span>{formatTime(routeDestinationArrivalTime)}</span>
            </div>
            <div className="flex gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
                <span>{bus.distanceKm} km</span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{bus.roadType}</span>
                <span className="sm:hidden text-muted-foreground">({bus.roadType})</span>
            </div>
          </div>
        </div>

        {/* BADGES ROW - Operator and Bus Info */}
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1">
            {bus.operatorType}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 hidden sm:inline-flex">
            {bus.operatorName}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1">
            {bus.busPlateNumber}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 md:inline-flex">
            {bus.busModel}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 lg:inline-flex">
            Cap: {bus.busCapacity}
          </Badge>
        </div>

        <hr className="border-border" />

        {/* JOURNEY SECTION - Journey visualization */}
        <div className="space-y-3 sm:space-y-4">
          {/* Desktop Journey Timeline */}
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:px-4">
            {/* FROM Stop */}
            <div className="flex flex-col items-start flex-shrink-0">
              <p className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                {fromStopName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatTime(departureTime)}
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
                {toStopName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatTime(arrivalTime)}
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
              <div className="flex flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  {fromStopName}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({formatTime(departureTime)})
                </p>
              </div>

              {/* TO Stop */}
              <div className="flex flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">
                  {toStopName}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({formatTime(arrivalTime)})
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
                <span>{formatDuration(bus.estimatedDurationMinutes)}</span>
              </div>
              <span className="hidden sm:block border-l-2 border-gray-300 h-5"></span>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-foreground">
                <Route className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="hidden sm:inline">Distance:</span>
                <span>{bus.distanceKm} km</span>
              </div>
            </div>
            {/* Button */}
            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white rounded-full transition-all duration-300"
              onClick={() => (window.location.href = detailLink)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
