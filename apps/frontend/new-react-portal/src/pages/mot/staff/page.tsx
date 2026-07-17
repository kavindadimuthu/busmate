'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/lib/router';
import { ConfirmDialog, ResourceStats, ResourceFilters, ResourceTable, useResource } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { StaffTypeTabs, StaffActionButtons } from '@/components/mot/staff';
import { getStaffMembers } from '@/data/mot/staff';
import { staffResource } from '@/resources/mot/staff.resource';

type TabValue = 'all' | 'timekeeper' | 'inspector';

/**
 * L2 composition: resource controller + blocks, plus a custom staff-type tab that
 * drives the `staffType` filter. Tab counts come straight from the mock dataset.
 */
export default function StaffManagementPage() {
  const router = useRouter();
  const controller = useResource(staffResource);
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const tabCounts = useMemo(() => {
    const all = getStaffMembers();
    return {
      all: all.length,
      timekeeper: all.filter((s) => s.staffType === 'timekeeper').length,
      inspector: all.filter((s) => s.staffType === 'inspector').length,
    };
  }, []);

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    controller.setFilters({ staffType: tab === 'all' ? '__all__' : tab });
    controller.setPage(1);
  };

  useSetPageMetadata({
    title: 'Staff Management',
    description: 'Manage timekeepers, inspectors, and other staff',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management' }],
  });

  useSetPageActions(
    <StaffActionButtons
      onAddStaff={() => router.push('/mot/staff/create')}
      onExportAll={() => controller.handleExportAll?.()}
    />,
  );

  return (
    <div className="space-y-6">
      <ResourceStats resource={staffResource} controller={controller} className="lg:grid-cols-6" />
      <StaffTypeTabs activeTab={activeTab} onTabChange={handleTabChange} counts={tabCounts} />
      <ResourceFilters resource={staffResource} controller={controller} />
      <ResourceTable
        resource={staffResource}
        controller={controller}
        rowActions={(s) => staffResource.rowActions!({ row: s, controller, navigate: router.push })}
      />

      <ConfirmDialog
        open={controller.deleteDialog.isOpen}
        onOpenChange={controller.deleteDialog.setOpen}
        title="Delete Staff Member"
        description={`Are you sure you want to delete "${controller.deleteDialog.data?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={controller.handleDeleteConfirm}
        loading={controller.isDeleting}
      />
    </div>
  );
}
