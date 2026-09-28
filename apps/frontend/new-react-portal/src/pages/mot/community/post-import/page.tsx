'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { PostImportsService, PostImportDraftResponse, PostImportDraftSummary } from '@busmate/api-client-core';
import { useSetPageMetadata } from '@/context/PageContext';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Staff paste any community timetable post; an AI reads it into rows; code checks the reading for claims
 * that aren't backed by the text and for timed lines the reading never accounted for (ADR-028, INC-060).
 * This page only reads and checks — nothing here loads anything into the network (see INC-061).
 */
export default function CommunityPostImportPage() {
  const [pastedText, setPastedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<PostImportDraftResponse | null>(null);
  const [history, setHistory] = useState<PostImportDraftSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useSetPageMetadata({
    title: 'Import a post',
    description: 'Paste a community timetable post. An AI reads it; the checks below show what to verify before anything is used',
    activeItem: 'community-post-import',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Import a post' }],
  });

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const result = await PostImportsService.listPostImports(0, 20);
      setHistory(result.content ?? []);
    } catch {
      // Past imports are a convenience list; a failure here shouldn't block pasting a new post.
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const submit = async () => {
    if (!pastedText.trim()) return;
    setSubmitting(true);
    try {
      const result = await PostImportsService.createPostImport({ pastedText });
      setDraft(result);
      await loadHistory();
      if (result.status === 'FAILED') {
        toast.error("The AI's answer didn't fit the expected shape — nothing to review here.");
      } else {
        toast.success('Read. Check the flags below before treating anything as fact.');
      }
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not read that post.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDraft = async (id: string) => {
    try {
      const result = await PostImportsService.getPostImport(id);
      setDraft(result);
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not load that import.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <label className="block text-sm font-medium text-foreground/80 mb-2">Paste the post</label>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows={8}
          maxLength={20000}
          placeholder="Paste the community post here, in whatever format it was written."
          className="w-full rounded-lg border border-border bg-background p-3 text-sm font-mono"
          data-testid="post-import-textarea"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">{pastedText.length}/20000</p>
          <button
            onClick={() => void submit()}
            disabled={submitting || !pastedText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg disabled:opacity-50"
            data-testid="post-import-submit"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Read
          </button>
        </div>
      </div>

      {draft && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4" data-testid="post-import-result">
          {draft.status === 'FAILED' ? (
            <p className="text-sm text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              The AI's answer didn't fit the expected shape. Nothing was read.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Original text</h3>
                  <pre className="whitespace-pre-wrap text-xs bg-muted rounded-lg p-3 max-h-[32rem] overflow-y-auto">
                    {draft.pastedText}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Read as {draft.departures?.length ?? 0} departure{(draft.departures?.length ?? 0) === 1 ? '' : 's'}
                  </h3>
                  {draft.postDate && (
                    <p className="text-xs text-muted-foreground mb-2">Post dated: {draft.postDate}</p>
                  )}
                  <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                    {(draft.departures ?? []).map((cd, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-sm ${cd.grounded ? 'border-border' : 'border-warning bg-warning/5'}`}
                        data-testid="post-import-row"
                      >
                        <p className="font-medium text-foreground">
                          {cd.departure?.time ?? '—'} · {cd.departure?.origin ?? '—'} → {cd.departure?.destination ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cd.departure?.operatorName ?? 'No operator named'}
                          {cd.departure?.plates?.length ? ` · ${cd.departure.plates.join(', ')}` : ''}
                          {cd.departure?.serviceClass ? ` · ${cd.departure.serviceClass}` : ''}
                        </p>
                        {!cd.grounded && (
                          <p className="text-xs text-warning flex items-center gap-1 mt-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Not backed by the quoted text: {cd.ungroundedFields?.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                    {(draft.departures?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground">No departures read from this post.</p>
                    )}
                  </div>
                </div>
              </div>

              {(draft.unaccountedLines?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-warning bg-warning/5 p-3">
                  <p className="text-sm font-medium text-warning flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Lines with a time on them that weren't read or explicitly set aside
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {draft.unaccountedLines?.map((line, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-mono">{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Past imports</h3>
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing pasted yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => void openDraft(h.id as string)}
                className="w-full text-left bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-4 hover:bg-muted/50"
                data-testid="post-import-history-row"
              >
                <span className="text-sm text-foreground">
                  {h.status === 'FAILED' ? 'Failed to read' : `${h.departureCount} departures`}
                  {h.status !== 'FAILED' && (h.ungroundedCount ?? 0) > 0 && (
                    <span className="text-warning"> · {h.ungroundedCount} unbacked</span>
                  )}
                  {h.status !== 'FAILED' && (h.unaccountedCount ?? 0) > 0 && (
                    <span className="text-warning"> · {h.unaccountedCount} unaccounted</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(h.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
