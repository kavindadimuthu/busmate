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
import { MonitoringAlert, AlertRule } from '@/data/admin/systemMonitoring';

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
    critical: { bg: 'bg-destructive/10', border: 'border-destructive/20', dot: 'bg-destructive', badge: 'bg-destructive/15 text-destructive' },
    warning: { bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning', badge: 'bg-warning/15 text-warning' },
    info: { bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary/80', badge: 'bg-primary/15 text-primary' },
  };

  const statusStyles = {
    active: { badge: 'bg-destructive/15 text-destructive', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    acknowledged: { badge: 'bg-warning/15 text-warning', icon: <Clock className="h-3.5 w-3.5" /> },
    resolved: { badge: 'bg-success/15 text-success', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  };

  const sev = severityStyles[alert.severity];
  const stat = statusStyles[alert.status];

  return (
    <div className={`rounded-xl border ${alert.status === 'resolved' ? 'bg-card border-border opacity-60' : `${sev.bg} ${sev.border}`} transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${alert.status === 'resolved' ? 'bg-success' : sev.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alert.source} — {timeAgo(alert.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.badge}`}>
            {alert.severity}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${stat.badge}`}>
            {stat.icon}
            {alert.status}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground/70" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/70" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="text-sm text-foreground/80 mb-3">{alert.message}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <span className="text-muted-foreground/70">Metric</span>
              <p className="font-medium text-foreground/80 mt-0.5">{alert.metric}</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Threshold</span>
              <p className="font-medium text-foreground/80 mt-0.5">{alert.threshold}{alert.unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Current Value</span>
              <p className="font-medium text-foreground/80 mt-0.5">{alert.currentValue}{alert.unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Created</span>
              <p className="font-medium text-foreground/80 mt-0.5">{formatDate(alert.createdAt)}</p>
            </div>
          </div>
          {alert.acknowledgedAt && (
            <p className="text-xs text-muted-foreground mb-2">
              Acknowledged by {alert.acknowledgedBy} at {formatDate(alert.acknowledgedAt)}
            </p>
          )}
          {alert.resolvedAt && (
            <p className="text-xs text-muted-foreground mb-2">
              Resolved at {formatDate(alert.resolvedAt)}
            </p>
          )}

          {alert.status !== 'resolved' && (
            <div className="flex gap-2 mt-2">
              {alert.status === 'active' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warning bg-warning/15 rounded-lg hover:bg-warning/20 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" /> Acknowledge
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/15 rounded-lg hover:bg-success/20 transition-colors"
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
    info: 'bg-primary/15 text-primary',
    warning: 'bg-warning/15 text-warning',
    critical: 'bg-destructive/15 text-destructive',
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      rule.enabled
        ? 'bg-card border-border hover:shadow-sm'
        : 'bg-muted border-border/50 opacity-60'
    }`}>
      {/* Toggle */}
      <button
        onClick={() => onToggle(rule.id)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          rule.enabled ? 'bg-success' : 'bg-secondary'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-card rounded-full shadow-sm transition-transform ${
          rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{rule.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rule.metric} {rule.condition} {rule.threshold}{rule.unit} • Cooldown: {rule.cooldownMinutes}m
        </p>
      </div>

      {/* Severity */}
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge[rule.severity]}`}>
        {rule.severity}
      </span>

      {/* Channels */}
      <div className="flex items-center gap-1.5 text-muted-foreground/70">
        {rule.notifyChannels.map((ch) => (
          <span key={ch} title={ch}>{channelIcons[ch]}</span>
        ))}
      </div>

      {/* Trigger count */}
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-medium text-foreground/80">{rule.triggerCount}</p>
        <p className="text-xs text-muted-foreground/70">triggers</p>
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
          <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Alerts & Notifications</h2>
        <p className="text-sm text-muted-foreground">Manage alert thresholds and view active alerts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-muted-foreground">Critical</span>
          </div>
          <div className="text-2xl font-bold text-destructive">
            {alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-warning/80" />
            <span className="text-xs font-medium text-muted-foreground">Warning</span>
          </div>
          <div className="text-2xl font-bold text-warning/80">
            {alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Resolved</span>
          </div>
          <div className="text-2xl font-bold text-success">
            {alerts.filter((a) => a.status === 'resolved').length}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Active Rules</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {alertRules.filter((r) => r.enabled).length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.key ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
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
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <BellOff className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No alerts found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
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
