'use client';

import { useState } from 'react';
import { 
  Bus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ArrowRight,
  User,
  Route,
  MapPin,
  Play,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trip, TripStatus } from '@/data/timekeeper/types';

interface TripsTableProps {
  trips: Trip[];
  routes?: Array<{ id: string; name: string; number?: string }>;
  onViewTrip?: (tripId: string) => void;
  onStartBoarding?: (tripId: string) => void;
  onRecordDeparture?: (tripId: string) => void;
  onUpdateStatus?: (tripId: string, status: TripStatus) => void;
  className?: string;
}

function getStatusBadge(status: TripStatus) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    case 'boarding':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Boarding
        </Badge>
      );
    case 'departed':
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          <ArrowRight className="h-3 w-3 mr-1" />
          Departed
        </Badge>
      );
    case 'in_transit':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Bus className="h-3 w-3 mr-1" />
          In Transit
        </Badge>
      );
    case 'arrived':
      return (
        <Badge className="bg-teal-100 text-teal-800 border-teal-300">
          <MapPin className="h-3 w-3 mr-1" />
          Arrived
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'delayed':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Delayed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function TripsTable({ 
  trips, 
  routes = [],
  onViewTrip,
  onStartBoarding,
  onRecordDeparture,
  onUpdateStatus,
  className = '' 
}: TripsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = 
      trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesRoute = routeFilter === 'all' || trip.routeId === routeFilter;

    return matchesSearch && matchesStatus && matchesRoute;
  });

  const canStartBoarding = (status: TripStatus) => status === 'scheduled';
  const canDepart = (status: TripStatus) => status === 'boarding' || status === 'delayed';

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            Trip Schedule
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="boarding">Boarding</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Route Filter */}
            {routes.length > 0 && (
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.number ? `${route.number} - ` : ''}{route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip #</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No trips found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{trip.tripNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Route className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">{trip.routeNumber || ''}</span>
                        <span className="text-gray-500 text-sm max-w-[120px] truncate">
                          {trip.routeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Bus className="h-3 w-3 text-gray-500" />
                        <span>{trip.busNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {trip.driverName ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span>{trip.driverName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{trip.scheduledDepartureTime}</span>
                    </TableCell>
                    <TableCell>
                      {trip.actualDepartureTime ? (
                        <span className="font-mono text-sm">{trip.actualDepartureTime}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewTrip && (
                            <DropdownMenuItem onClick={() => onViewTrip(trip.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onStartBoarding && canStartBoarding(trip.status) && (
                            <DropdownMenuItem onClick={() => onStartBoarding(trip.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Start Boarding
                            </DropdownMenuItem>
                          )}
                          {onRecordDeparture && canDepart(trip.status) && (
                            <DropdownMenuItem onClick={() => onRecordDeparture(trip.id)}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Record Departure
                            </DropdownMenuItem>
                          )}
                          {onUpdateStatus && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onUpdateStatus(trip.id, 'delayed')}
                                className="text-yellow-600"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Mark as Delayed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onUpdateStatus(trip.id, 'cancelled')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Trip
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
