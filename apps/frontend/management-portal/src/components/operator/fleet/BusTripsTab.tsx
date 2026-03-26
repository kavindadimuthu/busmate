'use client';

import React, { useState } from 'react';
import {
  Route, CheckCircle, XCircle, Clock, AlertCircle, Navigation,
  DollarSign, Users, Calendar, ChevronUp, ChevronDown, Filter,
} from 'lucide-react';
import type { OperatorBus, TripRecord } from '@/data/operator/buses';

interface BusTripsTabProps {
  bus: OperatorBus;
}

type TripStatus = TripRecord['status'];

const STATUS_META: Record<TripStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  COMPLETED:   { label: 'Completed',   icon: <CheckCircle  className="w-3.5 h-3.5" />, classes: 'bg-success/15 text-success border-success/20' },
  IN_PROGRESS: { label: 'In Progress', icon: <Navigation   className="w-3.5 h-3.5" />, classes: 'bg-primary/15 text-primary border-primary/20' },
  SCHEDULED:   { label: 'Scheduled',   icon: <Clock        className="w-3.5 h-3.5" />, classes: 'bg-warning/15 text-warning border-warning/20' },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle      className="w-3.5 h-3.5" />, classes: 'bg-muted text-muted-foreground border-border' },
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-LK', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function duration(dep?: string, arr?: string) {
  if (!dep || !arr) return null;
  try {
    const mins = Math.round((new Date(arr).getTime() - new Date(dep).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } catch { return null; }
}

export function BusTripsTab({ bus }: BusTripsTabProps) {
  const [filter, setFilter] = useState<TripStatus | 'ALL'>('ALL');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const trips = bus.recentTrips;

  const filtered = (filter === 'ALL' ? trips : trips.filter(t => t.status === filter))
    .slice()
    .sort((a, b) => {
      const diff = new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });

  const completed    = trips.filter(t => t.status === 'COMPLETED');
  const totalRevenue = completed.reduce((a, t) => a + (t.revenue ?? 0), 0);
  const totalPax     = completed.reduce((a, t) => a + (t.passengerCount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Trips',   value: trips.length,                       cls: 'bg-muted border-border' },
          { label: 'Completed',     value: completed.length,                   cls: 'bg-success/10 border-success/20' },
          { label: 'Total Revenue', value: totalRevenue > 0 ? `LKR ${totalRevenue.toLocaleString()}` : '—', cls: 'bg-primary/10 border-primary/20' },
          { label: 'Passengers',    value: totalPax > 0 ? totalPax.toLocaleString() : '—',                  cls: 'bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-200))]' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Date {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
          <Route className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No trips match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => {
            const sm = STATUS_META[trip.status];
            const dur = duration(trip.departureTime, trip.arrivalTime);
            return (
              <div key={trip.tripId} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Route info */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{trip.routeName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {trip.origin} → {trip.destination}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${sm.classes}`}>
                    {sm.icon}
                    {sm.label}
                  </span>
                </div>

                {/* Details row */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Dep: {formatDateTime(trip.departureTime)}
                  </span>
                  {trip.arrivalTime && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-success/80" />
                      Arr: {formatDateTime(trip.arrivalTime)}
                    </span>
                  )}
                  {dur && <span>Duration: {dur}</span>}
                  {trip.passengerCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {trip.passengerCount} pax
                    </span>
                  )}
                  {trip.revenue !== undefined && (
                    <span className="flex items-center gap-1 text-success font-medium">
                      <DollarSign className="w-3.5 h-3.5" />
                      LKR {trip.revenue.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground/70">
        Showing the {trips.length} most recent trip records. Full trip history will be available once the trip management API is integrated.
      </p>
    </div>
  );
}
