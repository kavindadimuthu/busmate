'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  NotificationFilters,
  NotificationTable,
} from '@/components/admin/notifications';
import {
  filterNotifications,
  getNotifications,
  getSentNotifications,
  getScheduledNotifications,
  getDraftNotifications,
  getUniqueAudiences,
  getUniqueSenders,
} from '@/data/admin';
import {
  Bell,
  Send,
  Clock,
  FileText,
  Download,
  Plus,
} from 'lucide-react';
import type { Notification } from '@/data/admin/types';

type TabKey = 'all' | 'sent' | 'scheduled' | 'drafts';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: 'All', icon: <Bell className="h-4 w-4" />, color: 'blue' },
  { key: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" />, color: 'green' },
  { key: 'scheduled', label: 'Scheduled', icon: <Clock className="h-4 w-4" />, color: 'amber' },
  { key: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" />, color: 'purple' },
];

const ITEMS_PER_PAGE = 15;

function NotificationsListingContent() {
  useSetPageMetadata({
    title: 'Notification Explorer',
    description: 'Browse and filter all notifications',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Explorer' },
    ],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'all';

  useSetPageActions(
    <>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => {/* TODO: export */}}
      >
        <Download className="h-4 w-4" />
        Export
      </button>
      <button
        onClick={() => router.push('/admin/notifications/compose')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Compose
      </button>
    </>
  );

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
    setSort({ field: 'createdAt', direction: 'desc' });
  }, []);

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(`/admin/notifications/${id}`);
    },
    [router]
  );

  // Total counts per tab
  const totalCounts = useMemo(
    () => ({
      all: getNotifications().length,
      sent: getSentNotifications().length,
      scheduled: getScheduledNotifications().length,
      drafts: getDraftNotifications().length,
    }),
    []
  );

  // Filter config
  const filterConfig = useMemo(() => {
    const audiences = getUniqueAudiences();
    const common = [
      {
        key: 'type',
        label: 'Type',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Warning' },
          { value: 'critical', label: 'Critical' },
          { value: 'success', label: 'Success' },
          { value: 'maintenance', label: 'Maintenance' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        options: [
          { value: 'all', label: 'All Priorities' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ],
      },
      {
        key: 'targetAudience',
        label: 'Audience',
        options: [
          { value: 'all', label: 'All Audiences' },
          ...audiences.map((a) => ({ value: a, label: a.replace('_', ' ') })),
        ],
      },
      {
        key: 'channel',
        label: 'Channel',
        options: [
          { value: 'all', label: 'All Channels' },
          { value: 'push', label: 'Push' },
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'in-app', label: 'In-App' },
        ],
      },
    ];
    return common;
  }, []);

  // Apply filters
  const filteredNotifications = useMemo(() => {
    // Start from tab-specific list
    let base: Notification[];
    switch (activeTab) {
      case 'sent':
        base = getSentNotifications();
        break;
      case 'scheduled':
        base = getScheduledNotifications();
        break;
      case 'drafts':
        base = getDraftNotifications();
        break;
      default:
        base = getNotifications();
    }

    // Apply additional filters
    if (Object.keys(filters).length > 0 || searchTerm) {
      const allFiltered = filterNotifications({
        ...filters,
        search: searchTerm,
        ...(activeTab === 'sent' ? { status: 'sent' } : {}),
        ...(activeTab === 'scheduled' ? { status: 'scheduled' } : {}),
        ...(activeTab === 'drafts' ? { status: 'draft' } : {}),
      });
      return allFiltered;
    }

    return base;
  }, [activeTab, filters, searchTerm]);

  // Sort
  const sortedNotifications = useMemo(() => {
    const sorted = [...filteredNotifications];
    sorted.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort.field];
      const bVal = (b as unknown as Record<string, unknown>)[sort.field];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [filteredNotifications, sort]);

  // Paginate
  const totalPages = Math.ceil(sortedNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(
    () => sortedNotifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [sortedNotifications, currentPage]
  );

  const tabColorClass = (tab: TabKey, isActive: boolean) => {
    if (!isActive) return 'text-gray-500 hover:text-gray-700 hover:bg-gray-50';
    switch (tab) {
      case 'all':
        return 'text-blue-700 bg-blue-50 border-blue-500';
      case 'sent':
        return 'text-green-700 bg-green-50 border-green-500';
      case 'scheduled':
        return 'text-amber-700 bg-amber-50 border-amber-500';
      case 'drafts':
        return 'text-purple-700 bg-purple-50 border-purple-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? tabColorClass(tab.key, true)
                    : `border-transparent ${tabColorClass(tab.key, false)}`
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-white/60 font-semibold'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {totalCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100">
          <NotificationFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            filterConfig={filterConfig}
            totalCount={totalCounts[activeTab]}
            filteredCount={filteredNotifications.length}
          />
        </div>

        {/* Table */}
        <NotificationTable
          notifications={paginatedNotifications}
          onView={handleViewDetail}
          currentSort={sort}
          onSort={handleSort}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedNotifications.length)} of{' '}
              {sortedNotifications.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === p
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsListingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <NotificationsListingContent />
    </Suspense>
  );
}
