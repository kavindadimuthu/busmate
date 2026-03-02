'use client';

import React, { useState } from 'react';
import { Users, Info } from 'lucide-react';
import type { OperatorBus, SeatInfo, SeatStatus } from '@/data/operator/buses';

interface BusSeatingViewProps {
  bus: OperatorBus;
}

const SEAT_COLORS: Record<SeatStatus, { bg: string; border: string; label: string }> = {
  AVAILABLE: { bg: 'bg-white',       border: 'border-gray-300', label: 'Available' },
  RESERVED:  { bg: 'bg-yellow-100',  border: 'border-yellow-400', label: 'Reserved' },
  BOOKED:    { bg: 'bg-blue-200',    border: 'border-blue-500', label: 'Booked' },
  DAMAGED:   { bg: 'bg-red-100',     border: 'border-red-400',  label: 'Damaged' },
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
          { label: 'Total Seats', value: layout.totalSeats, cls: 'bg-gray-50 border-gray-200' },
          { label: 'Available',   value: available,         cls: 'bg-white border-gray-200' },
          { label: 'Booked',      value: booked,            cls: 'bg-blue-50 border-blue-200' },
          { label: 'Damaged',     value: damaged,           cls: 'bg-red-50 border-red-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 ${item.cls}`}>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {Object.entries(SEAT_COLORS).map(([status, meta]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded border-2 inline-block ${meta.bg} ${meta.border}`} />
            {meta.label}
          </span>
        ))}
      </div>

      {/* Bus diagram */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-auto p-6">
        <div className="min-w-[300px] mx-auto" style={{ maxWidth: 380 }}>
          {/* Front of bus */}
          <div className="flex items-center justify-center mb-4">
            <div className="border-2 border-gray-400 rounded-t-3xl w-36 h-8 flex items-center justify-center text-xs text-gray-500 font-medium bg-gray-100">
              FRONT / DRIVER
            </div>
          </div>

          {/* Seat rows */}
          <div className="border-2 border-gray-300 rounded-xl p-4 space-y-2 bg-gray-50">
            {layout.layout.map(row => (
              <div key={row.rowNumber} className="flex items-center justify-between gap-4">
                {/* Left seats (2) */}
                <div className="flex gap-1.5">
                  {row.left.map(s => <Seat key={s.seatNumber} seat={s} onClick={setSelected} />)}
                </div>

                {/* Aisle label */}
                <div className="text-xs text-gray-400 shrink-0">{row.rowNumber}</div>

                {/* Right seats (2) */}
                <div className="flex gap-1.5">
                  {row.right.map(s => <Seat key={s.seatNumber} seat={s} onClick={setSelected} />)}
                </div>
              </div>
            ))}

            {/* Rear seat */}
            {layout.hasRearSeat && (
              <>
                <div className="border-t border-dashed border-gray-300 my-2" />
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
            <div className="border-2 border-gray-400 rounded-b-lg w-36 h-6 flex items-center justify-center text-xs text-gray-500 bg-gray-100">
              REAR
            </div>
          </div>
        </div>

        {/* Selected seat info */}
        {selected && (
          <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Seat {selected.seatNumber}</strong> · Row {selected.row} ·{' '}
              {selected.side === 'left' ? 'Left' : 'Right'} side ·{' '}
              {selected.position === 'window' ? 'Window' : 'Aisle'} ·{' '}
              <span className="font-semibold">{SEAT_COLORS[selected.status].label}</span>
              <button
                onClick={() => setSelected(null)}
                className="ml-3 text-blue-600 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        Seating layout reflects the physical configuration. Live occupancy data requires the ticketing API integration.
      </p>
    </div>
  );
}
