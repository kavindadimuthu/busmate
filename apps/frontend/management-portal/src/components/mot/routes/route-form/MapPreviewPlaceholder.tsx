'use client';

import { Map as MapIcon } from 'lucide-react';
import type { RouteGroupFormData } from './RouteForm';

interface MapPreviewPlaceholderProps {
  formData: RouteGroupFormData;
}

export function MapPreviewPlaceholder({ formData }: MapPreviewPlaceholderProps) {
  const hasOutboundRoute = formData.outboundRoute.startStopName && formData.outboundRoute.endStopName;
  const hasInboundRoute = formData.inboundRoute.startStopName && formData.inboundRoute.endStopName;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Preview</h3>
      
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Map View</h4>
        <p className="text-gray-600 mb-4">
          🔌 <strong>API Integration Point:</strong> Implement map component here
        </p>
        
        {/* Route Summary */}
        {(hasOutboundRoute || hasInboundRoute) && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Route Summary:</div>
            
            {hasOutboundRoute && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-700">Outbound:</span> {formData.outboundRoute.startStopName} → {formData.outboundRoute.endStopName}
                {formData.outboundRoute.routeStops.length > 0 && (
                  <span className="text-gray-500"> (+{formData.outboundRoute.routeStops.length} stops)</span>
                )}
              </div>
            )}
            
            {hasInboundRoute && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-700">Inbound:</span> {formData.inboundRoute.startStopName} → {formData.inboundRoute.endStopName}
                {formData.inboundRoute.routeStops.length > 0 && (
                  <span className="text-gray-500"> (+{formData.inboundRoute.routeStops.length} stops)</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-500 space-y-1 mt-4">
          <p>• Use Google Maps, Leaflet, or Mapbox</p>
          <p>• Show route paths with start/end markers</p>
          <p>• Display all intermediate stops</p>
          <p>• Add route distance calculation</p>
        </div>
      </div>
    </div>
  );
}