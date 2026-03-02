'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Lock,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { GeneralSettings } from '@/data/admin/system-settings';
import {
  getGeneralSettings,
  updateGeneralSettings,
} from '@/data/admin/system-settings';

// ── Section wrapper ──────────────────────────────────────────────

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
    <div className="px-6 py-6 border-b border-gray-100 last:border-0">
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

// ── Toggle row ───────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────

interface GeneralSettingsPanelProps {
  onSaved?: () => void;
}

export function GeneralSettingsPanel({ onSaved }: GeneralSettingsPanelProps) {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [original, setOriginal] = useState<GeneralSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = getGeneralSettings();
    setSettings(data);
    setOriginal(data);
  }, []);

  const isDirty =
    settings !== null &&
    original !== null &&
    JSON.stringify(settings) !== JSON.stringify(original);

  const update = useCallback(
    <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      setSaved(false);
    },
    [],
  );

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateGeneralSettings(settings);
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

  if (!settings) {
    return (
      <div className="px-6 py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Site Information ─────────────────────────── */}
        <Section
          icon={<Globe className="h-5 w-5 text-blue-600" />}
          title="Site Information"
          description="Basic details about your BusMate instance"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => update('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteTagline">Tagline</Label>
              <Input
                id="siteTagline"
                value={settings.siteTagline}
                onChange={(e) => update('siteTagline', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={(e) => update('logoUrl', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                value={settings.faviconUrl}
                onChange={(e) => update('faviconUrl', e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* ── Contact Information ─────────────────────── */}
        <Section
          icon={<Mail className="h-5 w-5 text-green-600" />}
          title="Contact Information"
          description="Primary contact details displayed on the platform"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="contactEmail">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Contact Email
                </span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Support Email
                </span>
              </Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => update('supportEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
              </Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </span>
              </Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => update('address', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </Section>

        {/* ── Regional Settings ───────────────────────── */}
        <Section
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          title="Regional Settings"
          description="Configure locale and timezone preferences"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <Label>Time Zone</Label>
              <Select
                value={settings.timeZone}
                onValueChange={(v) => update('timeZone', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Colombo">Asia/Colombo (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => update('dateFormat', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select
                value={settings.language}
                onValueChange={(v) => update('language', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="si">Sinhala</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(v) => update('currency', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LKR">LKR (Sri Lankan Rupee)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* ── Security Settings ───────────────────────── */}
        <Section
          icon={<Shield className="h-5 w-5 text-red-600" />}
          title="Security Settings"
          description="Authentication and access control preferences"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={5}
                value={settings.sessionTimeout}
                onChange={(e) =>
                  update('sessionTimeout', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                min={0}
                value={settings.passwordExpiry}
                onChange={(e) =>
                  update('passwordExpiry', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min={1}
                value={settings.maxLoginAttempts}
                onChange={(e) =>
                  update('maxLoginAttempts', parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
          <div className="space-y-1 divide-y divide-gray-50">
            <ToggleRow
              id="twoFactorEnabled"
              label="Two-Factor Authentication"
              description="Require 2FA for admin accounts"
              checked={settings.twoFactorEnabled}
              onChange={(v) => update('twoFactorEnabled', v)}
            />
            <ToggleRow
              id="lockAfterFailedAttempts"
              label="Lock After Failed Attempts"
              description={`Lock accounts after ${settings.maxLoginAttempts} failed login attempts`}
              checked={settings.lockAfterFailedAttempts}
              onChange={(v) => update('lockAfterFailedAttempts', v)}
            />
          </div>
        </Section>

        {/* ── Notification Preferences ────────────────── */}
        <Section
          icon={<Lock className="h-5 w-5 text-amber-600" />}
          title="Notification Preferences"
          description="Choose how system alerts are delivered"
        >
          <div className="space-y-1 divide-y divide-gray-50">
            <ToggleRow
              id="emailNotifications"
              label="Email Notifications"
              description="Send system alerts via email"
              checked={settings.emailNotifications}
              onChange={(v) => update('emailNotifications', v)}
            />
            <ToggleRow
              id="smsAlerts"
              label="SMS Alerts"
              description="Send critical alerts via SMS"
              checked={settings.smsAlerts}
              onChange={(v) => update('smsAlerts', v)}
            />
          </div>
        </Section>

      {/* ── Action Bar ──────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 rounded-b-xl border-t border-gray-100">
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
    </div>
  );
}
