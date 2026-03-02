'use client';

import { ArrowUp, ArrowDown, Minus, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { OperatorPerformanceItem } from '@/data/mot/dashboard';

function TrendIcon({ trend }: { trend: OperatorPerformanceItem['trend'] }) {
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

function SatisfactionStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : star <= rating
              ? 'text-amber-400 fill-amber-200'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
      <span className="text-[10px] text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

interface MOTDashboardOperatorPerformanceProps {
  operators: OperatorPerformanceItem[];
  loading?: boolean;
}

export function MOTDashboardOperatorPerformance({ operators, loading = false }: MOTDashboardOperatorPerformanceProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Top Operators</h3>
        <Link
          href="/mot/users?type=operators"
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
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Fleet</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Routes</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">On-Time</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Satisfaction</th>
              <th className="pb-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {operators.map((op, index) => (
              <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                      {op.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-gray-700">{op.fleetSize}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-gray-700">{op.activeRoutes}</span>
                </td>
                <td className="py-2.5 text-center">
                  <OnTimeRateBadge rate={op.onTimeRate} />
                </td>
                <td className="py-2.5">
                  <SatisfactionStars rating={op.passengerSatisfaction} />
                </td>
                <td className="py-2.5 text-center">
                  <TrendIcon trend={op.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
