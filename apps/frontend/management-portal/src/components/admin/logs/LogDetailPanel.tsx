'use client';

import {
  ArrowLeft,
  Clock,
  User,
  Globe,
  Smartphone,
  MapPin,
  Shield,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Server,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import type { UserActivityLog, SecurityLog, ApplicationLog } from '@/data/admin/types';

type LogUnion = UserActivityLog | SecurityLog | ApplicationLog;

interface LogDetailPanelProps {
  log: LogUnion;
  logType: 'user-activity' | 'security' | 'application';
  onBack: () => void;
}

export function LogDetailPanel({ log, logType, onBack }: LogDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
      title="Copy"
    >
      {copied === label ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );

  const DetailRow = ({
    label,
    value,
    icon,
    copiable = false,
    badge,
  }: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    copiable?: boolean;
    badge?: React.ReactNode;
  }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[140px]">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-900 text-right">
        {badge || <span className="font-mono">{value}</span>}
        {copiable && <CopyButton text={value} label={label} />}
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> Error
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      default:
        return <span className="text-sm text-gray-900">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-red-50 text-red-700 border border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      low: 'bg-green-50 text-green-700 border border-green-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity] || 'bg-gray-100 text-gray-700'}`}>
        <Shield className="h-3 w-3" /> {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      ERROR: { className: 'bg-red-50 text-red-700 border border-red-200', icon: <XCircle className="h-3 w-3" /> },
      WARN: { className: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: <AlertTriangle className="h-3 w-3" /> },
      INFO: { className: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <Info className="h-3 w-3" /> },
      DEBUG: { className: 'bg-gray-50 text-gray-600 border border-gray-200', icon: <Terminal className="h-3 w-3" /> },
    };
    const c = config[level] || config.INFO;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${c.className}`}>
        {c.icon} {level}
      </span>
    );
  };

  const getTypeTitle = () => {
    switch (logType) {
      case 'user-activity':
        return { icon: <User className="h-5 w-5 text-green-600" />, label: 'User Activity Log', color: 'bg-green-50 border-green-200' };
      case 'security':
        return { icon: <Shield className="h-5 w-5 text-orange-600" />, label: 'Security Log', color: 'bg-orange-50 border-orange-200' };
      case 'application':
        return { icon: <Terminal className="h-5 w-5 text-purple-600" />, label: 'Application Log', color: 'bg-purple-50 border-purple-200' };
    }
  };

  const typeInfo = getTypeTitle();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${typeInfo.color}`}>
              {typeInfo.icon}
              {typeInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">{log.id}</p>
        </div>
      </div>

      {/* Common fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">General Information</h3>
        <DetailRow
          label="Log ID"
          value={log.id}
          icon={<ExternalLink className="h-3.5 w-3.5" />}
          copiable
        />
        <DetailRow
          label="Timestamp"
          value={log.timestamp}
          icon={<Clock className="h-3.5 w-3.5" />}
        />

        {/* User Activity specific */}
        {logType === 'user-activity' && (() => {
          const uLog = log as UserActivityLog;
          return (
            <>
              <DetailRow label="User" value={uLog.userName} icon={<User className="h-3.5 w-3.5" />} />
              <DetailRow label="User ID" value={uLog.userId} copiable />
              <DetailRow label="User Type" value={uLog.userType} />
              <DetailRow label="Action" value={uLog.action} />
              <DetailRow label="Status" value={uLog.status} badge={getStatusBadge(uLog.status)} />
              <DetailRow label="IP Address" value={uLog.ipAddress} icon={<Globe className="h-3.5 w-3.5" />} copiable />
              <DetailRow label="Device" value={uLog.device} icon={<Smartphone className="h-3.5 w-3.5" />} />
              <DetailRow label="Location" value={uLog.location} icon={<MapPin className="h-3.5 w-3.5" />} />
            </>
          );
        })()}

        {/* Security specific */}
        {logType === 'security' && (() => {
          const sLog = log as SecurityLog;
          return (
            <>
              <DetailRow label="Severity" value={sLog.severity} badge={getSeverityBadge(sLog.severity)} />
              <DetailRow
                label="Event Type"
                value={sLog.eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                icon={<Shield className="h-3.5 w-3.5" />}
              />
              {sLog.userName && <DetailRow label="User" value={sLog.userName} icon={<User className="h-3.5 w-3.5" />} />}
              {sLog.userId && <DetailRow label="User ID" value={sLog.userId} copiable />}
              <DetailRow label="IP Address" value={sLog.ipAddress} icon={<Globe className="h-3.5 w-3.5" />} copiable />
            </>
          );
        })()}

        {/* Application specific */}
        {logType === 'application' && (() => {
          const aLog = log as ApplicationLog;
          return (
            <>
              <DetailRow label="Level" value={aLog.level} badge={getLevelBadge(aLog.level)} />
              <DetailRow label="Service" value={aLog.service} icon={<Server className="h-3.5 w-3.5" />} />
            </>
          );
        })()}
      </div>

      {/* Details / Message section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Details</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {logType === 'user-activity'
            ? (log as UserActivityLog).details
            : logType === 'security'
              ? (log as SecurityLog).details
              : (log as ApplicationLog).message}
        </p>
      </div>

      {/* Security - User Agent */}
      {logType === 'security' && (log as SecurityLog).userAgent && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">User Agent</h3>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-gray-600 bg-gray-50 p-3 rounded-lg flex-1 break-all">
              {(log as SecurityLog).userAgent}
            </code>
            <CopyButton text={(log as SecurityLog).userAgent} label="userAgent" />
          </div>
        </div>
      )}

      {/* Application - Stack Trace */}
      {logType === 'application' && (log as ApplicationLog).stackTrace && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Stack Trace</h3>
            <CopyButton text={(log as ApplicationLog).stackTrace!} label="stackTrace" />
          </div>
          <pre className="text-xs font-mono text-red-700 bg-red-50 border border-red-100 rounded-lg p-4 overflow-x-auto max-h-64 whitespace-pre-wrap">
            {(log as ApplicationLog).stackTrace}
          </pre>
        </div>
      )}

      {/* Application - Metadata */}
      {logType === 'application' && (log as ApplicationLog).metadata && Object.keys((log as ApplicationLog).metadata!).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Metadata</h3>
            <CopyButton
              text={JSON.stringify((log as ApplicationLog).metadata, null, 2)}
              label="metadata"
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify((log as ApplicationLog).metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
