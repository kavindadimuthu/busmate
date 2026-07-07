'use client';

import { 
  MapPin, 
  Bus, 
  Route,
  Building,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@busmate/ui';
import { AssignedStop } from '@/data/timekeeper/types';

interface AssignedStopInfoProps {
  stop: AssignedStop;
  busesAtStop?: number;
  className?: string;
}

export function AssignedStopInfo({ stop, busesAtStop = 0, className = '' }: AssignedStopInfoProps) {
  const getStopTypeBadge = (type: AssignedStop['type']) => {
    switch (type) {
      case 'terminal':
        return <Badge className="bg-primary/15 text-primary">Terminal</Badge>;
      case 'depot':
        return <Badge className="bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]">Depot</Badge>;
      case 'intermediate':
        return <Badge className="bg-muted text-foreground">Intermediate</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Assigned Bus Stop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stop Name and Type */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{stop.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building className="h-3 w-3" />
                Code: {stop.code}
              </p>
            </div>
            {getStopTypeBadge(stop.type)}
          </div>

          {/* Address */}
          {stop.address && (
            <p className="text-sm text-muted-foreground">{stop.address}</p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <Bus className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-primary">{busesAtStop}</p>
              <p className="text-xs text-primary">Buses at Stop</p>
            </div>
            <div className="bg-[hsl(var(--purple-50))] rounded-lg p-3 text-center">
              <Route className="h-5 w-5 mx-auto text-[hsl(var(--purple-600))] mb-1" />
              <p className="text-2xl font-bold text-[hsl(var(--purple-900))]">{stop.routes?.length || 0}</p>
              <p className="text-xs text-[hsl(var(--purple-700))]">Active Routes</p>
            </div>
          </div>

          {/* Routes */}
          {stop.routes && stop.routes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Routes Serving This Stop</p>
              <div className="flex flex-wrap gap-1">
                {stop.routes.slice(0, 8).map((route) => (
                  <Badge key={route} variant="outline" className="text-xs">
                    {route}
                  </Badge>
                ))}
                {stop.routes.length > 8 && (
                  <Badge variant="outline" className="text-xs bg-muted">
                    +{stop.routes.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Facilities */}
          {stop.facilities && stop.facilities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Facilities</p>
              <div className="flex flex-wrap gap-1">
                {stop.facilities.map((facility) => (
                  <Badge key={facility} className="text-xs bg-success/15 text-success">
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
