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
import {
  Card,
  CardContent,
  Badge,
  Button,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  CardSkeleton,
  EmptyState,
} from '@busmate/ui';
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
    critical: { bg: 'bg-destructive/10', border: 'border-destructive/20', dot: 'bg-destructive' },
    warning: { bg: 'bg-warning/10', border: 'border-warning/20', dot: 'bg-warning' },
    info: { bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary/80' },
  };

  const severityVariant: Record<string, 'destructive' | 'outline' | 'secondary'> = {
    critical: 'destructive',
    warning: 'outline',
    info: 'secondary',
  };

  const statusStyles = {
    active: { icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    acknowledged: { icon: <Clock className="h-3.5 w-3.5" /> },
    resolved: { icon: <CheckCircle className="h-3.5 w-3.5" /> },
  };

  const sev = severityStyles[alert.severity];
  const stat = statusStyles[alert.status];

  return (
    <Card className={`${alert.status === 'resolved' ? 'opacity-60' : `${sev.bg} ${sev.border}`}`}>
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
          <Badge variant={severityVariant[alert.severity]} className={alert.severity === 'warning' ? 'border-warning text-warning' : ''}>
            {alert.severity}
          </Badge>
          <Badge variant="outline" className={`flex items-center gap-1 ${
            alert.status === 'active' ? 'border-destructive/30 text-destructive' :
            alert.status === 'acknowledged' ? 'border-warning/30 text-warning' :
            'border-success/30 text-success'
          }`}>
            {stat.icon}
            {alert.status}
          </Badge>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-warning border-warning/30 hover:bg-warning/10"
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" /> Acknowledge
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-success border-success/30 hover:bg-success/10"
                onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" /> Resolve
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
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

  const severityVariant: Record<string, 'destructive' | 'outline' | 'secondary'> = {
    info: 'secondary',
    warning: 'outline',
    critical: 'destructive',
  };

  return (
    <Card className={`flex items-center gap-4 p-4 ${
      !rule.enabled ? 'opacity-60' : ''
    }`}>
      <Switch
        checked={rule.enabled}
        onCheckedChange={() => onToggle(rule.id)}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{rule.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rule.metric} {rule.condition} {rule.threshold}{rule.unit} • Cooldown: {rule.cooldownMinutes}m
        </p>
      </div>

      {/* Severity */}
      <Badge variant={severityVariant[rule.severity]} className={rule.severity === 'warning' ? 'border-warning text-warning' : ''}>
        {rule.severity}
      </Badge>

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
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────

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
  const [tab, setTab] = useState<string>('all');

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
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">Critical</span>
            </div>
            <div className="text-2xl font-bold text-destructive">
              {alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-warning/80" />
              <span className="text-xs font-medium text-muted-foreground">Warning</span>
            </div>
            <div className="text-2xl font-bold text-warning/80">
              {alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground">Resolved</span>
            </div>
            <div className="text-2xl font-bold text-success">
              {alerts.filter((a) => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Active Rules</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {alertRules.filter((r) => r.enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All Alerts
            <Badge variant="secondary" className="ml-1.5 text-xs">{alerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Active
            <Badge variant="secondary" className="ml-1.5 text-xs">{activeAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1">
            Resolved
            <Badge variant="secondary" className="ml-1.5 text-xs">{alerts.filter((a) => a.status === 'resolved').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex-1">
            Alert Rules
            <Badge variant="secondary" className="ml-1.5 text-xs">{alertRules.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlertList alerts={filteredAlerts} onAcknowledge={onAcknowledgeAlert} onResolve={onResolveAlert} emptyMessage="No alerts found" />
        </TabsContent>
        <TabsContent value="active">
          <AlertList alerts={filteredAlerts} onAcknowledge={onAcknowledgeAlert} onResolve={onResolveAlert} emptyMessage="All alerts have been resolved!" />
        </TabsContent>
        <TabsContent value="resolved">
          <AlertList alerts={filteredAlerts} onAcknowledge={onAcknowledgeAlert} onResolve={onResolveAlert} emptyMessage="No resolved alerts" />
        </TabsContent>
        <TabsContent value="rules">
          <div className="space-y-3">
            {alertRules.map((rule) => (
              <AlertRuleRow key={rule.id} rule={rule} onToggle={onToggleRule} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Alert List helper ────────────────────────────────────────────

function AlertList({
  alerts,
  onAcknowledge,
  onResolve,
  emptyMessage,
}: {
  alerts: MonitoringAlert[];
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  emptyMessage: string;
}) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<BellOff className="h-8 w-8" />}
        title="No alerts found"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
        />
      ))}
    </div>
  );
}
