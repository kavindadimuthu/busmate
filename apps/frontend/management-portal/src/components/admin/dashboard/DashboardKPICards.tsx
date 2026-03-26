'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { KPIMetric } from '@/data/admin/dashboard-v2';

// ── Mini sparkline ────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 28;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} className="overflow-visible opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ── Trend icon ────────────────────────────────────────────────────

function TrendIcon({ trend, positive }: { trend: KPIMetric['trend']; positive: boolean }) {
  if (trend === 'stable') return <Minus className="h-3 w-3 text-muted-foreground" />;
  const isGood = (trend === 'up') === positive;
  const cls = isGood ? 'text-success' : 'text-destructive';
  return trend === 'up'
    ? <ArrowUp className={`h-3 w-3 ${cls}`} />
    : <ArrowDown className={`h-3 w-3 ${cls}`} />;
}

// ── Color maps ────────────────────────────────────────────────────

const BG: Record<KPIMetric['color'], string> = {
  blue:   'bg-primary/10   border-primary/20',
  teal:   'bg-primary/10   border-teal-200',
  green:  'bg-success/10  border-success/20',
  red:    'bg-destructive/10    border-destructive/20',
  purple: 'bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-200))]',
  amber:  'bg-warning/10  border-warning/20',
};

const ICON_BG: Record<KPIMetric['color'], string> = {
  blue:   'bg-primary/15   text-primary',
  teal:   'bg-teal-100   text-teal-600',
  green:  'bg-success/15  text-success',
  red:    'bg-destructive/15    text-destructive',
  purple: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-600))]',
  amber:  'bg-warning/15  text-warning',
};

const SPARK_COLOR: Record<KPIMetric['color'], string> = {
  blue:   '#3b82f6',
  teal:   '#14b8a6',
  green:  '#22c55e',
  red:    '#ef4444',
  purple: '#a855f7',
  amber:  '#f59e0b',
};

// ── Card ──────────────────────────────────────────────────────────

function KPICard({ metric }: { metric: KPIMetric }) {
  const trendColor =
    metric.trend === 'stable'
      ? 'text-muted-foreground'
      : (metric.trend === 'up') === metric.trendPositiveIsGood
      ? 'text-success'
      : 'text-destructive';

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${BG[metric.color]}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground leading-tight">{metric.label}</p>
        <Sparkline data={metric.sparkData} color={SPARK_COLOR[metric.color]} />
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground tracking-tight">{metric.value}</p>

      {/* Trend */}
      <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
        <TrendIcon trend={metric.trend} positive={metric.trendPositiveIsGood} />
        <span>{metric.trendValue}</span>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-7 bg-muted rounded w-20" />
      </div>
      <div className="h-7 bg-muted rounded w-32 mb-3" />
      <div className="h-3 bg-muted rounded w-28" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

interface DashboardKPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

export function DashboardKPICards({ kpis, loading = false }: DashboardKPICardsProps) {
  if (loading || kpis.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} metric={kpi} />
      ))}
    </div>
  );
}
