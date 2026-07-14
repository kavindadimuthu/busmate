'use client';

import { Copy, CheckCircle } from 'lucide-react';

interface CopyableFieldProps {
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  className?: string;
}

export default function CopyableField({ value, field, copiedField, onCopy, className = '' }: CopyableFieldProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex-1">{value}</span>
      <button
        onClick={() => onCopy(value, field)}
        className="p-1 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        title="Copy to clipboard"
      >
        {copiedField === field ? (
          <CheckCircle className="w-4 h-4 text-success/80" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
