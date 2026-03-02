// Attendance mock data for Time Keeper portal

import { 
  StaffAttendance, 
  BusAttendance, 
  AttendanceStats, 
  BusAttendanceStats,
  AttendanceFilters,
  BusAttendanceFilters,
  PaginatedResponse 
} from './types';

// Sample staff attendance data
const staffAttendanceData: StaffAttendance[] = [
  {
    id: 'sa-001',
    staffId: 'STF-001',
    staffName: 'Kamal Perera',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: '06:30',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-001',
    busNumber: 'NA-1234',
    tripId: 'trip-001',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:30:00Z',
  },
  {
    id: 'sa-002',
    staffId: 'STF-002',
    staffName: 'Nimal Jayawardena',
    staffRole: 'conductor',
    date: '2026-02-21',
    checkInTime: '06:25',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-001',
    busNumber: 'NA-1234',
    tripId: 'trip-001',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:25:00Z',
  },
  {
    id: 'sa-003',
    staffId: 'STF-003',
    staffName: 'Sunil Fernando',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: '07:15',
    checkOutTime: undefined,
    status: 'late',
    busId: 'bus-002',
    busNumber: 'WP-5678',
    tripId: 'trip-002',
    notes: 'Traffic delay',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T07:15:00Z',
  },
  {
    id: 'sa-004',
    staffId: 'STF-004',
    staffName: 'Ranjith Silva',
    staffRole: 'conductor',
    date: '2026-02-21',
    checkInTime: '06:45',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-002',
    busNumber: 'WP-5678',
    tripId: 'trip-002',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:45:00Z',
  },
  {
    id: 'sa-005',
    staffId: 'STF-005',
    staffName: 'Prasanna Wickrama',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: undefined,
    checkOutTime: undefined,
    status: 'absent',
    busId: undefined,
    busNumber: undefined,
    tripId: undefined,
    notes: 'Medical leave',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T08:00:00Z',
  },
  {
    id: 'sa-006',
    staffId: 'STF-006',
    staffName: 'Chaminda Ratnayake',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: '06:20',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-003',
    busNumber: 'NW-9012',
    tripId: 'trip-003',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:20:00Z',
  },
  {
    id: 'sa-007',
    staffId: 'STF-007',
    staffName: 'Mahesh Bandara',
    staffRole: 'conductor',
    date: '2026-02-21',
    checkInTime: '06:22',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-003',
    busNumber: 'NW-9012',
    tripId: 'trip-003',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:22:00Z',
  },
  {
    id: 'sa-008',
    staffId: 'STF-008',
    staffName: 'Roshan Gunawardena',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: undefined,
    checkOutTime: undefined,
    status: 'on_leave',
    busId: undefined,
    busNumber: undefined,
    tripId: undefined,
    notes: 'Annual leave',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-20T18:00:00Z',
  },
  {
    id: 'sa-009',
    staffId: 'STF-009',
    staffName: 'Ajith Kumara',
    staffRole: 'conductor',
    date: '2026-02-21',
    checkInTime: '06:40',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-004',
    busNumber: 'SP-3456',
    tripId: 'trip-004',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:40:00Z',
  },
  {
    id: 'sa-010',
    staffId: 'STF-010',
    staffName: 'Sanjeewa Perera',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: '06:35',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-004',
    busNumber: 'SP-3456',
    tripId: 'trip-004',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:35:00Z',
  },
  {
    id: 'sa-011',
    staffId: 'STF-011',
    staffName: 'Dinesh Rajapaksa',
    staffRole: 'driver',
    date: '2026-02-21',
    checkInTime: '07:30',
    checkOutTime: undefined,
    status: 'late',
    busId: 'bus-005',
    busNumber: 'NW-7890',
    tripId: 'trip-005',
    notes: 'Personal emergency',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T07:30:00Z',
  },
  {
    id: 'sa-012',
    staffId: 'STF-012',
    staffName: 'Lakmal Fernando',
    staffRole: 'conductor',
    date: '2026-02-21',
    checkInTime: '06:50',
    checkOutTime: undefined,
    status: 'present',
    busId: 'bus-005',
    busNumber: 'NW-7890',
    tripId: 'trip-005',
    notes: '',
    recordedBy: 'TK-001',
    recordedAt: '2026-02-21T06:50:00Z',
  },
];

