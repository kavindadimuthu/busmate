'use client';

import { FareAmendmentSummaryCard } from '@/components/mot/fares/FareAmendmentSummaryCard';
import { FareMatrixTable } from '@/components/mot/fares/FareMatrixTable';
import { FareMatrixFilters } from '@/components/mot/fares/FareMatrixFilters';
import { useAmendmentDetail } from '@/components/mot/fares/useAmendmentDetail';

export default function AmendmentDetailPage() {
  const {
    amendment, amendmentId, router,
    stageFrom, setStageFrom, stageTo, setStageTo, maxStages,
    searchFare, setSearchFare, selectedPermitTypes, setSelectedPermitTypes,
    handleClearFilters,
  } = useAmendmentDetail();

  if (!amendment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Amendment Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The fare amendment with ID &quot;{amendmentId}&quot; could not be found.
        </p>
        <button onClick={() => router.push('/mot/fares')} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors">
          Back to Fares
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FareAmendmentSummaryCard amendment={amendment} />

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Fare Matrix</h2>
        <FareMatrixFilters
          stageFrom={stageFrom} onStageFromChange={setStageFrom}
          stageTo={stageTo} onStageToChange={setStageTo} maxStages={maxStages}
          searchFare={searchFare} onSearchFareChange={setSearchFare}
          selectedPermitTypes={selectedPermitTypes} onPermitTypesChange={setSelectedPermitTypes}
          onClearAll={handleClearFilters}
        />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <FareMatrixTable
          matrix={amendment.matrix} stageFrom={stageFrom} stageTo={stageTo}
          searchFare={searchFare} highlightPermitTypes={selectedPermitTypes}
        />
      </div>
    </div>
  );
}
