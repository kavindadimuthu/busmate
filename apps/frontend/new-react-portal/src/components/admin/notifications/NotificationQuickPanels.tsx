'use client';

import { ArrowRight, AlertTriangle, Clock, FileText } from 'lucide-react';
import type { getSentNotifications, getScheduledNotifications, getDraftNotifications } from '@/data/admin';

type SentNotification = ReturnType<typeof getSentNotifications>[number];
type ScheduledNotification = ReturnType<typeof getScheduledNotifications>[number];
type DraftNotification = ReturnType<typeof getDraftNotifications>[number];

interface Props {
  recentCritical: SentNotification[];
  upcoming: ScheduledNotification[];
  drafts: DraftNotification[];
  onViewSent: () => void;
  onViewScheduled: () => void;
  onViewDrafts: () => void;
  onViewNotification: (id: string) => void;
}

export function NotificationQuickPanels({
  recentCritical,
  upcoming,
  drafts,
  onViewSent,
  onViewScheduled,
  onViewDrafts,
  onViewNotification,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* High Priority */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">High Priority</h3>
          </div>
          <button
            onClick={onViewSent}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recentCritical.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentCritical.map((n) => (
              <div
                key={n.id}
                className="p-3 hover:bg-destructive/10/30 cursor-pointer transition-colors"
                onClick={() => onViewNotification(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    n.priority === 'critical' ? 'bg-destructive' : 'bg-warning'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${
                        n.priority === 'critical'
                          ? 'bg-destructive text-white'
                          : 'bg-warning/15 text-orange-700'
                      }`}>
                        {n.priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No high-priority notifications
          </div>
        )}
      </div>

      {/* Scheduled */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-warning/10 rounded-lg">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Scheduled</h3>
          </div>
          <button
            onClick={onViewScheduled}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {upcoming.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {upcoming.map((n) => (
              <div
                key={n.id}
                className="p-3 hover:bg-warning/10/30 cursor-pointer transition-colors"
                onClick={() => onViewNotification(n.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{n.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warning/15 text-warning">
                      {n.scheduledFor
                        ? new Date(n.scheduledFor).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'TBD'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">{n.targetAudience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No scheduled notifications
          </div>
        )}
      </div>

      {/* Drafts */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[hsl(var(--purple-50))] rounded-lg">
              <FileText className="h-4 w-4 text-[hsl(var(--purple-600))]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Drafts</h3>
          </div>
          <button
            onClick={onViewDrafts}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {drafts.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {drafts.map((n) => (
              <div
                key={n.id}
                className="p-3 hover:bg-[hsl(var(--purple-50))]/30 cursor-pointer transition-colors"
                onClick={() => onViewNotification(n.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{n.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]">
                      Draft
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">No drafts</div>
        )}
      </div>
    </div>
  );
}
