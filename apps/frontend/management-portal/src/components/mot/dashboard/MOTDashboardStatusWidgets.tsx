'use client';

import { RouteStatusItem, PermitStatusItem } from '@/data/mot/dashboard';

// ── Progress bar component ────────────────────────────────────────

function StatusBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="h-3 bg-gray-100 rounded-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = routeStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Route Status</h3>
        <span className="text-xs text-gray-500">{total} total</span>
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
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900">{item.value}</span>
              <span className="text-[10px] text-gray-400">({item.percentage}%)</span>
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="h-3 bg-gray-100 rounded-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = permitStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Permit Status</h3>
        <span className="text-xs text-gray-500">{total.toLocaleString()} total</span>
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
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900">{item.value.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
