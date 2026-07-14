'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { TrackingStatsCardMetric } from '@/types/LocationTracking';

// ── Props ─────────────────────────────────────────────────────────

interface LocationTrackingStatsCardsProps {
  metrics: TrackingStatsCardMetric[];
  loading?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  lastUpdate?: Date | null;
}

// ── Component ─────────────────────────────────────────────────────

export function LocationTrackingStatsCards({
  metrics,
  loading = false,
  isCollapsed,
  onToggleCollapse,
  lastUpdate,
}: LocationTrackingStatsCardsProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300">
      {/* Header - Always visible */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-5 py-3 bg-muted hover:bg-muted transition-colors border-b border-border"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground/80">Fleet Overview</h3>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated{' '}
              {lastUpdate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isCollapsed ? 'Show stats' : 'Hide stats'}
          </span>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
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
          <StatsCardGrid className="lg:grid-cols-6">
            {metrics.map((m) => (
              <StatsCard
                key={m.id}
                title={m.label}
                value={m.value}
                icon={<m.icon className="h-5 w-5" />}
                trend={{
                  value: parseFloat(m.trendValue) || 0,
                  direction: m.trend === 'up' ? 'up' : m.trend === 'down' ? 'down' : 'neutral',
                }}
              />
            ))}
          </StatsCardGrid>
        </div>
      </div>
    </div>
  );
}
