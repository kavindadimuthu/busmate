'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  getLogStats,
} from '@/data/admin';

export type TabKey = 'user-activity' | 'security' | 'application';

export function useLogsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'user-activity';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'timestamp',
    direction: 'desc',
  });

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
    setPageSize(20);
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
    (logId: string) => router.push(`/admin/logs/${logId}`),
    [router]
  );

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const filterConfig = useMemo(() => {
    switch (activeTab) {
      case 'user-activity':
        return [
          {
            key: 'userType',
            label: 'User Type',
            options: [
              ...getUniqueUserTypes().map((t) => ({ value: t, label: t })),
            ],
          },
          {
            key: 'action',
            label: 'Action',
            options: [
              ...getUniqueActions().map((a) => ({ value: a, label: a })),
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
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
              { value: 'ERROR', label: 'ERROR' },
              { value: 'WARN', label: 'WARN' },
              { value: 'INFO', label: 'INFO' },
              { value: 'DEBUG', label: 'DEBUG' },
            ],
          },
          {
            key: 'service',
            label: 'Service',
            options: [
              ...getUniqueServices().map((s) => ({ value: s, label: s })),
            ],
          },
        ];
    }
  }, [activeTab]);

  const stats = useMemo(() => getLogStats(), []);

  const totalCounts = useMemo(
    () => ({
      'user-activity': getUserActivityLogs().length,
      security: getSecurityLogs().length,
      application: getApplicationLogs().length,
    }),
    []
  );

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

  const totalPages = Math.ceil(sortedLogs.length / pageSize);
  const paginatedLogs = useMemo(
    () => sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedLogs, currentPage, pageSize]
  );

  return {
    stats,
    activeTab,
    searchTerm,
    filters,
    currentPage,
    sort,
    filterConfig,
    totalCounts,
    filteredLogs,
    sortedLogs,
    totalPages,
    paginatedLogs,
    pageSize,
    handleTabChange,
    handleSort,
    handleFilterChange,
    handleSearchChange,
    handleViewDetail,
    handleClearAll,
    setCurrentPage,
    handlePageSizeChange,
  };
}
