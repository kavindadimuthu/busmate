'use client';

import React from 'react';
import type { SalaryRecord } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryBreakdownPanelProps {
  /** All salary records (filtered by current filters). */
  records: SalaryRecord[];
  /** Show skeleton loading state. */
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Panel showing salary breakdown by staff member, aggregating across
 * the visible date range. Displays a bar chart of total net salary
 * per person, sorted by amount.
 */
export function SalaryBreakdownPanel({ records, loading }: SalaryBreakdownPanelProps) {
  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32 h-3.5 bg-gray-200 rounded" />
              <div className="flex-1 h-3 bg-gray-100 rounded-full" />
              <div className="w-24 h-3.5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Aggregate per staff
  const staffMap = new Map<string, { name: string; role: string; total: number; count: number }>();
  for (const r of records) {
    const existing = staffMap.get(r.staffId);
    if (existing) {
      existing.total += r.netSalary;
      existing.count += 1;
    } else {
      staffMap.set(r.staffId, { name: r.staffName, role: r.role, total: r.netSalary, count: 1 });
    }
  }

  const staffList = Array.from(staffMap.values()).sort((a, b) => b.total - a.total);
  const maxTotal = staffList.length > 0 ? Math.max(...staffList.map((s) => s.total)) : 1;

  const COLORS: Record<string, string> = {
    DRIVER: '#3b82f6',
    CONDUCTOR: '#8b5cf6',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Salary by Staff Member</h3>

      {staffList.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          No salary data available for current filters
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((staff) => (
            <div key={staff.name} className="flex items-center gap-3">
              {/* Name & role */}
              <div className="w-36 min-w-[9rem] shrink-0">
                <p className="text-sm font-medium text-gray-800 truncate">{staff.name}</p>
                <p className="text-[10px] text-gray-400">
                  {staff.role === 'DRIVER' ? 'Driver' : 'Conductor'} · {staff.count} days
                </p>
              </div>

              {/* Bar */}
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(staff.total / maxTotal) * 100}%`,
                    backgroundColor: COLORS[staff.role] ?? '#6b7280',
                  }}
                />
              </div>

              {/* Value */}
              <div className="w-28 text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  Rs {staff.total.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
