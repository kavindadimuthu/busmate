'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { CSVData, CSVRow } from './types';

interface CSVUploaderProps {
  onDataParsed: (data: CSVData) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  acceptedFileTypes?: string[];
  onDownloadTemplate?: (format: string) => Promise<void>;
}

export function CSVUploader({
  onDataParsed,
  onError,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  acceptedFileTypes = ['.csv', '.txt'],
  onDownloadTemplate
}: CSVUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvText, setCsvText] = useState('');
  const [showTextArea, setShowTextArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVContent = useCallback((content: string) => {
    try {
      setUploadStatus('uploading');
      
      const result = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string, field: string) => {
          // Handle empty values
          if (!value || value.trim() === '') {
            return '';
          }
          
          // Transform boolean strings
          if (field === 'isAccessible') {
            if (value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes') {
              return true;
            } else if (value.toLowerCase() === 'false' || value === '0' || value.toLowerCase() === 'no') {
              return false;
            }
          }
          
          // Transform numeric fields - both bus stop and route fields
          const numericFields = [
            'latitude', 'longitude', // Bus stop fields
            'distance_km', 'estimated_duration_minutes', 'stop_order', 'distance_from_start_km' // Route fields
          ];
          
          if (numericFields.includes(field)) {
            const num = parseFloat(value);
            return !isNaN(num) ? num : value;
          }
          
          // Return trimmed string for other fields
          return value.trim();
        }
      }) as Papa.ParseResult<CSVRow>;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((error: Papa.ParseError) => `Row ${error.row}: ${error.message}`).join(', ');
        throw new Error(`CSV parsing errors: ${errorMessages}`);
      }

      const headers = result.meta?.fields || [];
      const rows = result.data || [];

      if (headers.length === 0) {
        throw new Error('No headers found in CSV file');
      }

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      const csvData: CSVData = {
        headers,
        rows
      };

      setUploadStatus('success');
      onDataParsed(csvData);
      
    } catch (error) {
      setUploadStatus('error');
      onError(error instanceof Error ? error.message : 'Failed to parse CSV file');
    }
  }, [onDataParsed, onError]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > maxFileSize) {
      onError(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      onError(`File type ${fileExtension} is not supported. Accepted types: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseCSVContent(content);
    };
    reader.onerror = () => {
      onError('Failed to read file');
    };
    reader.readAsText(file);
  }, [maxFileSize, acceptedFileTypes, onError, parseCSVContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleTextSubmit = useCallback(() => {
    if (csvText.trim()) {
      parseCSVContent(csvText.trim());
    }
  }, [csvText, parseCSVContent]);

  const handleDownloadTemplate = useCallback(async (format: string) => {
    if (onDownloadTemplate) {
      try {
        await onDownloadTemplate(format);
      } catch (error) {
        onError('Failed to download template');
      }
    }
  }, [onDownloadTemplate, onError]);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (isDragOver && !disabled) return 'border-primary bg-primary/10';
    if (uploadStatus === 'success') return 'border-success/30 bg-success/10';
    if (uploadStatus === 'error') return 'border-destructive/30 bg-destructive/10';
    if (disabled) return 'border-border bg-muted';
    return 'border-border hover:border-border';
  };

  return (
    <div className="space-y-4">
      {/* Template Download Section */}
      {/* {onDownloadTemplate && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-primary mb-1">Need a template?</h3>
              <p className="text-sm text-primary mb-3">
                Download a CSV template to see the expected format and column names.
              </p>
              <div className="flex flex-wrap gap-2">
                {['minimal', 'multilingual', 'location', 'full'].map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownloadTemplate(format)}
                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary transition-colors capitalize"
                  >
                    {format} Template
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Upload Methods Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setShowTextArea(false)}
          className={`px-4 py-2 font-medium text-sm ${
            !showTextArea 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setShowTextArea(true)}
          className={`px-4 py-2 font-medium text-sm ${
            showTextArea 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Paste CSV
        </button>
      </div>

      {/* File Upload Area */}
      {!showTextArea && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${getStatusColor()}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {getStatusIcon() || <Upload className="w-12 h-12 text-muted-foreground/70" />}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {uploadStatus === 'uploading' ? 'Processing...' :
                 uploadStatus === 'success' ? 'File uploaded successfully!' :
                 uploadStatus === 'error' ? 'Upload failed' :
                 'Upload CSV File'}
              </h3>
              
              {uploadStatus === 'idle' && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Drag and drop your CSV file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:text-primary font-medium"
                      disabled={disabled}
                    >
                      browse to upload
                    </button>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: {acceptedFileTypes.join(', ')} • Max size: {(maxFileSize / 1024 / 1024).toFixed(0)}MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text Area for Paste */}
      {showTextArea && (
        <div className="space-y-4">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste your CSV content here...&#10;Example:&#10;name,latitude,longitude,city,state,isAccessible&#10;Central Bus Station,6.9271,79.8612,Colombo,Western Province,true&#10;Kandy Bus Stand,7.2906,80.6337,Kandy,Central Province,false"
            className="w-full h-48 p-3 border border-border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-primary"
            disabled={disabled}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Paste your CSV content including headers in the first row
            </p>
            <div className="flex gap-2">
              {csvText && (
                <button
                  onClick={() => setCsvText('')}
                  className="px-3 py-1 text-muted-foreground hover:text-foreground border border-border rounded text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleTextSubmit}
                disabled={!csvText.trim() || disabled}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Parse CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}