'use client';

import { 
  Bus,
  Clock,
  User,
  Route,
  MapPin,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trip, TripStatus } from '@/data/timekeeper/types';

interface TripDetailModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onStartBoarding?: (tripId: string) => void;
  onRecordDeparture?: (tripId: string, passengerCount?: number) => void;
  onUpdateStatus?: (tripId: string, status: TripStatus) => void;
}

function getStatusBadge(status: TripStatus) {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-gray-100 text-gray-800">Scheduled</Badge>;
    case 'boarding':
      return <Badge className="bg-green-100 text-green-800">Boarding</Badge>;
    case 'departed':
      return <Badge className="bg-purple-100 text-purple-800">Departed</Badge>;
    case 'in_transit':
      return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'delayed':
      return <Badge className="bg-yellow-100 text-yellow-800">Delayed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function TripDetailModal({ 
  trip, 
  isOpen, 
  onClose,
  onStartBoarding,
  onRecordDeparture,
  onUpdateStatus,
}: TripDetailModalProps) {
  if (!isOpen) return null;

  const canStartBoarding = trip.status === 'scheduled';
  const canDepart = trip.status === 'boarding' || trip.status === 'delayed';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-600" />
                Trip Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {trip.tripNumber}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status and Route */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4 text-gray-500" />
                  {trip.routeNumber && <span className="text-blue-600">{trip.routeNumber}</span>}
                  {trip.routeName}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.departureStopName}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{trip.arrivalStopName}</span>
                </div>
              </div>
              {getStatusBadge(trip.status)}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
                <p className="font-semibold">{trip.date}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="h-4 w-4" />
                  Scheduled Departure
                </div>
                <p className="font-semibold">{trip.scheduledDepartureTime}</p>
                {trip.actualDepartureTime && (
                  <p className="text-sm text-gray-500">
                    Actual: {trip.actualDepartureTime}
                  </p>
                )}
              </div>
            </div>

            {/* Bus and Staff */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                  <Bus className="h-4 w-4" />
                  Bus
                </div>
                <p className="font-semibold">{trip.busNumber}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                  <User className="h-4 w-4" />
                  Driver
                </div>
                <p className="font-semibold">{trip.driverName || 'Not assigned'}</p>
                {trip.conductorName && (
                  <p className="text-sm text-gray-500">
                    Conductor: {trip.conductorName}
                  </p>
                )}
              </div>
            </div>

            {/* Passenger Count */}
            {trip.passengerCount !== undefined && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                  <User className="h-4 w-4" />
                  Passengers
                </div>
                <p className="font-semibold">{trip.passengerCount}</p>
              </div>
            )}

            {/* Notes */}
            {trip.notes && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-700 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Notes
                </div>
                <p className="text-sm">{trip.notes}</p>
              </div>
            )}

            {/* Delay Reason */}
            {trip.delayReason && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Delay Reason
                </div>
                <p className="text-sm">{trip.delayReason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 p-6 border-t bg-gray-50">
            {onStartBoarding && canStartBoarding && (
              <Button 
                onClick={() => onStartBoarding(trip.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Start Boarding
              </Button>
            )}
            {onRecordDeparture && canDepart && (
              <Button 
                onClick={() => onRecordDeparture(trip.id)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Record Departure
              </Button>
            )}
            {onUpdateStatus && trip.status !== 'cancelled' && trip.status !== 'completed' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => onUpdateStatus(trip.id, 'delayed')}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Mark Delayed
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onUpdateStatus(trip.id, 'cancelled')}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
