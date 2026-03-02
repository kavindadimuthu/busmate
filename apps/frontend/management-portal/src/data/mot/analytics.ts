// MOT Analytics Dashboard – comprehensive mock data
// ─────────────────────────────────────────────────────────────────
// When the backend is ready, replace each function marked with TODO
// with the corresponding API fetch call. The data shapes are
// intentionally kept stable so components need no changes.
//
// Backend endpoints (planned):
//   GET /api/analytics/overview       — KPI cards data
//   GET /api/analytics/trends         — Historical trend data
//   GET /api/analytics/trips          — Trip analytics
//   GET /api/analytics/routes         — Route analytics
//   GET /api/analytics/fleet          — Fleet/bus analytics
//   GET /api/analytics/staff          — Staff analytics
//   GET /api/analytics/revenue        — Revenue analytics
//   GET /api/analytics/passengers     — Passenger analytics

// ── Types ────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';
export type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom';
export type AnalyticsCategory = 
  | 'overview' 
  | 'trips' 
  | 'routes' 
  | 'fleet' 
  | 'staff' 
  | 'revenue' 
  | 'passengers';

// KPI Metric interface (same pattern as admin dashboard)
export interface AnalyticsKPIMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: Trend;
  trendValue: string;
  trendPositiveIsGood: boolean;
  sparkData: number[];
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal';
}

// Trend point for line charts
export interface TrendPoint {
  label: string;
  trips: number;
  passengers: number;
  revenue: number;
  busesActive: number;
}

