'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  NotificationStatsCards,
  NotificationTrendChart,
} from '@/components/admin/notifications';
import {
  getNotificationStats,
  getSentNotifications,
  getScheduledNotifications,
  getDraftNotifications,
} from '@/data/admin';
import {
  ArrowRight,
  Plus,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';

export default function NotificationsOverviewPage() {
  useSetPageMetadata({
    title: 'Notifications',
    description: 'Overview of notification activity and delivery metrics',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Notifications' }],
  });

  const router = useRouter();
  const [loading] = useState(false);

  const stats = useMemo(() => getNotificationStats(), []);
  const recentCritical = useMemo(
    () =>
      getSentNotifications()
        .filter((n) => n.priority === 'critical' || n.priority === 'high')
        .slice(0, 5),
    []
  );
  const upcoming = useMemo(() => getScheduledNotifications(5), []);
  const drafts = useMemo(() => getDraftNotifications(5), []);

  useSetPageActions(
    <>
      <button
        onClick={() => router.push('/admin/notifications/listing')}
        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
      >
        View All Notifications
      </button>
      <button
        onClick={() => router.push('/admin/notifications/compose')}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-colors"
      >
        <Plus className="h-4 w-4" />
        Compose
      </button>
    </>
  );

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <NotificationStatsCards stats={stats} loading={loading} />

      {/* Trend Chart */}
      <NotificationTrendChart stats={stats} loading={loading} />

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical & High Priority */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">High Priority</h3>
            </div>
            <button
              onClick={() => router.push('/admin/notifications/listing?tab=sent')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentCritical.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentCritical.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-red-50/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/notifications/${n.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      n.priority === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${
                          n.priority === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {n.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              No high-priority notifications
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Scheduled</h3>
            </div>
            <button
              onClick={() => router.push('/admin/notifications/listing?tab=scheduled')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {upcoming.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {upcoming.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-amber-50/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/notifications/${n.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        {n.scheduledFor
                          ? new Date(n.scheduledFor).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'TBD'}
                      </span>
                      <span className="text-[10px] text-gray-400">{n.targetAudience}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              No scheduled notifications
            </div>
          )}
        </div>

        {/* Drafts */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Drafts</h3>
            </div>
            <button
              onClick={() => router.push('/admin/notifications/listing?tab=drafts')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {drafts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {drafts.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-purple-50/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/notifications/${n.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        Draft
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">No drafts</div>
          )}
        </div>
      </div>

      {/* Audience & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Audience Breakdown
          </h3>
          <div className="space-y-3">
            {stats.audienceBreakdown.map((item, idx) => {
              const maxCount = stats.audienceBreakdown[0]?.count || 1;
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 capitalize">{item.audience.replace('_', ' ')}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Channel Distribution
          </h3>
          <div className="space-y-3">
            {stats.channelBreakdown.map((item, idx) => {
              const maxCount = stats.channelBreakdown[0]?.count || 1;
              const pct = (item.count / maxCount) * 100;
              const colors: Record<string, string> = {
                push: 'bg-green-500',
                email: 'bg-blue-500',
                sms: 'bg-amber-500',
                'in-app': 'bg-purple-500',
              };
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 capitalize">{item.channel}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors[item.channel] || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
