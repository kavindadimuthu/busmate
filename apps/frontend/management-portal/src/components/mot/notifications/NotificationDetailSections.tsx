'use client';

import React from 'react';
import {
  Bell,
  Send,
  Inbox,
  Clock,
  Users,
  Smartphone,
  Mail,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  Tag,
  Info,
  Wrench,
  XCircle,
  AlertTriangle,
  CalendarClock,
  BarChart2,
} from 'lucide-react';
import type { Notification } from '@/data/admin/types';
import {
  typeStyles,
  priorityStyles,
  statusStyles,
  channelIconNames,
  audienceLabels,
  formatDate,
  readRatePercent,
} from '@/components/mot/notifications/useNotificationDetail';

// ── Icon lookup ───────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Wrench,
  Smartphone,
  Mail,
  MessageSquare,
  Bell,
};

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return iconMap[name] ?? Info;
}

// ── Detail row ────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 w-40 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Header Banner ─────────────────────────────────────────────────

interface NotificationHeaderProps {
  notification: Notification;
  isRead: boolean;
}

export function NotificationHeader({ notification, isRead }: NotificationHeaderProps) {
  const typeStyle = typeStyles[notification.type] ?? typeStyles.info;
  const TypeIcon = getIcon(typeStyle.icon);
  const statusStyle = statusStyles[notification.status] ?? statusStyles.draft;

  return (
    <div className={`px-6 py-5 border-b border-border/50 flex items-start gap-4 ${isRead ? 'bg-success/10/30' : 'bg-card'}`}>
      <div className={`p-3 rounded-xl border ${typeStyle.cls}`}>
        <TypeIcon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h1 className="text-xl font-bold text-foreground">{notification.title}</h1>
          {isRead && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
              <CheckCircle2 className="h-3 w-3" />
              Read
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.cls}`}>
            <TypeIcon className="h-3 w-3" />
            {typeStyle.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityStyles[notification.priority] ?? 'bg-muted text-muted-foreground'}`}>
            {notification.priority} priority
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.cls}`}>
            {statusStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Metadata Section ──────────────────────────────────────────────

interface NotificationMetadataProps {
  notification: Notification;
  isReceived: boolean;
}

export function NotificationMetadata({ notification, isReceived }: NotificationMetadataProps) {
  const ChannelIcon = notification.channel ? getIcon(channelIconNames[notification.channel] ?? 'Bell') : Bell;

  return (
    <div className="px-6 py-2">
      <DetailRow icon={isReceived ? Inbox : Send} label={isReceived ? 'From' : 'Sent by'}>
        <span className="text-sm text-foreground font-medium">{notification.senderName}</span>
        <span className="text-xs text-muted-foreground/70 ml-2">({notification.senderId})</span>
      </DetailRow>

      <DetailRow icon={Users} label="Audience">
        <span className="text-sm text-foreground/80">{audienceLabels[notification.targetAudience] ?? notification.targetAudience}</span>
      </DetailRow>

      {notification.channel && (
        <DetailRow icon={ChannelIcon} label="Channel">
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80 capitalize">
            <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
            {notification.channel}
          </span>
        </DetailRow>
      )}

      <DetailRow icon={Clock} label="Created">
        <span className="text-sm text-foreground/80">{formatDate(notification.createdAt)}</span>
      </DetailRow>

      {notification.sentAt && (
        <DetailRow icon={Send} label="Sent at">
          <span className="text-sm text-foreground/80">{formatDate(notification.sentAt)}</span>
        </DetailRow>
      )}

      {notification.scheduledFor && (
        <DetailRow icon={CalendarClock} label="Scheduled for">
          <span className="text-sm text-foreground/80">{formatDate(notification.scheduledFor)}</span>
        </DetailRow>
      )}

      <DetailRow icon={Tag} label="ID">
        <span className="text-sm font-mono text-muted-foreground">{notification.id}</span>
      </DetailRow>
    </div>
  );
}

// ── Engagement Stats ──────────────────────────────────────────────

interface NotificationEngagementProps {
  notification: Notification;
}

export function NotificationEngagement({ notification }: NotificationEngagementProps) {
  const rate = readRatePercent(notification);

  return (
    <div className="px-6 py-5 border-t border-border/50 bg-muted/50">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-4">
        Delivery &amp; Engagement
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{notification.totalRecipients.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Recipients</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-success">{notification.readCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Reads</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-2xl font-bold text-primary">{rate}%</p>
            <BarChart2 className="h-5 w-5 text-primary/70" />
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/80 rounded-full transition-all"
              style={{ width: `${rate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Read Rate</p>
        </div>
      </div>
    </div>
  );
}
