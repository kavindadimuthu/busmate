'use client';

import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Navigation,
  Activity,
} from 'lucide-react';
import type { OperatorTrip, TripStatus } from '@/data/operator/trips';

interface TripStatusTabProps {
  trip: OperatorTrip;
}

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; icon: React.ReactNode; badge: string; bg: string }
> = {
  PENDING: {
    label: 'Pending',
    icon: <Clock className="w-5 h-5" />,
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bg: 'bg-yellow-50',
  },
  ACTIVE: {
    label: 'Active',
    icon: <CheckCircle className="w-5 h-5" />,
    badge: 'bg-green-100 text-green-800 border-green-200',
    bg: 'bg-green-50',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    icon: <Navigation className="w-5 h-5" />,
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bg: 'bg-blue-50',
  },
  BOARDING: {
    label: 'Boarding',
    icon: <Navigation className="w-5 h-5" />,
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    bg: 'bg-cyan-50',
  },
  DEPARTED: {
    label: 'Departed',
    icon: <Navigation className="w-5 h-5" />,
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bg: 'bg-indigo-50',
  },
  COMPLETED: {
    label: 'Completed',
    icon: <CheckCircle className="w-5 h-5" />,
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bg: 'bg-emerald-50',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="w-5 h-5" />,
    badge: 'bg-red-100 text-red-800 border-red-200',
    bg: 'bg-red-50',
  },
  DELAYED: {
    label: 'Delayed',
    icon: <AlertTriangle className="w-5 h-5" />,
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bg: 'bg-amber-50',
  },
};

function formatTime(t?: string) {
  if (!t) return '—';
  try {
    const part = t.includes('T') ? t.split('T')[1] : t;
    return new Date(`1970-01-01T${part}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return t; }
}

function formatDateTime(dt?: string) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return dt; }
}

function calcDelayMinutes(scheduled?: string, actual?: string): number | null {
  if (!scheduled || !actual) return null;
  try {
    const s = new Date(`1970-01-01T${scheduled}`).getTime();
    const a = new Date(`1970-01-01T${actual}`).getTime();
    return Math.round((a - s) / 60000);
  } catch { return null; }
}

export function TripStatusTab({ trip }: TripStatusTabProps) {
  const cfg = STATUS_CONFIG[trip.status] ?? {
    label: trip.status,
    icon: <Clock className="w-5 h-5" />,
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    bg: 'bg-gray-50',
  };

  const depDelay = calcDelayMinutes(trip.scheduledDepartureTime, trip.actualDepartureTime);
  const arrDelay = calcDelayMinutes(trip.scheduledArrivalTime, trip.actualArrivalTime);

  // Build a simple status history from available timestamps
  const history = [
    {
      status: 'PENDING' as TripStatus,
      timestamp: trip.createdAt,
      description: 'Trip created and scheduled',
    },
    trip.actualDepartureTime && {
      status: 'DEPARTED' as TripStatus,
      timestamp: trip.actualDepartureTime,
      description: 'Trip departed from origin',
    },
    trip.actualArrivalTime && {
      status: 'COMPLETED' as TripStatus,
      timestamp: trip.actualArrivalTime,
      description: 'Trip arrived at destination',
    },
    trip.status === 'CANCELLED' && trip.updatedAt && {
      status: 'CANCELLED' as TripStatus,
      timestamp: trip.updatedAt,
      description: trip.cancellationReason
        ? `Cancelled: ${trip.cancellationReason}`
        : 'Trip cancelled',
    },
    trip.status === 'DELAYED' && trip.updatedAt && {
      status: 'DELAYED' as TripStatus,
      timestamp: trip.updatedAt,
      description: trip.notes ?? 'Trip delayed',
    },
  ].filter(Boolean) as Array<{ status: TripStatus; timestamp: string; description: string }>;

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className={`${cfg.bg} border border-gray-200 rounded-xl p-6`}>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${cfg.badge}`}
          >
            {cfg.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Current Status</p>
            <p className="text-2xl font-bold text-gray-800">{cfg.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Last updated: {formatDateTime(trip.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Timing analysis */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Timing Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">Departure</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-medium">{formatTime(trip.scheduledDepartureTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Actual</span>
                <span className="text-sm font-medium text-emerald-700">
                  {trip.actualDepartureTime ? formatTime(trip.actualDepartureTime) : 'Not departed'}
                </span>
              </div>
              {depDelay !== null && (
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-sm text-gray-600">Variance</span>
                  <span
                    className={`text-sm font-semibold ${
                      depDelay > 0 ? 'text-red-600' : depDelay < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {depDelay > 0 ? `+${depDelay} min (late)` : depDelay < 0 ? `${depDelay} min (early)` : 'On time'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrival analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">Arrival</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-medium">{formatTime(trip.scheduledArrivalTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Actual</span>
                <span className="text-sm font-medium text-emerald-700">
                  {trip.actualArrivalTime ? formatTime(trip.actualArrivalTime) : 'Not arrived'}
                </span>
              </div>
              {arrDelay !== null && (
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-sm text-gray-600">Variance</span>
                  <span
                    className={`text-sm font-semibold ${
                      arrDelay > 0 ? 'text-red-600' : arrDelay < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {arrDelay > 0 ? `+${arrDelay} min (late)` : arrDelay < 0 ? `${arrDelay} min (early)` : 'On time'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-800">Status Timeline</h3>
        </div>
        <div className="px-6 py-4">
          <div className="relative">
            {history.map((event, idx) => {
              const evtCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.PENDING;
              return (
                <div key={idx} className="flex gap-4 pb-4 last:pb-0">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${evtCfg.badge}`}
                    >
                      <span className="w-4 h-4">{evtCfg.icon}</span>
                    </div>
                    {idx < history.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[20px]" />
                    )}
                  </div>
                  {/* Event content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm font-semibold text-gray-800">{evtCfg.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.timestamp)}</p>
                    <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes / cancellation */}
      {(trip.notes || trip.cancellationReason) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          {trip.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{trip.notes}</p>
            </div>
          )}
          {trip.cancellationReason && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                Cancellation Reason
              </p>
              <p className="text-sm text-red-700">{trip.cancellationReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
