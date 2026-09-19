'use client';

import { CSVEditor, BUS_STOP_VALIDATION_RULES } from '@/components/tools/csv-editor';
import { useBusStopsImport } from '@/hooks/mot/stops/useBusStopsImport';
import { SourceTierSelect } from '@/components/shared/provenance/SourceTierSelect';
import type { SourceTierKey } from '@/lib/provenance';
import { useState } from 'react';

function BusStopsImportPage() {
    const { handleImport, handleImportComplete, handleImportError, handleTemplateDownload } = useBusStopsImport();
    // MOT only; undefined records the default source (field observation).
    const [sourceTier, setSourceTier] = useState<SourceTierKey | undefined>(undefined);

    return (
        <div className="p-0 mx-auto">
            <SourceTierSelect className="mb-4 max-w-md" value={sourceTier} onChange={setSourceTier} />
            <CSVEditor
                onImport={handleImport}
                onImportComplete={handleImportComplete}
                onImportError={handleImportError}
                templateDownloadFn={handleTemplateDownload}
                importOptions={{ defaultCountry: 'Sri Lanka', sourceTier }}
                validationRules={BUS_STOP_VALIDATION_RULES}
                maxRows={5000}
                maxFileSize={5 * 1024 * 1024}
                title="Upload Bus Stops CSV Data"
                description="Upload your bus stops CSV file or paste CSV data directly. Make sure to include at least one name field (name, name_sinhala, or name_tamil) and location coordinates."
            />
        </div>
    );
}

export default BusStopsImportPage;