'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions, usePageContext } from '@/context/PageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, RefreshCw, Users, Bus } from 'lucide-react';
import {
  AttendanceStatsCards,
  BusAttendanceStatsCards,
  StaffAttendanceTable,
  BusAttendanceTable,
} from '@/components/timekeeper/attendance';
import {
  getStaffAttendanceStats,
  getBusAttendanceStats,
  getStaffAttendance,
  getBusAttendance,
  markStaffAttendance,
  recordBusArrival,
  recordBusDeparture,
  getAssignedStop,
} from '@/data/timekeeper';
import { 
  AttendanceStats, 
  BusAttendanceStats, 
  StaffAttendance, 
  BusAttendance,
  AttendanceStatus,
  AssignedStop,
} from '@/data/timekeeper/types';

export default function TimeKeeperAttendancePage() {
  const [activeTab, setActiveTab] = useState('staff');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [assignedStop, setAssignedStop] = useState<AssignedStop | null>(null);

  useSetPageMetadata({
    title: 'Attendance Management',
    description: 'Manage attendance for your assigned stop',
    activeItem: 'attendance',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Attendance' }],
  });

  const { setMetadata } = usePageContext();

  // Staff attendance state
  const [staffStats, setStaffStats] = useState<AttendanceStats | null>(null);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);

  // Bus attendance state
  const [busStats, setBusStats] = useState<BusAttendanceStats | null>(null);
  const [busAttendance, setBusAttendance] = useState<BusAttendance[]>([]);

  // Load data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get assigned stop
      const stop = getAssignedStop();
      setAssignedStop(stop);

      // Load staff attendance
      const staffStatsData = getStaffAttendanceStats(selectedDate);
      const staffData = getStaffAttendance({ date: selectedDate }, 0, 50);
      setStaffStats(staffStatsData);
      setStaffAttendance(staffData.content);

      // Load bus attendance
      const busStatsData = getBusAttendanceStats(selectedDate);
      const busData = getBusAttendance({ date: selectedDate }, 0, 50);
      setBusStats(busStatsData);
      setBusAttendance(busData.content);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update header description once assigned stop is known
  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Manage attendance for ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  // Refresh action in the content header
  useSetPageActions(
    <Button
      variant="outline"
      size="sm"
      onClick={loadData}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  // Staff attendance actions
  const handleMarkStaffAttendance = useCallback(
    (staffId: string, status: AttendanceStatus, notes?: string) => {
      const updated = markStaffAttendance(staffId, status, notes);
      if (updated) {
        // Refresh data
        loadData();
      }
    },
    [loadData]
  );

  // Bus attendance actions
  const handleRecordBusArrival = useCallback(
    (busId: string) => {
      const updated = recordBusArrival(busId);
      if (updated) {
        // Refresh data
        loadData();
      }
    },
    [loadData]
  );

  const handleRecordBusDeparture = useCallback(
    (busId: string) => {
      const updated = recordBusDeparture(busId);
      if (updated) {
        // Refresh data
        loadData();
      }
    },
    [loadData]
  );

  if (isLoading && !staffStats && !busStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

        {/* Tabs for Staff and Bus Attendance */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff Attendance
            </TabsTrigger>
            <TabsTrigger value="bus" className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Bus Attendance
            </TabsTrigger>
          </TabsList>

          {/* Staff Attendance Tab */}
          <TabsContent value="staff" className="space-y-6 mt-6">
            {staffStats && (
              <AttendanceStatsCards stats={staffStats} />
            )}
            <StaffAttendanceTable
              attendance={staffAttendance}
              onMarkAttendance={handleMarkStaffAttendance}
            />
          </TabsContent>

          {/* Bus Attendance Tab */}
          <TabsContent value="bus" className="space-y-6 mt-6">
            {busStats && (
              <BusAttendanceStatsCards stats={busStats} />
            )}
            <BusAttendanceTable
              attendance={busAttendance}
              onRecordArrival={handleRecordBusArrival}
              onRecordDeparture={handleRecordBusDeparture}
            />
          </TabsContent>
        </Tabs>
    </div>
  );
}
