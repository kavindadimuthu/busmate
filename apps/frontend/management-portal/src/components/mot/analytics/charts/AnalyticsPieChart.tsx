'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import type { DistributionItem } from '@/data/mot/analytics';

ChartJS.register(ArcElement, Tooltip, Legend);

// ── Types ────────────────────────────────────────────────────────

interface AnalyticsPieChartProps {
  data: DistributionItem[];
  title?: string;
  subtitle?: string;
  type?: 'pie' | 'doughnut';
  showLegend?: boolean;
  showLabels?: boolean;
  height?: number;
  loading?: boolean;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (value: number) => string;
}

// ── Component ────────────────────────────────────────────────────

export function AnalyticsPieChart({
  data,
  title,
  subtitle,
  type = 'doughnut',
  showLegend = true,
  showLabels = true,
  height = 280,
  loading = false,
  centerLabel,
  centerValue,
  formatValue = (v) => v.toLocaleString(),
}: AnalyticsPieChartProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        {title && <div className="h-5 bg-secondary rounded w-40 mb-4" />}
        <div className="h-52 bg-muted rounded-full w-52 mx-auto" />
      </div>
    );
  }

  // Calculate percentages if not provided
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const dataWithPercentage = data.map((d) => ({
    ...d,
    percentage: d.percentage ?? ((d.value / total) * 100),
  }));

  const chartData = {
    labels: dataWithPercentage.map((d) => d.label),
    datasets: [
      {
        data: dataWithPercentage.map((d) => d.value),
        backgroundColor: dataWithPercentage.map((d) => d.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: type === 'doughnut' ? '60%' : '0%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.9)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const item = dataWithPercentage[context.dataIndex];
            return `${formatValue(item.value)} (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const ChartComponent = type === 'doughnut' ? Doughnut : Pie;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold text-foreground text-sm">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="relative" style={{ height, width: height }}>
          <ChartComponent data={chartData} options={options} />
          {type === 'doughnut' && centerValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground">{centerValue}</span>
              {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 space-y-2">
            {dataWithPercentage.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground/80 truncate">{item.label}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatValue(item.value)}
                    </span>
                  </div>
                  {showLabels && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
