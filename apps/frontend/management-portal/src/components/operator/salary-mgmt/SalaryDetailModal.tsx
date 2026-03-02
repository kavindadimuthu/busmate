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
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{record.staffName}</h2>
            <p className="text-xs text-gray-500">
              {roleLabel} · {dateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Bus className="h-3.5 w-3.5 text-gray-400" />
              Bus: <span className="font-medium text-gray-800">{record.busAssigned}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              Route: <span className="font-medium text-gray-800">{record.routeAssigned}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Award className="h-3.5 w-3.5 text-gray-400" />
              Performance:{' '}
              <span className="font-medium text-gray-800">
                {record.performanceRating === 'BELOW_AVERAGE'
                  ? 'Below Average'
                  : record.performanceRating.charAt(0) + record.performanceRating.slice(1).toLowerCase()}
              </span>
              <span className="text-gray-400">· On-time: {record.onTimePercentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* ── Salary breakdown ─────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              Salary Breakdown
            </h3>

            <div className="space-y-1.5">
              {/* Base */}
              <LineItem label="Base Daily Rate" amount={record.baseSalary} />

              {/* Bonuses */}
              {record.bonuses.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider mb-1">Bonuses</p>
                  {record.bonuses.map((b, i) => (
                    <LineItem key={i} label={b.label} amount={b.amount} type="bonus" />
                  ))}
                </div>
              )}

              {/* Deductions */}
              {record.deductions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-red-600 uppercase tracking-wider mb-1">Deductions</p>
                  {record.deductions.map((d, i) => (
                    <LineItem key={i} label={d.label} amount={d.amount} type="deduction" />
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Gross Salary</span>
                  <span className="font-medium text-gray-700">Rs {record.grossSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Net Pay</span>
                  <span className="text-gray-900">Rs {record.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment info ─────────────────────────────────────── */}
          <div className="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <p>Payment Method: <span className="font-medium text-gray-700">{record.paymentMethod.replace('_', ' ')}</span></p>
              {record.bankAccount && <p className="mt-0.5">Account: {record.bankAccount}</p>}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                STATUS_STYLES[record.paymentStatus] ?? 'bg-gray-100 text-gray-600'
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
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
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
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          type === 'bonus'
            ? 'text-green-600'
            : type === 'deduction'
            ? 'text-red-600'
            : 'text-gray-800'
        }`}
      >
        {type === 'bonus' && '+'}
        {type === 'deduction' && '-'}
        Rs {amount.toLocaleString()}
      </span>
    </div>
  );
}
