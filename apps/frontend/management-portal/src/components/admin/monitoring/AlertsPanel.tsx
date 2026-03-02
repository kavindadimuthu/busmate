'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { MonitoringAlert, AlertRule } from '@/data/admin/system-monitoring';

// ── Helpers ──────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Alert Item ───────────────────────────────────────────────────

function AlertItem({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: MonitoringAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const severityStyles = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  };

  const statusStyles = {
    active: { badge: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    acknowledged: { badge: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
    resolved: { badge: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  };

  const sev = severityStyles[alert.severity];
  const stat = statusStyles[alert.status];

  return (
    <div className={`rounded-xl border ${alert.status === 'resolved' ? 'bg-white border-gray-200 opacity-60' : `${sev.bg} ${sev.border}`} transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${alert.status === 'resolved' ? 'bg-green-500' : sev.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{alert.source} — {timeAgo(alert.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.badge}`}>
            {alert.severity}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${stat.badge}`}>
            {stat.icon}
            {alert.status}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <span className="text-gray-400">Metric</span>
              <p className="font-medium text-gray-700 mt-0.5">{alert.metric}</p>
            </div>
            <div>
              <span className="text-gray-400">Threshold</span>
              <p className="font-medium text-gray-700 mt-0.5">{alert.threshold}{alert.unit}</p>
            </div>
            <div>
              <span className="text-gray-400">Current Value</span>
              <p className="font-medium text-gray-700 mt-0.5">{alert.currentValue}{alert.unit}</p>
            </div>
            <div>
              <span className="text-gray-400">Created</span>
              <p className="font-medium text-gray-700 mt-0.5">{formatDate(alert.createdAt)}</p>
            </div>
          </div>
          {alert.acknowledgedAt && (
            <p className="text-xs text-gray-500 mb-2">
              Acknowledged by {alert.acknowledgedBy} at {formatDate(alert.acknowledgedAt)}
            </p>
          )}
          {alert.resolvedAt && (
            <p className="text-xs text-gray-500 mb-2">
              Resolved at {formatDate(alert.resolvedAt)}
            </p>
          )}

          {alert.status !== 'resolved' && (
            <div className="flex gap-2 mt-2">
              {alert.status === 'active' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" /> Acknowledge
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Resolve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Alert Rule Row ───────────────────────────────────────────────

function AlertRuleRow({
  rule,
  onToggle,
}: {
  rule: AlertRule;
  onToggle: (id: string) => void;
}) {
  const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail className="h-3.5 w-3.5" />,
    sms: <Smartphone className="h-3.5 w-3.5" />,
    slack: <MessageSquare className="h-3.5 w-3.5" />,
    'in-app': <Bell className="h-3.5 w-3.5" />,
  };

  const severityBadge = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      rule.enabled
        ? 'bg-white border-gray-200 hover:shadow-sm'
        : 'bg-gray-50 border-gray-100 opacity-60'
    }`}>
      {/* Toggle */}
      <button
        onClick={() => onToggle(rule.id)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          rule.enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{rule.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {rule.metric} {rule.condition} {rule.threshold}{rule.unit} • Cooldown: {rule.cooldownMinutes}m
        </p>
      </div>

      {/* Severity */}
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge[rule.severity]}`}>
        {rule.severity}
      </span>

      {/* Channels */}
      <div className="flex items-center gap-1.5 text-gray-400">
        {rule.notifyChannels.map((ch) => (
          <span key={ch} title={ch}>{channelIcons[ch]}</span>
        ))}
      </div>

      {/* Trigger count */}
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-medium text-gray-700">{rule.triggerCount}</p>
        <p className="text-xs text-gray-400">triggers</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

type AlertTab = 'all' | 'active' | 'resolved' | 'rules';

interface AlertsPanelProps {
  alerts: MonitoringAlert[];
  activeAlerts: MonitoringAlert[];
  alertRules: AlertRule[];
  loading: boolean;
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onResolveAlert: (id: string) => Promise<void>;
  onToggleRule: (id: string) => Promise<void>;
}

export function AlertsPanel({
  alerts,
  activeAlerts,
  alertRules,
  loading,
  onAcknowledgeAlert,
  onResolveAlert,
  onToggleRule,
}: AlertsPanelProps) {
  const [tab, setTab] = useState<AlertTab>('all');

  const tabs: { key: AlertTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Alerts', count: alerts.length },
    { key: 'active', label: 'Active', count: activeAlerts.length },
    { key: 'resolved', label: 'Resolved', count: alerts.filter((a) => a.status === 'resolved').length },
    { key: 'rules', label: 'Alert Rules', count: alertRules.length },
  ];

  const filteredAlerts =
    tab === 'active'
      ? alerts.filter((a) => a.status === 'active' || a.status === 'acknowledged')
      : tab === 'resolved'
      ? alerts.filter((a) => a.status === 'resolved')
      : alerts;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
        <p className="text-sm text-gray-500">Manage alert thresholds and view active alerts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-gray-500">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Warning</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500">Resolved</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {alerts.filter((a) => a.status === 'resolved').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500">Active Rules</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {alertRules.filter((r) => r.enabled).length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab !== 'rules' ? (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BellOff className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No alerts found</p>
              <p className="text-xs text-gray-400 mt-1">
                {tab === 'active' ? 'All alerts have been resolved!' : 'No alerts in this category'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledgeAlert}
                onResolve={onResolveAlert}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {alertRules.map((rule) => (
            <AlertRuleRow key={rule.id} rule={rule} onToggle={onToggleRule} />
          ))}
        </div>
      )}
    </div>
  );
}
