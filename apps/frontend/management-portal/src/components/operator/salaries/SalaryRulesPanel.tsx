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
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Salary Rules</h3>
      <p className="text-xs text-muted-foreground/70 mb-5">
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
    ? 'border-primary/20 bg-primary/10/50'
    : 'border-[hsl(var(--purple-200))] bg-[hsl(var(--purple-50))]/50';

  const perfRows = Object.entries(rule.performanceMultiplier).map(([rating, multiplier]) => ({
    rating,
    label: rating === 'BELOW_AVERAGE' ? 'Below Avg' : rating.charAt(0) + rating.slice(1).toLowerCase(),
    multiplier,
  }));

  return (
    <div className={`rounded-lg border p-4 ${roleColor}`}>
      <h4 className="text-sm font-semibold text-foreground mb-3">{roleLabel}</h4>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Base Daily Rate</dt>
          <dd className="font-semibold text-foreground">Rs {rule.baseDailyRate.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Overtime Rate (per hour)</dt>
          <dd className="font-semibold text-foreground">Rs {rule.overtimeHourlyRate.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Bonus per Trip</dt>
          <dd className="font-semibold text-foreground">Rs {rule.bonusPerTrip.toLocaleString()}</dd>
        </div>
      </dl>

      {/* Performance multipliers */}
      <div className="mt-3 pt-3 border-t border-border/60">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Performance Multipliers
        </p>
        <div className="grid grid-cols-2 gap-1">
          {perfRows.map(({ rating, label, multiplier }) => (
            <div
              key={rating}
              className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-card/60"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">×{multiplier.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
