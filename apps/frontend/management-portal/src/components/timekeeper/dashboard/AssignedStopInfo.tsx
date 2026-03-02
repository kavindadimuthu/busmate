'use client';

import { 
  MapPin, 
  Bus, 
  Route,
  Building,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        return <Badge className="bg-blue-100 text-blue-800">Terminal</Badge>;
      case 'depot':
        return <Badge className="bg-purple-100 text-purple-800">Depot</Badge>;
      case 'intermediate':
        return <Badge className="bg-gray-100 text-gray-800">Intermediate</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Assigned Bus Stop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stop Name and Type */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{stop.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building className="h-3 w-3" />
                Code: {stop.code}
              </p>
            </div>
            {getStopTypeBadge(stop.type)}
          </div>

          {/* Address */}
          {stop.address && (
            <p className="text-sm text-gray-600">{stop.address}</p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Bus className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-blue-900">{busesAtStop}</p>
              <p className="text-xs text-blue-700">Buses at Stop</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Route className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <p className="text-2xl font-bold text-purple-900">{stop.routes?.length || 0}</p>
              <p className="text-xs text-purple-700">Active Routes</p>
            </div>
          </div>

          {/* Routes */}
          {stop.routes && stop.routes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Routes Serving This Stop</p>
              <div className="flex flex-wrap gap-1">
                {stop.routes.slice(0, 8).map((route) => (
                  <Badge key={route} variant="outline" className="text-xs">
                    {route}
                  </Badge>
                ))}
                {stop.routes.length > 8 && (
                  <Badge variant="outline" className="text-xs bg-gray-100">
                    +{stop.routes.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Facilities */}
          {stop.facilities && stop.facilities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Facilities</p>
              <div className="flex flex-wrap gap-1">
                {stop.facilities.map((facility) => (
                  <Badge key={facility} className="text-xs bg-green-100 text-green-800">
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
