'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Send,
  Clock,
  FileEdit,
  AlertTriangle,
  CheckCircle,
  Info,
  Wrench,
  XCircle,
  Users,
  Mail,
  Smartphone,
  Calendar,
  User,
  Copy,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import type { Notification } from '@/data/admin/types';

interface NotificationDetailPanelProps {
  notification: Notification;
  onBack?: () => void;
}

export function NotificationDetailPanel({ notification, onBack }: NotificationDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
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

  // ── style helpers ───────────────────────────────

  const typeConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    info: { cls: 'bg-blue-100 text-blue-800', icon: <Info className="h-5 w-5" />, label: 'Information' },
    warning: { cls: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-5 w-5" />, label: 'Warning' },
    critical: { cls: 'bg-red-100 text-red-800', icon: <XCircle className="h-5 w-5" />, label: 'Critical' },
    success: { cls: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-5 w-5" />, label: 'Success' },
    maintenance: { cls: 'bg-purple-100 text-purple-800', icon: <Wrench className="h-5 w-5" />, label: 'Maintenance' },
    error: { cls: 'bg-red-100 text-red-800', icon: <XCircle className="h-5 w-5" />, label: 'Error' },
  };

  const statusConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    sent: { cls: 'bg-green-50 text-green-700 border border-green-200', icon: <Send className="h-3.5 w-3.5" />, label: 'Sent' },
    scheduled: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock className="h-3.5 w-3.5" />, label: 'Scheduled' },
    draft: { cls: 'bg-gray-100 text-gray-600 border border-gray-200', icon: <FileEdit className="h-3.5 w-3.5" />, label: 'Draft' },
    failed: { cls: 'bg-red-50 text-red-700 border border-red-200', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Failed' },
  };

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-100 text-orange-700 border border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low: 'bg-green-100 text-green-700 border border-green-200',
  };

  const n = notification;
  const tc = typeConfig[n.type] || typeConfig.info;
  const sc = statusConfig[n.status] || statusConfig.draft;
  const readRate = n.totalRecipients > 0 ? Math.round((n.readCount / n.totalRecipients) * 100) : 0;

  const formatDate = (str?: string) => {
    if (!str) return '—';
    try {
      return new Date(str).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return str;
    }
  };

  const audienceLabel = n.targetAudience
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const channelIcon = () => {
    switch (n.channel) {
      case 'email': return <Mail className="h-4 w-4 text-gray-500" />;
      case 'sms': return <Smartphone className="h-4 w-4 text-gray-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notifications
        </button>
      )}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Colour accent bar */}
        <div
          className={`h-1.5 ${
            n.type === 'critical' ? 'bg-red-500' :
            n.type === 'warning' ? 'bg-yellow-500' :
            n.type === 'success' ? 'bg-green-500' :
            n.type === 'maintenance' ? 'bg-purple-500' :
            'bg-blue-500'
          }`}
        />

        <div className="p-6">
          {/* Title row */}
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${tc.cls}`}>
              {tc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{n.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tc.cls}`}>
                  {tc.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                  {sc.icon}
                  {sc.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[n.priority] || priorityColors.low}`}>
                  {n.priority.charAt(0).toUpperCase() + n.priority.slice(1)} Priority
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message body */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Message</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{n.body}</p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Details</h3>
          <div className="space-y-4">
            <DetailRow
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
              label="Created"
              value={formatDate(n.createdAt)}
              copyBtn={<CopyBtn text={n.createdAt} label="created" />}
            />
            {n.sentAt && (
              <DetailRow
                icon={<Send className="h-4 w-4 text-gray-400" />}
                label="Sent"
                value={formatDate(n.sentAt)}
              />
            )}
            {n.scheduledFor && (
              <DetailRow
                icon={<Clock className="h-4 w-4 text-gray-400" />}
                label="Scheduled For"
                value={formatDate(n.scheduledFor)}
              />
            )}
            <DetailRow
              icon={<User className="h-4 w-4 text-gray-400" />}
              label="Sender"
              value={`${n.senderName} (${n.senderId})`}
              copyBtn={<CopyBtn text={n.senderId} label="sender" />}
            />
            <DetailRow
              icon={<Users className="h-4 w-4 text-gray-400" />}
              label="Audience"
              value={audienceLabel}
            />
            <DetailRow
              icon={channelIcon()}
              label="Channel"
              value={(n.channel || 'push').charAt(0).toUpperCase() + (n.channel || 'push').slice(1)}
            />
            <DetailRow
              icon={<Bell className="h-4 w-4 text-gray-400" />}
              label="ID"
              value={n.id}
              copyBtn={<CopyBtn text={n.id} label="id" />}
            />
          </div>
        </div>

        {/* Delivery metrics (only for sent) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Delivery</h3>
          {n.status === 'sent' ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{n.totalRecipients.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total recipients</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{n.readCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Read / opened</p>
                </div>
              </div>

              {/* Read rate bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Read Rate
                  </span>
                  <span className="text-sm font-bold text-gray-900">{readRate}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      readRate >= 80 ? 'bg-green-500' :
                      readRate >= 50 ? 'bg-blue-500' :
                      readRate >= 25 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${readRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-3 bg-gray-100 rounded-full inline-block mb-3">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {n.status === 'scheduled'
                  ? 'Delivery metrics will be available after sending'
                  : 'No delivery data for this notification'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── subcomponents ────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  copyBtn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyBtn?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value}</p>
      </div>
      {copyBtn}
    </div>
  );
}
