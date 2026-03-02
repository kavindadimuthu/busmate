'use client';

import { Calendar, Clock, CheckCircle } from 'lucide-react';
import type { OperatorTrip, OperatorTripSchedule } from '@/data/operator/trips';

interface TripScheduleTabProps {
  trip: OperatorTrip;
  schedule?: OperatorTripSchedule | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDate(d?: string) {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return d; }
}

function formatTime(t?: string) {
  if (!t) return '—';
  try {
    const part = t.includes('T') ? t.split('T')[1] : t;
    return new Date(`1970-01-01T${part}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return t; }
}

function StatusBadge({ status }: { status?: string }) {
  const cfgs: Record<string, string> = {
    ACTIVE:    'bg-green-100 text-green-800',
    INACTIVE:  'bg-gray-100 text-gray-700',
    DRAFT:     'bg-yellow-100 text-yellow-800',
    SUSPENDED: 'bg-red-100 text-red-700',
  };
  const cls = cfgs[status ?? ''] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status ?? 'Unknown'}
    </span>
  );
}

export function TripScheduleTab({ trip, schedule }: TripScheduleTabProps) {
  if (!schedule) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-1">No Schedule Information</h3>
        <p className="text-sm text-gray-500">Schedule details are not available for this trip.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">{schedule.name}</h3>
          <StatusBadge status={schedule.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {/* Departure time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Scheduled Departure</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatTime(schedule.scheduledDepartureTime)}
              </p>
            </div>
          </div>

          {/* Arrival time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Scheduled Arrival</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatTime(schedule.scheduledArrivalTime)}
              </p>
            </div>
          </div>

          {/* Effective dates */}
          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
            <Calendar className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Effective Period</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatDate(schedule.effectiveFrom)}
                {schedule.effectiveTo ? ` → ${formatDate(schedule.effectiveTo)}` : ' (ongoing)'}
              </p>
            </div>
          </div>
        </div>

        {schedule.description && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
            {schedule.description}
          </p>
        )}
      </div>

      {/* Operating days */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Operating Days</h3>
        <div className="flex gap-2 flex-wrap">
          {DAY_SHORT.map((short, idx) => {
            const active = schedule.operatingDays.includes(idx);
            return (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
                title={DAY_NAMES[idx]}
              >
                {short}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Operates on:{' '}
          <span className="font-medium text-gray-700">
            {schedule.operatingDays
              .sort()
              .map((d) => DAY_NAMES[d])
              .join(', ')}
          </span>
        </p>
      </div>

      {/* This trip's actual times */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Actual Times for This Trip
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Departure</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Scheduled</span>
                <span className="text-xs font-medium text-gray-800">
                  {formatTime(trip.scheduledDepartureTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Actual</span>
                <span className="text-xs font-medium text-emerald-700">
                  {trip.actualDepartureTime ? formatTime(trip.actualDepartureTime) : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Arrival</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Scheduled</span>
                <span className="text-xs font-medium text-gray-800">
                  {formatTime(trip.scheduledArrivalTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Actual</span>
                <span className="text-xs font-medium text-emerald-700">
                  {trip.actualArrivalTime ? formatTime(trip.actualArrivalTime) : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Actual times are recorded automatically by the system when drivers depart and arrive.</span>
        </div>
      </div>
    </div>
  );
}
