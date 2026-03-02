'use client';

import React from 'react';
import { SALARY_RULES, type SalaryRule } from '@/data/operator/salary';

// ── Component ─────────────────────────────────────────────────────

/**
 * Panel displaying the salary calculation rules for each role.
 *
 * Shows base daily rate, overtime rate, trip bonus, and
 * performance multipliers in a clear, readable format.
 */
export function SalaryRulesPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Salary Rules</h3>
      <p className="text-xs text-gray-400 mb-5">
        Predefined salary calculation rules applied per role
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SALARY_RULES.map((rule) => (
          <RuleCard key={rule.role} rule={rule} />
        ))}
      </div>
    </div>
  );
}

// ── Rule card ─────────────────────────────────────────────────────

function RuleCard({ rule }: { rule: SalaryRule }) {
  const roleLabel = rule.role === 'DRIVER' ? 'Driver' : 'Conductor';
  const roleColor = rule.role === 'DRIVER'
    ? 'border-blue-200 bg-blue-50/50'
    : 'border-purple-200 bg-purple-50/50';

  const perfRows = Object.entries(rule.performanceMultiplier).map(([rating, multiplier]) => ({
    rating,
    label: rating === 'BELOW_AVERAGE' ? 'Below Avg' : rating.charAt(0) + rating.slice(1).toLowerCase(),
    multiplier,
  }));

  return (
    <div className={`rounded-lg border p-4 ${roleColor}`}>
      <h4 className="text-sm font-semibold text-gray-800 mb-3">{roleLabel}</h4>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-gray-500">Base Daily Rate</dt>
          <dd className="font-semibold text-gray-800">Rs {rule.baseDailyRate.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Overtime Rate (per hour)</dt>
          <dd className="font-semibold text-gray-800">Rs {rule.overtimeHourlyRate.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Bonus per Trip</dt>
          <dd className="font-semibold text-gray-800">Rs {rule.bonusPerTrip.toLocaleString()}</dd>
        </div>
      </dl>

      {/* Performance multipliers */}
      <div className="mt-3 pt-3 border-t border-gray-200/60">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          Performance Multipliers
        </p>
        <div className="grid grid-cols-2 gap-1">
          {perfRows.map(({ rating, label, multiplier }) => (
            <div
              key={rating}
              className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-white/60"
            >
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold text-gray-800">×{multiplier.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
