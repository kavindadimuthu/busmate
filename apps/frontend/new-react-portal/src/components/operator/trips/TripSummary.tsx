'use client';

import * as React from 'react';
import { Calendar, MapPin, Clock, Bus, FileText, Navigation, CheckCircle, XCircle, AlertTriangle, Users } from 'lucide-react';
import type { TripResponse } from '@busmate/api-client-route';

interface TripSummaryProps {
  trip: TripResponse;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-4 h-4" />, badge: 'bg-warning/15 text-warning border-warning/20' },
  active: { label: 'Active', icon: <CheckCircle className="w-4 h-4" />, badge: 'bg-success/15 text-success border-success/20' },
  boarding: { label: 'Boarding', icon: <Users className="w-4 h-4" />, badge: 'bg-primary/15 text-primary border-primary/20' },
  in_transit: { label: 'In Transit', icon: <Navigation className="w-4 h-4" />, badge: 'bg-primary/15 text-primary border-primary/20' },
  departed: { label: 'Departed', icon: <Navigation className="w-4 h-4" />, badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  delayed: { label: 'Delayed', icon: <AlertTriangle className="w-4 h-4" />, badge: 'bg-warning/15 text-warning border-warning/20' },
  completed: { label: 'Completed', icon: <CheckCircle className="w-4 h-4" />, badge: 'bg-success/15 text-success border-success/20' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-4 h-4" />, badge: 'bg-destructive/15 text-destructive border-destructive/20' },
};

function formatDate(d?: string) {
  if (!d) return 'Not set';
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

function formatTime(t?: string) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function TripSummary({ trip }: TripSummaryProps) {
  const statusCfg = STATUS_CONFIG[trip.status ?? ''] ?? {
    label: trip.status ?? 'Unknown',
    icon: <Clock className="w-4 h-4" />,
    badge: 'bg-muted text-foreground/80 border-border',
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{trip.routeName ?? 'Route'}</h2>
          <p className="text-sm text-muted-foreground">{trip.scheduleName ?? 'Schedule'}</p>
        </div>
        <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusCfg.badge}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
        <div className="flex items-start gap-3 col-span-2 sm:col-span-1">
          <Calendar className="w-5 h-5 text-primary/80 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trip Date</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(trip.tripDate)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 col-span-2 sm:col-span-1">
          <MapPin className="w-5 h-5 text-destructive/70 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Route</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{trip.routeName ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Departure</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{formatTime(trip.scheduledDepartureTime)}</p>
            {trip.actualDepartureTime && (
              <p className="text-xs text-warning">Actual: {formatTime(trip.actualDepartureTime)}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-success/80 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Arrival</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{formatTime(trip.scheduledArrivalTime)}</p>
            {trip.actualArrivalTime && (
              <p className="text-xs text-success">Actual: {formatTime(trip.actualArrivalTime)}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Bus className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bus</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{trip.busPlateNumber ?? 'Not Assigned'}</p>
            {trip.busModel && <p className="text-xs text-muted-foreground">{trip.busModel}</p>}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Permit</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{trip.permitNumber ?? 'Not assigned'}</p>
          </div>
        </div>
      </div>

      {trip.notes && (
        <div className="px-6 py-3 bg-warning/10 border-t border-yellow-100 flex items-start gap-2">
          <FileText className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-warning">{trip.notes}</p>
        </div>
      )}
    </div>
  );
}
