import React, { useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { getAmendmentById, PermitType } from '@/data/mot/fares';
import { ArrowLeft, Download } from 'lucide-react';

export function useAmendmentDetail() {
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
        amendment
            ? React.createElement(React.Fragment, null,
                React.createElement('button', {
                    onClick: () => router.push('/mot/fares'),
                    className: 'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
                }, React.createElement(ArrowLeft, { className: 'w-4 h-4' }), 'Back'),
                React.createElement('button', {
                    onClick: handleExport,
                    className: 'flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted transition-colors',
                }, React.createElement(Download, { className: 'w-4 h-4' }), 'Export'),
              )
            : null
    );

    return {
        amendment, amendmentId, router,
        stageFrom, setStageFrom, stageTo, setStageTo, maxStages,
        searchFare, setSearchFare, selectedPermitTypes, setSelectedPermitTypes,
        handleClearFilters,
    };
}
