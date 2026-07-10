'use client';

import { CSVEditor, BUS_STOP_VALIDATION_RULES } from '@/components/tools/csv-editor';
import { useBusStopsImport } from '@/hooks/mot/stops/useBusStopsImport';

function BusStopsImportPage() {
    const { handleImport, handleImportComplete, handleImportError, handleTemplateDownload } = useBusStopsImport();

    return (
        <div className="p-0 mx-auto">
            <CSVEditor
                onImport={handleImport}
                onImportComplete={handleImportComplete}
                onImportError={handleImportError}
                templateDownloadFn={handleTemplateDownload}
                importOptions={{ defaultCountry: 'Sri Lanka' }}
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