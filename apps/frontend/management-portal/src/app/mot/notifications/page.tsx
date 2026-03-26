'use client';

import { useRouter } from 'next/navigation';
import { PenSquare, Inbox, Send } from 'lucide-react';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, ConfirmDialog } from '@busmate/ui';

import { NotificationsTableNew } from '@/components/mot/notifications/notifications-table';
import { NotificationsFilterBar } from '@/components/mot/notifications/notifications-filter-bar';
import { NotificationsStatsCardsNew } from '@/components/mot/notifications/notifications-stats-cards';
import { useNotifications } from '@/components/mot/notifications/useNotifications';

export default function NotificationsPage() {
  const router = useRouter();

  const {
    allReceived, allSent, statsData, paginated, totalElements, activeTab, handleTabChange,
    searchTerm, handleSearchChange, filters, handleFiltersChange, activeFilterCount, handleClearAll,
    sortColumn, sortDir, handleSort, page, setPage, pageSize,
    deleteDialog, isDeleting, handleDeleteConfirm, handleView,
  } = useNotifications();

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
    </Button>,
  );

  return (
    <div className="space-y-6">
      <NotificationsStatsCardsNew stats={statsData} />

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
          <NotificationsFilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearAll={handleClearAll}
            activeFilterCount={activeFilterCount}
          />

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
