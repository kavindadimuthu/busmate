'use client';

import { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '@busmate/ui';
import { RouteManagementService } from '@busmate/api-client-core';
import { HeartHandshake } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { useContributors, type ContributorTab } from '@/hooks/mot/community/useContributors';
import { usePromotionCandidates, type PromotionCandidateRow } from '@/hooks/mot/community/usePromotionCandidates';
import { contributorColumns } from '@/components/mot/community/ContributorColumns';
import { ContributorDetailDrawer } from '@/components/mot/community/ContributorDetailDrawer';
import { useRouter, useSearchParams } from '@/lib/router';

type PageTab = ContributorTab | 'CANDIDATES';

const TABS: { value: PageTab; label: string }[] = [
  { value: 'APPLIED', label: 'Applications' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CANDIDATES', label: 'Ready to promote' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const candidateColumns: ColumnDef<PromotionCandidateRow>[] = [
  {
    id: 'name',
    header: 'Contributor',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{row.contributor.account?.fullName ?? '—'}</p>
        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
          {row.contributor.account?.email ?? row.contributor.userId?.slice(0, 8)}
        </p>
      </div>
    ),
  },
  {
    id: 'approved',
    header: 'Approved',
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.approved}</span>,
  },
  {
    id: 'rate',
    header: 'Approval rate',
    cell: ({ row }) => <span className="text-sm tabular-nums">{Math.round(row.approvalRate * 100)}%</span>,
  },
  {
    id: 'corridors',
    header: 'Corridors they know',
    hideBelow: 'md',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.contributor.corridorRouteGroupIds?.length ? `${row.contributor.corridorRouteGroupIds.length} corridor(s)` : '—'}
      </span>
    ),
  },
];

/**
 * The review queue for the community contribution programme (INC-029, ADR-019). Real data end to
 * end: applications from core-service, names from user-service, decisions written straight back.
 */
export default function CommunityContributorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('status') as PageTab | null) ?? 'APPLIED';
  const onCandidates = tab === 'CANDIDATES';

  const { candidates, loading: candidatesLoading, reload: reloadCandidates } = usePromotionCandidates(onCandidates);

  // The list tabs need a real status; the candidates tab has its own data, so the list sits on ACTIVE.
  const {
    contributors, totalItems, counts, page, pageSize, loading, actionLoading,
    selected, setSelected, setPage, setPageSize, accept, decline, suspend, reinstate,
    appointSteward, revokeSteward,
  } = useContributors(onCandidates ? 'ACTIVE' : tab, () => {
    if (onCandidates) reloadCandidates();
  });

  // Corridors, for the steward picker and to name the ids stored on a contributor.
  const [routeGroups, setRouteGroups] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    RouteManagementService.getAllRouteGroupsAsList()
      .then((groups) => setRouteGroups(groups.filter((g) => g.id).map((g) => ({ id: g.id!, name: g.name ?? g.id! }))))
      .catch(() => setRouteGroups([]));
  }, []);

  useSetPageMetadata({
    title: 'Community Contributors',
    description: 'Review applications to contribute network data, and manage active contributors',
    activeItem: 'community',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Contributors' }],
  });

  const changeTab = (value: PageTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.push(`/mot/community?${params.toString()}`);
  };

  const tabCount = (value: PageTab) => {
    if (!counts || value === 'CANDIDATES') return undefined;
    return { APPLIED: counts.applied, ACTIVE: counts.active, DECLINED: counts.declined, SUSPENDED: counts.suspended }[value as ContributorTab];
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

      {onCandidates ? (
        <DataTable
          columns={candidateColumns}
          data={candidates}
          totalItems={candidates.length}
          page={1}
          pageSize={Math.max(candidates.length, 1)}
          onPageChange={() => undefined}
          onPageSizeChange={() => undefined}
          getRowId={(row) => row.contributor.userId ?? ''}
          loading={candidatesLoading}
          onRowClick={(row) => setSelected(row.contributor)}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HeartHandshake className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No one is ready yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Contributors appear here once they have enough approved proposals, a high approval rate and no
                reverted approvals. Listing someone here does not promote them — you decide.
              </p>
            </div>
          }
        />
      ) : (
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
      )}

      <ContributorDetailDrawer
        contributor={selected}
        onClose={() => setSelected(null)}
        onAccept={accept}
        onDecline={decline}
        onSuspend={suspend}
        onReinstate={reinstate}
        onAppointSteward={appointSteward}
        onRevokeSteward={revokeSteward}
        routeGroups={routeGroups}
        actionLoading={actionLoading}
      />
    </div>
  );
}
