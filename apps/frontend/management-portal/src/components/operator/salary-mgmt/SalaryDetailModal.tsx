'use client';

import React from 'react';
import { X, DollarSign, Clock, Award, Bus, MapPin, Star } from 'lucide-react';
import type { SalaryRecord } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryDetailModalProps {
  /** The salary record to display (null = hidden). */
  record: SalaryRecord | null;
  /** Callback to close the modal. */
  onClose: () => void;
}

// ── Status colours ────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-success/15 text-success',
  PENDING: 'bg-warning/15 text-warning',
  PROCESSING: 'bg-primary/15 text-primary',
  FAILED: 'bg-destructive/15 text-destructive',
};

// ── Component ─────────────────────────────────────────────────────

/**
 * Modal overlay displaying full details of a salary record.
 *
 * Includes salary breakdown with individual bonus and deduction
 * line items, performance metrics, and payment information.
 */
export function SalaryDetailModal({ record, onClose }: SalaryDetailModalProps) {
  if (!record) return null;

  const roleLabel = record.role === 'DRIVER' ? 'Driver' : 'Conductor';
  const dt = new Date(record.periodStart);
  const dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">{record.staffName}</h2>
            <p className="text-xs text-muted-foreground">
              {roleLabel} · {dateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Quick stats ──────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <QuickStat icon={Clock} label="Hours" value={`${record.totalHours.toFixed(1)}h`} />
            <QuickStat icon={Bus} label="Trips" value={String(record.tripsCompleted)} />
            <QuickStat icon={Star} label="Rating" value={`${record.customerRating.toFixed(1)}/5`} />
          </div>

          {/* ── Assignment ───────────────────────────────────────── */}
          <div className="rounded-lg bg-muted p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bus className="h-3.5 w-3.5 text-muted-foreground/70" />
              Bus: <span className="font-medium text-foreground">{record.busAssigned}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
              Route: <span className="font-medium text-foreground">{record.routeAssigned}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-muted-foreground/70" />
              Performance:{' '}
              <span className="font-medium text-foreground">
                {record.performanceRating === 'BELOW_AVERAGE'
                  ? 'Below Average'
                  : record.performanceRating.charAt(0) + record.performanceRating.slice(1).toLowerCase()}
              </span>
              <span className="text-muted-foreground/70">· On-time: {record.onTimePercentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* ── Salary breakdown ─────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground/70" />
              Salary Breakdown
            </h3>

            <div className="space-y-1.5">
              {/* Base */}
              <LineItem label="Base Daily Rate" amount={record.baseSalary} />

              {/* Bonuses */}
              {record.bonuses.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-success uppercase tracking-wider mb-1">Bonuses</p>
                  {record.bonuses.map((b, i) => (
                    <LineItem key={i} label={b.label} amount={b.amount} type="bonus" />
                  ))}
                </div>
              )}

              {/* Deductions */}
              {record.deductions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-destructive uppercase tracking-wider mb-1">Deductions</p>
                  {record.deductions.map((d, i) => (
                    <LineItem key={i} label={d.label} amount={d.amount} type="deduction" />
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Gross Salary</span>
                  <span className="font-medium text-foreground/80">Rs {record.grossSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Net Pay</span>
                  <span className="text-foreground">Rs {record.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment info ─────────────────────────────────────── */}
          <div className="rounded-lg border border-border p-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <p>Payment Method: <span className="font-medium text-foreground/80">{record.paymentMethod.replace('_', ' ')}</span></p>
              {record.bankAccount && <p className="mt-0.5">Account: {record.bankAccount}</p>}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                STATUS_STYLES[record.paymentStatus] ?? 'bg-muted text-muted-foreground'
              }`}
            >
              {record.paymentStatus.charAt(0) + record.paymentStatus.slice(1).toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Internal helpers ──────────────────────────────────────────────

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground/70 mb-1" />
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground/70">{label}</p>
    </div>
  );
}

function LineItem({
  label,
  amount,
  type,
}: {
  label: string;
  amount: number;
  type?: 'bonus' | 'deduction';
}) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          type === 'bonus'
            ? 'text-success'
            : type === 'deduction'
            ? 'text-destructive'
            : 'text-foreground'
        }`}
      >
        {type === 'bonus' && '+'}
        {type === 'deduction' && '-'}
        Rs {amount.toLocaleString()}
      </span>
    </div>
  );
}
