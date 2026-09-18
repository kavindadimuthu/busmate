'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { FACILITY_CATALOG, facilityLabel } from '@/lib/fleet';

/** Facilities as stored on the bus: { key: boolean }. Catalogue items plus any custom keys. */
export function FacilitiesPicker({ value, onChange }: { value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  const [custom, setCustom] = useState('');
  const customKeys = Object.keys(value).filter((k) => !FACILITY_CATALOG.some((f) => f.key === k));

  const toggle = (key: string) => onChange({ ...value, [key]: !value[key] });
  const addCustom = () => {
    const key = custom.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!key || key in value) return;
    onChange({ ...value, [key]: true });
    setCustom('');
  };
  const removeCustom = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const chip = (key: string, label: string, removable = false) => {
    const on = !!value[key];
    return (
      <span key={key} className={`inline-flex items-center rounded-full border text-xs ${on ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>
        <button type="button" onClick={() => toggle(key)} aria-pressed={on} className="inline-flex items-center gap-1.5 px-3 py-1.5">
          {on && <Check className="w-3 h-3" />}
          {label}
        </button>
        {removable && (
          <button type="button" onClick={() => removeCustom(key)} className="pr-2 -ml-1" aria-label={`Remove ${label}`}>
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FACILITY_CATALOG.map((f) => chip(f.key, f.label))}
        {customKeys.map((k) => chip(k, facilityLabel(k), true))}
      </div>
      <div className="flex gap-2 max-w-sm">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add another facility…"
          maxLength={40}
          className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-card"
        />
        <button type="button" onClick={addCustom} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
