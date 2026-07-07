'use client';

import { 
  Clock, 
  Bus, 
  MapPin,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@busmate/ui';
import { TripSchedule } from '@/data/timekeeper/types';

interface UpcomingDeparturesProps {
  departures: TripSchedule[];
  title?: string;
  className?: string;
}

function getStatusBadge(status: TripSchedule['status']) {
  switch (status) {
    case 'boarding':
      return <Badge className="bg-success/15 text-success border-success/30">Boarding</Badge>;
    case 'scheduled':
      return <Badge className="bg-primary/15 text-primary border-primary/30">Scheduled</Badge>;
    case 'delayed':
      return <Badge className="bg-warning/15 text-warning border-warning/30">Delayed</Badge>;
    case 'departed':
      return <Badge className="bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))] border-purple-300">Departed</Badge>;
    case 'cancelled':
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStatusIcon(status: TripSchedule['status']) {
  switch (status) {
    case 'boarding':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'delayed':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case 'departed':
      return <ArrowRight className="h-4 w-4 text-[hsl(var(--purple-600))]" />;
    default:
      return <Clock className="h-4 w-4 text-primary" />;
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
            <Clock className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
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
          <Clock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {departures.map((departure) => (
            <div 
              key={departure.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-card rounded-lg shadow-sm border">
                  {getStatusIcon(departure.status)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{departure.routeName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bus className="h-3 w-3" />
                    <span>{departure.busNumber}</span>
                    {departure.platform && (
                      <>
                        <span className="text-muted-foreground">|</span>
                        <MapPin className="h-3 w-3" />
                        <span>Platform {departure.platform}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="font-semibold text-foreground">{departure.scheduledTime}</span>
                  {departure.scheduledTime !== departure.estimatedTime && (
                    <span className="text-sm text-warning">
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
