'use client';

import { useEffect, useState } from 'react';
import { FormDialog } from '@busmate/ui';
import { inputClassFor } from '@/components/shared/form-primitives';

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Extra context shown above the reason box (e.g. how many trips are affected). */
  notice?: React.ReactNode;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
}

/** A status change that must record why: suspend, withdraw, cancel. */
export function ReasonDialog({
  open, onOpenChange, title, description, confirmLabel, destructive, notice, busy, error, onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim()) onConfirm(reason.trim());
        }}
      >
        {notice}
        <div>
          <label htmlFor="status-reason" className="block text-xs font-medium text-muted-foreground mb-1">
            Reason <span className="text-destructive/80">*</span>
          </label>
          <textarea
            id="status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            className={inputClassFor()}
            placeholder="This is shown to the other party"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !reason.trim()}
            className={`px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 ${
              destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
