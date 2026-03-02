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
    <Card className="hover:shadow-lg transition-all duration-300 border border-border rounded-2xl w-full bg-card overflow-hidden">
      <CardContent className="p-6 space-y-5">
        {/* TOP SECTION - Route Header with Info */}
        <div className="flex items-start gap-4 justify-between flex-wrap">
          {/* Left side - Route Number and Name */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <BusFront className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                  {bus.routeNumber}
                </Badge>
                <h3 className="text-xl font-bold text-foreground">
                  {bus.routeName}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                via {bus.routeThrough}
              </p>
            </div>
          </div>

          {/* Right side - Time and Distance info */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <span>{formatTime(routeOriginDepartureTime)}</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <span>{formatTime(routeDestinationArrivalTime)}</span>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge variant="outline" className="text-xs">
                {bus.distanceKm} km
              </Badge>
              <Badge variant="outline" className="text-xs">
                {bus.roadType}
              </Badge>
            </div>
          </div>
        </div>

        {/* BADGES ROW - Operator and Bus Info */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs font-medium">
            {bus.operatorType}
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium">
            {bus.operatorName}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {bus.busPlateNumber}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {bus.busModel}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Capacity: {bus.busCapacity}
          </Badge>
        </div>

        <hr className="border-border mx-[-24px]" />

        {/* JOURNEY SECTION - Journey visualization */}
        <div className="space-y-4">

          <div className="flex items-center justify-between px-4 mb-[-24px]">
            {/* FROM Stop */}
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground mb-1">
                {fromStopName}
              </p>
              <p className="text-sm text-muted-foreground">
                ({formatTime(departureTime)})
              </p>
            </div>


            {/* TO Stop */}
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground mb-1">
                {toStopName}
              </p>
              <p className="text-sm text-muted-foreground">
                ({formatTime(arrivalTime)})
              </p>
            </div>
          </div>

          {/* Journey Timeline */}

          {/* Journey Visual */}
          <div className="flex-1 mx-4 flex items-center justify-center relative">
            {/* Horizontal Line */}
            <div className="absolute inset-x-0 h-2 bg-gradient-to-r from-primary to-primary/70 rounded-full"></div>
            {/* Bus Icon Circle */}
            <div className="relative z-10 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <BusFront className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Row - Duration and Distance */}
        <div className="flex items-center justify-between px-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-md font-bold text-foreground">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>Duration: {formatDuration(bus.estimatedDurationMinutes)}</span>
            </div>
            <span className="border border-2 border-l border-gray-600 my-1 py-2"></span>
            <div className="flex items-center gap-1 text-md font-bold text-foreground">
              <Route className="h-5 w-5 text-muted-foreground" />
              <span>Distance: {bus.distanceKm} km</span>
            </div>
          </div>
          {/* Button */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white rounded-full transition-all duration-300"
            onClick={() => (window.location.href = detailLink)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
