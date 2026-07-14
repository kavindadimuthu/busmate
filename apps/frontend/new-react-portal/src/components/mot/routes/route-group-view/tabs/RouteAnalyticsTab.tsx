'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Bus,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
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
        <StatsCardGrid className="lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
          ))}
        </StatsCardGrid>
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
        <StatsCardGrid className="lg:grid-cols-3">
          <StatsCard
            title="Total Trips"
            value={formatNumber(analytics.totalTrips)}
            icon={<Bus className="h-5 w-5" />}
            description="Completed trips"
          />
          <StatsCard
            title="Passengers"
            value={formatNumber(analytics.totalPassengers)}
            icon={<Users className="h-5 w-5" />}
            description={`~${Math.round(analytics.totalPassengers / analytics.totalTrips)} avg per trip`}
          />
          <StatsCard
            title="Avg Duration"
            value={`${analytics.avgTripDuration}m`}
            icon={<Clock className="h-5 w-5" />}
            description="Per trip"
          />
          <StatsCard
            title="On-Time Rate"
            value={`${analytics.avgOnTimePercentage}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            description="Arrival accuracy"
          />
          <StatsCard
            title="Revenue"
            value={formatCurrency(analytics.totalRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
            description="Total collections"
          />
          <StatsCard
            title="Active Schedules"
            value={analytics.activeSchedules}
            icon={<Calendar className="h-5 w-5" />}
            description="Currently running"
          />
        </StatsCardGrid>
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
