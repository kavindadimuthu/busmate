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
  COMPLETED:   { label: 'Completed',   icon: <CheckCircle  className="w-3.5 h-3.5" />, classes: 'bg-green-100 text-green-800 border-green-200' },
  IN_PROGRESS: { label: 'In Progress', icon: <Navigation   className="w-3.5 h-3.5" />, classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  SCHEDULED:   { label: 'Scheduled',   icon: <Clock        className="w-3.5 h-3.5" />, classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle      className="w-3.5 h-3.5" />, classes: 'bg-gray-100 text-gray-500 border-gray-200' },
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
          { label: 'Total Trips',   value: trips.length,                       cls: 'bg-gray-50 border-gray-200' },
          { label: 'Completed',     value: completed.length,                   cls: 'bg-green-50 border-green-200' },
          { label: 'Total Revenue', value: totalRevenue > 0 ? `LKR ${totalRevenue.toLocaleString()}` : '—', cls: 'bg-blue-50 border-blue-200' },
          { label: 'Passengers',    value: totalPax > 0 ? totalPax.toLocaleString() : '—',                  cls: 'bg-purple-50 border-purple-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-xl font-bold text-gray-900 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Date {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
          <Route className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No trips match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => {
            const sm = STATUS_META[trip.status];
            const dur = duration(trip.departureTime, trip.arrivalTime);
            return (
              <div key={trip.tripId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Route info */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{trip.routeName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
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
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Dep: {formatDateTime(trip.departureTime)}
                  </span>
                  {trip.arrivalTime && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
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
                    <span className="flex items-center gap-1 text-green-700 font-medium">
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

      <p className="text-xs text-gray-400">
        Showing the {trips.length} most recent trip records. Full trip history will be available once the trip management API is integrated.
      </p>
    </div>
  );
}
