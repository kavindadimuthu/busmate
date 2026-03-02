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
  ACTIVE: { label: 'Active', style: 'bg-green-100 text-green-800', Icon: CheckCircle },
  INACTIVE: { label: 'Inactive', style: 'bg-gray-100 text-gray-700', Icon: XCircle },
  PENDING: { label: 'Pending Review', style: 'bg-yellow-100 text-yellow-800', Icon: Clock },
  EXPIRED: { label: 'Expired', style: 'bg-red-100 text-red-800', Icon: XCircle },
};

const PERMIT_TYPE_CONFIG: Record<string, { label: string; style: string }> = {
  REGULAR: { label: 'Regular Service', style: 'bg-blue-100 text-blue-800' },
  SPECIAL: { label: 'Special Service', style: 'bg-purple-100 text-purple-800' },
  TEMPORARY: { label: 'Temporary Permit', style: 'bg-orange-100 text-orange-800' },
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
  const statusCfg = STATUS_CONFIG[permit.status] ?? { label: permit.status, style: 'bg-gray-100 text-gray-700', Icon: FileText };
  const typeCfg = PERMIT_TYPE_CONFIG[permit.permitType] ?? { label: permit.permitType, style: 'bg-gray-100 text-gray-700' };
  const StatusIcon = statusCfg.Icon;
  const expired = isExpired(permit.expiryDate);
  const expiringSoon = !expired && isExpiringSoon(permit.expiryDate);
  const daysLeft = getDaysUntilExpiry(permit.expiryDate);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-mono">{permit.permitNumber}</h2>
            <p className="text-sm text-gray-500">{permit.routeGroupName}</p>
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
          expired ? 'bg-red-50 text-red-800 border-b border-red-100' : 'bg-orange-50 text-orange-800 border-b border-orange-100'
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
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="Issue Date"
          value={formatDate(permit.issueDate)}
        />
        <InfoItem
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="Expiry Date"
          value={formatDate(permit.expiryDate)}
          valueClass={expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-orange-600 font-semibold' : ''}
        />
        <InfoItem
          icon={<RouteIcon className="w-4 h-4 text-gray-400" />}
          label="Route Group Code"
          value={permit.routeGroupCode}
        />
        <InfoItem
          icon={<Bus className="w-4 h-4 text-gray-400" />}
          label="Max Buses Allowed"
          value={String(permit.maximumBusAssigned)}
        />
        <InfoItem
          icon={<FileText className="w-4 h-4 text-gray-400" />}
          label="Issued By"
          value={permit.issuedBy}
          span={2}
        />
        {permit.notes && (
          <InfoItem
            icon={<FileText className="w-4 h-4 text-gray-400" />}
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
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-medium text-gray-900 ${valueClass ?? ''}`}>{value}</p>
    </div>
  );
}
