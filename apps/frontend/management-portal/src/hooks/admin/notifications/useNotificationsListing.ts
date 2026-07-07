'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  filterNotifications,
  getNotifications,
  getNotificationStats,
  getSentNotifications,
  getScheduledNotifications,
  getDraftNotifications,
  getUniqueAudiences,
} from '@/data/admin';
import type { Notification } from '@/data/admin/types';

export type TabKey = 'all' | 'sent' | 'scheduled' | 'drafts';

export function useNotificationsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'all';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
    setPageSize(20);
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
    (id: string) => router.push(`/admin/notifications/${id}`),
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

  const stats = useMemo(() => getNotificationStats(), []);

  const totalCounts = useMemo(
    () => ({
      all: getNotifications().length,
      sent: getSentNotifications().length,
      scheduled: getScheduledNotifications().length,
      drafts: getDraftNotifications().length,
    }),
    []
  );

  const filterConfig = useMemo(() => {
    const audiences = getUniqueAudiences();
    return [
      {
        key: 'type',
        label: 'Type',
        options: [
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
          ...audiences.map((a) => ({ value: a, label: a.replace('_', ' ') })),
        ],
      },
      {
        key: 'channel',
        label: 'Channel',
        options: [
          { value: 'push', label: 'Push' },
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'in-app', label: 'In-App' },
        ],
      },
    ];
  }, []);

  const filteredNotifications = useMemo((): Notification[] => {
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

    if (Object.keys(filters).length > 0 || searchTerm) {
      return filterNotifications({
        ...filters,
        search: searchTerm,
        ...(activeTab === 'sent' ? { status: 'sent' } : {}),
        ...(activeTab === 'scheduled' ? { status: 'scheduled' } : {}),
        ...(activeTab === 'drafts' ? { status: 'draft' } : {}),
      });
    }

    return base;
  }, [activeTab, filters, searchTerm]);

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

  const totalPages = Math.ceil(sortedNotifications.length / pageSize);
  const paginatedNotifications = useMemo(
    () => sortedNotifications.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedNotifications, currentPage, pageSize]
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
    filteredNotifications,
    sortedNotifications,
    totalPages,
    paginatedNotifications,
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
