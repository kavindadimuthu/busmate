'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDialog } from '@busmate/ui';

import type { NotificationFilters } from '@/components/mot/notifications/notifications-filter-bar';

import {
  getReceivedNotifications,
  getSentNotifications,
  getNotificationStats,
  deleteNotification,
} from '@/data/admin';
import type { Notification } from '@/data/admin/types';

export function useNotifications() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Data ────────────────────────────────────────────────────
  const allReceived = useMemo(() => getReceivedNotifications(), []);
  const allSent = useMemo(() => getSentNotifications(), []);
  const rawStats = useMemo(() => getNotificationStats(), []);

  const statsData = useMemo(
    () => ({
      totalReceived: allReceived.length,
      totalSent: allSent.length,
      totalScheduled: rawStats.totalScheduled,
      averageReadRate: rawStats.averageReadRate,
    }),
    [allReceived.length, allSent.length, rawStats],
  );

  // ── UI state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<NotificationFilters>({
    type: '__all__',
    priority: '__all__',
  });
  const [sortColumn, setSortColumn] = useState<string | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Delete dialog
  const deleteDialog = useDialog<Notification>();
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Source for current tab ──────────────────────────────────
  const sourceData = activeTab === 'received' ? allReceived : allSent;

  // ── Filtering & sorting ──────────────────────────────────────
  const processed = useMemo(() => {
    let data = [...sourceData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.body.toLowerCase().includes(term) ||
          n.senderName.toLowerCase().includes(term),
      );
    }

    if (filters.type !== '__all__') {
      data = data.filter((n) => n.type === filters.type);
    }

    if (filters.priority !== '__all__') {
      data = data.filter((n) => n.priority === filters.priority);
    }

    if (sortColumn) {
      data.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortColumn];
        const bVal = (b as unknown as Record<string, unknown>)[sortColumn];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    return data;
  }, [sourceData, searchTerm, filters, sortColumn, sortDir]);

  const totalElements = processed.length;
  const paginated = useMemo(
    () => processed.slice((page - 1) * pageSize, page * pageSize),
    [processed, page, pageSize],
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as 'received' | 'sent');
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((partial: Partial<NotificationFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const activeFilterCount = [
    filters.type !== '__all__',
    filters.priority !== '__all__',
  ].filter(Boolean).length;

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setFilters({ type: '__all__', priority: '__all__' });
    setPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDir('asc');
      return column;
    });
    setPage(1);
  }, []);

  const handleView = useCallback(
    (notif: any) => router.push(`/mot/notifications/${notif.id}?from=${activeTab}`),
    [router, activeTab],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.data) return;
    try {
      setIsDeleting(true);
      await deleteNotification(deleteDialog.data.id);
      toast({
        title: 'Notification Deleted',
        description: `"${deleteDialog.data.title}" has been deleted.`,
      });
      deleteDialog.close();
    } catch {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, toast]);

  return {
    // Data
    allReceived,
    allSent,
    statsData,
    paginated,
    totalElements,
    // Tab state
    activeTab,
    handleTabChange,
    // Filter state
    searchTerm,
    handleSearchChange,
    filters,
    handleFiltersChange,
    activeFilterCount,
    handleClearAll,
    // Sort & pagination
    sortColumn,
    sortDir,
    handleSort,
    page,
    setPage,
    pageSize,
    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    // Actions
    handleView,
  };
}
