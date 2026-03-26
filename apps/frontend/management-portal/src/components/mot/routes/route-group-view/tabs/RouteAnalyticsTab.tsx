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
import type { RouteResponse } from '@busmate/api-client-route';

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
  blue: { bg: 'bg-primary/10', iconBg: 'bg-primary/15', text: 'text-primary' },
  emerald: { bg: 'bg-success/10', iconBg: 'bg-success/15', text: 'text-success' },
  amber: { bg: 'bg-warning/10', iconBg: 'bg-warning/15', text: 'text-warning' },
  violet: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', text: 'text-violet-600' },
  rose: { bg: 'bg-destructive/10', iconBg: 'bg-destructive/15', text: 'text-destructive' },
  cyan: { bg: 'bg-primary/10', iconBg: 'bg-primary/15', text: 'text-primary/90' },
};

function StatCard({ icon: Icon, label, value, subValue, color }: StatCardProps) {
  const colorStyles = COLORS[color];
  
  return (
    <div className={`rounded-xl p-5 border border-border/50 ${colorStyles.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorStyles.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorStyles.text}`} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
      )}
    </div>
  );
}

// ── Performance Bar ───────────────────────────────────────────────

function PerformanceBar({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v >= 90) return 'bg-success';
    if (v >= 75) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold text-foreground">{value}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
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
            <div key={i} className="bg-muted rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary rounded-lg" />
                <div className="h-4 w-20 bg-secondary rounded" />
              </div>
              <div className="h-7 w-24 bg-secondary rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
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
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning/80 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-warning">Sample Analytics Data</h4>
          <p className="text-sm text-warning mt-0.5">
            This section displays sample analytics data. Real-time data will be integrated once the analytics backend is connected.
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div>
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4">
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
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4">
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-primary/10 p-6">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card/80 rounded-lg p-4 border border-primary/10">
            <div className="text-sm text-muted-foreground mb-1">Peak Hour</div>
            <div className="text-lg font-semibold text-foreground">7:00 - 9:00 AM</div>
            <div className="text-xs text-muted-foreground mt-1">Highest passenger volume</div>
          </div>
          <div className="bg-card/80 rounded-lg p-4 border border-primary/10">
            <div className="text-sm text-muted-foreground mb-1">Busiest Day</div>
            <div className="text-lg font-semibold text-foreground">Monday</div>
            <div className="text-xs text-muted-foreground mt-1">35% higher than average</div>
          </div>
          <div className="bg-card/80 rounded-lg p-4 border border-primary/10">
            <div className="text-sm text-muted-foreground mb-1">Average Wait Time</div>
            <div className="text-lg font-semibold text-foreground">12 minutes</div>
            <div className="text-xs text-muted-foreground mt-1">At major stops</div>
          </div>
          <div className="bg-card/80 rounded-lg p-4 border border-primary/10">
            <div className="text-sm text-muted-foreground mb-1">Passenger Satisfaction</div>
            <div className="text-lg font-semibold text-foreground">4.2 / 5.0</div>
            <div className="text-xs text-muted-foreground mt-1">Based on 156 reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
}
