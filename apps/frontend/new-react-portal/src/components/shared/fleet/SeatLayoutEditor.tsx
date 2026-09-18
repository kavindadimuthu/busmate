'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, Trash2, Wand2, ArrowUp, ArrowDown, DoorOpen, CircleUser } from 'lucide-react';

/**
 * The seat layout contract shared with core-service (SeatLayoutValidator), the conductor app and
 * the passenger apps: rows of left/right seat ids, an optional full-width back row, and seats
 * blocked from sale. Seat ids are "1".."N", numbered front to back, left to right — the numbers
 * printed on tickets.
 */
export interface SeatLayout {
  layoutName?: string;
  rows: { left?: string[]; right?: string[]; back?: string[] }[];
  blockedSeats?: string[];
}

type EditorRow = { kind: 'standard'; left: number; right: number } | { kind: 'back'; count: number };

/** A seat's position, which survives renumbering (ids are recomputed on every edit). */
type SeatPos = string; // `${rowIndex}:${side}:${index}`

const MAX_SIDE = 6;
const MAX_BACK = 8;
const MAX_ROWS = 25;

export function layoutFromTemplate(left: number, right: number, rows: number, back: number): EditorRow[] {
  const result: EditorRow[] = Array.from({ length: rows }, () => ({ kind: 'standard' as const, left, right }));
  if (back > 0) result.push({ kind: 'back', count: back });
  return result;
}

function parse(layout?: SeatLayout | null): { rows: EditorRow[]; blocked: Set<SeatPos>; name: string } {
  if (!layout?.rows?.length) {
    return { rows: layoutFromTemplate(2, 2, 11, 5), blocked: new Set(), name: '' };
  }
  const blockedIds = new Set((layout.blockedSeats ?? []).map(String));
  const blocked = new Set<SeatPos>();
  const rows: EditorRow[] = layout.rows.map((row, r) => {
    if (row.back?.length) {
      row.back.forEach((id, i) => blockedIds.has(String(id)) && blocked.add(`${r}:back:${i}`));
      return { kind: 'back', count: row.back.length };
    }
    (row.left ?? []).forEach((id, i) => blockedIds.has(String(id)) && blocked.add(`${r}:left:${i}`));
    (row.right ?? []).forEach((id, i) => blockedIds.has(String(id)) && blocked.add(`${r}:right:${i}`));
    return { kind: 'standard', left: row.left?.length ?? 0, right: row.right?.length ?? 0 };
  });
  return { rows, blocked, name: layout.layoutName ?? '' };
}

/** Numbers every seat and emits the stored shape. */
export function buildLayout(rows: EditorRow[], blocked: Set<SeatPos>, name: string): SeatLayout {
  let n = 1;
  const blockedSeats: string[] = [];
  const out = rows.map((row, r) => {
    const take = (side: string, count: number) =>
      Array.from({ length: count }, (_, i) => {
        const id = String(n++);
        if (blocked.has(`${r}:${side}:${i}`)) blockedSeats.push(id);
        return id;
      });
    if (row.kind === 'back') return { back: take('back', row.count) };
    const left = take('left', row.left);
    const right = take('right', row.right);
    return { ...(left.length ? { left } : {}), ...(right.length ? { right } : {}) };
  });
  const total = n - 1;
  return { layoutName: name.trim() || `Custom (${total} seats)`, rows: out, blockedSeats };
}

/** What the editor shows for `initial` (the default 2+2 coach when there is none), in stored form. */
export function normalizeLayout(initial?: SeatLayout | null): SeatLayout {
  const { rows, blocked, name } = parse(initial);
  return buildLayout(rows, blocked, name);
}

export function seatCount(layout: SeatLayout): number {
  return layout.rows.reduce((sum, r) => sum + (r.left?.length ?? 0) + (r.right?.length ?? 0) + (r.back?.length ?? 0), 0);
}

interface SeatLayoutEditorProps {
  initial?: SeatLayout | null;
  onChange: (layout: SeatLayout) => void;
  disabled?: boolean;
}

