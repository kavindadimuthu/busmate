'use client';

import { ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { RoutePerformanceItem } from '@/data/operator/dashboard';

function TrendIcon({ trend }: { trend: RoutePerformanceItem['trend'] }) {
  if (trend === 'stable') return <Minus className="h-3 w-3 text-gray-400" />;
  if (trend === 'up') return <ArrowUp className="h-3 w-3 text-green-500" />;
  return <ArrowDown className="h-3 w-3 text-red-500" />;
}

function OnTimeRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? 'bg-green-100 text-green-700' :
    rate >= 80 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

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
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Route Performance</h3>
        <Link
          href="/operator/routes"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Trips</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Passengers</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Revenue</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">On-Time</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      <span className="text-blue-600 mr-1">#{route.routeNumber}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{route.routeName}</p>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-gray-700">{route.tripsToday}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-gray-700">{route.passengers.toLocaleString()}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs font-medium text-gray-900">
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
