'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Upload, FileText, Download, AlertTriangle } from 'lucide-react';
import { CSVUploader } from './CSVUploader';
import { CSVDataTable } from './CSVDataTable';
import { validateCSVData, getValidationSummary } from './CSVValidator';
import { CSVData, ValidationResult, ImportProgress, ValidationRule } from './types';

interface CSVEditorProps {
  // Data handling
  onDataChange?: (data: CSVData) => void;
  onValidationChange?: (result: ValidationResult) => void;
  initialData?: CSVData;
  
  // Import handling
  onImport?: (data: CSVData, options?: any) => Promise<any>;
  onImportComplete?: (result: any) => void;
  onImportError?: (error: string) => void;
  importOptions?: any;
  
  // Template handling
  templateDownloadFn?: (format: string) => Promise<void>;
  
  // Validation
  validationRules?: ValidationRule[];
  
  // Configuration
  maxRows?: number;
  maxFileSize?: number;
  isLoading?: boolean;
  disabled?: boolean;
  
  // UI customization
  title?: string;
  description?: string;
}

export function CSVEditor({
  onDataChange,
  onValidationChange,
  onImport,
  onImportComplete,
  onImportError,
  initialData,
  maxRows = 1000,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  validationRules = [],
  isLoading = false,
  disabled = false,
  importOptions,
  templateDownloadFn,
  title = "Upload CSV Data",
  description = "Upload your CSV file or paste CSV data directly"
}: CSVEditorProps) {
  const [csvData, setCsvData] = useState<CSVData | null>(initialData || null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate data whenever it changes
  useEffect(() => {
    if (csvData && validationRules) {
      const result = validateCSVData(csvData, validationRules);
      setValidationResult(result);
      onValidationChange?.(result);
    }
  }, [csvData, validationRules, onValidationChange]);

  const handleDataParsed = useCallback((data: CSVData) => {
    setCsvData(data);
    setErrorMessage(null);
    onDataChange?.(data);
  }, [onDataChange]);

  const handleDataChanged = useCallback((data: CSVData) => {
    setCsvData(data);
    onDataChange?.(data);
  }, [onDataChange]);

  const handleError = useCallback((error: string) => {
    setErrorMessage(error);
    setImportProgress(null);
  }, []);

  const handleDownloadTemplate = useCallback(async (format: string) => {
    try {
      if (templateDownloadFn) {
        await templateDownloadFn(format);
      } else {
        throw new Error('No template download function provided');
      }
    } catch (error) {
      handleError('Failed to download template');
      console.error('Template download error:', error);
    }
  }, [templateDownloadFn, handleError]);

  const handleImport = useCallback(async () => {
    if (!csvData || !validationResult) {
      handleError('No data to import');
      return;
    }

    if (!validationResult.isValid) {
      handleError('Please fix validation errors before importing');
      return;
    }

    try {
      setImportProgress({
        total: csvData.rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        isImporting: true
      });

      // Convert CSV data to CSV file content
      const headers = csvData.headers.join(',');
      const rows = csvData.rows.map(row => 
        csvData.headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      // Create blob and form data
      const blob = new Blob([csvContent], { type: 'text/csv' });
      
      if (onImport) {
        // Use custom import handler
        const result = await onImport(csvData, importOptions);

        if (result) {
          setImportProgress({
            total: csvData.rows.length,
            processed: result.totalRecords || csvData.rows.length,
            successful: result.successfulImports || 0,
            failed: result.failedImports || 0,
            isImporting: false,
            errors: result.errors?.map((error: any, index: number) => ({
              row: index,
              message: error.message || 'Unknown error'
            }))
          });

          onImportComplete?.(result);
        } else {
          throw new Error('Import returned no result');
        }
      } else {
        throw new Error('No import handler provided');
      }

    } catch (error) {
      setImportProgress({
        total: csvData.rows.length,
        processed: 0,
        successful: 0,
        failed: csvData.rows.length,
        isImporting: false
      });

      const errorMsg = error instanceof Error ? error.message : 'Import failed';
      handleError(errorMsg);
      onImportError?.(errorMsg);
    }
  }, [csvData, validationResult, onImport, onImportComplete, onImportError, importOptions, handleError]);

  const canImport = csvData && validationResult?.isValid && !importProgress?.isImporting && !isLoading && !disabled;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        <CSVUploader
          onDataParsed={handleDataParsed}
          onError={handleError}
          maxFileSize={maxFileSize}
          disabled={disabled || isLoading}
          onDownloadTemplate={handleDownloadTemplate}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && csvData && (
        <div className={`rounded-lg border p-4 ${
          validationResult.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {validationResult.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                validationResult.isValid ? 'text-green-900' : 'text-red-900'
              }`}>
                Validation {validationResult.isValid ? 'Passed' : 'Issues Found'}
              </h4>
              <p className={`mt-1 ${
                validationResult.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {getValidationSummary(validationResult)}
              </p>
              
              {!validationResult.isValid && (
                <>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Review the highlighted cells in the table below and fix the errors before importing.
                  </p>
                  
                  {/* Detailed Error List */}
                  <div className="mt-4 space-y-3">
                    {validationResult.errors.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-800 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Errors ({validationResult.errors.length})
                        </h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {validationResult.errors.slice(0, 10).map((error, idx) => (
                            <div key={idx} className="text-xs p-2 bg-red-100 border border-red-200 rounded flex justify-between items-start">
                              <span className="text-red-800">
                                <strong>Row {error.row + 1}, {error.column}:</strong> {error.message}
                              </span>
                            </div>
                          ))}
                          {validationResult.errors.length > 10 && (
                            <div className="text-xs text-red-600 italic">
                              ... and {validationResult.errors.length - 10} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <div>
                        <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings ({validationResult.warnings.length})
                        </h5>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {validationResult.warnings.slice(0, 10).map((warning, idx) => (
                            <div key={idx} className="text-xs p-2 bg-yellow-100 border border-yellow-200 rounded flex justify-between items-start">
                              <span className="text-yellow-800">
                                <strong>Row {warning.row + 1}, {warning.column}:</strong> {warning.message}
                              </span>
                            </div>
                          ))}
                          {validationResult.warnings.length > 10 && (
                            <div className="text-xs text-yellow-600 italic">
                              ... and {validationResult.warnings.length - 10} more warnings
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {canImport && (
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Import Progress */}
      {importProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className={`w-5 h-5 mt-0.5 ${
              importProgress.isImporting 
                ? 'border-2 border-blue-600 border-t-transparent rounded-full animate-spin'
                : importProgress.failed === 0 
                  ? 'text-green-600'
                  : 'text-yellow-600'
            }`}>
              {!importProgress.isImporting && (
                importProgress.failed === 0 ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">
                {importProgress.isImporting ? 'Importing...' : 'Import Complete'}
              </h4>
              <div className="text-blue-700 mt-1 space-y-1">
                <p>
                  {importProgress.successful} successful, {importProgress.failed} failed 
                  {importProgress.isImporting ? ` (${importProgress.processed}/${importProgress.total})` : ''}
                </p>
                
                {importProgress.errors && importProgress.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-700">Errors:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                      {importProgress.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>Row {error.row + 1}: {error.message}</li>
                      ))}
                      {importProgress.errors.length > 5 && (
                        <li>... and {importProgress.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {csvData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Review & Edit Data</h3>
          </div>
          <CSVDataTable
            data={csvData}
            onDataChange={handleDataChanged}
            validationErrors={validationResult ? [...validationResult.errors, ...validationResult.warnings] : []}
            maxRows={maxRows}
            readOnly={disabled || isLoading}
            allowAddRows={true}
            allowDeleteRows={true}
            allowEditHeaders={false}
          />
        </div>
      )}
    </div>
  );
}