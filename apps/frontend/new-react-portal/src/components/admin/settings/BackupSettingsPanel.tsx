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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  StatsCard,
  StatsCardGrid,
  FormSkeleton,
  StatusBadge,
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
} from '@/data/admin/systemSettings';
import {
  getBackupSettings,
  updateBackupSettings,
  getBackupHistory,
  getBackupStats,
  createBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
} from '@/data/admin/systemSettings';

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
      <div className="space-y-4">
        <FormSkeleton fields={4} columns={2} showTitle={false} showDescription={false} />
        <FormSkeleton fields={4} columns={2} showTitle={false} showDescription={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stats ──────────────────────────────────── */}
      <StatsCardGrid>
        <StatsCard
          title="Last Backup"
          value={stats.lastBackupTime}
          icon={<CheckCircle className="h-5 w-5 text-success" />}
          className="border-success/20 bg-success/10"
        />
        <StatsCard
          title="Last Backup Size"
          value={stats.lastBackupSize}
          icon={<Database className="h-5 w-5" />}
        />
        <StatsCard
          title="Storage Used"
          value={stats.totalStorageUsed}
          description={`of ${stats.maxStorage}`}
          icon={<HardDrive className="h-5 w-5" />}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<Shield className="h-5 w-5 text-warning" />}
          className="border-warning/20 bg-warning/10"
        />
      </StatsCardGrid>

      {/* ── Configuration + History ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Backup Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-primary" />
                Backup Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
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
                    onChange={(e) => update('retentionDays', parseInt(e.target.value) || 1)}
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
                  {(
                    [
                      { id: 'encryptBackups', key: 'encryptBackups', icon: Lock, label: 'Encrypt Backups' },
                      { id: 'includeDatabase', key: 'includeDatabase', icon: Database, label: 'Include Database' },
                      { id: 'includeFiles', key: 'includeFiles', icon: FolderArchive, label: 'Include Files' },
                      { id: 'includeConfigs', key: 'includeConfigs', icon: Settings, label: 'Include Configs' },
                    ] as const
                  ).map(({ id, key, icon: Icon, label }) => (
                    <div key={id} className="flex items-center justify-between">
                      <Label htmlFor={id} className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </Label>
                      <Switch
                        id={id}
                        checked={settings[key]}
                        onCheckedChange={(v) => update(key, v)}
                      />
                    </div>
                  ))}
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
            </CardContent>
          </Card>

          {/* Quick Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Play className="h-4 w-4 text-primary" />
                Quick Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-primary" />
                Backup History
              </CardTitle>
              <CardDescription>Recent backup operations and their status</CardDescription>
              <CardAction>
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
              </CardAction>
            </CardHeader>
            <CardContent>
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
                          <StatusBadge
                            status={backup.status === 'failed' ? 'error' : backup.status}
                            label={backup.status === 'failed' ? 'Failed' : undefined}
                          />
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
            </CardContent>
          </Card>

          {/* Recovery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Recovery Options
              </CardTitle>
              <CardDescription>System recovery and disaster management</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
