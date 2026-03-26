'use client';

import React from 'react';
import {
  MapPin, Wifi, WifiOff, Navigation, Clock, Gauge, Activity, ExternalLink,
} from 'lucide-react';
import type { OperatorBus } from '@/data/operator/buses';

interface BusLocationTabProps {
  bus: OperatorBus;
}

function formatDateTime(iso?: string) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleString('en-LK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export function BusLocationTab({ bus }: BusLocationTabProps) {
  const loc = bus.location;

  if (!loc) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
        <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground/80 mb-1">No Location Data</h3>
        <p className="text-sm text-muted-foreground">
          Live location tracking is not available for this bus. GPS unit may be offline or not installed.
        </p>
      </div>
    );
  }

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.lastKnownLat},${loc.lastKnownLng}`;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        loc.isOnline ? 'bg-success/10 border-success/20 text-success' : 'bg-muted border-border text-muted-foreground'
      }`}>
        {loc.isOnline
          ? <><Wifi     className="w-5 h-5 text-success" /><span className="text-sm font-medium">GPS Online – Real-time tracking active</span></>
          : <><WifiOff  className="w-5 h-5 text-muted-foreground/70" /><span className="text-sm font-medium">GPS Offline – Showing last known location</span></>
        }
        <span className="ml-auto text-xs opacity-70">Updated: {formatDateTime(loc.lastUpdated)}</span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Gauge       className="w-4 h-4 text-primary/80" />,   label: 'Current Speed', value: `${loc.currentSpeed} km/h`  },
          { icon: <Navigation  className="w-4 h-4 text-purple-500" />, label: 'Heading',       value: `${loc.heading}°`           },
          { icon: <MapPin      className="w-4 h-4 text-destructive/80" />,    label: 'Latitude',      value: loc.lastKnownLat.toFixed(5)  },
          { icon: <MapPin      className="w-4 h-4 text-destructive/80" />,    label: 'Longitude',     value: loc.lastKnownLng.toFixed(5)  },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-base font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-destructive/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground/70 mb-0.5">Last Known Address</p>
              <p className="text-sm font-semibold text-foreground">{loc.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {loc.lastKnownLat.toFixed(6)}, {loc.lastKnownLng.toFixed(6)}
              </p>
            </div>
          </div>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Maps
          </a>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/50 bg-muted">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Live Map</h3>
          <span className="ml-auto text-xs text-muted-foreground/70">Map integration coming soon</span>
        </div>
        <div
          className="relative flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50"
          style={{ height: 320 }}
        >
          {/* Simulated map tiles */}
          <div className="absolute inset-0 opacity-20 grid grid-cols-6 grid-rows-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={`border border-border ${i % 3 === 0 ? 'bg-primary/15' : i % 5 === 0 ? 'bg-success/15' : ''}`} />
            ))}
          </div>

          {/* Bus pin */}
          <div className="relative flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-blue-200 animate-pulse">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div className="mt-2 px-3 py-1 bg-card border border-border rounded-full text-xs font-semibold text-foreground shadow-sm">
              {bus.plateNumber}
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center max-w-[200px]">
              {loc.address}
            </p>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/50 bg-muted">
          <p className="text-xs text-muted-foreground">
            An interactive map will display the real-time route and stops once the mapping integration is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
