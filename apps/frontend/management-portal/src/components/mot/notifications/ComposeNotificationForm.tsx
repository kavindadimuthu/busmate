'use client';

import React from 'react';
import {
  Send,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Wrench,
  XCircle,
  Smartphone,
  Mail,
  MessageSquare,
  Users,
  Loader2,
} from 'lucide-react';

import type { Notification } from '@/data/admin/types';
import {
  TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  AUDIENCE_OPTIONS,
  CHANNEL_OPTIONS,
  type FormState,
} from '../../../hooks/mot/notifications/useNotificationComposer';

// ── Icon map (avoids passing component refs from .ts hook) ────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Info, AlertTriangle, XCircle, CheckCircle, Wrench,
  Smartphone, Mail, MessageSquare, Bell,
};

// ── Field wrapper ─────────────────────────────────────────────────

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/80">
        {label}
        {required && <span className="text-destructive/80 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────

interface ComposeNotificationFormProps {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  isSending: boolean;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSend: () => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────

export function ComposeNotificationForm({
  form,
  errors,
  isSending,
  set,
  onSend,
  onCancel,
}: ComposeNotificationFormProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg border border-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">New Notification</h2>
          <p className="text-sm text-muted-foreground">Fill in the details below to compose and send your notification.</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Title */}
        <Field label="Title" required hint={`${form.title.length}/120 characters`}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={120}
            placeholder="Enter a clear, descriptive title…"
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-primary/40 focus:bg-card transition-all ${errors.title ? 'border-destructive/30' : 'border-border'}`}
          />
          {errors.title && <p className="text-xs text-destructive/80 mt-1">{errors.title}</p>}
        </Field>

        {/* Body */}
        <Field label="Message" required hint={`${form.body.length}/2000 characters`}>
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Write the full notification message here…"
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-primary/40 focus:bg-card transition-all resize-none ${errors.body ? 'border-destructive/30' : 'border-border'}`}
          />
          {errors.body && <p className="text-xs text-destructive/80 mt-1">{errors.body}</p>}
        </Field>

        {/* Type */}
        <Field label="Notification Type" required>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPE_OPTIONS.map(({ value, label, iconName }) => {
              const active = form.type === value;
              const Icon = ICON_MAP[iconName];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('type', value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                    active
                      ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                      : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
                  }`}
                >
                  {Icon && <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground/70'}`} />}
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Priority */}
        <Field label="Priority" required>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map(({ value, label, cls }) => {
              const active = form.priority === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('priority', value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    active
                      ? `${cls} bg-card shadow-sm`
                      : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Target Audience */}
        <Field label="Target Audience" required>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
            <select
              value={form.targetAudience}
              onChange={(e) => set('targetAudience', e.target.value as Notification['targetAudience'])}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-primary/40 focus:bg-card transition-all appearance-none"
            >
              {AUDIENCE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </Field>

        {/* Channel */}
        <Field label="Delivery Channel" required>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CHANNEL_OPTIONS.map(({ value, label, iconName }) => {
              const active = form.channel === value;
              const Icon = ICON_MAP[iconName];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('channel', value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                      : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
                  }`}
                >
                  {Icon && <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground/70'}`} />}
                  {label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-border/50 bg-muted flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground/70">
          Once sent, notifications cannot be edited. You can delete them from the notifications list.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
