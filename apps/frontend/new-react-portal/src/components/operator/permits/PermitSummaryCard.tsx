'use client';

import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Route as RouteIcon,
  Bus,
} from 'lucide-react';
import type { OperatorPermitDetail } from '@/data/operator/permits';

interface PermitSummaryCardProps {
  permit: OperatorPermitDetail;
}

const STATUS_CONFIG: Record<string, { label: string; style: string; Icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', style: 'bg-success/15 text-success', Icon: CheckCircle },
  INACTIVE: { label: 'Inactive', style: 'bg-muted text-foreground/80', Icon: XCircle },
  PENDING: { label: 'Pending Review', style: 'bg-warning/15 text-warning', Icon: Clock },
  EXPIRED: { label: 'Expired', style: 'bg-destructive/15 text-destructive', Icon: XCircle },
};

const PERMIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  REGULAR: { label: 'Regular Service', style: 'bg-primary/15 text-primary' },
  SPECIAL: { label: 'Special Service', style: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]' },
  TEMPORARY: { label: 'Temporary Permit', style: 'bg-warning/15 text-warning' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function isExpired(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr?: string) {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days <= 30 && days >= 0;
}

function getDaysUntilExpiry(dateStr?: string) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function PermitSummaryCard({ permit }: PermitSummaryCardProps) {
  const statusCfg = STATUS_CONFIG[permit.status] ?? { label: permit.status, style: 'bg-muted text-foreground/80', Icon: FileText };
  const typeCfg = PERMIT_TYPE_CONFIG[permit.permitType] ?? { label: permit.permitType, style: 'bg-muted text-foreground/80' };
  const StatusIcon = statusCfg.Icon;
  const expired = isExpired(permit.expiryDate);
  const expiringSoon = !expired && isExpiringSoon(permit.expiryDate);
  const daysLeft = getDaysUntilExpiry(permit.expiryDate);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-2.5 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-mono">{permit.permitNumber}</h2>
            <p className="text-sm text-muted-foreground">{permit.routeGroupName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusCfg.style}`}>
            <StatusIcon className="w-4 h-4" />
            {statusCfg.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeCfg.style}`}>
            {typeCfg.label}
          </span>
        </div>
      </div>

      {/* Expiry warning banner */}
      {(expired || expiringSoon) && (
        <div className={`px-6 py-3 flex items-center gap-2 text-sm font-medium ${
          expired ? 'bg-destructive/10 text-destructive border-b border-destructive/10' : 'bg-warning/10 text-warning border-b border-warning/10'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {expired
            ? 'This permit has expired. Please contact the Ministry of Transport to renew.'
            : `This permit expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renewal is recommended.`}
        </div>
      )}

      {/* Core info grid */}
      <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        <InfoItem
          icon={<Calendar className="w-4 h-4 text-muted-foreground/70" />}
          label="Issue Date"
          value={formatDate(permit.issueDate)}
        />
        <InfoItem
          icon={<Calendar className="w-4 h-4 text-muted-foreground/70" />}
          label="Expiry Date"
          value={formatDate(permit.expiryDate)}
          valueClass={expired ? 'text-destructive font-semibold' : expiringSoon ? 'text-warning font-semibold' : ''}
        />
        <InfoItem
          icon={<RouteIcon className="w-4 h-4 text-muted-foreground/70" />}
          label="Route Group Code"
          value={permit.routeGroupCode}
        />
        <InfoItem
          icon={<Bus className="w-4 h-4 text-muted-foreground/70" />}
          label="Max Buses Allowed"
          value={String(permit.maximumBusAssigned)}
        />
        <InfoItem
          icon={<FileText className="w-4 h-4 text-muted-foreground/70" />}
          label="Issued By"
          value={permit.issuedBy}
          span={2}
        />
        {permit.notes && (
          <InfoItem
            icon={<FileText className="w-4 h-4 text-muted-foreground/70" />}
            label="Notes"
            value={permit.notes}
            span={2}
          />
        )}
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  span?: number;
}

function InfoItem({ icon, label, value, valueClass, span }: InfoItemProps) {
  return (
    <div className={span ? `col-span-${span}` : ''}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-medium text-foreground ${valueClass ?? ''}`}>{value}</p>
    </div>
  );
}
