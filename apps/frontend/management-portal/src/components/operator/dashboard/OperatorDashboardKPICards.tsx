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
  if (trend === 'stable') return <Minus className="h-3 w-3 text-gray-400" />;
  const isGood = (trend === 'up') === positive;
  const cls = isGood ? 'text-green-600' : 'text-red-600';
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
  blue:   'bg-blue-50   border-blue-200',
  teal:   'bg-teal-50   border-teal-200',
  green:  'bg-green-50  border-green-200',
  red:    'bg-red-50    border-red-200',
  purple: 'bg-purple-50 border-purple-200',
  amber:  'bg-amber-50  border-amber-200',
};

const ICON_BG: Record<KPIMetric['color'], string> = {
  blue:   'bg-blue-100   text-blue-600',
  teal:   'bg-teal-100   text-teal-600',
  green:  'bg-green-100  text-green-600',
  red:    'bg-red-100    text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  amber:  'bg-amber-100  text-amber-600',
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
    if (kpi.trend === 'stable') return 'text-gray-500';
    const isGood = (kpi.trend === 'up') === kpi.trendPositiveIsGood;
    return isGood ? 'text-green-600' : 'text-red-600';
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
        <p className="text-2xl font-bold text-gray-900 leading-none">{kpi.value}</p>
        <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="w-20 h-7 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-7 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded mt-2" />
      </div>
      <div className="h-3 w-28 bg-gray-200 rounded" />
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
