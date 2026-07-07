'use client';

import { RouteStatusItem, PermitStatusItem } from '@/data/mot/dashboard';

// ── Progress bar component ────────────────────────────────────────

function StatusBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="h-full transition-all duration-500"
          style={{
            width: `${(item.value / total) * 100}%`,
            backgroundColor: item.color,
          }}
          title={`${item.label}: ${item.value}`}
        />
      ))}
    </div>
  );
}

// ── Route Status Component ────────────────────────────────────────

interface MOTDashboardRouteStatusProps {
  routeStatus: RouteStatusItem[];
  loading?: boolean;
}

export function MOTDashboardRouteStatus({ routeStatus, loading = false }: MOTDashboardRouteStatusProps) {
  if (loading || routeStatus.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-28 bg-muted rounded mb-4" />
        <div className="h-3 bg-muted rounded-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = routeStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Route Status</h3>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>

      {/* Status bar */}
      <StatusBar items={routeStatus} total={total} />

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {routeStatus.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{item.value}</span>
              <span className="text-[10px] text-muted-foreground">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Permit Status Component ───────────────────────────────────────

interface MOTDashboardPermitStatusProps {
  permitStatus: PermitStatusItem[];
  loading?: boolean;
}

export function MOTDashboardPermitStatus({ permitStatus, loading = false }: MOTDashboardPermitStatusProps) {
  if (loading || permitStatus.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-28 bg-muted rounded mb-4" />
        <div className="h-3 bg-muted rounded-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = permitStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Permit Status</h3>
        <span className="text-xs text-muted-foreground">{total.toLocaleString()} total</span>
      </div>

      {/* Status bar */}
      <StatusBar items={permitStatus} total={total} />

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {permitStatus.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{item.value.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
