'use client';

import {
  Calendar,
  MapPin,
  Clock,
  Bus,
  FileText,
  Navigation,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { OperatorTrip, TripStatus } from '@/data/operator/trips';

interface TripOverviewCardProps {
  trip: OperatorTrip;
}

const STATUS_CONFIG: Record<TripStatus, { label: string; icon: React.ReactNode; badge: string }> = {
  PENDING:   { label: 'Pending',   icon: <Clock className="w-4 h-4" />,         badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ACTIVE:    { label: 'Active',    icon: <CheckCircle className="w-4 h-4" />,    badge: 'bg-green-100 text-green-800 border-green-200' },
  IN_TRANSIT:{ label: 'In Transit',icon: <Navigation className="w-4 h-4" />,     badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  BOARDING:  { label: 'Boarding',  icon: <Navigation className="w-4 h-4" />,     badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  DEPARTED:  { label: 'Departed',  icon: <Navigation className="w-4 h-4" />,     badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: 'Completed', icon: <CheckCircle className="w-4 h-4" />,    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-4 h-4" />,        badge: 'bg-red-100 text-red-800 border-red-200' },
  DELAYED:   { label: 'Delayed',   icon: <AlertTriangle className="w-4 h-4" />,  badge: 'bg-amber-100 text-amber-800 border-amber-200' },
};

function formatDate(d?: string) {
  if (!d) return 'Not set';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return d; }
}

function formatTime(t?: string) {
  if (!t) return '—';
  try {
    const part = t.includes('T') ? t.split('T')[1] : t;
    const [h, m] = part.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  } catch { return t; }
}

export function TripOverviewCard({ trip }: TripOverviewCardProps) {
  const statusCfg = STATUS_CONFIG[trip.status] ?? {
    label: trip.status,
    icon: <Clock className="w-4 h-4" />,
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{trip.routeName}</h2>
          <p className="text-sm text-gray-500">
            Trip {trip.tripNumber ?? trip.id} &middot; Route {trip.routeNumber}
          </p>
        </div>
        <span
          className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusCfg.badge}`}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      {/* Key info grid */}
      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
        {/* Date */}
        <div className="flex items-start gap-3 col-span-2 sm:col-span-1">
          <Calendar className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Trip Date</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(trip.tripDate)}</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 col-span-2 sm:col-span-1">
          <MapPin className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Origin → Destination</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {trip.routeOrigin} &rarr; {trip.routeDestination}
            </p>
          </div>
        </div>

        {/* Departure */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Departure</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {formatTime(trip.scheduledDepartureTime)}
            </p>
            {trip.actualDepartureTime && (
              <p className="text-xs text-amber-600">Actual: {formatTime(trip.actualDepartureTime)}</p>
            )}
          </div>
        </div>

        {/* Arrival */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Arrival</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {formatTime(trip.scheduledArrivalTime)}
            </p>
            {trip.actualArrivalTime && (
              <p className="text-xs text-emerald-600">Actual: {formatTime(trip.actualArrivalTime)}</p>
            )}
          </div>
        </div>

        {/* Bus */}
        <div className="flex items-start gap-3">
          <Bus className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bus</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {trip.busRegistrationNumber ?? 'Not Assigned'}
            </p>
            {trip.busServiceType && (
              <p className="text-xs text-gray-500">{trip.busServiceType}</p>
            )}
          </div>
        </div>

        {/* Permit */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Permit</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{trip.permitNumber}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3 col-span-2">
          <Navigation className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Schedule</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{trip.scheduleName}</p>
          </div>
        </div>
      </div>

      {/* Notes banner */}
      {trip.notes && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100 flex items-start gap-2">
          <FileText className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">{trip.notes}</p>
        </div>
      )}

      {/* Cancellation reason */}
      {trip.cancellationReason && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-medium">Cancellation reason:</span> {trip.cancellationReason}
          </p>
        </div>
      )}
    </div>
  );
}
