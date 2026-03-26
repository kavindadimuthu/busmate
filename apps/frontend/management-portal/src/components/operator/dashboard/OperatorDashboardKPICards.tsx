'use client';

import { ArrowDown, ArrowUp, Minus, Bus, DollarSign, Route, Clock, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KPIMetric } from '@/data/operator/dashboard';

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

// ── Icon mapping ──────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  'kpi-fleet':        Bus,
  'kpi-revenue':      DollarSign,
  'kpi-active-trips': Route,
  'kpi-ontime':       Clock,
  'kpi-staff':        Users,
  'kpi-maintenance':  Wrench,
};

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

// ── Single card ───────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: KPIMetric }) {
  const Icon = ICON_MAP[kpi.id] || Bus;
  const trendColor = (() => {
    if (kpi.trend === 'stable') return 'text-muted-foreground';
    const isGood = (kpi.trend === 'up') === kpi.trendPositiveIsGood;
    return isGood ? 'text-success' : 'text-destructive';
  })();

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${BG[kpi.color]}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${ICON_BG[kpi.color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <Sparkline data={kpi.sparkData} color={SPARK_COLOR[kpi.color]} />
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{kpi.value}</p>
        <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
      </div>

      {/* Trend */}
      <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
        <TrendIcon trend={kpi.trend} positive={kpi.trendPositiveIsGood} />
        <span>{kpi.trendValue}</span>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-muted p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-20 h-7 bg-muted rounded" />
      </div>
      <div>
        <div className="h-7 w-24 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded mt-2" />
      </div>
      <div className="h-3 w-28 bg-muted rounded" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

interface OperatorDashboardKPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

export function OperatorDashboardKPICards({ kpis, loading = false }: OperatorDashboardKPICardsProps) {
  if (loading || kpis.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => <KPICard key={kpi.id} kpi={kpi} />)}
    </div>
  );
}
