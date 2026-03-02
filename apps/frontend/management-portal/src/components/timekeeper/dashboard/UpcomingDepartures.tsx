'use client';

import { 
  Clock, 
  Bus, 
  MapPin,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TripSchedule } from '@/data/timekeeper/types';

interface UpcomingDeparturesProps {
  departures: TripSchedule[];
  title?: string;
  className?: string;
}

function getStatusBadge(status: TripSchedule['status']) {
  switch (status) {
    case 'boarding':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Boarding</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Scheduled</Badge>;
    case 'delayed':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Delayed</Badge>;
    case 'departed':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Departed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: TripSchedule['status']) {
  switch (status) {
    case 'boarding':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'delayed':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'departed':
      return <ArrowRight className="h-4 w-4 text-purple-600" />;
    default:
      return <Clock className="h-4 w-4 text-blue-600" />;
  }
}

export function UpcomingDepartures({ 
  departures, 
  title = 'Upcoming Departures',
  className = '' 
}: UpcomingDeparturesProps) {
  if (departures.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Bus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No upcoming departures</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {departures.map((departure) => (
            <div 
              key={departure.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm border">
                  {getStatusIcon(departure.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{departure.routeName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bus className="h-3 w-3" />
                    <span>{departure.busNumber}</span>
                    {departure.platform && (
                      <>
                        <span className="text-gray-300">|</span>
                        <MapPin className="h-3 w-3" />
                        <span>Platform {departure.platform}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="font-semibold text-gray-900">{departure.scheduledTime}</span>
                  {departure.scheduledTime !== departure.estimatedTime && (
                    <span className="text-sm text-yellow-600">
                      → {departure.estimatedTime}
                    </span>
                  )}
                </div>
                {getStatusBadge(departure.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
