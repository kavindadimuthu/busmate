'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { TrackingStatsCardMetric } from '@/types/location-tracking';

// ── Props ─────────────────────────────────────────────────────────

interface TrackingStatsCardsProps {
  /** Array of stat metrics to display */
  metrics: TrackingStatsCardMetric[];
  /** Loading state */
  loading?: boolean;
  /** Whether the stats section is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Last update timestamp */
  lastUpdate?: Date | null;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Collapsible stats cards section for the location tracking page.
 * Shows key metrics about tracked buses with the ability to collapse
 * to give more space to the map view.
 */
export function TrackingStatsCards({
  metrics,
  loading = false,
  isCollapsed,
  onToggleCollapse,
  lastUpdate,
}: TrackingStatsCardsProps) {
  // Convert TrackingStatsCardMetric to StatsCardMetric
  const statsMetrics: StatsCardMetric[] = metrics.map((m) => ({
    label: m.label,
    value: m.value,
    trend: m.trend,
    trendValue: m.trendValue,
    trendPositiveIsGood: m.trendPositiveIsGood,
    color: m.color,
    sparkData: m.sparkData,
    icon: m.icon,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header - Always visible */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700">Fleet Overview</h3>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {isCollapsed ? 'Show stats' : 'Hide stats'}
          </span>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}
      >
        <div className="p-5">
          <StatsCardsContainer
            metrics={statsMetrics}
            loading={loading}
            columns={6}
          />
        </div>
      </div>
    </div>
  );
}
