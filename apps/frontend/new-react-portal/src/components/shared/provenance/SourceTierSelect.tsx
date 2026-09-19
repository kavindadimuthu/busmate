'use client';

import { STAFF_ENTERABLE_TIERS, SOURCE_TIERS, type SourceTierKey } from '@/lib/provenance';
import { useCurrentUserType } from '@/hooks/useCurrentUserType';

interface SourceTierSelectProps {
  value?: SourceTierKey;
  onChange: (tier: SourceTierKey | undefined) => void;
  /** Edit forms keep the record's current source until one is chosen. */
  isEdit?: boolean;
  className?: string;
}

/**
 * Lets MOT record where the data came from, including marking it official. Everyone else gets nothing:
 * their writes are field observation credited to BusMate, and the backend refuses anything else that
 * needs MOT — this only keeps the UI from offering it.
 */
export function SourceTierSelect({ value, onChange, isEdit, className }: SourceTierSelectProps) {
  const userType = useCurrentUserType();
  if (userType !== 'mot') return null;

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data source</label>
      <select
        className="w-full border border-border rounded-lg px-3 py-2 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? (e.target.value as SourceTierKey) : undefined)}
      >
        <option value="">
          {isEdit ? 'Keep current source' : `${SOURCE_TIERS.SRC_4.label} (default)`}
        </option>
        {STAFF_ENTERABLE_TIERS.filter((t) => isEdit || t !== 'SRC_4').map((tier) => (
          <option key={tier} value={tier}>
            {SOURCE_TIERS[tier].label} — {SOURCE_TIERS[tier].description}
          </option>
        ))}
      </select>
    </div>
  );
}
