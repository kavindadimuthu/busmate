'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Send,
    Inbox,
    PenSquare,
    CheckCircle,
    Clock3,
} from 'lucide-react';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';

import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import type { TabItem } from '@/components/shared/SwitchableTabs';
import { SearchFilterBar, SelectFilter } from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import { DataPagination } from '@/components/shared/DataPagination';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import { DeleteConfirmationModal } from '@/components/mot/confirmation-modals';
import { NotificationsTable } from '@/components/mot/notifications';

import {
    getReceivedNotifications,
    getSentNotifications,
    getNotificationStats,
    deleteNotification,
} from '@/data/admin';
import type { Notification } from '@/data/admin/types';

// ── Tab type ──────────────────────────────────────────────────────

type TabValue = 'received' | 'sent';

const TABS: TabItem<TabValue>[] = [
    { id: 'received', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
];

// ── Filter options ────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
    { value: 'success', label: 'Success' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'error', label: 'Error' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

// ── Page component ────────────────────────────────────────────────

export default function NotificationsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // ── Metadata & actions ──────────────────────────────────────

    useSetPageMetadata({
        title: 'Notification Center',
        description: 'Manage and track system notifications and communications',
        activeItem: 'notifications',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Notifications' }],
    });

    useSetPageActions(
        <button
            onClick={() => router.push('/mot/notifications/compose')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
            <PenSquare className="h-4 w-4" />
            Compose
        </button>
    );

    // ── Data ────────────────────────────────────────────────────

    const allReceived = useMemo(() => getReceivedNotifications(), []);
    const allSent = useMemo(() => getSentNotifications(), []);
    const stats = useMemo(() => getNotificationStats(), []);

    // ── UI state ────────────────────────────────────────────────

    const [activeTab, setActiveTab] = useState<TabValue>('received');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
        field: 'createdAt',
        direction: 'desc',
    });

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState<Notification | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Tab counts ──────────────────────────────────────────────

    const tabsWithCounts = useMemo<TabItem<TabValue>[]>(() => [
        { id: 'received', label: 'Inbox', icon: Inbox, count: allReceived.length },
        { id: 'sent', label: 'Sent', icon: Send, count: allSent.length },
    ], [allReceived.length, allSent.length]);

    // ── Source for current tab ──────────────────────────────────

    const sourceData = activeTab === 'received' ? allReceived : allSent;

    // ── Filtering & sorting ──────────────────────────────────────

    const processed = useMemo(() => {
        let data = [...sourceData];

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(
                (n) =>
                    n.title.toLowerCase().includes(term) ||
                    n.body.toLowerCase().includes(term) ||
                    n.senderName.toLowerCase().includes(term),
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            data = data.filter((n) => n.type === typeFilter);
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            data = data.filter((n) => n.priority === priorityFilter);
        }

        // Sort
        data.sort((a, b) => {
            const aVal = (a as unknown as Record<string, unknown>)[sort.field];
            const bVal = (b as unknown as Record<string, unknown>)[sort.field];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sort.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return 0;
        });

        return data;
    }, [sourceData, searchTerm, typeFilter, priorityFilter, sort]);

    // Paginate
    const totalElements = processed.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
    const paginated = useMemo(
        () => processed.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
        [processed, currentPage, pageSize],
    );

    // ── Stats cards ──────────────────────────────────────────────

    const statMetrics = useMemo<StatsCardMetric[]>(() => [
        {
            label: 'Total Received',
            value: String(allReceived.length),
            icon: Inbox,
            color: 'blue',
            trend: 'stable',
            trendValue: '',
            trendPositiveIsGood: true,
            sparkData: [],
        },
        {
            label: 'Total Sent',
            value: String(allSent.length),
            icon: Send,
            color: 'teal',
            trend: 'stable',
            trendValue: '',
            trendPositiveIsGood: true,
            sparkData: [],
        },
        {
            label: 'Scheduled',
            value: String(stats.totalScheduled),
            icon: Clock3,
            color: 'amber',
            trend: 'stable',
            trendValue: '',
            trendPositiveIsGood: true,
            sparkData: [],
        },
        {
            label: 'Avg Read Rate',
            value: `${stats.averageReadRate}%`,
            icon: CheckCircle,
            color: 'green',
            trend: 'stable',
            trendValue: '',
            trendPositiveIsGood: true,
            sparkData: [],
        },
    ], [allReceived.length, allSent.length, stats]);

    // ── Filter chips ───────────────────────────────────────────

    const activeChips = useMemo<FilterChipDescriptor[]>(() => {
        const chips: FilterChipDescriptor[] = [];
        if (typeFilter !== 'all') {
            const opt = TYPE_OPTIONS.find((o) => o.value === typeFilter);
            chips.push({
                key: 'type',
                label: `Type: ${opt?.label ?? typeFilter}`,
                onRemove: () => { setTypeFilter('all'); setCurrentPage(0); },
            });
        }
        if (priorityFilter !== 'all') {
            const opt = PRIORITY_OPTIONS.find((o) => o.value === priorityFilter);
            chips.push({
                key: 'priority',
                label: `Priority: ${opt?.label ?? priorityFilter}`,
                onRemove: () => { setPriorityFilter('all'); setCurrentPage(0); },
            });
        }
        return chips;
    }, [typeFilter, priorityFilter]);

    // ── Handlers ──────────────────────────────────────────────

    const handleTabChange = useCallback((tab: TabValue) => {
        setActiveTab(tab);
        setCurrentPage(0);
    }, []);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentPage(0);
    }, []);

    const handleTypeFilter = useCallback((val: string) => {
        setTypeFilter(val);
        setCurrentPage(0);
    }, []);

    const handlePriorityFilter = useCallback((val: string) => {
        setPriorityFilter(val);
        setCurrentPage(0);
    }, []);

    const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSort({ field, direction });
        setCurrentPage(0);
    }, []);

    const handleClearAll = useCallback(() => {
        setSearchTerm('');
        setTypeFilter('all');
        setPriorityFilter('all');
        setCurrentPage(0);
    }, []);

    const handleView = useCallback(
        (id: string) => router.push(`/mot/notifications/${id}?from=${activeTab}`),
        [router, activeTab],
    );

    const handleDeleteClick = useCallback((notif: Notification) => {
        setNotifToDelete(notif);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteCancel = useCallback(() => {
        setShowDeleteModal(false);
        setNotifToDelete(null);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!notifToDelete) return;
        try {
            setIsDeleting(true);
            await deleteNotification(notifToDelete.id);
            toast({
                title: 'Notification Deleted',
                description: `"${notifToDelete.title}" has been deleted.`,
            });
            setShowDeleteModal(false);
            setNotifToDelete(null);
        } catch {
            toast({
                title: 'Delete Failed',
                description: 'Failed to delete notification. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    }, [notifToDelete, toast]);

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <StatsCardsContainer metrics={statMetrics} columns={4} />

            {/* Tab Switcher */}
            <SwitchableTabs<TabValue>
                tabs={tabsWithCounts}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                ariaLabel="Notification type switcher"
            />

            {/* Search & Filters */}
            <SearchFilterBar
                searchValue={searchTerm}
                onSearchChange={handleSearch}
                searchPlaceholder="Search notifications by title, content, or sender…"
                totalCount={sourceData.length}
                filteredCount={totalElements}
                resultLabel="notification"
                activeChips={activeChips}
                onClearAllFilters={handleClearAll}
                filters={
                    <>
                        <SelectFilter
                            value={typeFilter}
                            onChange={handleTypeFilter}
                            options={TYPE_OPTIONS}
                            allLabel="All Types"
                        />
                        <SelectFilter
                            value={priorityFilter}
                            onChange={handlePriorityFilter}
                            options={PRIORITY_OPTIONS}
                            allLabel="All Priorities"
                        />
                    </>
                }
            />

            {/* Table */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <NotificationsTable
                    notifications={paginated}
                    mode={activeTab}
                    loading={false}
                    onView={handleView}
                    onDelete={handleDeleteClick}
                    currentSort={sort}
                    onSort={handleSort}
                />

                <DataPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={() => {}}
                    loading={false}
                />
            </div>

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Notification"
                itemName={notifToDelete?.title ?? 'this notification'}
                isLoading={isDeleting}
            />
        </div>
    );
}
