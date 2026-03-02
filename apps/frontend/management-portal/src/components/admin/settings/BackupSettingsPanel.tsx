'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Database,
  HardDrive,
  Shield,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Play,
  Save,
  RotateCcw,
  Loader2,
  Trash2,
  Lock,
  FolderArchive,
} from 'lucide-react';
import type {
  BackupSettings,
  BackupEntry,
  BackupStats,
} from '@/data/admin/system-settings';
import {
  getBackupSettings,
  updateBackupSettings,
  getBackupHistory,
  getBackupStats,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
} from '@/data/admin/system-settings';

// ── Status badge ─────────────────────────────────────────────────

function BackupStatusBadge({ status }: { status: BackupEntry['status'] }) {
  const map = {
    completed: { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
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

// ── Stats cards ──────────────────────────────────────────────────

function BackupStatsCards({ stats }: { stats: BackupStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Last Backup</p>
            <p className="font-semibold text-green-900">{stats.lastBackupTime}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Last Size</p>
            <p className="font-semibold text-blue-900">{stats.lastBackupSize}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <HardDrive className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-violet-600 uppercase tracking-wide font-medium">Storage Used</p>
            <p className="font-semibold text-violet-900">
              {stats.totalStorageUsed}
              <span className="text-xs text-violet-400 ml-1">/ {stats.maxStorage}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Success Rate</p>
            <p className="font-semibold text-amber-900">{stats.successRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

interface BackupSettingsPanelProps {
  onSaved?: () => void;
}

export function BackupSettingsPanel({ onSaved }: BackupSettingsPanelProps) {
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [original, setOriginal] = useState<BackupSettings | null>(null);
  const [history, setHistory] = useState<BackupEntry[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupLoading, setBackupLoading] = useState<string | null>(null);

  useEffect(() => {
    const s = getBackupSettings();
    setSettings(s);
    setOriginal(s);
    setHistory(getBackupHistory());
    setStats(getBackupStats());
  }, []);

  const isDirty =
    settings !== null &&
    original !== null &&
    JSON.stringify(settings) !== JSON.stringify(original);

  const update = useCallback(
    <K extends keyof BackupSettings>(key: K, value: BackupSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      setSaved(false);
    },
    [],
  );

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateBackupSettings(settings);
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

  const handleCreateBackup = async (type: BackupEntry['type']) => {
    setBackupLoading(type);
    try {
      const entry = await createBackup(type);
      setHistory((prev) => [entry, ...prev]);
    } finally {
      setBackupLoading(null);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;
    await restoreBackup(id);
    alert('Backup restore initiated (mock).');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    const ok = await deleteBackup(id);
    if (ok) {
      setHistory((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleDownload = async (id: string) => {
    await downloadBackup(id);
    alert('Download started (mock).');
  };

  if (!settings || !stats) {
    return (
      <div className="px-6 py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Stats ──────────────────────────────────── */}
      <div className="px-6 py-6 border-b border-gray-100">
        <BackupStatsCards stats={stats} />
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Configuration + Quick Actions ─────────── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Backup Configuration</h3>
                </div>
              </div>
              <div className="p-5 space-y-5">
              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackupEnabled" className="text-base font-medium">
                    Automatic Backup
                  </Label>
                  <p className="text-sm text-gray-500">Enable scheduled backups</p>
                </div>
                <Switch
                  id="autoBackupEnabled"
                  checked={settings.autoBackupEnabled}
                  onCheckedChange={(v) => update('autoBackupEnabled', v)}
                />
              </div>

              {settings.autoBackupEnabled && (
                <>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(v) =>
                        update('backupFrequency', v as BackupSettings['backupFrequency'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Backup Time</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={settings.backupTime}
                        onChange={(e) => update('backupTime', e.target.value)}
                      />
                      <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>Retention Period (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.retentionDays}
                  onChange={(e) =>
                    update('retentionDays', parseInt(e.target.value) || 1)
                  }
                />
              </div>

              <div>
                <Label>Storage Location</Label>
                <Select
                  value={settings.storageLocation}
                  onValueChange={(v) =>
                    update('storageLocation', v as BackupSettings['storageLocation'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="aws-s3">AWS S3</SelectItem>
                    <SelectItem value="google-cloud">Google Cloud</SelectItem>
                    <SelectItem value="azure-blob">Azure Blob</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryptBackups" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Encrypt Backups
                  </Label>
                  <Switch
                    id="encryptBackups"
                    checked={settings.encryptBackups}
                    onCheckedChange={(v) => update('encryptBackups', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeDatabase" className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Include Database
                  </Label>
                  <Switch
                    id="includeDatabase"
                    checked={settings.includeDatabase}
                    onCheckedChange={(v) => update('includeDatabase', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeFiles" className="flex items-center gap-1.5">
                    <FolderArchive className="h-3.5 w-3.5" /> Include Files
                  </Label>
                  <Switch
                    id="includeFiles"
                    checked={settings.includeFiles}
                    onCheckedChange={(v) => update('includeFiles', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeConfigs" className="flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5" /> Include Configs
                  </Label>
                  <Switch
                    id="includeConfigs"
                    checked={settings.includeConfigs}
                    onCheckedChange={(v) => update('includeConfigs', v)}
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnComplete">Notify on Complete</Label>
                  <Switch
                    id="notifyOnComplete"
                    checked={settings.notifyOnComplete}
                    onCheckedChange={(v) => update('notifyOnComplete', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyOnFailure">Notify on Failure</Label>
                  <Switch
                    id="notifyOnFailure"
                    checked={settings.notifyOnFailure}
                    onCheckedChange={(v) => update('notifyOnFailure', v)}
                  />
                </div>
              </div>

              {/* Save/Reset */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm">
                  {saved && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> Saved
                    </span>
                  )}
                  {isDirty && !saved && (
                    <span className="text-amber-600 text-xs">Unsaved</span>
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
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Quick Backup</h3>
            </div>
            <div className="p-5 space-y-3">
              {(
                [
                  { type: 'Database', icon: Database, color: 'blue' },
                  { type: 'Full System', icon: HardDrive, color: 'gray' },
                  { type: 'Configuration', icon: Settings, color: 'purple' },
                  { type: 'Files Only', icon: FolderArchive, color: 'teal' },
                ] as const
              ).map(({ type, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant="outline"
                  className={`w-full justify-start bg-${color}-500/10 text-${color}-600 border-${color}-200 hover:bg-${color}-500/20 shadow-sm`}
                  disabled={backupLoading !== null}
                  onClick={() => handleCreateBackup(type)}
                >
                  {backupLoading === type ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {type} Backup
                </Button>
              ))}

              <div className="pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 shadow-sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.dump,.sql,.zip';
                    input.click();
                    alert('File upload & restore (mock)');
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from File
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── History & Recovery ───────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Backup History</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Recent backup operations and their status
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleCreateBackup('Full System')}
                  disabled={backupLoading !== null}
                >
                  {backupLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Backup
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.type}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(backup.date).toLocaleString()}
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>{backup.duration}</TableCell>
                        <TableCell>
                          <BackupStatusBadge status={backup.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {backup.status === 'completed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Download"
                                  onClick={() => handleDownload(backup.id)}
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Restore"
                                  onClick={() => handleRestore(backup.id)}
                                >
                                  <Upload className="h-4 w-4 text-green-600" />
                                </Button>
                              </>
                            )}
                            {backup.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Retry"
                                onClick={() => handleCreateBackup(backup.type)}
                              >
                                <RefreshCw className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDelete(backup.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          No backup history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Recovery Options */}
          <div className="rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">Recovery Options</h3>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">System recovery and disaster management</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Point-in-Time Recovery</h4>
                  <p className="text-sm text-blue-700 mb-3">Restore system to a specific date and time</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200"
                  >
                    Configure Recovery Point
                  </Button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Disaster Recovery</h4>
                  <p className="text-sm text-green-700 mb-3">Full system recovery procedures</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-100 text-green-600 border-green-200 hover:bg-green-200"
                  >
                    View Recovery Plan
                  </Button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Selective Restore</h4>
                  <p className="text-sm text-amber-700 mb-3">Restore specific components or data</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200"
                  >
                    Select Components
                  </Button>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Test Recovery</h4>
                  <p className="text-sm text-purple-700 mb-3">Test backup integrity and recovery process</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200"
                  >
                    Run Test Recovery
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}