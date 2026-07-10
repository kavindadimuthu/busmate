'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Label,
  Switch,
  Button,
  Badge,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatsCard,
  StatsCardGrid,
  FormSkeleton,
  StatusBadge,
} from '@busmate/ui';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Users,
  Zap,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
  Save,
  RotateCcw,
  Loader2,
  Power,
  Bell,
} from 'lucide-react';
import type {
  MaintenanceSettings,
  MaintenanceHistoryEntry,
  SystemStatus,
} from '@/data/admin/systemSettings';
import {
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenanceMode,
  getMaintenanceHistory,
  getSystemStatus,
  performMaintenanceAction,
} from '@/data/admin/systemSettings';

// ── Component ────────────────────────────────────────────────────

interface MaintenanceSettingsPanelProps {
  onSaved?: () => void;
}

export function MaintenanceSettingsPanel({ onSaved }: MaintenanceSettingsPanelProps) {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [original, setOriginal] = useState<MaintenanceSettings | null>(null);
  const [history, setHistory] = useState<MaintenanceHistoryEntry[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const s = getMaintenanceSettings();
    setSettings(s);
    setOriginal(s);
    setHistory(getMaintenanceHistory());
    setStatus(getSystemStatus());
  }, []);

  const isDirty =
    settings !== null &&
    original !== null &&
    JSON.stringify(settings) !== JSON.stringify(original);

  const update = useCallback(
    <K extends keyof MaintenanceSettings>(key: K, value: MaintenanceSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      setSaved(false);
    },
    [],
  );

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateMaintenanceSettings(settings);
      setSettings(updated);
      setOriginal(updated);
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (original) {
      setSettings({ ...original });
      setSaved(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!settings) return;
    const next = !settings.maintenanceMode;
    const ok = await toggleMaintenanceMode(next);
    if (ok) {
      update('maintenanceMode', next);
    }
  };

  const handleAction = async (action: Parameters<typeof performMaintenanceAction>[0]) => {
    setActionLoading(action);
    try {
      const entry = await performMaintenanceAction(action);
      setHistory((prev) => [entry, ...prev]);
    } finally {
      setActionLoading(null);
    }
  };

  if (!settings || !status) {
    return (
      <div className="space-y-4">
        <FormSkeleton fields={4} columns={2} showTitle={false} showDescription={false} />
        <FormSkeleton fields={4} columns={2} showTitle={false} showDescription={false} />
      </div>
    );
  }

  const healthClassName =
    status.health === 'operational'
      ? 'border-success/20 bg-success/10'
      : status.health === 'degraded'
      ? 'border-warning/20 bg-warning/10'
      : 'border-destructive/20 bg-destructive/10';

  const healthIcon =
    status.health === 'operational' ? (
      <CheckCircle className="h-5 w-5 text-success" />
    ) : status.health === 'degraded' ? (
      <AlertTriangle className="h-5 w-5 text-warning" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    );

  return (
    <div className="space-y-4">
      {/* ── System Status ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsCardGrid>
            <StatsCard
              title="System Health"
              value={status.health}
              icon={healthIcon}
              className={healthClassName}
            />
            <StatsCard
              title="Active Sessions"
              value={status.activeSessions}
              icon={<Users className="h-5 w-5" />}
            />
            <StatsCard
              title="Uptime"
              value={`${status.uptimePercentage}%`}
              icon={<Zap className="h-5 w-5" />}
            />
            <StatsCard
              title="Running Since"
              value={status.uptime}
              icon={<Server className="h-5 w-5" />}
            />
          </StatsCardGrid>
        </CardContent>
      </Card>

      {/* ── Maintenance Mode Toggle ──────────────────── */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${settings.maintenanceMode ? 'bg-warning/15' : 'bg-muted'}`}>
                <Power className={`h-6 w-6 ${settings.maintenanceMode ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Maintenance Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.maintenanceMode
                    ? 'System is currently in maintenance mode. Users will see a maintenance page.'
                    : 'Enable maintenance mode to take the system offline for updates.'}
                </p>
              </div>
            </div>
            <Button
              className={
                settings.maintenanceMode
                  ? 'bg-success hover:bg-success text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }
              onClick={handleToggleMaintenance}
            >
              {settings.maintenanceMode ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Disable Maintenance
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Enable Maintenance
                </>
              )}
            </Button>
          </div>

          {settings.maintenanceMode && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-orange-200">
              <div>
                <Label htmlFor="maintenanceTitle">Maintenance Title</Label>
                <Input
                  id="maintenanceTitle"
                  value={settings.maintenanceTitle}
                  onChange={(e) => update('maintenanceTitle', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="allowAdminAccess"
                  checked={settings.allowAdminAccess}
                  onCheckedChange={(v) => update('allowAdminAccess', v)}
                />
                <Label htmlFor="allowAdminAccess">Allow admin access during maintenance</Label>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  rows={3}
                  value={settings.maintenanceMessage}
                  onChange={(e) => update('maintenanceMessage', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Scheduled Maintenance + Quick Actions ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scheduled Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              Scheduled Maintenance
            </CardTitle>
            <CardDescription>Configure automatic maintenance windows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoMaintenanceEnabled" className="text-base font-medium">
                    Automatic Maintenance
                  </Label>
                  <p className="text-sm text-muted-foreground">Run scheduled maintenance tasks</p>
                </div>
                <Switch
                  id="autoMaintenanceEnabled"
                  checked={settings.autoMaintenanceEnabled}
                  onCheckedChange={(v) => update('autoMaintenanceEnabled', v)}
                />
              </div>

              {settings.autoMaintenanceEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Window Start</Label>
                      <Input
                        type="time"
                        value={settings.maintenanceWindowStart}
                        onChange={(e) => update('maintenanceWindowStart', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Window End</Label>
                      <Input
                        type="time"
                        value={settings.maintenanceWindowEnd}
                        onChange={(e) => update('maintenanceWindowEnd', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={settings.maintenanceFrequency}
                      onValueChange={(v) =>
                        update('maintenanceFrequency', v as MaintenanceSettings['maintenanceFrequency'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifyUsersBeforeMaintenance" className="text-base font-medium">
                        <span className="flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5" /> Notify Users
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Send notifications before maintenance</p>
                    </div>
                    <Switch
                      id="notifyUsersBeforeMaintenance"
                      checked={settings.notifyUsersBeforeMaintenance}
                      onCheckedChange={(v) => update('notifyUsersBeforeMaintenance', v)}
                    />
                  </div>

                  {settings.notifyUsersBeforeMaintenance && (
                    <div>
                      <Label htmlFor="notifyMinutesBefore">Notify Minutes Before</Label>
                      <Input
                        id="notifyMinutesBefore"
                        type="number"
                        min={5}
                        value={settings.notifyMinutesBefore}
                        onChange={(e) =>
                          update('notifyMinutesBefore', parseInt(e.target.value) || 5)
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {/* Save / Reset */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  {saved && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                  {isDirty && !saved && (
                    <span className="text-warning text-xs">Unsaved changes</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty || saving}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="bg-primary hover:bg-primary text-white"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-violet-600" />
              Maintenance Actions
            </CardTitle>
            <CardDescription>Run on-demand maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(
                [
                  { action: 'optimize-db', icon: Database, label: 'Database Optimization', color: 'blue' },
                  { action: 'clear-cache', icon: HardDrive, label: 'Clear System Cache', color: 'green' },
                  { action: 'restart-services', icon: RefreshCw, label: 'Restart Services', color: 'purple' },
                  { action: 'security-scan', icon: Shield, label: 'Security Scan', color: 'gray' },
                ] as const
              ).map(({ action, icon: Icon, label, color }) => (
                <Button
                  key={action}
                  variant="outline"
                  className={`w-full justify-start bg-${color}-500/10 text-${color}-600 border-${color}-200 hover:bg-${color}-500/20 shadow-sm`}
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(action)}
                >
                  {actionLoading === action ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {label}
                </Button>
              ))}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-foreground/80 mb-3">Emergency Actions</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15 shadow-sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to initiate an emergency shutdown?')) {
                      alert('Emergency shutdown initiated (mock).');
                    }
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Emergency Shutdown
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Maintenance History ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide">Maintenance History</CardTitle>
          <CardDescription>Record of past maintenance tasks and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.task}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(entry.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.duration}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={entry.status === 'failed' ? 'error' : entry.status}
                        label={entry.status === 'failed' ? 'Failed' : undefined}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.details}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.performedBy}
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground/70">
                      No maintenance history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
