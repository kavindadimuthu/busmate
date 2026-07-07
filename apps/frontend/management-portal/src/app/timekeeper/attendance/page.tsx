'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Input } from '@busmate/ui';
import { Calendar, RefreshCw, Users, Bus } from 'lucide-react';
import {
  AttendanceStatsCards, BusAttendanceStatsCards,
  StaffAttendanceTable, BusAttendanceTable,
} from '@/components/timekeeper/attendance';
import { useTimeKeeperAttendance } from '@/hooks/timekeeper/attendance/useTimeKeeperAttendance';

export default function TimeKeeperAttendancePage() {
  const {
    activeTab, setActiveTab, selectedDate, setSelectedDate,
    isLoading, staffStats, staffAttendance, busStats, busAttendance,
    loadData, handleMarkStaffAttendance, handleRecordBusArrival, handleRecordBusDeparture,
  } = useTimeKeeperAttendance();

  useSetPageMetadata({
    title: 'Attendance Management',
    description: 'Manage attendance for your assigned stop',
    activeItem: 'attendance',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Attendance' }],
  });

  useSetPageActions(
    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  if (isLoading && !staffStats && !busStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)} className="w-auto"
          />
        </div>
      </div>

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

        <TabsContent value="staff" className="space-y-6 mt-6">
          {staffStats && <AttendanceStatsCards stats={staffStats} />}
          <StaffAttendanceTable attendance={staffAttendance} onMarkAttendance={handleMarkStaffAttendance} />
        </TabsContent>

        <TabsContent value="bus" className="space-y-6 mt-6">
          {busStats && <BusAttendanceStatsCards stats={busStats} />}
          <BusAttendanceTable
            attendance={busAttendance}
            onRecordArrival={handleRecordBusArrival} onRecordDeparture={handleRecordBusDeparture}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
