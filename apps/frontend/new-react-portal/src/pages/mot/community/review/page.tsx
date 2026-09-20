'use client';

import { useRouter } from '@/lib/router';
import { AlertTriangle, ChevronRight, ClipboardList, Loader2, MapPin } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { useChangesetQueue, type QueueTab } from '@/hooks/mot/community/useChangesetQueue';
import { useState } from 'react';

const TABS: { value: QueueTab; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REVERTED', label: 'Reverted' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

/**
 * The review queue for stop proposals (INC-031, ADR-018). Real data end to end: proposals from
 * core-service, names from user-service, decisions written straight back.
 */
export default function CommunityReviewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<QueueTab>('PENDING');
  const { rows, totalItems, loading, stopName } = useChangesetQueue(tab);

  useSetPageMetadata({
    title: 'Review Stop Proposals',
    description: 'Compare each proposal with the current stop, and approve, reject or revert it',
    activeItem: 'community-review',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Review' }],
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.value && <span className="ml-1.5 text-xs text-muted-foreground">({totalItems})</span>}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">Nothing here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {tab === 'PENDING' ? 'No proposals are waiting for review.' : `No proposals in this status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.changeset?.id}
              onClick={() => router.push(`/mot/community/review/${row.changeset?.id}`)}
              className="w-full text-left bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{stopName(row.changeset)}</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {row.changeset?.action === 'CREATE' ? 'New stop' : 'Correction'}
                  </span>
                  {row.targetOutranksCommunityTier && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Outranked
                    </span>
                  )}
                  {row.stale && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Outdated
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {row.proposerAccount?.fullName ?? row.changeset?.proposerUserId?.slice(0, 8)}
                  {row.proposerAccount?.email ? ` · ${row.proposerAccount.email}` : ''}
                  {row.changeset?.createdAt ? ` · ${new Date(row.changeset.createdAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
