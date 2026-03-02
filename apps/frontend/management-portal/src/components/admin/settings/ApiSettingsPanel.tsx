'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Shield,
  Globe,
  Server,
  Key,
  Copy,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Database,
} from 'lucide-react';
import type { ApiSettings, ApiKey } from '@/data/admin/system-settings';
import {
  getApiSettings,
  updateApiSettings,
  revokeApiKey,
} from '@/data/admin/system-settings';

// ── Helpers ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-6 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-gray-500 mb-5">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <Label htmlFor={id} className="text-base font-medium">
          {label}
        </Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function KeyStatusBadge({ status }: { status: ApiKey['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    revoked: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  };
  return (
    <Badge className={`${styles[status]} capitalize`}>{status}</Badge>
  );
}

function MaskedKey({ apiKey }: { apiKey: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const display = visible ? apiKey : apiKey.slice(0, 8) + '••••••••••••••••••••••••';

  const copy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs bg-gray-50 rounded px-1.5 py-0.5 font-mono">
        {display}
      </code>
      <button
        onClick={() => setVisible(!visible)}
        className="text-gray-400 hover:text-gray-600"
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={copy}
        className="text-gray-400 hover:text-gray-600"
      >
        {copied ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

interface ApiSettingsPanelProps {
  onSaved?: () => void;
}

export function ApiSettingsPanel({ onSaved }: ApiSettingsPanelProps) {
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [original, setOriginal] = useState<ApiSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');

  useEffect(() => {
    const data = getApiSettings();
    setSettings(data);
    setOriginal(data);
  }, []);

  const isDirty =
    settings !== null &&
    original !== null &&
    JSON.stringify({ ...settings, apiKeys: [] }) !==
      JSON.stringify({ ...original, apiKeys: [] });

  const update = useCallback(
    <K extends keyof ApiSettings>(key: K, value: ApiSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      setSaved(false);
    },
    [],
  );

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { apiKeys: _keys, ...rest } = settings;
      const updated = await updateApiSettings(rest);
      setSettings({ ...updated, apiKeys: settings.apiKeys });
      setOriginal({ ...updated, apiKeys: settings.apiKeys });
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (original) {
      setSettings({ ...original, apiKeys: settings?.apiKeys ?? original.apiKeys });
      setSaved(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!settings) return;
    const ok = await revokeApiKey(id);
    if (ok) {
      setSettings({
        ...settings,
        apiKeys: settings.apiKeys.map((k) =>
          k.id === id ? { ...k, status: 'revoked' as const } : k,
        ),
      });
    }
  };

  const addOrigin = () => {
    if (!settings || !newOrigin.trim()) return;
    if (settings.corsAllowedOrigins.includes(newOrigin.trim())) return;
    update('corsAllowedOrigins', [...settings.corsAllowedOrigins, newOrigin.trim()]);
    setNewOrigin('');
  };

  const removeOrigin = (origin: string) => {
    if (!settings) return;
    update(
      'corsAllowedOrigins',
      settings.corsAllowedOrigins.filter((o) => o !== origin),
    );
  };

  if (!settings) {
    return (
      <div className="px-6 py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
          <Section
            icon={<Zap className="h-5 w-5 text-amber-600" />}
            title="Rate Limiting & Timeouts"
            description="Control request throughput and response timeouts"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <Label htmlFor="rateLimitPerMinute">Rate Limit / min</Label>
                <Input
                  id="rateLimitPerMinute"
                  type="number"
                  min={1}
                  value={settings.rateLimitPerMinute}
                  onChange={(e) =>
                    update('rateLimitPerMinute', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="rateLimitPerHour">Rate Limit / hour</Label>
                <Input
                  id="rateLimitPerHour"
                  type="number"
                  min={1}
                  value={settings.rateLimitPerHour}
                  onChange={(e) =>
                    update('rateLimitPerHour', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="apiTimeout">API Timeout (sec)</Label>
                <Input
                  id="apiTimeout"
                  type="number"
                  min={1}
                  value={settings.apiTimeout}
                  onChange={(e) =>
                    update('apiTimeout', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxPayloadSize">Max Payload (MB)</Label>
                <Input
                  id="maxPayloadSize"
                  type="number"
                  min={1}
                  value={settings.maxPayloadSize}
                  onChange={(e) =>
                    update('maxPayloadSize', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </Section>

          {/* ── Performance ───────────────────────────── */}
          <Section
            icon={<Server className="h-5 w-5 text-blue-600" />}
            title="Performance"
            description="Caching, compression & database connection settings"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                <Label htmlFor="cacheExpiryMinutes">Cache Expiry (min)</Label>
                <Input
                  id="cacheExpiryMinutes"
                  type="number"
                  min={1}
                  value={settings.cacheExpiryMinutes}
                  onChange={(e) =>
                    update('cacheExpiryMinutes', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxDatabaseConnections">Max DB Connections</Label>
                <Input
                  id="maxDatabaseConnections"
                  type="number"
                  min={1}
                  value={settings.maxDatabaseConnections}
                  onChange={(e) =>
                    update('maxDatabaseConnections', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className="space-y-1 divide-y divide-gray-50">
              <ToggleRow
                id="responseCompression"
                label="Response Compression"
                description="Enable GZIP compression for API responses"
                checked={settings.responseCompression}
                onChange={(v) => update('responseCompression', v)}
              />
              <ToggleRow
                id="aggressiveCaching"
                label="Aggressive Caching"
                description="Cache aggressively for improved performance"
                checked={settings.aggressiveCaching}
                onChange={(v) => update('aggressiveCaching', v)}
              />
              <ToggleRow
                id="apiLoggingEnabled"
                label="API Request Logging"
                description="Log all API requests for monitoring and debugging"
                checked={settings.apiLoggingEnabled}
                onChange={(v) => update('apiLoggingEnabled', v)}
              />
            </div>
          </Section>

          {/* ── CORS ──────────────────────────────────── */}
          <Section
            icon={<Globe className="h-5 w-5 text-green-600" />}
            title="CORS Configuration"
            description="Cross-Origin Resource Sharing allowed origins"
          >
            <ToggleRow
              id="corsEnabled"
              label="CORS Protection"
              description="Enable Cross-Origin Resource Sharing protection"
              checked={settings.corsEnabled}
              onChange={(v) => update('corsEnabled', v)}
            />
            {settings.corsEnabled && (
              <div className="mt-4">
                <Label className="mb-2 block">Allowed Origins</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {settings.corsAllowedOrigins.map((origin) => (
                    <span
                      key={origin}
                      className="inline-flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1 rounded-full"
                    >
                      {origin}
                      <button
                        onClick={() => removeOrigin(origin)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addOrigin()}
                    className="max-w-sm"
                  />
                  <Button variant="outline" size="sm" onClick={addOrigin}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </Section>

          {/* ── Webhook ───────────────────────────────── */}
          <Section
            icon={<Database className="h-5 w-5 text-purple-600" />}
            title="Webhook"
            description="Forward events to an external endpoint"
          >
            <ToggleRow
              id="webhookEnabled"
              label="Webhook Enabled"
              description="Send system events to external URL"
              checked={settings.webhookEnabled}
              onChange={(v) => update('webhookEnabled', v)}
            />
            {settings.webhookEnabled && (
              <div className="mt-3">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={(e) => update('webhookUrl', e.target.value)}
                  placeholder="https://hooks.example.com/events"
                />
              </div>
            )}
          </Section>

          {/* ── Action Bar ──────────────────────────── */}
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              {saved && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Settings saved
                </span>
              )}
              {isDirty && !saved && (
                <span className="text-amber-600">You have unsaved changes</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty || saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

      {/* ── API Keys ──────────────────────────────────── */}
      <div className="px-6 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">API Keys</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Manage API keys used by external integrations</p>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              alert('TODO: Show API key creation dialog');
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Generate Key
          </Button>
        </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <MaskedKey apiKey={key.key} />
                    </TableCell>
                    <TableCell>
                      <KeyStatusBadge status={key.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.slice(0, 2).map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {p}
                          </Badge>
                        ))}
                        {key.permissions.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 text-gray-400"
                          >
                            +{key.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {key.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
    </div>
  );
}
