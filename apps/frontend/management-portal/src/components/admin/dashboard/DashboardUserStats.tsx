'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Link from 'next/link';
import { ArrowUpRight, Users } from 'lucide-react';
import { UserDistribution } from '@/data/admin/dashboard-v2';

ChartJS.register(ArcElement, Tooltip);

interface DashboardUserStatsProps {
  userDistribution: UserDistribution[];
  loading?: boolean;
}

export function DashboardUserStats({ userDistribution, loading = false }: DashboardUserStatsProps) {
  if (loading || userDistribution.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-6" />
        <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  const total = userDistribution.reduce((s, u) => s + u.count, 0);

  const chartData = {
    labels: userDistribution.map((u) => u.type),
    datasets: [
      {
        data: userDistribution.map((u) => u.count),
        backgroundColor: userDistribution.map((u) => u.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.9)',
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()}`,
        },
      },
    },
  };

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">User Distribution</h3>
        </div>
        <Link
          href="/admin/users"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
        >
          Manage <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Donut chart */}
      <div className="relative w-32 h-32 mx-auto">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-foreground">{fmt(total)}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {userDistribution.map((u) => (
          <div key={u.type} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
              <span className="text-xs text-muted-foreground truncate">{u.type}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-foreground">{fmt(u.count)}</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right">
                {((u.count / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