// Sample bus attendance data
const busAttendanceData: BusAttendance[] = [
  {
    id: 'ba-001',
    busId: 'bus-001',
    busNumber: 'NA-1234',
    plateNumber: 'NA-1234',
    date: '2026-02-21',
    scheduledArrivalTime: '06:00',
    actualArrivalTime: '05:55',
    scheduledDepartureTime: '08:30',
    actualDepartureTime: undefined,
    status: 'arrived',
    driverId: 'STF-001',
    driverName: 'Kamal Perera',
    conductorId: 'STF-002',
    conductorName: 'Nimal Jayawardena',
    tripId: 'trip-001',
    routeName: 'Colombo - Kandy (138)',
    notes: '',
  },
  {
    id: 'ba-002',
    busId: 'bus-002',
    busNumber: 'WP-5678',
    plateNumber: 'WP-5678',
    date: '2026-02-21',
    scheduledArrivalTime: '06:15',
    actualArrivalTime: '06:20',
    scheduledDepartureTime: '08:45',
    actualDepartureTime: undefined,
    status: 'arrived',
    driverId: 'STF-003',
    driverName: 'Sunil Fernando',
    conductorId: 'STF-004',
    conductorName: 'Ranjith Silva',
    tripId: 'trip-002',
    routeName: 'Colombo - Galle (2)',
    notes: '',
  },
  {
    id: 'ba-003',
    busId: 'bus-003',
    busNumber: 'NW-9012',
    plateNumber: 'NW-9012',
    date: '2026-02-21',
    scheduledArrivalTime: '06:30',
    actualArrivalTime: '06:25',
    scheduledDepartureTime: '09:00',
    actualDepartureTime: undefined,
    status: 'arrived',
    driverId: 'STF-006',
    driverName: 'Chaminda Ratnayake',
    conductorId: 'STF-007',
    conductorName: 'Mahesh Bandara',
    tripId: 'trip-003',
    routeName: 'Colombo - Negombo (240)',
    notes: '',
  },
  {
    id: 'ba-004',
    busId: 'bus-004',
    busNumber: 'SP-3456',
    plateNumber: 'SP-3456',
    date: '2026-02-21',
    scheduledArrivalTime: '06:45',
    actualArrivalTime: '06:42',
    scheduledDepartureTime: '09:15',
    actualDepartureTime: undefined,
    status: 'arrived',
    driverId: 'STF-010',
    driverName: 'Sanjeewa Perera',
    conductorId: 'STF-009',
    conductorName: 'Ajith Kumara',
    tripId: 'trip-004',
    routeName: 'Colombo - Matara (32)',
    notes: '',
  },
  {
    id: 'ba-005',
    busId: 'bus-005',
    busNumber: 'NW-7890',
    plateNumber: 'NW-7890',
    date: '2026-02-21',
    scheduledArrivalTime: '07:00',
    actualArrivalTime: '07:25',
    scheduledDepartureTime: '09:30',
    actualDepartureTime: undefined,
    status: 'delayed',
    driverId: 'STF-011',
    driverName: 'Dinesh Rajapaksa',
    conductorId: 'STF-012',
    conductorName: 'Lakmal Fernando',
    tripId: 'trip-005',
    routeName: 'Colombo - Kurunegala (6)',
    notes: 'Driver arrived late',
  },
  {
    id: 'ba-006',
    busId: 'bus-006',
    busNumber: 'CP-4567',
    plateNumber: 'CP-4567',
    date: '2026-02-21',
    scheduledArrivalTime: '07:30',
    actualArrivalTime: undefined,
    scheduledDepartureTime: '10:00',
    actualDepartureTime: undefined,
    status: 'expected',
    driverId: undefined,
    driverName: undefined,
    conductorId: undefined,
    conductorName: undefined,
    tripId: 'trip-006',
    routeName: 'Colombo - Anuradhapura (57)',
    notes: '',
  },
  {
    id: 'ba-007',
    busId: 'bus-007',
    busNumber: 'WP-2345',
    plateNumber: 'WP-2345',
    date: '2026-02-21',
    scheduledArrivalTime: '05:30',
    actualArrivalTime: '05:28',
    scheduledDepartureTime: '07:30',
    actualDepartureTime: '07:28',
    status: 'departed',
    driverId: 'STF-013',
    driverName: 'Upul Tharanga',
    conductorId: 'STF-014',
    conductorName: 'Ruwan Kalpage',
    tripId: 'trip-past-001',
    routeName: 'Colombo - Kandy (138)',
    notes: '',
  },
  {
    id: 'ba-008',
    busId: 'bus-008',
    busNumber: 'SP-7890',
    plateNumber: 'SP-7890',
    date: '2026-02-21',
    scheduledArrivalTime: '05:45',
    actualArrivalTime: '05:50',
    scheduledDepartureTime: '07:45',
    actualDepartureTime: '07:52',
    status: 'departed',
    driverId: 'STF-015',
    driverName: 'Asanka Gurusinha',
    conductorId: 'STF-016',
    conductorName: 'Hashan Tillakaratne',
    tripId: 'trip-past-002',
    routeName: 'Colombo - Galle (2)',
    notes: 'Slight delay due to traffic',
  },
];

