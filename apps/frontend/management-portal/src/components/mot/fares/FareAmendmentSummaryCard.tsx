'use client';

import React from 'react';
import {
  Calendar,
  FileText,
  User,
  Hash,
  BookOpen,
  Clock,
  Info,
} from 'lucide-react';
import {
  FareAmendment,
  AMENDMENT_STATUS_COLORS,
  PERMIT_TYPE_LABELS,
  PERMIT_TYPES,
} from '@/data/mot/fares';

interface FareAmendmentSummaryCardProps {
  amendment: FareAmendment;
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="text-sm text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function FareAmendmentSummaryCard({ amendment }: FareAmendmentSummaryCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get fare range for each permit type (stage 1 and max stage)
  const firstEntry = amendment.matrix[0];
  const lastEntry = amendment.matrix[amendment.matrix.length - 1];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{amendment.title}</h2>
            <p className="text-sm text-gray-500 mt-1 font-mono">{amendment.referenceNumber}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
              AMENDMENT_STATUS_COLORS[amendment.status]
            }`}
          >
            {amendment.status}
          </span>
        </div>
        {amendment.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{amendment.description}</p>
        )}
      </div>

      {/* Details Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-1">
          <DetailRow icon={Calendar} label="Effective Date" value={formatDate(amendment.effectiveDate)} />
          <DetailRow icon={Clock} label="Approved Date" value={formatDate(amendment.approvedDate)} />
          <DetailRow icon={User} label="Approved By" value={amendment.approvedBy || '—'} />
          <DetailRow icon={BookOpen} label="Gazette Number" value={amendment.gazetteNumber || '—'} />
          <DetailRow icon={Hash} label="Maximum Stages" value={String(amendment.maxStages)} />
          <DetailRow
            icon={FileText}
            label="Last Updated"
            value={formatDate(amendment.updatedAt)}
          />
        </div>
      </div>

      {/* Fare Range Summary */}
      {firstEntry && lastEntry && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Fare Range Summary (Rs.)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERMIT_TYPES.map((pt) => (
              <div key={pt} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">{PERMIT_TYPE_LABELS[pt]}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {firstEntry.fares[pt].toFixed(2)} – {lastEntry.fares[pt].toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Stage 1 – {amendment.maxStages}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {amendment.remarks && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">{amendment.remarks}</p>
          </div>
        </div>
      )}
    </div>
  );
}
