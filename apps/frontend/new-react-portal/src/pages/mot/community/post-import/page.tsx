'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Loader2, Search, Sparkles } from 'lucide-react';
import {
  PostImportsService,
  PostImportDraftResponse,
  PostImportDraftSummary,
  ResolvedRow,
  RowAction,
  StopMatchCandidate,
} from '@busmate/api-client-core';
import { useSetPageMetadata } from '@/context/PageContext';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Best-effort guess at an ISO date from whatever the AI found stated in the post, e.g. "13/10/2025". */
function guessObservedOn(postDate?: string): string {
  if (postDate) {
    const m = postDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

type EditableRow = ResolvedRow & { grounded: boolean; ungroundedFields: string[]; sourceLines: string[] };

/**
 * Staff paste any community timetable post; an AI reads it into rows; code checks the reading for claims
 * that aren't backed by the text and for timed lines the reading never accounted for (ADR-028, INC-060).
 * From a checked reading, staff correct what the AI got wrong, match places to real stops, and load the
 * result as reports under the same rules staff already load by hand under (ADR-025, INC-061).
 */
export default function CommunityPostImportPage() {
  const [pastedText, setPastedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<PostImportDraftResponse | null>(null);
  const [history, setHistory] = useState<PostImportDraftSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [sourceLabel, setSourceLabel] = useState('');
  const [observedOn, setObservedOn] = useState('');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [stopSearch, setStopSearch] = useState<{ rowIndex: number; field: 'origin' | 'destination' } | null>(null);
  const [stopCandidates, setStopCandidates] = useState<StopMatchCandidate[]>([]);

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

  const seedFromDraft = (result: PostImportDraftResponse) => {
    if (result.status === 'FAILED') return;
    const saved = result.resolution;
    setSourceLabel(saved?.sourceLabel ?? `Community timetable post (${formatDate(result.createdAt)})`);
    setObservedOn(saved?.observedOn ?? guessObservedOn(result.postDate));
    setAcknowledged(new Set(saved?.acknowledgedUnaccountedLines ?? []));
    setRows(
      (result.departures ?? []).map((cd, i) => {
        const savedRow = saved?.rows?.find((r) => r.sourceIndex === i);
        return {
          sourceIndex: i,
          action: savedRow?.action ?? RowAction.LOAD,
          time: savedRow?.time ?? cd.departure?.time,
          origin: savedRow?.origin ?? cd.departure?.origin,
          destination: savedRow?.destination ?? cd.departure?.destination,
          operatorName: savedRow?.operatorName ?? cd.departure?.operatorName,
          plates: savedRow?.plates ?? cd.departure?.plates ?? [],
          serviceClass: savedRow?.serviceClass ?? cd.departure?.serviceClass,
          days: savedRow?.days ?? cd.departure?.days,
          notes: savedRow?.notes ?? cd.departure?.notes,
          originStopId: savedRow?.originStopId,
          destinationStopId: savedRow?.destinationStopId,
          overrideReason: savedRow?.overrideReason,
          grounded: cd.grounded ?? true,
          ungroundedFields: cd.ungroundedFields ?? [],
          sourceLines: cd.departure?.sourceLines ?? [],
        };
      }),
    );
  };

  const submit = async () => {
    if (!pastedText.trim()) return;
    setSubmitting(true);
    try {
      const result = await PostImportsService.createPostImport({ pastedText });
      setDraft(result);
      seedFromDraft(result);
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
      seedFromDraft(result);
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not load that import.');
    }
  };

  const unaccountedLines = useMemo(() => draft?.unaccountedLines ?? [], [draft]);

  const updateRow = (index: number, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.sourceIndex === index ? { ...r, ...patch } : r)));
  };

  const searchStops = async (rowIndex: number, field: 'origin' | 'destination', name?: string) => {
    if (!name?.trim()) return;
    setStopSearch({ rowIndex, field });
    try {
      const candidates = await PostImportsService.getPostImportStopCandidates(name);
      setStopCandidates(candidates);
    } catch {
      setStopCandidates([]);
    }
  };

  const pickStop = (candidate: StopMatchCandidate) => {
    if (!stopSearch) return;
    const idField = stopSearch.field === 'origin' ? 'originStopId' : 'destinationStopId';
    updateRow(stopSearch.rowIndex, { [idField]: candidate.stopId } as Partial<EditableRow>);
    setStopSearch(null);
    setStopCandidates([]);
  };

  const saveResolution = async (): Promise<PostImportDraftResponse | null> => {
    if (!draft) return null;
    setSaving(true);
    try {
      const result = await PostImportsService.savePostImportResolution(draft.id as string, {
        sourceLabel,
        observedOn,
        rows: rows.map((row) => ({
          sourceIndex: row.sourceIndex,
          action: row.action,
          time: row.time,
          origin: row.origin,
          destination: row.destination,
          operatorName: row.operatorName,
          plates: row.plates,
          serviceClass: row.serviceClass,
          days: row.days,
          notes: row.notes,
          originStopId: row.originStopId,
          destinationStopId: row.destinationStopId,
          overrideReason: row.overrideReason,
        })),
        acknowledgedUnaccountedLines: Array.from(acknowledged),
      });
      setDraft(result);
      return result;
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not save the review.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!draft) return;
    const saved = await saveResolution();
    if (!saved) return;
    setApproving(true);
    try {
      const result = await PostImportsService.approvePostImport(draft.id as string);
      setDraft(result);
      toast.success('Loaded. See the results below for what happened, row by row.');
      await loadHistory();
    } catch (e) {
      const body = (e as { body?: { message?: string } })?.body;
      toast.error(body?.message ?? 'Could not approve this draft.');
    } finally {
      setApproving(false);
    }
  };

  const allUnaccountedAcknowledged = unaccountedLines.every((l) => acknowledged.has(l));
  const alreadyLoaded = draft?.loadStatus === 'LOADED';

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
                    Read as {rows.length} departure{rows.length === 1 ? '' : 's'}
                  </h3>
                  {draft.postDate && (
                    <p className="text-xs text-muted-foreground mb-2">Post dated: {draft.postDate}</p>
                  )}
                  <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                    {rows.map((row) => (
                      <div
                        key={row.sourceIndex}
                        className={`rounded-lg border p-3 text-sm space-y-2 ${
                          !row.grounded ? 'border-warning bg-warning/5' : 'border-border'
                        } ${row.action === 'SKIP' ? 'opacity-50' : ''}`}
                        data-testid="post-import-row"
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={row.action}
                            disabled={alreadyLoaded}
                            onChange={(e) => updateRow(row.sourceIndex, { action: e.target.value as RowAction })}
                            className="text-xs border border-border rounded px-1.5 py-1 bg-background"
                            data-testid="row-action"
                          >
                            <option value="LOAD">Load</option>
                            <option value="SKIP">Skip</option>
                          </select>
                          <input
                            value={row.time ?? ''}
                            disabled={alreadyLoaded}
                            onChange={(e) => updateRow(row.sourceIndex, { time: e.target.value })}
                            className="w-16 text-xs border border-border rounded px-1.5 py-1 bg-background"
                            placeholder="time"
                          />
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              value={row.origin ?? ''}
                              disabled={alreadyLoaded}
                              onChange={(e) => updateRow(row.sourceIndex, { origin: e.target.value, originStopId: undefined })}
                              className="flex-1 min-w-0 text-xs border border-border rounded px-1.5 py-1 bg-background"
                              placeholder="origin"
                            />
                            <button
                              type="button"
                              disabled={alreadyLoaded}
                              onClick={() => void searchStops(row.sourceIndex, 'origin', row.origin)}
                              title="Match to an existing stop"
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            {row.originStopId && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              value={row.destination ?? ''}
                              disabled={alreadyLoaded}
                              onChange={(e) => updateRow(row.sourceIndex, { destination: e.target.value, destinationStopId: undefined })}
                              className="flex-1 min-w-0 text-xs border border-border rounded px-1.5 py-1 bg-background"
                              placeholder="destination"
                            />
                            <button
                              type="button"
                              disabled={alreadyLoaded}
                              onClick={() => void searchStops(row.sourceIndex, 'destination', row.destination)}
                              title="Match to an existing stop"
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            {row.destinationStopId && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                          </div>
                        </div>

                        {stopSearch?.rowIndex === row.sourceIndex && (
                          <div className="rounded border border-border bg-background p-2 text-xs space-y-1">
                            <p className="text-muted-foreground">Pick a match, or leave as typed to create a new stop:</p>
                            {stopCandidates.length === 0 ? (
                              <p className="text-muted-foreground italic">No close match found.</p>
                            ) : (
                              stopCandidates.map((c) => (
                                <button
                                  key={c.stopId}
                                  type="button"
                                  onClick={() => pickStop(c)}
                                  className="block w-full text-left px-2 py-1 rounded hover:bg-muted"
                                >
                                  {c.name} {c.city ? `(${c.city})` : ''}
                                </button>
                              ))
                            )}
                            <button type="button" onClick={() => setStopSearch(null)} className="text-muted-foreground">
                              Close
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            value={row.operatorName ?? ''}
                            disabled={alreadyLoaded}
                            onChange={(e) => updateRow(row.sourceIndex, { operatorName: e.target.value })}
                            className="flex-1 text-xs border border-border rounded px-1.5 py-1 bg-background"
                            placeholder="operator"
                          />
                          <input
                            value={row.plates?.join(', ') ?? ''}
                            disabled={alreadyLoaded}
                            onChange={(e) => updateRow(row.sourceIndex, { plates: e.target.value.split(',').map((p) => p.trim()).filter(Boolean) })}
                            className="w-28 text-xs border border-border rounded px-1.5 py-1 bg-background"
                            placeholder="plates"
                          />
                          <input
                            value={row.serviceClass ?? ''}
                            disabled={alreadyLoaded}
                            onChange={(e) => updateRow(row.sourceIndex, { serviceClass: e.target.value })}
                            className="w-28 text-xs border border-border rounded px-1.5 py-1 bg-background"
                            placeholder="class"
                          />
                        </div>

                        {!row.grounded && (
                          <div>
                            <p className="text-xs text-warning flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Not backed by the quoted text: {row.ungroundedFields.join(', ')}
                            </p>
                            {row.action === 'LOAD' && (
                              <input
                                value={row.overrideReason ?? ''}
                                disabled={alreadyLoaded}
                                onChange={(e) => updateRow(row.sourceIndex, { overrideReason: e.target.value })}
                                placeholder="Why load this anyway? (required)"
                                className="mt-1 w-full text-xs border border-warning rounded px-1.5 py-1 bg-background"
                                data-testid="override-reason"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {rows.length === 0 && (
                      <p className="text-sm text-muted-foreground">No departures read from this post.</p>
                    )}
                  </div>
                </div>
              </div>

              {unaccountedLines.length > 0 && (
                <div className="rounded-lg border border-warning bg-warning/5 p-3">
                  <p className="text-sm font-medium text-warning flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Lines with a time on them that weren't read or explicitly set aside
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {unaccountedLines.map((line, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <input
                          type="checkbox"
                          disabled={alreadyLoaded}
                          checked={acknowledged.has(line)}
                          onChange={(e) =>
                            setAcknowledged((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(line);
                              else next.delete(line);
                              return next;
                            })
                          }
                          data-testid="acknowledge-unaccounted"
                        />
                        <span className="text-muted-foreground font-mono">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!alreadyLoaded && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-foreground/80 mb-1">Source label</label>
                      <input
                        value={sourceLabel}
                        onChange={(e) => setSourceLabel(e.target.value)}
                        className="text-sm border border-border rounded px-2 py-1.5 bg-background w-72"
                        data-testid="source-label"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/80 mb-1">Dated to</label>
                      <input
                        type="date"
                        value={observedOn}
                        onChange={(e) => setObservedOn(e.target.value)}
                        className="text-sm border border-border rounded px-2 py-1.5 bg-background"
                        data-testid="observed-on"
                      />
                    </div>
                    <button
                      onClick={() => void saveResolution()}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                      data-testid="save-resolution"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save review'}
                    </button>
                    <button
                      onClick={() => void approve()}
                      disabled={approving || !allUnaccountedAcknowledged}
                      title={!allUnaccountedAcknowledged ? 'Acknowledge every unaccounted line first' : undefined}
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg disabled:opacity-50"
                      data-testid="approve-load"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Approve & Load'}
                    </button>
                  </div>
                </div>
              )}

              {draft.loadResult && (
                <div className="rounded-lg border border-success bg-success/5 p-3" data-testid="load-result">
                  <p className="text-sm font-medium text-success">
                    Loaded: {draft.loadResult.stopsCreated} stop(s), {draft.loadResult.routesCreated} route(s),{' '}
                    {draft.loadResult.schedulesCreated} schedule(s), {draft.loadResult.workingsCreated} working(s) created
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {draft.loadResult.rows?.map((r) => (
                      <li key={r.sourceIndex} className="text-xs text-muted-foreground">
                        Row {r.sourceIndex}: <span className="font-medium">{r.status}</span> — {r.detail}
                      </li>
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