function Stepper({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-6 h-6 inline-flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40" aria-label={`Fewer ${label}`}>
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-5 text-center text-xs tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-6 h-6 inline-flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40" aria-label={`More ${label}`}>
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}

export function SeatLayoutEditor({ initial, onChange, disabled }: SeatLayoutEditorProps) {
  const parsed = useMemo(() => parse(initial), [initial]);
  const [rows, setRows] = useState<EditorRow[]>(parsed.rows);
  const [blocked, setBlocked] = useState<Set<SeatPos>>(parsed.blocked);
  const [name, setName] = useState(parsed.name);
  const [template, setTemplate] = useState({ left: 2, right: 2, rows: 11, back: 5 });

  const layout = useMemo(() => buildLayout(rows, blocked, name), [rows, blocked, name]);
  const total = seatCount(layout);
  const blockedCount = layout.blockedSeats?.length ?? 0;

  // Every edit goes through here so the parent's copy is always the latest layout.
  const commit = (nextRows: EditorRow[], nextBlocked: Set<SeatPos>, nextName = name) => {
    setRows(nextRows);
    setBlocked(nextBlocked);
    setName(nextName);
    onChange(buildLayout(nextRows, nextBlocked, nextName));
  };

  // Structural edits invalidate positions after the change; dropping blocks there is the honest
  // outcome (the seat they pointed at no longer exists in that place).
  const keepBlocksBefore = (rowIndex: number) =>
    new Set([...blocked].filter((pos) => Number(pos.split(':')[0]) < rowIndex));

  const updateRow = (index: number, row: EditorRow) => {
    const next = rows.map((r, i) => (i === index ? row : r));
    const nextBlocked = new Set([...blocked].filter((pos) => {
      const [r, side, i] = pos.split(':');
      if (Number(r) !== index) return true;
      if (row.kind === 'back') return side === 'back' && Number(i) < row.count;
      return (side === 'left' && Number(i) < row.left) || (side === 'right' && Number(i) < row.right);
    }));
    commit(next, nextBlocked);
  };

  const removeRow = (index: number) => commit(rows.filter((_, i) => i !== index), keepBlocksBefore(index));

  const moveRow = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next, keepBlocksBefore(Math.min(index, target)));
  };

  const hasBack = rows.some((r) => r.kind === 'back');
  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    const standard: EditorRow = { kind: 'standard', left: 2, right: 2 };
    const backIndex = rows.findIndex((r) => r.kind === 'back');
    const next = backIndex >= 0 ? [...rows.slice(0, backIndex), standard, ...rows.slice(backIndex)] : [...rows, standard];
    commit(next, keepBlocksBefore(backIndex >= 0 ? backIndex : rows.length));
  };
  const addBackRow = () => !hasBack && rows.length < MAX_ROWS && commit([...rows, { kind: 'back', count: 5 }], blocked);

  const toggleSeat = (pos: SeatPos) => {
    const next = new Set(blocked);
    if (next.has(pos)) next.delete(pos);
    else next.add(pos);
    commit(rows, next);
  };

  const applyTemplate = () =>
    commit(layoutFromTemplate(template.left, template.right, template.rows, template.back), new Set(), name);

  // Seat ids for rendering, in the same order buildLayout numbers them.
  let seatNo = 0;
  const renderSeat = (pos: SeatPos) => {
    seatNo += 1;
    const isBlocked = blocked.has(pos);
    return (
      <button
        key={pos}
        type="button"
        disabled={disabled}
        onClick={() => toggleSeat(pos)}
        title={isBlocked ? `Seat ${seatNo}: not for sale — click to make it sellable` : `Seat ${seatNo} — click to block from sale`}
        aria-pressed={isBlocked}
        className={`w-9 h-9 rounded-md border text-[11px] font-semibold tabular-nums transition-colors ${
          isBlocked
            ? 'bg-muted text-muted-foreground border-dashed border-muted-foreground/50 line-through'
            : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
        }`}
      >
        {seatNo}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-4 min-w-0">
        {/* Template */}
        <div className="rounded-lg border border-border p-3 bg-muted/30 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-primary" /> Start from a template
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">Left of aisle <Stepper label="left seats" value={template.left} min={0} max={MAX_SIDE} onChange={(left) => setTemplate({ ...template, left })} /></span>
            <span className="flex items-center gap-1.5">Right of aisle <Stepper label="right seats" value={template.right} min={0} max={MAX_SIDE} onChange={(right) => setTemplate({ ...template, right })} /></span>
            <span className="flex items-center gap-1.5">Rows <Stepper label="rows" value={template.rows} min={1} max={MAX_ROWS - 1} onChange={(r) => setTemplate({ ...template, rows: r })} /></span>
            <span className="flex items-center gap-1.5">Back row <Stepper label="back seats" value={template.back} min={0} max={MAX_BACK} onChange={(back) => setTemplate({ ...template, back })} /></span>
            <button type="button" onClick={applyTemplate} disabled={disabled}
              className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">
              Apply ({template.rows * (template.left + template.right) + template.back} seats)
            </button>
          </div>
        </div>

        {/* Row editor */}
        <div className="rounded-lg border border-border divide-y divide-border">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs">
              <span className="w-14 font-medium text-muted-foreground">{row.kind === 'back' ? 'Back row' : `Row ${i + 1}`}</span>
              {row.kind === 'standard' ? (
                <>
                  <span className="flex items-center gap-1.5">Left <Stepper label={`row ${i + 1} left seats`} value={row.left} min={0} max={MAX_SIDE}
                    onChange={(left) => (left + row.right > 0 ? updateRow(i, { ...row, left }) : undefined)} /></span>
                  <span className="flex items-center gap-1.5">Right <Stepper label={`row ${i + 1} right seats`} value={row.right} min={0} max={MAX_SIDE}
                    onChange={(right) => (row.left + right > 0 ? updateRow(i, { ...row, right }) : undefined)} /></span>
                </>
              ) : (
                <span className="flex items-center gap-1.5">Seats <Stepper label="back row seats" value={row.count} min={1} max={MAX_BACK}
                  onChange={(count) => updateRow(i, { kind: 'back', count })} /></span>
              )}
              <span className="ml-auto flex items-center gap-1">
                {row.kind === 'standard' && (
                  <>
                    <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label={`Move row ${i + 1} up`}><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveRow(i, 1)} disabled={i >= rows.length - 1 || rows[i + 1]?.kind === 'back'} className="p-1 rounded hover:bg-muted disabled:opacity-30" aria-label={`Move row ${i + 1} down`}><ArrowDown className="w-3.5 h-3.5" /></button>
                  </>
                )}
                <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= 1} className="p-1 rounded text-destructive hover:bg-destructive/10 disabled:opacity-30" aria-label={`Remove ${row.kind === 'back' ? 'back row' : `row ${i + 1}`}`}><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            </div>
          ))}
          <div className="flex gap-2 px-3 py-2">
            <button type="button" onClick={addRow} disabled={disabled || rows.length >= MAX_ROWS} className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-md hover:bg-muted disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Add row</button>
            <button type="button" onClick={addBackRow} disabled={disabled || hasBack || rows.length >= MAX_ROWS} className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-md hover:bg-muted disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Add back row</button>
          </div>
        </div>
        <label className="block text-xs text-muted-foreground">
          Layout name
          <input value={name} onChange={(e) => commit(rows, blocked, e.target.value)} maxLength={100} placeholder={`Custom (${total} seats)`}
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-card" />
        </label>
      </div>

      {/* Live preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Preview — click a seat to block it</span>
          <span className="text-muted-foreground tabular-nums">{total} seats · {total - blockedCount} for sale</span>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-3 w-fit mx-auto" aria-label="Seat layout preview">
          <div className="flex items-center justify-between mb-3 text-muted-foreground text-[10px]">
            <span className="flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5" /> Door</span>
            <span className="flex items-center gap-1">Driver <CircleUser className="w-3.5 h-3.5" /></span>
          </div>
          {(() => {
            seatNo = 0;
            return (
              <div className="space-y-1.5">
                {rows.map((row, r) =>
                  row.kind === 'back' ? (
                    <div key={r} className="flex justify-center gap-1 pt-1">
                      {Array.from({ length: row.count }, (_, i) => renderSeat(`${r}:back:${i}`))}
                    </div>
                  ) : (
                    <div key={r} className="flex items-center gap-4 justify-between">
                      <div className="flex gap-1 min-w-[1px]">{Array.from({ length: row.left }, (_, i) => renderSeat(`${r}:left:${i}`))}</div>
                      <div className="flex gap-1 min-w-[1px]">{Array.from({ length: row.right }, (_, i) => renderSeat(`${r}:right:${i}`))}</div>
                    </div>
                  ),
                )}
              </div>
            );
          })()}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Seats are numbered front to back, left to right — the numbers printed on tickets. Blocked seats (e.g. the
          conductor&apos;s seat) are never sold.
        </p>
      </div>
    </div>
  );
}
