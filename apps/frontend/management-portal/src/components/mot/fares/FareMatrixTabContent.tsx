'use client';

import type { FareAmendment, PermitType } from '@/data/mot/fares';
import { FareMatrixFilters } from './FareMatrixFilters';
import { FareMatrixTable } from './FareMatrixTable';

interface FareMatrixTabContentProps {
  amendment: FareAmendment;
  stageFrom: number;
  onStageFromChange: (v: number) => void;
  stageTo: number;
  onStageToChange: (v: number) => void;
  maxStages: number;
  searchFare: string;
  onSearchFareChange: (v: string) => void;
  selectedPermitTypes: PermitType[];
  onPermitTypesChange: (types: PermitType[]) => void;
  onClearFilters: () => void;
  onViewDetails: (amendment: FareAmendment) => void;
}

export function FareMatrixTabContent({
  amendment, stageFrom, onStageFromChange, stageTo, onStageToChange, maxStages,
  searchFare, onSearchFareChange, selectedPermitTypes, onPermitTypesChange,
  onClearFilters, onViewDetails,
}: FareMatrixTabContentProps) {
  return (
    <>
      <div className="bg-success/10 border border-success/20 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-success">
            Current Fare Structure: {amendment.referenceNumber}
          </p>
          <p className="text-xs text-success mt-0.5">
            {amendment.title} — Effective from{' '}
            {new Date(amendment.effectiveDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => onViewDetails(amendment)}
          className="text-xs font-medium text-success hover:text-success/70 hover:underline"
        >
          View full details
        </button>
      </div>

      <FareMatrixFilters
        stageFrom={stageFrom} onStageFromChange={onStageFromChange}
        stageTo={stageTo} onStageToChange={onStageToChange}
        maxStages={maxStages} searchFare={searchFare}
        onSearchFareChange={onSearchFareChange}
        selectedPermitTypes={selectedPermitTypes}
        onPermitTypesChange={onPermitTypesChange}
        onClearAll={onClearFilters}
      />

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <FareMatrixTable
          matrix={amendment.matrix}
          stageFrom={stageFrom} stageTo={stageTo}
          searchFare={searchFare} highlightPermitTypes={selectedPermitTypes}
        />
      </div>
    </>
  );
}
