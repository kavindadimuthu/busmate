'use client';

import { useState } from 'react';
import { 
  User,
  Bus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarOff,
  Search,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@busmate/ui';
import { StaffAttendance, AttendanceStatus, StaffRole } from '@/data/timekeeper/types';

interface StaffAttendanceTableProps {
  attendance: StaffAttendance[];
  onMarkAttendance?: (staffId: string, status: AttendanceStatus, notes?: string) => void;
  className?: string;
}

function getStatusBadge(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return (
        <Badge className="bg-success/15 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Present
        </Badge>
      );
    case 'absent':
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          Absent
        </Badge>
      );
    case 'late':
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Late
        </Badge>
      );
    case 'on_leave':
      return (
        <Badge className="bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))] border-purple-300">
          <CalendarOff className="h-3 w-3 mr-1" />
          On Leave
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getRoleBadge(role: StaffRole) {
  switch (role) {
    case 'driver':
      return <Badge variant="outline" className="bg-primary/10 text-primary">Driver</Badge>;
    case 'conductor':
      return <Badge variant="outline" className="bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))]">Conductor</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export function StaffAttendanceTable({ 
  attendance, 
  onMarkAttendance,
  className = '' 
}: StaffAttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filter attendance records
  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch = 
      record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.staffId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesRole = roleFilter === 'all' || record.staffRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Staff Attendance
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                placeholder="Search staff..."
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
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="conductor">Conductor</SelectItem>
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
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bus Assignment</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                {onMarkAttendance && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onMarkAttendance ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{record.staffName}</p>
                          <p className="text-xs text-muted-foreground">{record.staffId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(record.staffRole)}</TableCell>
                    <TableCell>
                      {record.busNumber ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Bus className="h-3 w-3 text-muted-foreground" />
                          {record.busNumber}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/70">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkInTime ? (
                        <span className="font-mono text-sm">{record.checkInTime}</span>
                      ) : (
                        <span className="text-muted-foreground/70">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
                        {record.notes || '-'}
                      </span>
                    </TableCell>
                    {onMarkAttendance && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {record.status !== 'present' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-success hover:text-success hover:bg-success/10"
                              onClick={() => onMarkAttendance(record.staffId, 'present')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {record.status !== 'absent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onMarkAttendance(record.staffId, 'absent')}
                            >
                              <XCircle className="h-4 w-4" />
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
