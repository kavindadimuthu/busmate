'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
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

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/data/admin';
import type { Notification } from '@/data/admin/types';

// ── Field options ─────────────────────────────────────────────────

const TYPE_OPTIONS: { value: Notification['type']; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { value: 'info', label: 'Info', icon: Info, description: 'General information' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, description: 'Alert or caution' },
    { value: 'critical', label: 'Critical', icon: XCircle, description: 'Urgent action required' },
    { value: 'success', label: 'Success', icon: CheckCircle, description: 'Positive update' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'System maintenance' },
];

const PRIORITY_OPTIONS: { value: Notification['priority']; label: string; cls: string }[] = [
    { value: 'low', label: 'Low', cls: 'border-gray-300 text-gray-600' },
    { value: 'medium', label: 'Medium', cls: 'border-blue-300 text-blue-600' },
    { value: 'high', label: 'High', cls: 'border-orange-300 text-orange-600' },
    { value: 'critical', label: 'Critical', cls: 'border-red-300 text-red-600' },
];

const AUDIENCE_OPTIONS: { value: Notification['targetAudience']; label: string }[] = [
    { value: 'all', label: 'Everyone' },
    { value: 'passengers', label: 'Passengers' },
    { value: 'conductors', label: 'Conductors' },
    { value: 'fleet_operators', label: 'Fleet Operators' },
    { value: 'mot_officers', label: 'MOT Officers' },
    { value: 'timekeepers', label: 'Timekeepers' },
];

const CHANNEL_OPTIONS: { value: NonNullable<Notification['channel']>; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'push', label: 'Push Notification', icon: Smartphone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'in-app', label: 'In-App', icon: Bell },
];

// ── Form state ────────────────────────────────────────────────────

interface FormState {
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

// ── Form field wrapper ────────────────────────────────────────────

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

// ── Page component ────────────────────────────────────────────────

export default function ComposeNotificationPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [isSending, setIsSending] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

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

    // ── Helpers ────────────────────────────────────────────────

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

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Compose form card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <Send className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">New Notification</h2>
                        <p className="text-sm text-gray-500">Fill in the details below to compose and send your notification.</p>
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
                            className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </Field>

                    {/* Body */}
                    <Field label="Message" required hint={`${form.body.length}/2000 characters`}>
                        <textarea
                            value={form.body}
                            onChange={(e) => set('body', e.target.value)}
                            maxLength={2000}
                            rows={5}
                            placeholder="Write the full notification message here…"
                            className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all resize-none ${errors.body ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
                    </Field>

                    {/* Type */}
                    <Field label="Notification Type" required>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {TYPE_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                                const active = form.type === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => set('type', value)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                                            active
                                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
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
                                                ? `${cls} bg-white shadow-sm`
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
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
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select
                                value={form.targetAudience}
                                onChange={(e) => set('targetAudience', e.target.value as Notification['targetAudience'])}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all appearance-none"
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
                            {CHANNEL_OPTIONS.map(({ value, label, icon: Icon }) => {
                                const active = form.channel === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => set('channel', value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                            active
                                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                        Once sent, notifications cannot be edited. You can delete them from the notifications list.
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => router.push('/mot/notifications')}
                            disabled={isSending}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={isSending}
                            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
}

