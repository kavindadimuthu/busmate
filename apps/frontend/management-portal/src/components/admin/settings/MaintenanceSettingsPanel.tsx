'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/data/admin/system-settings';
import {
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenanceMode,
  getMaintenanceHistory,
  getSystemStatus,
  performMaintenanceAction,
} from '@/data/admin/system-settings';

// ── Status badge ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: MaintenanceHistoryEntry['status'] }) {
  const map = {
    completed: { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
    warning: { cls: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="h-3 w-3" /> },
    'in-progress': { cls: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  };
  const { cls, icon } = map[status];
  return (
    <Badge className={`${cls} capitalize flex items-center gap-1 w-fit`}>
      {icon}
      {status}
    </Badge>
  );
}

// ── System status cards ──────────────────────────────────────────

function SystemStatusCards({ status }: { status: SystemStatus }) {
  const healthColor =
    status.health === 'operational'
      ? 'bg-green-50 border-green-200 text-green-700'
      : status.health === 'degraded'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-red-50 border-red-200 text-red-700';

  const healthIcon =
    status.health === 'operational' ? (
      <CheckCircle className="h-7 w-7 text-green-600" />
    ) : status.health === 'degraded' ? (
      <AlertTriangle className="h-7 w-7 text-amber-600" />
    ) : (
      <XCircle className="h-7 w-7 text-red-600" />
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className={`rounded-xl border p-4 ${healthColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">System Health</p>
            <p className="text-lg font-semibold capitalize mt-0.5">{status.health}</p>
          </div>
          {healthIcon}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Active Sessions</p>
            <p className="text-lg font-semibold text-blue-900 mt-0.5">{status.activeSessions}</p>
          </div>
          <Users className="h-7 w-7 text-blue-500" />
        </div>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Uptime</p>
            <p className="text-lg font-semibold text-violet-900 mt-0.5">{status.uptimePercentage}%</p>
          </div>
          <Zap className="h-7 w-7 text-violet-500" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Running Since</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{status.uptime}</p>
          </div>
          <Server className="h-7 w-7 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

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
      <div className="px-6 py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* ── System Status ─────────────────────────────── */}
      <div className="px-6 py-6 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">System Status</p>
        <SystemStatusCards status={status} />
      </div>

      {/* ── Maintenance Mode Toggle ──────────────────── */}
      <div className={`px-6 py-6 border-b border-gray-100 ${settings.maintenanceMode ? 'bg-orange-50/40' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${settings.maintenanceMode ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Power className={`h-6 w-6 ${settings.maintenanceMode ? 'text-orange-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Maintenance Mode</h3>
                <p className="text-sm text-gray-500">
                  {settings.maintenanceMode
                    ? 'System is currently in maintenance mode. Users will see a maintenance page.'
                    : 'Enable maintenance mode to take the system offline for updates.'}
                </p>
              </div>
            </div>
            <Button
              className={
                settings.maintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
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
      </div>

      <div className="px-6 py-6 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Maintenance */}
        <div className="rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Scheduled Maintenance</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Configure automatic maintenance windows</p>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoMaintenanceEnabled" className="text-base font-medium">
                  Automatic Maintenance
                </Label>
                <p className="text-sm text-gray-500">Run scheduled maintenance tasks</p>
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
                    <div className="relative">
                      <Input
                        type="time"
                        value={settings.maintenanceWindowStart}
                        onChange={(e) => update('maintenanceWindowStart', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Window End</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={settings.maintenanceWindowEnd}
                        onChange={(e) => update('maintenanceWindowEnd', e.target.value)}
                      />
                    </div>
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
                    <p className="text-sm text-gray-500">Send notifications before maintenance</p>
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                {saved && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Saved
                  </span>
                )}
                {isDirty && !saved && (
                  <span className="text-amber-600 text-xs">Unsaved changes</span>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Save
                </Button>
              </div>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-gray-900">Maintenance Actions</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Run on-demand maintenance tasks</p>
          </div>
          <div className="p-5 space-y-3">
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
              <h4 className="font-medium text-gray-700 mb-3">Emergency Actions</h4>
              <Button
                variant="outline"
                className="w-full justify-start bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm"
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
        </div>
        </div>
      </div>

      {/* ── Maintenance History ─────────────────────── */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Maintenance History</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Record of past maintenance tasks and their outcomes</p>
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
                    <TableCell className="text-sm text-gray-500">
                      {new Date(entry.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.duration}</TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {entry.details}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {entry.performedBy}
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      No maintenance history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
