'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Label,
  Switch,
  Button,
  Badge,
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
} from '@busmate/ui';
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
    completed: { cls: 'bg-success/15 text-success', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { cls: 'bg-destructive/15 text-destructive', icon: <XCircle className="h-3 w-3" /> },
    'in-progress': { cls: 'bg-primary/15 text-primary', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
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
      <div className="rounded-xl border border-success/20 bg-success/10 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/15 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-success uppercase tracking-wide font-medium">Last Backup</p>
            <p className="font-semibold text-success">{stats.lastBackupTime}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/15 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary uppercase tracking-wide font-medium">Last Size</p>
            <p className="font-semibold text-primary">{stats.lastBackupSize}</p>
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

      <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/15 rounded-lg">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-warning uppercase tracking-wide font-medium">Success Rate</p>
            <p className="font-semibold text-warning">{stats.successRate}%</p>
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
        <Loader2 className="h-6 w-6 animate-spin text-primary/80" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Stats ──────────────────────────────────── */}
      <div className="px-6 py-6 border-b border-border/50">
        <BackupStatsCards stats={stats} />
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Configuration + Quick Actions ─────────── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-border">
              <div className="px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Backup Configuration</h3>
                </div>
              </div>
              <div className="p-5 space-y-5">
              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackupEnabled" className="text-base font-medium">
                    Automatic Backup
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable scheduled backups</p>
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
                      <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
              <div className="space-y-3 pt-3 border-t border-border/50">
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
              <div className="space-y-3 pt-3 border-t border-border/50">
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
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="text-sm">
                  {saved && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-4 w-4" /> Saved
                    </span>
                  )}
                  {isDirty && !saved && (
                    <span className="text-warning text-xs">Unsaved</span>
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
          </div>

          <div className="rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Quick Backup</h3>
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

              <div className="pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-warning/10 text-warning border-orange-200 hover:bg-warning/15 shadow-sm"
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
          <div className="rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Backup History</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recent backup operations and their status
                  </p>
                </div>
                <Button
                  className="bg-primary hover:bg-primary text-white"
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
                        <TableCell className="text-sm text-muted-foreground">
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
                                  <Download className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Restore"
                                  onClick={() => handleRestore(backup.id)}
                                >
                                  <Upload className="h-4 w-4 text-success" />
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
                                <RefreshCw className="h-4 w-4 text-warning" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDelete(backup.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive/70" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground/70">
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
          <div className="rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold text-foreground">Recovery Options</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">System recovery and disaster management</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">Point-in-Time Recovery</h4>
                  <p className="text-sm text-primary mb-3">Restore system to a specific date and time</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20"
                  >
                    Configure Recovery Point
                  </Button>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <h4 className="font-medium text-success mb-2">Disaster Recovery</h4>
                  <p className="text-sm text-success mb-3">Full system recovery procedures</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-success/15 text-success border-success/20 hover:bg-success/20"
                  >
                    View Recovery Plan
                  </Button>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <h4 className="font-medium text-warning mb-2">Selective Restore</h4>
                  <p className="text-sm text-warning mb-3">Restore specific components or data</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-warning/15 text-warning border-warning/20 hover:bg-warning/20"
                  >
                    Select Components
                  </Button>
                </div>
                <div className="bg-[hsl(var(--purple-50))] border border-[hsl(var(--purple-200))] rounded-lg p-4">
                  <h4 className="font-medium text-[hsl(var(--purple-900))] mb-2">Test Recovery</h4>
                  <p className="text-sm text-[hsl(var(--purple-700))] mb-3">Test backup integrity and recovery process</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-600))] border-[hsl(var(--purple-200))] hover:bg-[hsl(var(--purple-200))]"
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