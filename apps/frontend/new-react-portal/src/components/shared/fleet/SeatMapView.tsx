'use client';

import type { SeatLayout } from '@/components/shared/fleet/SeatLayoutEditor';

/** Read-only rendering of a stored seat layout. */
export function SeatMapView({ layout }: { layout?: SeatLayout | null }) {
  if (!layout?.rows?.length) return <p className="text-sm text-muted-foreground">No seat layout.</p>;
  const blocked = new Set((layout.blockedSeats ?? []).map(String));
  const seat = (id: string) => (
    <span key={id} title={blocked.has(id) ? `Seat ${id} (not for sale)` : `Seat ${id}`}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-md border text-[10px] font-semibold tabular-nums ${
        blocked.has(id) ? 'bg-muted text-muted-foreground border-dashed line-through' : 'bg-primary/10 text-primary border-primary/30'}`}>
      {id}
    </span>
  );
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-3 w-fit" aria-label={layout.layoutName ?? 'Seat layout'}>
      <div className="space-y-1">
        {layout.rows.map((row, i) =>
          row.back?.length ? (
            <div key={i} className="flex justify-center gap-1 pt-1">{row.back.map(seat)}</div>
          ) : (
            <div key={i} className="flex justify-between gap-4">
              <div className="flex gap-1 min-w-[1px]">{(row.left ?? []).map(seat)}</div>
              <div className="flex gap-1 min-w-[1px]">{(row.right ?? []).map(seat)}</div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
