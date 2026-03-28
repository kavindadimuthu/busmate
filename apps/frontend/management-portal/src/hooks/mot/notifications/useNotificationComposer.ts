import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/data/admin';
import type { Notification } from '@/data/admin/types';

// ── Field options ─────────────────────────────────────────────────

export const TYPE_OPTIONS: { value: Notification['type']; label: string; iconName: string; description: string }[] = [
  { value: 'info', label: 'Info', iconName: 'Info', description: 'General information' },
  { value: 'warning', label: 'Warning', iconName: 'AlertTriangle', description: 'Alert or caution' },
  { value: 'critical', label: 'Critical', iconName: 'XCircle', description: 'Urgent action required' },
  { value: 'success', label: 'Success', iconName: 'CheckCircle', description: 'Positive update' },
  { value: 'maintenance', label: 'Maintenance', iconName: 'Wrench', description: 'System maintenance' },
];

export const PRIORITY_OPTIONS: { value: Notification['priority']; label: string; cls: string }[] = [
  { value: 'low', label: 'Low', cls: 'border-border text-muted-foreground' },
  { value: 'medium', label: 'Medium', cls: 'border-primary/30 text-primary' },
  { value: 'high', label: 'High', cls: 'border-orange-300 text-warning' },
  { value: 'critical', label: 'Critical', cls: 'border-destructive/30 text-destructive' },
];

export const AUDIENCE_OPTIONS: { value: Notification['targetAudience']; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'passengers', label: 'Passengers' },
  { value: 'conductors', label: 'Conductors' },
  { value: 'fleet_operators', label: 'Fleet Operators' },
  { value: 'mot_officers', label: 'MOT Officers' },
  { value: 'timekeepers', label: 'Timekeepers' },
];

export const CHANNEL_OPTIONS: { value: NonNullable<Notification['channel']>; label: string; iconName: string }[] = [
  { value: 'push', label: 'Push Notification', iconName: 'Smartphone' },
  { value: 'email', label: 'Email', iconName: 'Mail' },
  { value: 'sms', label: 'SMS', iconName: 'MessageSquare' },
  { value: 'in-app', label: 'In-App', iconName: 'Bell' },
];

// ── Form state ────────────────────────────────────────────────────

export interface FormState {
  title: string;
  body: string;
  type: Notification['type'];
  priority: Notification['priority'];
  targetAudience: Notification['targetAudience'];
  channel: NonNullable<Notification['channel']>;
}

const DEFAULT_FORM: FormState = {
  title: '',
  body: '',
  type: 'info',
  priority: 'medium',
  targetAudience: 'all',
  channel: 'push',
};

export function useNotificationComposer() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Page metadata ─────────────────────────────────────────

  useSetPageMetadata({
    title: 'Compose Notification',
    description: 'Create and send a new notification to your recipients',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Notifications', href: '/mot/notifications' },
      { label: 'Compose' },
    ],
  });

  useSetPageActions(null);

  // ── Helpers ───────────────────────────────────────────────

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    else if (form.title.length > 120) newErrors.title = 'Title must be under 120 characters.';
    if (!form.body.trim()) newErrors.body = 'Message body is required.';
    else if (form.body.length > 2000) newErrors.body = 'Message must be under 2000 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;
    try {
      setIsSending(true);
      await sendNotification({
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        priority: form.priority,
        targetAudience: form.targetAudience,
        channel: form.channel,
      });
      toast({
        title: 'Notification Sent',
        description: `"${form.title}" has been sent successfully.`,
      });
      router.push('/mot/notifications');
    } catch {
      toast({
        title: 'Send Failed',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  }, [form, validate, toast, router]);

  const handleCancel = useCallback(() => {
    router.push('/mot/notifications');
  }, [router]);

  return {
    form,
    errors,
    isSending,
    set,
    handleSend,
    handleCancel,
  };
}
