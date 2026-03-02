'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import {
  FareMatrixEntry,
  PermitType,
  PERMIT_TYPES,
  PERMIT_TYPE_LABELS,
} from '@/data/mot/fares';

interface FareMatrixTableProps {
  matrix: FareMatrixEntry[];
  stageFrom: number;
  stageTo: number;
  searchFare: string;
  highlightPermitTypes: PermitType[];
  loading?: boolean;
}

function formatFare(value: number): string {
  return value.toFixed(2);
}

function isFareMatch(fare: number, searchFare: string): boolean {
  if (!searchFare) return false;
  const fareStr = fare.toFixed(2);
  return fareStr.includes(searchFare);
}

export function FareMatrixTable({
  matrix,
  stageFrom,
  stageTo,
  searchFare,
  highlightPermitTypes,
  loading = false,
}: FareMatrixTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredMatrix = useMemo(() => {
    return matrix.filter((entry) => entry.stage >= stageFrom && entry.stage <= stageTo);
  }, [matrix, stageFrom, stageTo]);

  const visiblePermitTypes = useMemo(() => {
    if (highlightPermitTypes.length === 0) return PERMIT_TYPES;
    return PERMIT_TYPES;
  }, [highlightPermitTypes]);

  const isHighlighted = (permitType: PermitType): boolean => {
    if (highlightPermitTypes.length === 0) return true;
    return highlightPermitTypes.includes(permitType);
  };

  // Scroll to first match when searchFare changes
  useEffect(() => {
    if (!searchFare || !tableRef.current) return;
    const firstMatch = tableRef.current.querySelector('[data-fare-match="true"]');
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchFare, stageFrom, stageTo]);

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-t-xl">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50 z-10">Stage</th>
              {PERMIT_TYPES.map((pt) => (
                <th key={pt} className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">{PERMIT_TYPE_LABELS[pt]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10">
                  <div className="h-3.5 bg-gray-200 rounded animate-pulse w-12" />
                </td>
                {PERMIT_TYPES.map((pt) => (
                  <td key={pt} className="px-4 py-2.5 text-right">
                    <div className="h-3.5 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (filteredMatrix.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No stages in range</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Adjust the stage range filters to view fare data.
        </p>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="overflow-x-auto rounded-t-xl max-h-[600px] overflow-y-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 z-20">
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50 z-30 min-w-[80px]">
              Stage
            </th>
            {visiblePermitTypes.map((pt) => (
              <th
                key={pt}
                className={[
                  'px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider min-w-[120px]',
                  isHighlighted(pt) ? 'text-gray-700' : 'text-gray-400',
                ].join(' ')}
              >
                {PERMIT_TYPE_LABELS[pt]}
                <span className="block text-[9px] font-normal normal-case tracking-normal text-gray-400 mt-0.5">
                  (Rs.)
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredMatrix.map((entry, idx) => (
            <tr
              key={entry.stage}
              className={[
                'transition-colors duration-75',
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                'hover:bg-blue-50/40',
              ].join(' ')}
            >
              <td className="px-4 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-100">
                {entry.stage}
              </td>
              {visiblePermitTypes.map((pt) => {
                const fare = entry.fares[pt];
                const isMatch = isFareMatch(fare, searchFare);
                const dimmed = !isHighlighted(pt);

                return (
                  <td
                    key={pt}
                    data-fare-match={isMatch ? 'true' : undefined}
                    className={[
                      'px-4 py-2 text-sm text-right tabular-nums',
                      dimmed ? 'text-gray-300' : 'text-gray-700',
                      isMatch ? 'bg-yellow-100 font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-300' : '',
                    ].join(' ')}
                  >
                    {formatFare(fare)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