// Calculate stats dynamically
export function getStaffAttendanceStats(date?: string): AttendanceStats {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const filteredData = staffAttendanceData.filter(a => a.date === targetDate);
  
  const presentCount = filteredData.filter(a => a.status === 'present').length;
  const absentCount = filteredData.filter(a => a.status === 'absent').length;
  const lateCount = filteredData.filter(a => a.status === 'late').length;
  const onLeaveCount = filteredData.filter(a => a.status === 'on_leave').length;
  const totalStaff = filteredData.length;
  
  return {
    totalStaff,
    presentCount,
    absentCount,
    lateCount,
    onLeaveCount,
    attendanceRate: totalStaff > 0 ? Math.round(((presentCount + lateCount) / totalStaff) * 100) : 0,
  };
}

export function getBusAttendanceStats(date?: string): BusAttendanceStats {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const filteredData = busAttendanceData.filter(a => a.date === targetDate);
  
  const arrivedOnTime = filteredData.filter(a => 
    a.status === 'arrived' || a.status === 'departed'
  ).length;
  const delayed = filteredData.filter(a => a.status === 'delayed').length;
  const missed = filteredData.filter(a => a.status === 'missed').length;
  const expected = filteredData.filter(a => a.status === 'expected').length;
  const totalBuses = filteredData.length;
  
  return {
    totalBusesToday: totalBuses,
    arrivedOnTime,
    delayed,
    missed,
    expectedToday: expected,
    onTimeRate: totalBuses > 0 ? Math.round((arrivedOnTime / (totalBuses - expected)) * 100) : 0,
  };
}

// Get staff attendance with optional filters
export function getStaffAttendance(
  filters?: AttendanceFilters,
  page: number = 0,
  size: number = 10
): PaginatedResponse<StaffAttendance> {
  let filteredData = [...staffAttendanceData];
  
  if (filters) {
    if (filters.date) {
      filteredData = filteredData.filter(a => a.date === filters.date);
    }
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(a => a.status === filters.status);
    }
    if (filters.role && filters.role !== 'all') {
      filteredData = filteredData.filter(a => a.staffRole === filters.role);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(a => 
        a.staffName.toLowerCase().includes(term) ||
        a.busNumber?.toLowerCase().includes(term) ||
        a.staffId.toLowerCase().includes(term)
      );
    }
  }
  
  const totalElements = filteredData.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = page * size;
  const content = filteredData.slice(startIndex, startIndex + size);
  
  return {
    content,
    totalElements,
    totalPages,
    page,
    size,
    hasNext: page < totalPages - 1,
    hasPrevious: page > 0,
  };
}

// Get bus attendance with optional filters
export function getBusAttendance(
  filters?: BusAttendanceFilters,
  page: number = 0,
  size: number = 10
): PaginatedResponse<BusAttendance> {
  let filteredData = [...busAttendanceData];
  
  if (filters) {
    if (filters.date) {
      filteredData = filteredData.filter(a => a.date === filters.date);
    }
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(a => a.status === filters.status);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(a => 
        a.busNumber.toLowerCase().includes(term) ||
        a.driverName?.toLowerCase().includes(term) ||
        a.routeName?.toLowerCase().includes(term)
      );
    }
  }
  
  const totalElements = filteredData.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = page * size;
  const content = filteredData.slice(startIndex, startIndex + size);
  
  return {
    content,
    totalElements,
    totalPages,
    page,
    size,
    hasNext: page < totalPages - 1,
    hasPrevious: page > 0,
  };
}

// Mark staff attendance
export function markStaffAttendance(
  staffId: string,
  status: StaffAttendance['status'],
  notes?: string
): StaffAttendance | null {
  const attendance = staffAttendanceData.find(a => a.staffId === staffId);
  if (attendance) {
    attendance.status = status;
    attendance.notes = notes || attendance.notes;
    if (status === 'present' || status === 'late') {
      attendance.checkInTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    attendance.recordedAt = new Date().toISOString();
    return { ...attendance };
  }
  return null;
}

// Record bus arrival
export function recordBusArrival(
  busId: string,
  notes?: string
): BusAttendance | null {
  const attendance = busAttendanceData.find(a => a.busId === busId);
  if (attendance) {
    const now = new Date();
    attendance.actualArrivalTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Determine status based on arrival time
    const scheduled = new Date(`${attendance.date}T${attendance.scheduledArrivalTime}`);
    const actual = now;
    const diffMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
    
    attendance.status = diffMinutes > 10 ? 'delayed' : 'arrived';
    attendance.notes = notes || attendance.notes;
    
    return { ...attendance };
  }
  return null;
}

// Record bus departure
export function recordBusDeparture(
  busId: string,
  notes?: string
): BusAttendance | null {
  const attendance = busAttendanceData.find(a => a.busId === busId);
  if (attendance) {
    attendance.actualDepartureTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    attendance.status = 'departed';
    attendance.notes = notes || attendance.notes;
    return { ...attendance };
  }
  return null;
}

// Get single staff attendance record
export function getStaffAttendanceById(id: string): StaffAttendance | null {
  return staffAttendanceData.find(a => a.id === id) || null;
}

// Get single bus attendance record
export function getBusAttendanceById(id: string): BusAttendance | null {
  return busAttendanceData.find(a => a.id === id) || null;
}
