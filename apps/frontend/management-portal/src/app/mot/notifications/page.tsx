'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PenSquare, Inbox, Send } from 'lucide-react';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, ConfirmDialog, useDialog } from '@busmate/ui';

import { NotificationsTableNew } from '@/components/mot/notifications/notifications-table';
import { NotificationsFilterBar, type NotificationFilters } from '@/components/mot/notifications/notifications-filter-bar';
import { NotificationsStatsCardsNew } from '@/components/mot/notifications/notifications-stats-cards';

import {
  getReceivedNotifications,
  getSentNotifications,
  getNotificationStats,
  deleteNotification,
} from '@/data/admin';
import type { Notification } from '@/data/admin/types';

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  useSetPageMetadata({
    title: 'Notification Center',
    description: 'Manage and track system notifications and communications',
    activeItem: 'notifications',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Notifications' }],
  });

  useSetPageActions(
    <Button onClick={() => router.push('/mot/notifications/compose')}>
      <PenSquare className="h-4 w-4" />
      Compose
    </Button>
  );

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
    [allReceived.length, allSent.length, rawStats]
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
          n.senderName.toLowerCase().includes(term)
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
    [processed, page, pageSize]
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
    [router, activeTab]
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <NotificationsStatsCardsNew stats={statsData} />

      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="received">
            <Inbox className="w-4 h-4 mr-1.5" />
            Inbox ({allReceived.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="w-4 h-4 mr-1.5" />
            Sent ({allSent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Search & Filters */}
          <NotificationsFilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearAll={handleClearAll}
            activeFilterCount={activeFilterCount}
          />

          {/* Table */}
          <NotificationsTableNew
            data={paginated}
            totalItems={totalElements}
            mode={activeTab}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            sortColumn={sortColumn}
            sortDirection={sortDir}
            onSort={handleSort}
            onView={handleView}
            onDelete={(notif: any) => deleteDialog.open(notif)}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Notification"
        description={`Are you sure you want to delete "${deleteDialog.data?.title ?? 'this notification'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
