'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { PermitType, PERMIT_TYPES, PERMIT_TYPE_LABELS } from '@/data/mot/fares';

interface FareMatrixFiltersProps {
  stageFrom: number;
  onStageFromChange: (value: number) => void;
  stageTo: number;
  onStageToChange: (value: number) => void;
  maxStages: number;
  searchFare: string;
  onSearchFareChange: (value: string) => void;
  selectedPermitTypes: PermitType[];
  onPermitTypesChange: (types: PermitType[]) => void;
  onClearAll: () => void;
}

export function FareMatrixFilters({
  stageFrom,
  onStageFromChange,
  stageTo,
  onStageToChange,
  maxStages,
  searchFare,
  onSearchFareChange,
  selectedPermitTypes,
  onPermitTypesChange,
  onClearAll,
}: FareMatrixFiltersProps) {
  const hasActiveFilters =
    stageFrom !== 1 ||
    stageTo !== maxStages ||
    searchFare !== '' ||
    selectedPermitTypes.length > 0;

  const togglePermitType = (pt: PermitType) => {
    if (selectedPermitTypes.includes(pt)) {
      onPermitTypesChange(selectedPermitTypes.filter((t) => t !== pt));
    } else {
      onPermitTypesChange([...selectedPermitTypes, pt]);
    }
  };

  const handleStageFromInput = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      onStageFromChange(Math.min(num, stageTo));
    }
  };

  const handleStageToInput = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= stageFrom) {
      onStageToChange(Math.min(num, maxStages));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Row 1: Fare Search + Stage Range */}
      <div className="flex flex-wrap items-end gap-4 p-4 border-b border-gray-100">
        {/* Fare Amount Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Search by fare amount</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchFare}
              onChange={(e) => onSearchFareChange(e.target.value)}
              placeholder="e.g. 150.00"
              className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
            />
            {searchFare && (
              <button
                onClick={() => onSearchFareChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Stage From */}
        <div className="w-[130px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Stage from</label>
          <input
            type="number"
            min={1}
            max={stageTo}
            value={stageFrom}
            onChange={(e) => handleStageFromInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
          />
        </div>

        {/* Stage To */}
        <div className="w-[130px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Stage to</label>
          <input
            type="number"
            min={stageFrom}
            max={maxStages}
            value={stageTo}
            onChange={(e) => handleStageToInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
          />
        </div>

        {/* Stage Range Display */}
        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
          <span>
            Showing stages <span className="font-semibold text-gray-700">{stageFrom}</span> – <span className="font-semibold text-gray-700">{stageTo}</span> of {maxStages}
          </span>
        </div>
      </div>

      {/* Row 2: Permit Type Toggles */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Permit Types
        </div>
        <div className="flex flex-wrap gap-2">
          {PERMIT_TYPES.map((pt) => {
            const isSelected = selectedPermitTypes.length === 0 || selectedPermitTypes.includes(pt);
            return (
              <button
                key={pt}
                onClick={() => togglePermitType(pt)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100',
                ].join(' ')}
              >
                {PERMIT_TYPE_LABELS[pt]}
              </button>
            );
          })}
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="ml-auto text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
