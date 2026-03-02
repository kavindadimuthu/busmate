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
import { BusAttendance } from '@/data/timekeeper/types';

interface BusAttendanceTableProps {
  attendance: BusAttendance[];
  onRecordArrival?: (busId: string) => void;
  onRecordDeparture?: (busId: string) => void;
  className?: string;
}

function getStatusBadge(status: BusAttendance['status']) {
  switch (status) {
    case 'arrived':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Arrived
        </Badge>
      );
    case 'departed':
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          <ArrowRight className="h-3 w-3 mr-1" />
          Departed
        </Badge>
      );
    case 'delayed':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Delayed
        </Badge>
      );
    case 'missed':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Missed
        </Badge>
      );
    case 'expected':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          Expected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function BusAttendanceTable({ 
  attendance, 
  onRecordArrival,
  onRecordDeparture,
  className = '' 
}: BusAttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter attendance records
  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch = 
      record.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.routeName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            Bus Attendance
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bus/driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="expected">Expected</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Driver / Conductor</TableHead>
                <TableHead>Scheduled Arrival</TableHead>
                <TableHead>Actual Arrival</TableHead>
                <TableHead>Scheduled Departure</TableHead>
                <TableHead>Status</TableHead>
                {(onRecordArrival || onRecordDeparture) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(onRecordArrival || onRecordDeparture) ? 8 : 7} className="text-center py-8 text-gray-500">
                    No bus attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bus className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{record.busNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.routeName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Route className="h-3 w-3 text-gray-500" />
                          <span className="max-w-[150px] truncate">{record.routeName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.driverName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span>{record.driverName}</span>
                          </div>
                        )}
                        {record.conductorName && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <User className="h-3 w-3 text-gray-300" />
                            <span>{record.conductorName}</span>
                          </div>
                        )}
                        {!record.driverName && !record.conductorName && (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{record.scheduledArrivalTime}</span>
                    </TableCell>
                    <TableCell>
                      {record.actualArrivalTime ? (
                        <span className="font-mono text-sm">{record.actualArrivalTime}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{record.scheduledDepartureTime}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    {(onRecordArrival || onRecordDeparture) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onRecordArrival && record.status === 'expected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => onRecordArrival(record.busId)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Arrived
                            </Button>
                          )}
                          {onRecordDeparture && (record.status === 'arrived' || record.status === 'delayed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => onRecordDeparture(record.busId)}
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Depart
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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
