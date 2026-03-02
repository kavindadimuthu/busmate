'use client';

import { Route, CheckCircle, Clock, XCircle, ChevronRight, CalendarDays } from 'lucide-react';
import type { AssignedTrip } from '@/data/operator/staff';

interface StaffAssignedTripsCardProps {
  trips: AssignedTrip[];
}

function TripStatusBadge({ status }: { status: AssignedTrip['tripStatus'] }) {
  const map = {
    SCHEDULED:   { label: 'Scheduled',   cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <CalendarDays className="w-3 h-3" /> },
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="w-3 h-3" /> },
    COMPLETED:   { label: 'Completed',   cls: 'bg-green-100 text-green-700 border-green-200',     icon: <CheckCircle className="w-3 h-3" /> },
    CANCELLED:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-700 border-red-200',           icon: <XCircle className="w-3 h-3" /> },
  } as const;
  const { label, cls, icon } = map[status] ?? map.SCHEDULED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

export function StaffAssignedTripsCard({ trips }: StaffAssignedTripsCardProps) {
  if (trips.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Route className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Recent & Upcoming Trips</h2>
        </div>
        <div className="p-10 text-center">
          <Route className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No trips found</p>
          <p className="text-xs text-gray-400 mt-1">This staff member has no recent trip records</p>
        </div>
      </div>
    );
  }

  // Sort: in-progress first, then scheduled, then completed/cancelled
  const order: Record<AssignedTrip['tripStatus'], number> = {
    IN_PROGRESS: 0, SCHEDULED: 1, COMPLETED: 2, CANCELLED: 3,
  };
  const sorted = [...trips].sort((a, b) => {
    const statusDiff = order[a.tripStatus] - order[b.tripStatus];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime();
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Recent & Upcoming Trips</h2>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{trips.length}</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {sorted.map(trip => (
          <div key={trip.tripId} className="px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 font-mono">{trip.routeNumber}</span>
                  <TripStatusBadge status={trip.tripStatus} />
                  <span className="text-xs text-gray-400">
                    {new Date(trip.tripDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900 mb-0.5">{trip.routeName}</p>

                {/* Origin → Destination */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                  <span>{trip.origin}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{trip.destination}</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>🕐 {trip.scheduledDeparture} → {trip.scheduledArrival}</span>
                  <span>🚌 {trip.busRegistration}</span>
                  <span>👤 {trip.partnerName} ({trip.partnerRole === 'DRIVER' ? 'Driver' : 'Conductor'})</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
