'use client';

import { CSVEditor, ROUTE_VALIDATION_RULES } from '@/components/tools/csv-editor';
import { useRoutesImport } from '@/components/mot/routes/useRoutesImport';

function RoutesImportPage() {
    const {
        handleImport, handleImportComplete, handleImportError,
        handleTemplateDownload, importOptions,
    } = useRoutesImport();

    return (
        <div className="p-0 mx-auto">
            <CSVEditor
                onImport={handleImport}
                onImportComplete={handleImportComplete}
                onImportError={handleImportError}
                templateDownloadFn={handleTemplateDownload}
                importOptions={importOptions}
                validationRules={ROUTE_VALIDATION_RULES}
                maxRows={5000}
                maxFileSize={5 * 1024 * 1024}
                title="Upload Routes CSV Data"
                description="Upload your unified routes CSV file containing route groups, routes, and route stops data. Make sure to include required fields: route_group_name, route_name, stop_name_english, and stop_order."
            />
        </div>
    );
}

export default RoutesImportPage;