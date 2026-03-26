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
  SCHEDULED:   { label: 'Scheduled',   icon: <Clock       className="w-4 h-4" />, classes: 'bg-primary/10 text-primary border-primary/20' },
  IN_PROGRESS: { label: 'In Progress', icon: <Wrench      className="w-4 h-4" />, classes: 'bg-warning/10 text-warning border-warning/20' },
  COMPLETED:   { label: 'Completed',   icon: <CheckCircle className="w-4 h-4" />, classes: 'bg-success/10 text-success border-success/20' },
  CANCELLED:   { label: 'Cancelled',   icon: <XCircle     className="w-4 h-4" />, classes: 'bg-muted text-muted-foreground border-border' },
};

const TYPE_META: Record<MaintenanceType, { label: string; color: string }> = {
  ROUTINE:    { label: 'Routine',    color: 'bg-success/15 text-success' },
  REPAIR:     { label: 'Repair',     color: 'bg-warning/15 text-orange-700' },
  INSPECTION: { label: 'Inspection', color: 'bg-primary/15 text-primary' },
  OVERHAUL:   { label: 'Overhaul',   color: 'bg-destructive/15 text-destructive' },
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
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
          <p className="text-sm font-medium text-foreground mt-1">{record.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
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
              <span className="flex items-center gap-1 text-success">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCost(record.cost)}
              </span>
            )}
          </div>
        </div>

        {hasDetails && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-muted-foreground/70 hover:text-muted-foreground p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 text-sm">
          {record.technician && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-muted-foreground/70" />
              <span>Technician: <strong>{record.technician}</strong></span>
            </div>
          )}
          {record.workshopName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 text-muted-foreground/70" />
              <span>Workshop: <strong>{record.workshopName}</strong></span>
            </div>
          )}
          {record.partsReplaced && record.partsReplaced.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Parts replaced:</p>
              <div className="flex flex-wrap gap-1.5">
                {record.partsReplaced.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-muted text-foreground/80 rounded text-xs border border-border">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {record.notes && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-warning">
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
          { label: 'Total Records', value: records.length,   cls: 'bg-muted border-border' },
          { label: 'Upcoming',      value: upcoming.length,  cls: 'bg-primary/10 border-primary/20' },
          { label: 'Completed',     value: completed.length, cls: 'bg-success/10 border-success/20' },
          { label: 'Total Cost',    value: totalCost > 0 ? `LKR ${totalCost.toLocaleString()}` : '—', cls: 'bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-200))]' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
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
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Wrench className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No maintenance records match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => <MaintenanceCard key={r.id} record={r} />)}
        </div>
      )}
    </div>
  );
}
