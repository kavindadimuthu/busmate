'use client';

import { ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { RoutePerformanceItem } from '@/data/operator/dashboard';

function TrendIcon({ trend }: { trend: RoutePerformanceItem['trend'] }) {
  if (trend === 'stable') return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (trend === 'up') return <ArrowUp className="h-3 w-3 text-success/80" />;
  return <ArrowDown className="h-3 w-3 text-destructive/80" />;
}

function OnTimeRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? 'bg-success/15 text-success' :
    rate >= 80 ? 'bg-warning/15 text-warning' :
    'bg-destructive/15 text-destructive';

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

interface OperatorDashboardRoutePerformanceProps {
  routes: RoutePerformanceItem[];
  loading?: boolean;
}

export function OperatorDashboardRoutePerformance({ routes, loading = false }: OperatorDashboardRoutePerformanceProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Route Performance</h3>
        <Link
          href="/operator/routes"
          className="text-xs text-primary hover:text-primary flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Route</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Trips</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Passengers</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Revenue</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">On-Time</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-muted transition-colors">
                <td className="py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      <span className="text-primary mr-1">#{route.routeNumber}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{route.routeName}</p>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-foreground">{route.tripsToday}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-foreground">{route.passengers.toLocaleString()}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs font-medium text-foreground">
                    Rs {(route.revenue / 1000).toFixed(0)}K
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <OnTimeRateBadge rate={route.onTimeRate} />
                </td>
                <td className="py-2.5 text-center">
                  <div className="flex justify-center">
                    <TrendIcon trend={route.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
