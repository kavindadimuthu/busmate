'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Bus,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { RouteResponse } from '../../../../../../generated/api-clients/route-management';

// ── Types ─────────────────────────────────────────────────────────

interface RouteAnalyticsTabProps {
  route: RouteResponse;
}

interface RouteAnalytics {
  totalTrips: number;
  totalPassengers: number;
  avgOnTimePercentage: number;
  totalRevenue: number;
  activeSchedules: number;
  avgTripDuration: number;
}

// ── Mock data (would come from API in production) ─────────────────

function generateMockAnalytics(route: RouteResponse): RouteAnalytics {
  // Generate realistic-looking mock data based on route properties
  const baseTrips = Math.floor(Math.random() * 500) + 200;
  const avgPassengersPerTrip = Math.floor(Math.random() * 30) + 20;
  
  return {
    totalTrips: baseTrips,
    totalPassengers: baseTrips * avgPassengersPerTrip,
    avgOnTimePercentage: Math.floor(Math.random() * 15) + 82, // 82-97%
    totalRevenue: baseTrips * avgPassengersPerTrip * (Math.random() * 50 + 50), // Average fare Rs 50-100
    activeSchedules: Math.floor(Math.random() * 5) + 2,
    avgTripDuration: route.estimatedDurationMinutes || Math.floor(Math.random() * 60) + 30,
  };
}

// ── Stat Card Component ───────────────────────────────────────────

interface StatCardProps {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  subValue?: string;
  color: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan';
}

const COLORS = {
  blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600' },
  rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
  cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', text: 'text-cyan-600' },
};

function StatCard({ icon: Icon, label, value, subValue, color }: StatCardProps) {
  const colorStyles = COLORS[color];
  
  return (
    <div className={`rounded-xl p-5 border border-gray-100 ${colorStyles.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorStyles.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorStyles.text}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );
}

// ── Performance Bar ───────────────────────────────────────────────

function PerformanceBar({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v >= 90) return 'bg-emerald-500';
    if (v >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{value}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getColor(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function RouteAnalyticsTab({ route }: RouteAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<RouteAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setAnalytics(generateMockAnalytics(route));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [route]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-7 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `Rs ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}K`;
    return `Rs ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Notice banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Sample Analytics Data</h4>
          <p className="text-sm text-amber-700 mt-0.5">
            This section displays sample analytics data. Real-time data will be integrated once the analytics backend is connected.
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Key Metrics (Last 30 Days)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Bus}
            label="Total Trips"
            value={formatNumber(analytics.totalTrips)}
            subValue="Completed trips"
            color="blue"
          />
          <StatCard
            icon={Users}
            label="Passengers"
            value={formatNumber(analytics.totalPassengers)}
            subValue={`~${Math.round(analytics.totalPassengers / analytics.totalTrips)} avg per trip`}
            color="emerald"
          />
          <StatCard
            icon={Clock}
            label="Avg Duration"
            value={`${analytics.avgTripDuration}m`}
            subValue="Per trip"
            color="amber"
          />
          <StatCard
            icon={CheckCircle}
            label="On-Time Rate"
            value={`${analytics.avgOnTimePercentage}%`}
            subValue="Arrival accuracy"
            color="violet"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={formatCurrency(analytics.totalRevenue)}
            subValue="Total collections"
            color="rose"
          />
          <StatCard
            icon={Calendar}
            label="Active Schedules"
            value={analytics.activeSchedules}
            subValue="Currently running"
            color="cyan"
          />
        </div>
      </div>

      {/* Performance metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Performance Overview
        </h3>
        <div className="space-y-4">
          <PerformanceBar
            value={analytics.avgOnTimePercentage}
            label="On-Time Performance"
          />
          <PerformanceBar
            value={Math.min(100, Math.round((analytics.totalPassengers / (analytics.totalTrips * 50)) * 100))}
            label="Seat Utilization"
          />
          <PerformanceBar
            value={Math.floor(Math.random() * 10) + 88}
            label="Schedule Adherence"
          />
          <PerformanceBar
            value={Math.floor(Math.random() * 5) + 92}
            label="Fleet Availability"
          />
        </div>
      </div>

      {/* Quick insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Peak Hour</div>
            <div className="text-lg font-semibold text-gray-900">7:00 - 9:00 AM</div>
            <div className="text-xs text-gray-500 mt-1">Highest passenger volume</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Busiest Day</div>
            <div className="text-lg font-semibold text-gray-900">Monday</div>
            <div className="text-xs text-gray-500 mt-1">35% higher than average</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Average Wait Time</div>
            <div className="text-lg font-semibold text-gray-900">12 minutes</div>
            <div className="text-xs text-gray-500 mt-1">At major stops</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Passenger Satisfaction</div>
            <div className="text-lg font-semibold text-gray-900">4.2 / 5.0</div>
            <div className="text-xs text-gray-500 mt-1">Based on 156 reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
}
