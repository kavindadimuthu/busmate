'use client';

import React, { useState } from 'react';
import {
  Wrench, CheckCircle, Clock, AlertCircle, XCircle, Calendar,
  DollarSign, User, Building2, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';
import type { MaintenanceRecord, MaintenanceStatus, MaintenanceType, OperatorBus } from '@/data/operator/buses';

interface BusMaintenanceTabProps {
  bus: OperatorBus;
}

const STATUS_META: Record<MaintenanceStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  SCHEDULED:   { label: 'Scheduled',   icon: <Clock       className="w-4 h-4" />, classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', icon: <Wrench      className="w-4 h-4" />, classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  COMPLETED:   { label: 'Completed',   icon: <CheckCircle className="w-4 h-4" />, classes: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle     className="w-4 h-4" />, classes: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const TYPE_META: Record<MaintenanceType, { label: string; color: string }> = {
  ROUTINE:    { label: 'Routine',    color: 'bg-green-100 text-green-700' },
  REPAIR:     { label: 'Repair',     color: 'bg-orange-100 text-orange-700' },
  INSPECTION: { label: 'Inspection', color: 'bg-blue-100 text-blue-700' },
  OVERHAUL:   { label: 'Overhaul',   color: 'bg-red-100 text-red-700' },
};

function formatDate(iso?: string) {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function formatCost(val?: number) {
  if (!val) return null;
  return `LKR ${val.toLocaleString()}`;
}

function MaintenanceCard({ record }: { record: MaintenanceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const sm = STATUS_META[record.status];
  const tm = TYPE_META[record.type];
  const hasDetails = !!(record.technician || record.workshopName || record.cost || record.partsReplaced?.length || record.notes);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${sm.classes}`}>
              {sm.icon}
              {sm.label}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">{record.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {record.completedDate
                ? `Completed: ${formatDate(record.completedDate)}`
                : `Scheduled: ${formatDate(record.scheduledDate)}`}
            </span>
            {record.mileageAtService && (
              <span>{record.mileageAtService.toLocaleString()} km</span>
            )}
            {record.cost && (
              <span className="flex items-center gap-1 text-green-700">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCost(record.cost)}
              </span>
            )}
          </div>
        </div>

        {hasDetails && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
          {record.technician && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>Technician: <strong>{record.technician}</strong></span>
            </div>
          )}
          {record.workshopName && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>Workshop: <strong>{record.workshopName}</strong></span>
            </div>
          )}
          {record.partsReplaced && record.partsReplaced.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Parts replaced:</p>
              <div className="flex flex-wrap gap-1.5">
                {record.partsReplaced.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {record.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              {record.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BusMaintenanceTab({ bus }: BusMaintenanceTabProps) {
  const [filter, setFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const records = bus.maintenanceRecords;

  const filtered = filter === 'ALL' ? records : records.filter(r => r.status === filter);

  const upcoming  = records.filter(r => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS');
  const completed = records.filter(r => r.status === 'COMPLETED');
  const totalCost = completed.reduce((a, r) => a + (r.cost ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: records.length,   cls: 'bg-gray-50 border-gray-200' },
          { label: 'Upcoming',      value: upcoming.length,  cls: 'bg-blue-50 border-blue-200' },
          { label: 'Completed',     value: completed.length, cls: 'bg-green-50 border-green-200' },
          { label: 'Total Cost',    value: totalCost > 0 ? `LKR ${totalCost.toLocaleString()}` : '—', cls: 'bg-purple-50 border-purple-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== 'ALL' && (
              <span className="ml-1 opacity-70">({records.filter(r => r.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No maintenance records match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => <MaintenanceCard key={r.id} record={r} />)}
        </div>
      )}
    </div>
  );
}
