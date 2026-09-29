'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Flag, Loader2 } from 'lucide-react';
import { CommunityContributorsService, PassengerReportResponse } from '@busmate/api-client-core';
import { useSetPageMetadata } from '@/context/PageContext';
import { useRouter } from '@/lib/router';

type Tab = 'OPEN' | 'RESOLVED';

const TABS: { value: Tab; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const REASON_LABEL: Record<string, string> = {
  WRONG_TIME: 'The time is wrong',
  WRONG_DAYS: "It doesn't run these days",
  BUS_DID_NOT_COME: "The bus didn't come",
  WRONG_OPERATOR_OR_PLATE: 'Who runs it is wrong',
  OTHER: 'Something else',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * What passengers have said is wrong (INC-056). Not a review queue: a report proposes no replacement
 * values, so there is nothing here to approve — a staff member checks the real record with the tools they
 * already have (the schedule page, the route page, the Usual Workings tab) and marks it resolved.
 */
export default function CommunityReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('OPEN');
  const [rows, setRows] = useState<PassengerReportResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Reports',
    description: 'What passengers have said is wrong. Check the real record, then mark it resolved',
    activeItem: 'community-reports',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Reports' }],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await CommunityContributorsService.listReports(tab, undefined, 0, 50);
      setRows(result.content ?? []);
      setTotal(result.totalElements ?? 0);
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not load the reports.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await CommunityContributorsService.resolveReport(id, {});
      toast.success('Marked resolved');
      await load();
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not resolve this report.');
    } finally {
      setResolving(null);
    }
  };

  const openTarget = (row: PassengerReportResponse) => {
    if (row.entityType === 'SCHEDULE') {
      router.push(`/mot/schedules/${row.targetId}`);
    }
    // A SCHEDULE_WORKING has no page of its own yet; staff open the schedule it belongs to from Schedules.
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.value && <span className="ml-1.5 text-xs text-muted-foreground">({total})</span>}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{tab === 'OPEN' ? 'Nothing waiting right now.' : 'Nothing resolved yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-4" data-testid="report-row">
              <button
                onClick={() => openTarget(r)}
                className="min-w-0 text-left flex-1 disabled:cursor-default"
                disabled={r.entityType !== 'SCHEDULE'}
              >
                <p className="text-sm font-semibold text-foreground">{REASON_LABEL[r.reason ?? ''] ?? r.reason}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.entityType === 'SCHEDULE' ? 'A departure' : 'Who runs a departure'} · {formatDate(r.createdAt)}
                </p>
                {r.note && <p className="text-sm text-muted-foreground mt-1.5 italic">"{r.note}"</p>}
                {r.status === 'RESOLVED' && r.resolutionNote && (
                  <p className="text-xs text-muted-foreground mt-1.5">Resolved: {r.resolutionNote}</p>
                )}
              </button>
              {tab === 'OPEN' && (
                <button
                  onClick={() => void resolve(r.id as string)}
                  disabled={resolving === r.id}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50"
                >
                  {resolving === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
