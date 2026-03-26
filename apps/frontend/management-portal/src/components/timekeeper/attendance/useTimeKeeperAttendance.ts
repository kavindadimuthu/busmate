import { useState, useEffect, useCallback } from 'react';
import { usePageContext } from '@/context/PageContext';
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

export function useTimeKeeperAttendance() {
  const [activeTab, setActiveTab] = useState('staff');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [assignedStop, setAssignedStop] = useState<AssignedStop | null>(null);

  const [staffStats, setStaffStats] = useState<AttendanceStats | null>(null);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [busStats, setBusStats] = useState<BusAttendanceStats | null>(null);
  const [busAttendance, setBusAttendance] = useState<BusAttendance[]>([]);

  const { setMetadata } = usePageContext();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const stop = getAssignedStop();
      setAssignedStop(stop);

      const staffStatsData = getStaffAttendanceStats(selectedDate);
      const staffData = getStaffAttendance({ date: selectedDate }, 0, 50);
      setStaffStats(staffStatsData);
      setStaffAttendance(staffData.content);

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

  useEffect(() => {
    if (assignedStop) {
      setMetadata({ description: `Manage attendance for ${assignedStop.name}` });
    }
  }, [assignedStop, setMetadata]);

  const handleMarkStaffAttendance = useCallback(
    (staffId: string, status: AttendanceStatus, notes?: string) => {
      const updated = markStaffAttendance(staffId, status, notes);
      if (updated) loadData();
    },
    [loadData]
  );

  const handleRecordBusArrival = useCallback(
    (busId: string) => {
      const updated = recordBusArrival(busId);
      if (updated) loadData();
    },
    [loadData]
  );

  const handleRecordBusDeparture = useCallback(
    (busId: string) => {
      const updated = recordBusDeparture(busId);
      if (updated) loadData();
    },
    [loadData]
  );

  return {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    isLoading,
    staffStats,
    staffAttendance,
    busStats,
    busAttendance,
    loadData,
    handleMarkStaffAttendance,
    handleRecordBusArrival,
    handleRecordBusDeparture,
  };
}