// Distribution data for pie/donut charts
export interface DistributionItem {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

// Bar chart data point
export interface BarChartItem {
  label: string;
  value: number;
  previousValue?: number;
  color?: string;
}

// ── Trip Analytics ───────────────────────────────────────────────

export interface TripStatusDistribution {
  completed: number;
  inProgress: number;
  scheduled: number;
  cancelled: number;
  delayed: number;
}

export interface TripAnalyticsData {
  totalTrips: number;
  completedTrips: number;
  onTimePercentage: number;
  averageDelay: number; // in minutes
  tripsByDay: BarChartItem[];
  tripsByRoute: BarChartItem[];
  statusDistribution: DistributionItem[];
  tripsTrend: { label: string; completed: number; cancelled: number; delayed: number }[];
  peakHours: { hour: string; trips: number }[];
}

// ── Route Analytics ──────────────────────────────────────────────

export interface RouteAnalyticsData {
  totalRoutes: number;
  activeRoutes: number;
  averagePassengersPerRoute: number;
  highestDemandRoute: { name: string; passengers: number };
  lowestDemandRoute: { name: string; passengers: number };
  routesByRegion: DistributionItem[];
  routePerformance: {
    routeId: string;
    routeName: string;
    trips: number;
    passengers: number;
    revenue: number;
    onTimeRate: number;
  }[];
  routeTypeDistribution: DistributionItem[];
  passengersByRoute: BarChartItem[];
}

// ── Fleet Analytics ──────────────────────────────────────────────

export interface FleetAnalyticsData {
  totalBuses: number;
  activeBuses: number;
  inMaintenanceBuses: number;
  outOfServiceBuses: number;
  averageAge: number; // in years
  fleetUtilization: number; // percentage
  busesByOperator: DistributionItem[];
  busesByCapacity: DistributionItem[];
  busesByStatus: DistributionItem[];
  maintenanceSchedule: {
    busId: string;
    registrationNumber: string;
    nextMaintenanceDate: string;
    maintenanceType: string;
  }[];
  busPerformance: {
    busId: string;
    registrationNumber: string;
    trips: number;
    distance: number;
    fuelEfficiency: number;
  }[];
}

// ── Staff Analytics ──────────────────────────────────────────────

export interface StaffAnalyticsData {
  totalStaff: number;
  activeStaff: number;
  timekeepers: number;
  inspectors: number;
  staffByProvince: DistributionItem[];
  staffByType: DistributionItem[];
  staffByStatus: DistributionItem[];
  staffPerformance: {
    staffId: string;
    name: string;
    type: string;
    shiftsCompleted: number;
    attendance: number;
    rating: number;
  }[];
  attendanceTrend: { label: string; present: number; absent: number }[];
}

// ── Revenue Analytics ────────────────────────────────────────────

export interface RevenueAnalyticsData {
  totalRevenue: number;
  ticketRevenue: number;
  permitRevenue: number;
  fineRevenue: number;
  growthRate: number;
  averageTicketPrice: number;
  revenueByRoute: BarChartItem[];
  revenueByOperator: BarChartItem[];
  revenueTrend: { label: string; revenue: number; tickets: number }[];
  revenueByCategory: DistributionItem[];
  dailyRevenue: { date: string; amount: number }[];
  topRevenueRoutes: { routeId: string; routeName: string; revenue: number; percentage: number }[];
}

// ── Passenger Analytics ──────────────────────────────────────────

export interface PassengerAnalyticsData {
  totalPassengers: number;
  dailyAverage: number;
  peakHourPassengers: number;
  weeklyGrowth: number;
  passengersByRoute: BarChartItem[];
  passengersByTimeSlot: BarChartItem[];
  passengerTrend: { label: string; passengers: number }[];
  passengerDemographics: DistributionItem[];
  passengersByTicketType: DistributionItem[];
  topRoutesByPassengers: { routeId: string; routeName: string; passengers: number; percentage: number }[];
}

// ── Complete Analytics Snapshot ──────────────────────────────────

export interface AnalyticsSnapshot {
  kpis: AnalyticsKPIMetric[];
  trendHistory: TrendPoint[];
  tripAnalytics: TripAnalyticsData;
  routeAnalytics: RouteAnalyticsData;
  fleetAnalytics: FleetAnalyticsData;
  staffAnalytics: StaffAnalyticsData;
  revenueAnalytics: RevenueAnalyticsData;
  passengerAnalytics: PassengerAnalyticsData;
  lastUpdated: string;
}

// Filter options
export interface AnalyticsFilterOptions {
  dateRanges: { value: DateRange; label: string }[];
  regions: string[];
  operators: { id: string; name: string }[];
  routes: { id: string; name: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drift(current: number, amount: number, min: number, max: number): number {
  const change = (Math.random() - 0.5) * 2 * amount;
  return Math.max(min, Math.min(max, Math.round((current + change) * 10) / 10));
}

function sparkSeries(seed: number, count = 20, spread = 10): number[] {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < count; i++) {
    v = drift(v, spread, seed * 0.5, seed * 1.8);
    arr.push(Math.round(v));
  }
  return arr;
}

function generateDaysLabels(days: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

function generateHourLabels(): string[] {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });
}

// ── Mock data generators ─────────────────────────────────────────

function makeKPIs(): AnalyticsKPIMetric[] {
  return [
    {
      id: 'kpi-trips',
      label: 'Total Trips',
      value: '12,847',
      rawValue: 12847,
      unit: '',
      trend: 'up',
      trendValue: '+342 this week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(12500, 20, 400),
      color: 'blue',
    },
    {
      id: 'kpi-passengers',
      label: 'Total Passengers',
      value: '458,231',
      rawValue: 458231,
      unit: '',
      trend: 'up',
      trendValue: '+5.2% vs last month',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(450000, 20, 15000),
      color: 'teal',
    },
    {
      id: 'kpi-revenue',
      label: 'Total Revenue',
      value: 'Rs 28.4M',
      rawValue: 28400000,
      unit: 'Rs',
      trend: 'up',
      trendValue: '+8.7% vs last month',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(27000000, 20, 1500000),
      color: 'green',
    },
    {
      id: 'kpi-ontime',
      label: 'On-Time Rate',
      value: '87.3%',
      rawValue: 87.3,
      unit: '%',
      trend: 'up',
      trendValue: '+2.1% vs last week',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(85, 20, 3),
      color: 'purple',
    },
    {
      id: 'kpi-active-buses',
      label: 'Active Buses',
      value: '1,247',
      rawValue: 1247,
      unit: '',
      trend: 'stable',
      trendValue: 'Same as yesterday',
      trendPositiveIsGood: true,
      sparkData: sparkSeries(1240, 20, 30),
      color: 'amber',
    },
  ];
}

function makeTrendHistory(): TrendPoint[] {
  const days = 30;
  const labels = generateDaysLabels(days);
  const points: TrendPoint[] = [];

  let trips = 400;
  let passengers = 15000;
  let revenue = 920000;
  let buses = 1200;

  labels.forEach((label) => {
    trips = Math.round(drift(trips, 30, 300, 500));
    passengers = Math.round(drift(passengers, 1500, 12000, 18000));
    revenue = Math.round(drift(revenue, 80000, 750000, 1100000));
    buses = Math.round(drift(buses, 20, 1150, 1280));

    points.push({ label, trips, passengers, revenue, busesActive: buses });
  });

  return points;
}

function makeTripAnalytics(): TripAnalyticsData {
  const days7Labels = generateDaysLabels(7);
  const hourLabels = generateHourLabels();

  return {
    totalTrips: 12847,
    completedTrips: 11234,
    onTimePercentage: 87.3,
    averageDelay: 4.2,
    tripsByDay: days7Labels.map((label) => ({
      label,
      value: rand(380, 480),
    })),
    tripsByRoute: [
      { label: 'Route 138', value: 1847 },
      { label: 'Route 255', value: 1523 },
      { label: 'Route 101', value: 1289 },
      { label: 'Route 177', value: 1156 },
      { label: 'Route 220', value: 987 },
      { label: 'Route 350', value: 876 },
      { label: 'Route 400', value: 789 },
      { label: 'Route 188', value: 654 },
    ],
    statusDistribution: [
      { label: 'Completed', value: 11234, color: '#22c55e' },
      { label: 'In Progress', value: 456, color: '#3b82f6' },
      { label: 'Scheduled', value: 789, color: '#a855f7' },
      { label: 'Cancelled', value: 156, color: '#ef4444' },
      { label: 'Delayed', value: 212, color: '#f59e0b' },
    ],
    tripsTrend: days7Labels.map((label) => ({
      label,
      completed: rand(350, 420),
      cancelled: rand(15, 35),
      delayed: rand(20, 40),
    })),
    peakHours: hourLabels.slice(5, 22).map((hour) => {
      const h = parseInt(hour.split(':')[0]);
      // Peak hours: 7-9 AM and 5-7 PM
      const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
      return {
        hour,
        trips: isPeak ? rand(80, 120) : rand(20, 50),
      };
    }),
  };
}

function makeRouteAnalytics(): RouteAnalyticsData {
  return {
    totalRoutes: 487,
    activeRoutes: 423,
    averagePassengersPerRoute: 942,
    highestDemandRoute: { name: 'Route 138 (Colombo - Kandy)', passengers: 45230 },
    lowestDemandRoute: { name: 'Route 892 (Polonnaruwa Rural)', passengers: 234 },
    routesByRegion: [
      { label: 'Western', value: 156, color: '#3b82f6' },
      { label: 'Central', value: 98, color: '#22c55e' },
      { label: 'Southern', value: 87, color: '#f59e0b' },
      { label: 'Northern', value: 54, color: '#ef4444' },
      { label: 'Eastern', value: 43, color: '#a855f7' },
      { label: 'North Western', value: 32, color: '#14b8a6' },
      { label: 'Uva', value: 17, color: '#f97316' },
    ],
    routePerformance: [
      { routeId: 'RT001', routeName: 'Route 138', trips: 1847, passengers: 45230, revenue: 4523000, onTimeRate: 92.3 },
      { routeId: 'RT002', routeName: 'Route 255', trips: 1523, passengers: 38450, revenue: 3845000, onTimeRate: 88.7 },
      { routeId: 'RT003', routeName: 'Route 101', trips: 1289, passengers: 32890, revenue: 3289000, onTimeRate: 91.2 },
      { routeId: 'RT004', routeName: 'Route 177', trips: 1156, passengers: 28970, revenue: 2897000, onTimeRate: 85.4 },
      { routeId: 'RT005', routeName: 'Route 220', trips: 987, passengers: 24560, revenue: 2456000, onTimeRate: 89.1 },
    ],
    routeTypeDistribution: [
      { label: 'Inter-city', value: 234, color: '#3b82f6' },
      { label: 'Urban', value: 156, color: '#22c55e' },
      { label: 'Rural', value: 67, color: '#f59e0b' },
      { label: 'Express', value: 30, color: '#a855f7' },
    ],
    passengersByRoute: [
      { label: 'Route 138', value: 45230 },
      { label: 'Route 255', value: 38450 },
      { label: 'Route 101', value: 32890 },
      { label: 'Route 177', value: 28970 },
      { label: 'Route 220', value: 24560 },
    ],
  };
}

function makeFleetAnalytics(): FleetAnalyticsData {
  return {
    totalBuses: 1523,
    activeBuses: 1247,
    inMaintenanceBuses: 156,
    outOfServiceBuses: 120,
    averageAge: 6.3,
    fleetUtilization: 81.9,
    busesByOperator: [
      { label: 'CTB', value: 623, color: '#3b82f6' },
      { label: 'Private Operators', value: 534, color: '#22c55e' },
      { label: 'SLTB', value: 234, color: '#f59e0b' },
      { label: 'Express Lines', value: 132, color: '#a855f7' },
    ],
    busesByCapacity: [
      { label: '40-50 seats', value: 567, color: '#3b82f6' },
      { label: '50-60 seats', value: 456, color: '#22c55e' },
      { label: '30-40 seats', value: 312, color: '#f59e0b' },
      { label: '60+ seats', value: 188, color: '#a855f7' },
    ],
    busesByStatus: [
      { label: 'Active', value: 1247, color: '#22c55e' },
      { label: 'In Maintenance', value: 156, color: '#f59e0b' },
      { label: 'Out of Service', value: 120, color: '#ef4444' },
    ],
    maintenanceSchedule: [
      { busId: 'BUS001', registrationNumber: 'NB-4821', nextMaintenanceDate: '2026-03-05', maintenanceType: 'Regular Service' },
      { busId: 'BUS002', registrationNumber: 'WP-1234', nextMaintenanceDate: '2026-03-08', maintenanceType: 'Engine Check' },
      { busId: 'BUS003', registrationNumber: 'CP-5678', nextMaintenanceDate: '2026-03-10', maintenanceType: 'Tire Replacement' },
      { busId: 'BUS004', registrationNumber: 'SP-9012', nextMaintenanceDate: '2026-03-12', maintenanceType: 'AC Repair' },
      { busId: 'BUS005', registrationNumber: 'NW-3456', nextMaintenanceDate: '2026-03-15', maintenanceType: 'Regular Service' },
    ],
    busPerformance: [
      { busId: 'BUS001', registrationNumber: 'NB-4821', trips: 234, distance: 12450, fuelEfficiency: 8.2 },
      { busId: 'BUS002', registrationNumber: 'WP-1234', trips: 218, distance: 11230, fuelEfficiency: 7.8 },
      { busId: 'BUS003', registrationNumber: 'CP-5678', trips: 201, distance: 10890, fuelEfficiency: 8.5 },
      { busId: 'BUS004', registrationNumber: 'SP-9012', trips: 195, distance: 10120, fuelEfficiency: 7.5 },
      { busId: 'BUS005', registrationNumber: 'NW-3456', trips: 187, distance: 9870, fuelEfficiency: 8.0 },
    ],
  };
}

function makeStaffAnalytics(): StaffAnalyticsData {
  const days7Labels = generateDaysLabels(7);

  return {
    totalStaff: 4521,
    activeStaff: 4123,
    timekeepers: 2345,
    inspectors: 1778,
    staffByProvince: [
      { label: 'Western', value: 1456, color: '#3b82f6' },
      { label: 'Central', value: 876, color: '#22c55e' },
      { label: 'Southern', value: 654, color: '#f59e0b' },
      { label: 'Northern', value: 432, color: '#ef4444' },
      { label: 'Eastern', value: 387, color: '#a855f7' },
      { label: 'North Western', value: 312, color: '#14b8a6' },
      { label: 'Others', value: 404, color: '#6b7280' },
    ],
    staffByType: [
      { label: 'Timekeepers', value: 2345, color: '#3b82f6' },
      { label: 'Inspectors', value: 1778, color: '#22c55e' },
      { label: 'Supervisors', value: 245, color: '#f59e0b' },
      { label: 'Others', value: 153, color: '#6b7280' },
    ],
    staffByStatus: [
      { label: 'Active', value: 4123, color: '#22c55e' },
      { label: 'On Leave', value: 234, color: '#f59e0b' },
      { label: 'Inactive', value: 164, color: '#ef4444' },
    ],
    staffPerformance: [
      { staffId: 'STF001', name: 'Kamal Perera', type: 'Timekeeper', shiftsCompleted: 24, attendance: 98.5, rating: 4.8 },
      { staffId: 'STF002', name: 'Nimal Jayawardena', type: 'Inspector', shiftsCompleted: 22, attendance: 96.2, rating: 4.6 },
      { staffId: 'STF003', name: 'Sunil Fernando', type: 'Timekeeper', shiftsCompleted: 23, attendance: 97.8, rating: 4.7 },
      { staffId: 'STF004', name: 'Ranjith Silva', type: 'Inspector', shiftsCompleted: 21, attendance: 95.1, rating: 4.5 },
      { staffId: 'STF005', name: 'Kumar Bandara', type: 'Supervisor', shiftsCompleted: 25, attendance: 99.2, rating: 4.9 },
    ],
    attendanceTrend: days7Labels.map((label) => ({
      label,
      present: rand(3800, 4100),
      absent: rand(100, 250),
    })),
  };
}

function makeRevenueAnalytics(): RevenueAnalyticsData {
  const days30Labels = generateDaysLabels(30);

  return {
    totalRevenue: 28400000,
    ticketRevenue: 24500000,
    permitRevenue: 2800000,
    fineRevenue: 1100000,
    growthRate: 8.7,
    averageTicketPrice: 62.5,
    revenueByRoute: [
      { label: 'Route 138', value: 4523000, color: '#3b82f6' },
      { label: 'Route 255', value: 3845000, color: '#22c55e' },
      { label: 'Route 101', value: 3289000, color: '#f59e0b' },
      { label: 'Route 177', value: 2897000, color: '#a855f7' },
      { label: 'Route 220', value: 2456000, color: '#ef4444' },
    ],
    revenueByOperator: [
      { label: 'CTB', value: 11200000, color: '#3b82f6' },
      { label: 'Private Operators', value: 9800000, color: '#22c55e' },
      { label: 'SLTB', value: 5200000, color: '#f59e0b' },
      { label: 'Express Lines', value: 2200000, color: '#a855f7' },
    ],
    revenueTrend: days30Labels.map((label) => ({
      label,
      revenue: rand(750000, 1100000),
      tickets: rand(12000, 18000),
    })),
    revenueByCategory: [
      { label: 'Ticket Sales', value: 24500000, color: '#3b82f6', percentage: 86.3 },
      { label: 'Permit Fees', value: 2800000, color: '#22c55e', percentage: 9.9 },
      { label: 'Fines', value: 1100000, color: '#ef4444', percentage: 3.8 },
    ],
    dailyRevenue: days30Labels.map((date) => ({
      date,
      amount: rand(750000, 1100000),
    })),
    topRevenueRoutes: [
      { routeId: 'RT001', routeName: 'Route 138 (Colombo - Kandy)', revenue: 4523000, percentage: 15.9 },
      { routeId: 'RT002', routeName: 'Route 255 (Colombo - Galle)', revenue: 3845000, percentage: 13.5 },
      { routeId: 'RT003', routeName: 'Route 101 (Colombo - Negombo)', revenue: 3289000, percentage: 11.6 },
      { routeId: 'RT004', routeName: 'Route 177 (Kandy - Matale)', revenue: 2897000, percentage: 10.2 },
      { routeId: 'RT005', routeName: 'Route 220 (Colombo - Ratnapura)', revenue: 2456000, percentage: 8.6 },
    ],
  };
}

function makePassengerAnalytics(): PassengerAnalyticsData {
  const days30Labels = generateDaysLabels(30);
  const hourLabels = generateHourLabels();

  return {
    totalPassengers: 458231,
    dailyAverage: 15274,
    peakHourPassengers: 2847,
    weeklyGrowth: 5.2,
    passengersByRoute: [
      { label: 'Route 138', value: 45230 },
      { label: 'Route 255', value: 38450 },
      { label: 'Route 101', value: 32890 },
      { label: 'Route 177', value: 28970 },
      { label: 'Route 220', value: 24560 },
    ],
    passengersByTimeSlot: hourLabels.slice(5, 22).map((slot) => {
      const h = parseInt(slot.split(':')[0]);
      const isPeak = (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
      return {
        label: slot,
        value: isPeak ? rand(2200, 2900) : rand(600, 1200),
      };
    }),
    passengerTrend: days30Labels.map((label) => ({
      label,
      passengers: rand(13500, 17000),
    })),
    passengerDemographics: [
      { label: 'Adults (18-60)', value: 312500, color: '#3b82f6', percentage: 68.2 },
      { label: 'Students', value: 89450, color: '#22c55e', percentage: 19.5 },
      { label: 'Seniors (60+)', value: 43281, color: '#f59e0b', percentage: 9.4 },
      { label: 'Children', value: 13000, color: '#a855f7', percentage: 2.9 },
    ],
    passengersByTicketType: [
      { label: 'Normal', value: 285000, color: '#3b82f6', percentage: 62.2 },
      { label: 'Concession', value: 98450, color: '#22c55e', percentage: 21.5 },
      { label: 'Season Pass', value: 52781, color: '#f59e0b', percentage: 11.5 },
      { label: 'Highway', value: 22000, color: '#a855f7', percentage: 4.8 },
    ],
    topRoutesByPassengers: [
      { routeId: 'RT001', routeName: 'Route 138 (Colombo - Kandy)', passengers: 45230, percentage: 9.9 },
      { routeId: 'RT002', routeName: 'Route 255 (Colombo - Galle)', passengers: 38450, percentage: 8.4 },
      { routeId: 'RT003', routeName: 'Route 101 (Colombo - Negombo)', passengers: 32890, percentage: 7.2 },
      { routeId: 'RT004', routeName: 'Route 177 (Kandy - Matale)', passengers: 28970, percentage: 6.3 },
      { routeId: 'RT005', routeName: 'Route 220 (Colombo - Ratnapura)', passengers: 24560, percentage: 5.4 },
    ],
  };
}

function makeFilterOptions(): AnalyticsFilterOptions {
  return {
    dateRanges: [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
      { value: '1y', label: 'Last year' },
      { value: 'custom', label: 'Custom range' },
    ],
    regions: [
      'All Regions',
      'Western',
      'Central',
      'Southern',
      'Northern',
      'Eastern',
      'North Western',
      'North Central',
      'Uva',
      'Sabaragamuwa',
    ],
    operators: [
      { id: 'all', name: 'All Operators' },
      { id: 'ctb', name: 'CTB' },
      { id: 'sltb', name: 'SLTB' },
      { id: 'private', name: 'Private Operators' },
      { id: 'express', name: 'Express Lines' },
    ],
    routes: [
      { id: 'all', name: 'All Routes' },
      { id: 'rt138', name: 'Route 138' },
      { id: 'rt255', name: 'Route 255' },
      { id: 'rt101', name: 'Route 101' },
      { id: 'rt177', name: 'Route 177' },
      { id: 'rt220', name: 'Route 220' },
    ],
  };
}

// ── Cached snapshot state ────────────────────────────────────────

let _kpis: AnalyticsKPIMetric[] = makeKPIs();
let _trendHistory: TrendPoint[] = makeTrendHistory();
let _tripAnalytics: TripAnalyticsData = makeTripAnalytics();
let _routeAnalytics: RouteAnalyticsData = makeRouteAnalytics();
let _fleetAnalytics: FleetAnalyticsData = makeFleetAnalytics();
let _staffAnalytics: StaffAnalyticsData = makeStaffAnalytics();
let _revenueAnalytics: RevenueAnalyticsData = makeRevenueAnalytics();
let _passengerAnalytics: PassengerAnalyticsData = makePassengerAnalytics();
let _filterOptions: AnalyticsFilterOptions = makeFilterOptions();

// ── Public API ───────────────────────────────────────────────────

export function getAnalyticsKPIs(): AnalyticsKPIMetric[] {
  // TODO: Replace with → GET /api/analytics/overview/kpis
  return _kpis;
}

export function getAnalyticsTrends(): TrendPoint[] {
  // TODO: Replace with → GET /api/analytics/overview/trends
  return _trendHistory;
}

export function getTripAnalytics(): TripAnalyticsData {
  // TODO: Replace with → GET /api/analytics/trips
  return _tripAnalytics;
}

export function getRouteAnalytics(): RouteAnalyticsData {
  // TODO: Replace with → GET /api/analytics/routes
  return _routeAnalytics;
}

export function getFleetAnalytics(): FleetAnalyticsData {
  // TODO: Replace with → GET /api/analytics/fleet
  return _fleetAnalytics;
}

export function getStaffAnalytics(): StaffAnalyticsData {
  // TODO: Replace with → GET /api/analytics/staff
  return _staffAnalytics;
}

export function getRevenueAnalytics(): RevenueAnalyticsData {
  // TODO: Replace with → GET /api/analytics/revenue
  return _revenueAnalytics;
}

export function getPassengerAnalytics(): PassengerAnalyticsData {
  // TODO: Replace with → GET /api/analytics/passengers
  return _passengerAnalytics;
}

export function getAnalyticsFilterOptions(): AnalyticsFilterOptions {
  // TODO: Replace with → GET /api/analytics/filters
  return _filterOptions;
}

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  // TODO: Replace with → GET /api/analytics/snapshot
  return {
    kpis: getAnalyticsKPIs(),
    trendHistory: getAnalyticsTrends(),
    tripAnalytics: getTripAnalytics(),
    routeAnalytics: getRouteAnalytics(),
    fleetAnalytics: getFleetAnalytics(),
    staffAnalytics: getStaffAnalytics(),
    revenueAnalytics: getRevenueAnalytics(),
    passengerAnalytics: getPassengerAnalytics(),
    lastUpdated: new Date().toISOString(),
  };
}

// ── Simulation tick (for live updates) ──────────────────────────

export function simulateAnalyticsTick(): void {
  // Update KPIs with small random changes
  _kpis = _kpis.map((kpi) => {
    if (kpi.id === 'kpi-trips') {
      const newRaw = kpi.rawValue + rand(1, 8);
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: newRaw.toLocaleString(), sparkData: newSpark };
    }
    if (kpi.id === 'kpi-passengers') {
      const newRaw = kpi.rawValue + rand(10, 50);
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: newRaw.toLocaleString(), sparkData: newSpark };
    }
    if (kpi.id === 'kpi-revenue') {
      const newRaw = kpi.rawValue + rand(5000, 25000);
      const val = newRaw >= 1000000 ? `Rs ${(newRaw / 1000000).toFixed(1)}M` : `Rs ${(newRaw / 1000).toFixed(0)}K`;
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: val, sparkData: newSpark };
    }
    if (kpi.id === 'kpi-ontime') {
      const newRaw = parseFloat(drift(kpi.rawValue, 0.5, 80, 95).toFixed(1));
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: `${newRaw}%`, sparkData: newSpark };
    }
    if (kpi.id === 'kpi-active-buses') {
      const newRaw = Math.round(drift(kpi.rawValue, 10, 1150, 1300));
      const newSpark = [...kpi.sparkData.slice(1), newRaw];
      return { ...kpi, rawValue: newRaw, value: newRaw.toLocaleString(), sparkData: newSpark };
    }
    return kpi;
  });
}
