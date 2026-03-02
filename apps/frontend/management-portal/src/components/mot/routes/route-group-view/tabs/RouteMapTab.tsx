'use client';

import { useState } from 'react';
import { Map, Maximize2, Navigation, MapPin } from 'lucide-react';
import type { RouteResponse } from '../../../../../../generated/api-clients/route-management';
import { RouteMap } from '../../RouteMap';
import { RouteMapFullscreen } from '../../RouteMapFullscreen';

// ── Types ─────────────────────────────────────────────────────────

interface RouteMapTabProps {
  route: RouteResponse;
}

// ── Component ─────────────────────────────────────────────────────

export function RouteMapTab({ route }: RouteMapTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isOutbound = route.direction === 'OUTBOUND';
  const stopsCount = (route.routeStops?.length || 0) + 2;

  return (
    <div className="space-y-4">
      {/* Map header info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        {/* Route summary */}
        <div className="flex items-center gap-6">
          {/* Direction */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isOutbound ? 'bg-emerald-100' : 'bg-cyan-100'
              }`}
            >
              <Navigation
                className={`w-4 h-4 ${
                  isOutbound
                    ? 'text-emerald-600 rotate-45'
                    : 'text-cyan-600 -rotate-[135deg]'
                }`}
              />
            </div>
            <div>
              <div className="text-xs text-gray-500">Direction</div>
              <div className="text-sm font-semibold text-gray-900">
                {route.direction}
              </div>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Map className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Distance</div>
              <div className="text-sm font-semibold text-gray-900">
                {route.distanceKm?.toFixed(1) || 0} km
              </div>
            </div>
          </div>

          {/* Stops */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Stops</div>
              <div className="text-sm font-semibold text-gray-900">{stopsCount}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <RouteMap route={route} className="h-[500px]" />
      </div>

      {/* Route legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-full" />
          <span>Start Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <span>Intermediate Stops</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full" />
          <span>End Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-blue-500 rounded" />
          <span>Route Path</span>
        </div>
      </div>

      {/* Fullscreen modal */}
      <RouteMapFullscreen
        route={route}
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      />
    </div>
  );
}
