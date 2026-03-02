'use client';

import { MapPin, Navigation, ArrowRight, Info } from 'lucide-react';
import type { OperatorTrip, OperatorTripRoute } from '@/data/operator/trips';

interface TripRouteTabProps {
  trip: OperatorTrip;
  route?: OperatorTripRoute | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

export function TripRouteTab({ trip, route }: TripRouteTabProps) {
  const stops = route?.stops ?? [];

  if (!route) {
    return (
      <div className="text-center py-12">
        <Navigation className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-1">No Route Information</h3>
        <p className="text-sm text-gray-500">
          Route details are not available for this trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Route Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{route.routeNumber}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Route Number</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{route.distanceKm} km</p>
            <p className="text-xs text-green-600 font-medium mt-1">Total Distance</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">
              {Math.floor(route.estimatedDurationMinutes / 60)}h{' '}
              {route.estimatedDurationMinutes % 60}m
            </p>
            <p className="text-xs text-orange-600 font-medium mt-1">Est. Duration</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stops.length}</p>
            <p className="text-xs text-purple-600 font-medium mt-1">Total Stops</p>
          </div>
        </div>

        {route.description && (
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p>{route.description}</p>
          </div>
        )}
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Origin</p>
          </div>
          <p className="text-lg font-bold text-green-800">{route.origin}</p>
          <p className="text-xs text-green-600 mt-1">Route Group: {route.routeGroupCode}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Destination</p>
          </div>
          <p className="text-lg font-bold text-red-800">{route.destination}</p>
          <p className="text-xs text-red-600 mt-1">Route Group: {route.routeGroupName}</p>
        </div>
      </div>

      {/* Stops */}
      {stops.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">
              Stops ({stops.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-3">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center shrink-0 w-6">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      stop.isTerminal
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-400'
                    }`}
                  />
                  {idx < stops.length - 1 && (
                    <div className="w-0.5 h-5 bg-gray-200 mt-1" />
                  )}
                </div>

                {/* Stop number */}
                <span className="text-xs font-mono text-gray-400 w-5 shrink-0">
                  {stop.stopOrder}
                </span>

                {/* Stop name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className={`text-sm ${stop.isTerminal ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {stop.stopName}
                    </p>
                    {stop.stopCode && (
                      <span className="text-xs text-gray-400 font-mono">({stop.stopCode})</span>
                    )}
                    {stop.isTerminal && (
                      <span className="text-xs bg-blue-100 text-blue-700 font-medium px-1.5 py-0.5 rounded">
                        Terminal
                      </span>
                    )}
                  </div>
                </div>

                {/* Timing */}
                {(stop.arrivalOffset !== undefined || stop.departureOffset !== undefined) && (
                  <div className="text-right shrink-0">
                    {stop.arrivalOffset !== undefined && (
                      <p className="text-xs text-gray-500">
                        +{stop.arrivalOffset} min
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Terminal stop
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
              Intermediate stop
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Offset from departure
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
