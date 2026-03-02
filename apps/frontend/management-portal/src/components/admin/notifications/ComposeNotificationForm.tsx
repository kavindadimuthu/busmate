'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  CheckCircle,
  X,
} from 'lucide-react';
import { sendNotification, scheduleNotification } from '@/data/admin';
import type { Notification } from '@/data/admin/types';

type NotificationType = Notification['type'];
type NotificationPriority = Notification['priority'];
type NotificationAudience = Notification['targetAudience'];
type NotificationChannel = NonNullable<Notification['channel']>;

interface ComposeNotificationFormProps {
  onSuccess?: () => void;
}

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'info', label: 'Information' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'critical', label: 'Critical' },
  { value: 'maintenance', label: 'Maintenance' },
];

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
];

const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; description: string }[] = [
  { value: 'all', label: 'All Users', description: 'Send to every user in the system' },
  { value: 'passengers', label: 'Passengers', description: 'Commuters and ticket holders' },
  { value: 'conductors', label: 'Conductors', description: 'Bus conductors and crew' },
  { value: 'fleet_operators', label: 'Fleet Operators', description: 'Bus fleet operators and managers' },
  { value: 'mot_officers', label: 'MOT Officers', description: 'Ministry of Transport officers' },
  { value: 'timekeepers', label: 'Timekeepers', description: 'Station and depot timekeepers' },
];

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string; icon: string }[] = [
  { value: 'push', label: 'Push Notification', icon: '📱' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'in-app', label: 'In-App', icon: '🔔' },
];

export function ComposeNotificationForm({ onSuccess }: ComposeNotificationFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [audience, setAudience] = useState<NotificationAudience>('all');
  const [channel, setChannel] = useState<NotificationChannel>('push');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isValid = title.trim().length >= 5 && body.trim().length >= 10 && (!isScheduled || (scheduledDate && scheduledTime));

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const data: Partial<Notification> = { title, body, type, priority, targetAudience: audience, channel };

      if (isScheduled) {
        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        await scheduleNotification(data, scheduledFor);
        setResult({ success: true, message: `Notification scheduled for ${scheduledDate} at ${scheduledTime}` });
      } else {
        await sendNotification(data);
        setResult({ success: true, message: 'Notification sent successfully' });
      }

      // Reset form after short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/notifications');
        }
      }, 2000);
    } catch {
      setResult({ success: false, message: 'Failed to send notification. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, title, body, type, priority, audience, channel, isScheduled, scheduledDate, scheduledTime, onSuccess, router]);

  const handleReset = useCallback(() => {
    setTitle('');
    setBody('');
    setType('info');
    setPriority('medium');
    setAudience('all');
    setChannel('push');
    setIsScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
    setResult(null);
  }, []);

  return (
    <div className="mx-auto">
      {/* Result Banner */}
      {result && (
        <div
          className={`mb-6 flex items-center gap-3 p-4 rounded-xl border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{result.message}</p>
          <button onClick={() => setResult(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Title */}
        <div className="p-6">
          <label htmlFor="notif-title" className="block text-sm font-semibold text-gray-900 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="notif-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled System Maintenance"
            maxLength={120}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/120 characters — minimum 5</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <label htmlFor="notif-body" className="block text-sm font-semibold text-gray-900 mb-2">
            Message Body <span className="text-red-500">*</span>
          </label>
          <textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the full notification message here…"
            rows={5}
            maxLength={2000}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/2000 characters — minimum 10</p>
        </div>

        {/* Type & Priority (side-by-side) */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="notif-type" className="block text-sm font-semibold text-gray-900 mb-2">
              Type
            </label>
            <div className="relative">
              <select
                id="notif-type"
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full appearance-none px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    priority === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audience */}
        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Target Audience
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  audience === opt.value
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium ${audience === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Delivery Channel
          </label>
          <div className="flex gap-3">
            {CHANNEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setChannel(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  channel === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Toggle */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsScheduled(!isScheduled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isScheduled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isScheduled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900">Schedule for later</p>
              <p className="text-xs text-gray-500">Set a specific date and time to send</p>
            </div>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div>
                <label htmlFor="sched-date" className="block text-xs font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  id="sched-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="sched-time" className="block text-xs font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  id="sched-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-between bg-gray-50/50 rounded-b-xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Reset Form
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isValid || submitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isScheduled
                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isScheduled ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Processing…' : isScheduled ? 'Schedule' : 'Send Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
