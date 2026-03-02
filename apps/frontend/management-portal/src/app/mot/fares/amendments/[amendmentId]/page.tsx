'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { getAmendmentById, PermitType } from '@/data/mot/fares';
import { FareAmendmentSummaryCard } from '@/components/mot/fares/FareAmendmentSummaryCard';
import { FareMatrixTable } from '@/components/mot/fares/FareMatrixTable';
import { FareMatrixFilters } from '@/components/mot/fares/FareMatrixFilters';
import { ArrowLeft, Download } from 'lucide-react';

export default function AmendmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const amendmentId = params.amendmentId as string;

  const amendment = useMemo(() => getAmendmentById(amendmentId), [amendmentId]);

  useSetPageMetadata({
    title: amendment ? amendment.title : 'Amendment Not Found',
    description: amendment?.referenceNumber || '',
    activeItem: 'fares',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Fares', href: '/mot/fares' },
      { label: amendment?.referenceNumber || 'Amendment Details' },
    ],
  });

  // Matrix filters
  const maxStages = amendment?.maxStages ?? 350;
  const [stageFrom, setStageFrom] = useState(1);
  const [stageTo, setStageTo] = useState(Math.min(50, maxStages));
  const [searchFare, setSearchFare] = useState('');
  const [selectedPermitTypes, setSelectedPermitTypes] = useState<PermitType[]>([]);

  const handleClearFilters = useCallback(() => {
    setStageFrom(1);
    setStageTo(Math.min(50, maxStages));
    setSearchFare('');
    setSelectedPermitTypes([]);
  }, [maxStages]);

  const handleExport = useCallback(() => {
    alert('Export feature coming soon');
  }, []);

  useSetPageActions(
    amendment ? (
      <>
        <button
          onClick={() => router.push('/mot/fares')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </>
    ) : null
  );

  if (!amendment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Amendment Not Found</h2>
        <p className="text-gray-600 mb-6">
          The fare amendment with ID &quot;{amendmentId}&quot; could not be found.
        </p>
        <button
          onClick={() => router.push('/mot/fares')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Fares
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Amendment Summary */}
      <FareAmendmentSummaryCard amendment={amendment} />

      {/* Matrix Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fare Matrix</h2>

        <FareMatrixFilters
          stageFrom={stageFrom}
          onStageFromChange={setStageFrom}
          stageTo={stageTo}
          onStageToChange={setStageTo}
          maxStages={maxStages}
          searchFare={searchFare}
          onSearchFareChange={setSearchFare}
          selectedPermitTypes={selectedPermitTypes}
          onPermitTypesChange={setSelectedPermitTypes}
          onClearAll={handleClearFilters}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <FareMatrixTable
          matrix={amendment.matrix}
          stageFrom={stageFrom}
          stageTo={stageTo}
          searchFare={searchFare}
          highlightPermitTypes={selectedPermitTypes}
        />
      </div>
    </div>
  );
}
