'use client';

import { ArrowUp, ArrowDown, Minus, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { OperatorPerformanceItem } from '@/data/mot/dashboard';

function TrendIcon({ trend }: { trend: OperatorPerformanceItem['trend'] }) {
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

function SatisfactionStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= Math.floor(rating)
              ? 'text-warning/70 fill-amber-400'
              : star <= rating
              ? 'text-warning/70 fill-amber-200'
              : 'text-muted-foreground/30 fill-gray-200'
          }`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
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
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Top Operators</h3>
        <Link
          href="/mot/users?type=operators"
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
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Operator</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Fleet</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Routes</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">On-Time</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Satisfaction</th>
              <th className="pb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {operators.map((op, index) => (
              <tr key={op.id} className="hover:bg-muted transition-colors">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {op.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-foreground">{op.fleetSize}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-foreground">{op.activeRoutes}</span>
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
