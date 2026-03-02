'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import {
  LogFilters,
  UserActivityTable,
  SecurityLogsTable,
  ApplicationLogsTable,
} from '@/components/admin/logs';
import {
  filterUserActivityLogs,
  filterSecurityLogs,
  filterApplicationLogs,
  getUserActivityLogs,
  getSecurityLogs,
  getApplicationLogs,
  getUniqueServices,
  getUniqueUserTypes,
  getUniqueActions,
} from '@/data/admin';
import {
  Activity,
  Shield,
  Terminal,
  Download,
} from 'lucide-react';

type TabKey = 'user-activity' | 'security' | 'application';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'user-activity', label: 'User Activity', icon: <Activity className="h-4 w-4" />, color: 'green' },
  { key: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, color: 'orange' },
  { key: 'application', label: 'Application', icon: <Terminal className="h-4 w-4" />, color: 'purple' },
];

const ITEMS_PER_PAGE = 15;

function LogsListingContent() {
  useSetPageMetadata({
    title: 'Log Explorer',
    description: 'Browse and filter all system logs',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Logs', href: '/admin/logs' },
      { label: 'Explorer' },
    ],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'user-activity';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'timestamp',
    direction: 'desc',
  });

  // Reset filters & page when switching tabs
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
    setSort({ field: 'timestamp', direction: 'desc' });
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
    (logId: string) => {
      router.push(`/admin/logs/${logId}`);
    },
    [router]
  );

  // Get filter configs for each tab
  const filterConfig = useMemo(() => {
    switch (activeTab) {
      case 'user-activity':
        return [
          {
            key: 'userType',
            label: 'User Type',
            options: [{ value: 'all', label: 'All Types' }, ...getUniqueUserTypes().map((t) => ({ value: t, label: t }))],
          },
          {
            key: 'action',
            label: 'Action',
            options: [{ value: 'all', label: 'All Actions' }, ...getUniqueActions().map((a) => ({ value: a, label: a }))],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'all', label: 'All' },
              { value: 'success', label: 'Success' },
              { value: 'error', label: 'Error' },
              { value: 'warning', label: 'Warning' },
            ],
          },
        ];
      case 'security':
        return [
          {
            key: 'eventType',
            label: 'Event Type',
            options: [
              { value: 'all', label: 'All Events' },
              { value: 'login', label: 'Login' },
              { value: 'logout', label: 'Logout' },
              { value: 'failed_login', label: 'Failed Login' },
              { value: 'password_change', label: 'Password Change' },
              { value: 'permission_change', label: 'Permission Change' },
              { value: 'suspicious_activity', label: 'Suspicious Activity' },
            ],
          },
          {
            key: 'severity',
            label: 'Severity',
            options: [
              { value: 'all', label: 'All' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ],
          },
        ];
      case 'application':
        return [
          {
            key: 'level',
            label: 'Level',
            options: [
              { value: 'all', label: 'All Levels' },
              { value: 'ERROR', label: 'ERROR' },
              { value: 'WARN', label: 'WARN' },
              { value: 'INFO', label: 'INFO' },
              { value: 'DEBUG', label: 'DEBUG' },
            ],
          },
          {
            key: 'service',
            label: 'Service',
            options: [{ value: 'all', label: 'All Services' }, ...getUniqueServices().map((s) => ({ value: s, label: s }))],
          },
        ];
    }
  }, [activeTab]);

  // Get total counts for each tab
  const totalCounts = useMemo(
    () => ({
      'user-activity': getUserActivityLogs().length,
      security: getSecurityLogs().length,
      application: getApplicationLogs().length,
    }),
    []
  );

  // Apply filters
  const filteredLogs = useMemo(() => {
    switch (activeTab) {
      case 'user-activity':
        return filterUserActivityLogs({
          userType: filters.userType,
          action: filters.action,
          status: filters.status,
          search: searchTerm,
        });
      case 'security':
        return filterSecurityLogs({
          eventType: filters.eventType,
          severity: filters.severity,
          search: searchTerm,
        });
      case 'application':
        return filterApplicationLogs({
          level: filters.level,
          service: filters.service,
          search: searchTerm,
        });
    }
  }, [activeTab, filters, searchTerm]);

  // Sort
  const sortedLogs = useMemo(() => {
    const sorted = [...filteredLogs];
    sorted.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort.field];
      const bVal = (b as unknown as Record<string, unknown>)[sort.field];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
    return sorted;
  }, [filteredLogs, sort]);

  // Paginate
  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(
    () => sortedLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [sortedLogs, currentPage]
  );

  const tabColorClass = (tab: TabKey, isActive: boolean) => {
    if (!isActive) return 'text-gray-500 hover:text-gray-700 hover:bg-gray-50';
    switch (tab) {
      case 'user-activity':
        return 'text-green-700 bg-green-50 border-green-500';
      case 'security':
        return 'text-orange-700 bg-orange-50 border-orange-500';
      case 'application':
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
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => {
              /* TODO: export functionality */
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100">
          <LogFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={() => { setSearchTerm(''); setFilters({}); setCurrentPage(1); }}
            filterConfig={filterConfig}
            totalCount={totalCounts[activeTab]}
            filteredCount={filteredLogs.length}
          />
        </div>

        {/* Table */}
        <div>
          {activeTab === 'user-activity' && (
            <UserActivityTable
              logs={paginatedLogs as ReturnType<typeof getUserActivityLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
          {activeTab === 'security' && (
            <SecurityLogsTable
              logs={paginatedLogs as ReturnType<typeof getSecurityLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
          {activeTab === 'application' && (
            <ApplicationLogsTable
              logs={paginatedLogs as ReturnType<typeof getApplicationLogs>}
              onViewDetail={handleViewDetail}
              currentSort={sort}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedLogs.length)} of {sortedLogs.length} results
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

export default function LogsListingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <LogsListingContent />
    </Suspense>
  );
}
