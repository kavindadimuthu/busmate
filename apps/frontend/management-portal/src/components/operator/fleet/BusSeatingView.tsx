'use client';

import React, { useState } from 'react';
import { Users, Info } from 'lucide-react';
import type { OperatorBus, SeatInfo, SeatStatus } from '@/data/operator/buses';

interface BusSeatingViewProps {
  bus: OperatorBus;
}

const SEAT_COLORS: Record<SeatStatus, { bg: string; border: string; label: string }> = {
  AVAILABLE: { bg: 'bg-card',       border: 'border-border', label: 'Available' },
  RESERVED:  { bg: 'bg-warning/15',  border: 'border-warning', label: 'Reserved' },
  BOOKED:    { bg: 'bg-primary/20',    border: 'border-primary', label: 'Booked' },
  DAMAGED:   { bg: 'bg-destructive/15',     border: 'border-destructive/40',  label: 'Damaged' },
};

function Seat({ seat, onClick }: { seat: SeatInfo; onClick?: (s: SeatInfo) => void }) {
  const meta = SEAT_COLORS[seat.status];
  return (
    <button
      title={`Seat ${seat.seatNumber} — ${meta.label}`}
      onClick={() => onClick?.(seat)}
      className={`w-8 h-8 rounded-t-lg border-2 text-xs font-semibold flex items-center justify-center transition-all hover:scale-110 ${meta.bg} ${meta.border}`}
    >
      {seat.seatNumber}
    </button>
  );
}

export function BusSeatingView({ bus }: BusSeatingViewProps) {
  const [selected, setSelected] = useState<SeatInfo | null>(null);
  const { seatingLayout: layout } = bus;

  const available = layout.layout.flatMap(r => [...r.left, ...r.right]).filter(s => s.status === 'AVAILABLE').length;
  const booked    = layout.layout.flatMap(r => [...r.left, ...r.right]).filter(s => s.status === 'BOOKED').length;
  const reserved  = layout.layout.flatMap(r => [...r.left, ...r.right]).filter(s => s.status === 'RESERVED').length;
  const damaged   = layout.layout.flatMap(r => [...r.left, ...r.right]).filter(s => s.status === 'DAMAGED').length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Seats', value: layout.totalSeats, cls: 'bg-muted border-border' },
          { label: 'Available',   value: available,         cls: 'bg-card border-border' },
          { label: 'Booked',      value: booked,            cls: 'bg-primary/10 border-primary/20' },
          { label: 'Damaged',     value: damaged,           cls: 'bg-destructive/10 border-destructive/20' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries(SEAT_COLORS).map(([status, meta]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded border-2 inline-block ${meta.bg} ${meta.border}`} />
            {meta.label}
          </span>
        ))}
      </div>

      {/* Bus diagram */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-auto p-6">
        <div className="min-w-[300px] mx-auto" style={{ maxWidth: 380 }}>
          {/* Front of bus */}
          <div className="flex items-center justify-center mb-4">
            <div className="border-2 border-border rounded-t-3xl w-36 h-8 flex items-center justify-center text-xs text-muted-foreground font-medium bg-muted">
              FRONT / DRIVER
            </div>
          </div>

          {/* Seat rows */}
          <div className="border-2 border-border rounded-xl p-4 space-y-2 bg-muted">
            {layout.layout.map(row => (
              <div key={row.rowNumber} className="flex items-center justify-between gap-4">
                {/* Left seats (2) */}
                <div className="flex gap-1.5">
                  {row.left.map(s => <Seat key={s.seatNumber} seat={s} onClick={setSelected} />)}
                </div>

                {/* Aisle label */}
                <div className="text-xs text-muted-foreground/70 shrink-0">{row.rowNumber}</div>

                {/* Right seats (2) */}
                <div className="flex gap-1.5">
                  {row.right.map(s => <Seat key={s.seatNumber} seat={s} onClick={setSelected} />)}
                </div>
              </div>
            ))}

            {/* Rear seat */}
            {layout.hasRearSeat && (
              <>
                <div className="border-t border-dashed border-border my-2" />
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: layout.rearSeatCount }).map((_, i) => {
                    const seatNum = layout.totalSeats - layout.rearSeatCount + 1 + i;
                    const seatInfo: SeatInfo = {
                      seatNumber: String(seatNum),
                      row: layout.rows + 1,
                      position: 'window',
                      side: i < layout.rearSeatCount / 2 ? 'left' : 'right',
                      status: 'AVAILABLE',
                    };
                    return <Seat key={seatNum} seat={seatInfo} onClick={setSelected} />;
                  })}
                </div>
              </>
            )}
          </div>

          {/* Rear label */}
          <div className="flex items-center justify-center mt-4">
            <div className="border-2 border-border rounded-b-lg w-36 h-6 flex items-center justify-center text-xs text-muted-foreground bg-muted">
              REAR
            </div>
          </div>
        </div>

        {/* Selected seat info */}
        {selected && (
          <div className="mt-5 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-primary">
              <strong>Seat {selected.seatNumber}</strong> · Row {selected.row} ·{' '}
              {selected.side === 'left' ? 'Left' : 'Right'} side ·{' '}
              {selected.position === 'window' ? 'Window' : 'Aisle'} ·{' '}
              <span className="font-semibold">{SEAT_COLORS[selected.status].label}</span>
              <button
                onClick={() => setSelected(null)}
                className="ml-3 text-primary underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        Seating layout reflects the physical configuration. Live occupancy data requires the ticketing API integration.
      </p>
    </div>
  );
}
