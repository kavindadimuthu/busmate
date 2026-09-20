'use client';

import { DataTable } from '@busmate/ui';
import { HeartHandshake } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { useContributors, type ContributorTab } from '@/hooks/mot/community/useContributors';
import { contributorColumns } from '@/components/mot/community/ContributorColumns';
import { ContributorDetailDrawer } from '@/components/mot/community/ContributorDetailDrawer';
import { useRouter, useSearchParams } from '@/lib/router';

const TABS: { value: ContributorTab; label: string }[] = [
  { value: 'APPLIED', label: 'Applications' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

/**
 * The review queue for the community contribution programme (INC-029, ADR-019). Real data end to
 * end: applications from core-service, names from user-service, decisions written straight back.
 */
export default function CommunityContributorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('status') as ContributorTab | null) ?? 'APPLIED';

  const {
    contributors, totalItems, counts, page, pageSize, loading, actionLoading,
    selected, setSelected, setPage, setPageSize, accept, decline, suspend, reinstate,
  } = useContributors(tab);

  useSetPageMetadata({
    title: 'Community Contributors',
    description: 'Review applications to contribute network data, and manage active contributors',
    activeItem: 'community',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Contributors' }],
  });

  const changeTab = (value: ContributorTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.push(`/mot/community?${params.toString()}`);
  };

  const tabCount = (value: ContributorTab) => {
    if (!counts) return undefined;
    return { APPLIED: counts.applied, ACTIVE: counts.active, DECLINED: counts.declined, SUSPENDED: counts.suspended }[value];
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => changeTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tabCount(t.value) !== undefined && (
                <span className="ml-1.5 text-xs text-muted-foreground">({tabCount(t.value)})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <DataTable
        columns={contributorColumns}
        data={contributors}
        totalItems={totalItems}
        page={page + 1}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p - 1)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        getRowId={(row) => row.userId ?? ''}
        loading={loading}
        onRowClick={(row) => setSelected(row)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HeartHandshake className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === 'APPLIED' ? 'No applications are waiting for review.' : 'No contributors in this status.'}
            </p>
          </div>
        }
      />

      <ContributorDetailDrawer
        contributor={selected}
        onClose={() => setSelected(null)}
        onAccept={accept}
        onDecline={decline}
        onSuspend={suspend}
        onReinstate={reinstate}
        actionLoading={actionLoading}
      />
    </div>
  );
}
