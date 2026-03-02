'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';

// ── FilterChip ────────────────────────────────────────────────────

export interface FilterChipProps {
  /** Display label for the chip. */
  label: string;
  /** Callback fired when the remove (×) button is clicked. */
  onRemove: () => void;
  /**
   * Tailwind colour classes applied to the chip.
   *
   * @example "bg-purple-50 text-purple-700 border-purple-200"
   */
  colorClass?: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
}

/**
 * Small pill showing an active filter with a remove button.
 *
 * @example
 * ```tsx
 * <FilterChip
 *   label="Colombo"
 *   onRemove={() => setCity('all')}
 *   colorClass="bg-purple-50 text-purple-700 border-purple-200"
 *   icon={<MapPin className="h-3 w-3 opacity-70" />}
 * />
 * ```
 */
export function FilterChip({
  label,
  onRemove,
  colorClass = 'bg-gray-100 text-gray-700 border-gray-200',
  icon,
}: FilterChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1
        rounded-full text-xs font-medium border
        ${colorClass}
        transition-all duration-150
      `}
    >
      {icon}
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="
          inline-flex items-center justify-center w-4 h-4 rounded-full
          hover:bg-black/10 transition-colors duration-100 shrink-0
        "
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ── FilterChipsBar ────────────────────────────────────────────────

/** Descriptor for a single active filter chip. */
export interface FilterChipDescriptor {
  /** Unique key for the chip (used as React key). */
  key: string;
  /** Display label. */
  label: string;
  /** Callback to remove / clear this specific filter. */
  onRemove: () => void;
  /** Tailwind colour classes. */
  colorClass?: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
}

export interface FilterChipsBarProps {
  /** Array of active filter descriptors. */
  chips: FilterChipDescriptor[];
  /** Callback fired when the "Clear all" button is clicked. */
  onClearAll?: () => void;
  /** Extra class names applied to the wrapper. */
  className?: string;
}

/**
 * Horizontal bar displaying active `<FilterChip>` components with an
 * optional "Clear all" button.
 *
 * Renders nothing when the `chips` array is empty.
 *
 * @example
 * ```tsx
 * <FilterChipsBar
 *   chips={[
 *     { key: 'state', label: 'Western', onRemove: () => setStateFilter('all'), colorClass: '…' },
 *   ]}
 *   onClearAll={handleClearAll}
 * />
 * ```
 */
export function FilterChipsBar({
  chips,
  onClearAll,
  className = '',
}: FilterChipsBarProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 pb-3.5 border-t border-gray-100 pt-3 ${className}`}
    >
      <div className="flex-1 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            onRemove={chip.onRemove}
            colorClass={chip.colorClass}
            icon={chip.icon}
          />
        ))}
      </div>

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="
            shrink-0 inline-flex items-center gap-1
            text-xs font-medium text-gray-400 hover:text-red-500
            transition-colors duration-150
          "
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  );
}

// ── SearchInput ───────────────────────────────────────────────────

export interface SearchInputProps {
  /** Current search value (controlled). */
  value: string;
  /** Callback fired with the new search value (after debounce). */
  onChange: (value: string) => void;
  /** Placeholder text. @default "Search…" */
  placeholder?: string;
  /** Debounce delay in ms. @default 300 */
  debounceMs?: number;
  /** Extra class names applied to the wrapper `<div>`. */
  className?: string;
}

/**
 * Debounced search input with a clear button.
 *
 * Maintains an internal value and notifies the parent after the debounce
 * delay expires, preventing excessive re-renders / API calls while the
 * user is typing.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Search bus stops…"
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [local, setLocal] = useState(value);

  // Flush debounced value to parent
  useEffect(() => {
    if (local === value) return;
    const timer = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(timer);
  }, [local, value, onChange, debounceMs]);

  // Sync inbound prop changes (e.g. external clear)
  useEffect(() => {
    if (value !== local) setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`relative flex-1 group ${className}`}>
      <Search
        className="
          absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4
          text-gray-400 group-focus-within:text-blue-500
          transition-colors duration-150 pointer-events-none
        "
      />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-8 py-2
          bg-gray-50 border border-gray-200 rounded-xl
          text-sm text-gray-800 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white
          transition-all duration-150
        "
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          className="
            absolute right-2.5 top-1/2 -translate-y-1/2
            inline-flex items-center justify-center w-4 h-4
            rounded-full bg-gray-300 hover:bg-gray-400
            text-gray-600 hover:text-gray-800
            transition-colors duration-100
          "
          aria-label="Clear search"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ── ResultCount ───────────────────────────────────────────────────

export interface ResultCountProps {
  /** Number of results currently visible (after filtering). */
  filtered: number;
  /** Total number of results (before filtering). */
  total: number;
  /**
   * Optional number of records loaded on the current page.
   *
   * When provided the indicator shows **`loaded / filtered`** instead of
   * the default **`filtered / total`** pattern, giving the user a clear
   * sense of how many items are currently rendered vs. how many match the
   * active search / filter criteria.
   *
   * @example
   * // 25 rows on screen, 60 matching the filter → "25 / 60 results"
   * <ResultCount loaded={25} filtered={60} total={100} />
   */
  loaded?: number;
  /** Singular label (e.g. "stop"). @default "result" */
  label?: string;
  /** Plural label. Derived from `label` + "s" when omitted. */
  labelPlural?: string;
  /** Show a loading spinner alongside the count. */
  loading?: boolean;
  /** Extra class names. */
  className?: string;
}

/**
 * Compact count indicator with an optional spinner.
 *
 * - When `loaded` is supplied → shows **`loaded / filtered results`**
 *   (e.g. "25 / 60 stops") — ideal for paginated, filtered views.
 * - Otherwise → shows **`filtered / total results`**
 *   (legacy / simpler use-case).
 *
 * @example
 * ```tsx
 * // Paginated + filtered
 * <ResultCount loaded={25} filtered={60} total={100} label="stop" loading={isLoading} />
 *
 * // Simple filtered
 * <ResultCount filtered={42} total={120} label="stop" loading={isLoading} />
 * ```
 */
export function ResultCount({
  filtered,
  total,
  loaded,
  label = 'result',
  labelPlural,
  loading = false,
  className = '',
}: ResultCountProps) {
  const plural = labelPlural ?? `${label}s`;
  // When `loaded` is provided, noun agrees with `filtered`; otherwise with `total`.
  const referenceCount = loaded !== undefined ? filtered : total;
  const noun = referenceCount === 1 ? label : plural;

  // Primary number shown on the left of the slash
  const primary = loaded !== undefined ? loaded : filtered;
  // Secondary number shown on the right of the slash
  const secondary = loaded !== undefined ? filtered : total;

  return (
    <div className={`shrink-0 flex items-center gap-2 ${className}`}>
      {loading && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
      )}
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
        <span className="font-semibold text-gray-800">
          {primary.toLocaleString()}
        </span>
        {' / '}
        <span className="font-semibold text-gray-800">
          {secondary.toLocaleString()}
        </span>
        {` ${noun}`}
      </span>
    </div>
  );
}

// ── SelectFilter ──────────────────────────────────────────────────

export interface SelectFilterOption {
  /** Option value. */
  value: string;
  /** Visible label. Falls back to `value` if omitted. */
  label?: string;
}

export interface SelectFilterProps {
  /** Currently selected value. */
  value: string;
  /** Callback fired when the selection changes. */
  onChange: (value: string) => void;
  /** Available options (an "All" option with `value="all"` is added automatically). */
  options: SelectFilterOption[];
  /** Label text for the "all" option. @default "All" */
  allLabel?: string;
  /** Optional leading icon rendered inside the select. */
  icon?: React.ReactNode;
  /**
   * Tailwind colour classes applied when an option other than "all" is
   * selected, giving visual feedback that a filter is active.
   *
   * @default "bg-purple-50 border-purple-300 text-purple-800"
   */
  activeColorClass?: string;
  /** Extra class names. */
  className?: string;
}

/**
 * Styled `<select>` dropdown for a single-value filter.
 *
 * @example
 * ```tsx
 * <SelectFilter
 *   value={stateFilter}
 *   onChange={setStateFilter}
 *   options={states.map(s => ({ value: s, label: s }))}
 *   allLabel="All States"
 *   icon={<MapPin className="h-3.5 w-3.5" />}
 * />
 * ```
 */
export function SelectFilter({
  value,
  onChange,
  options,
  allLabel = 'All',
  icon,
  activeColorClass = 'bg-purple-50 border-purple-300 text-purple-800',
  className = '',
}: SelectFilterProps) {
  const isActive = value !== 'all';

  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          appearance-none ${icon ? 'pl-7' : 'pl-3'} pr-7 py-1.5
          text-xs font-medium rounded-lg border
          focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400
          transition-all duration-150 cursor-pointer
          ${
            isActive
              ? activeColorClass
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
          }
        `}
      >
        <option value="all">{allLabel}</option>
        {options.map((opt, idx) => (
          // include index in key to guard against duplicate values coming from
          // server data; this prevents the React warning seen when two
          // options share the same `value`.
          <option key={`${opt.value}-${idx}`} value={opt.value}>
            {opt.label ?? opt.value}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── SegmentedControl ──────────────────────────────────────────────

/** Single segment option. */
export interface SegmentOption {
  /** Option value used for comparison. */
  value: string;
  /** Visible label. */
  label: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  /** Currently selected segment value. */
  value: string;
  /** Callback fired when a segment is clicked. */
  onChange: (value: string) => void;
  /** Available segments. */
  options: SegmentOption[];
  /** Extra class names. */
  className?: string;
}

/**
 * A pill-shaped segmented control (toggle).
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   value={accessibilityFilter}
 *   onChange={setAccessibilityFilter}
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'accessible', label: 'Accessible', icon: <CheckCircle2 className="h-3 w-3" /> },
 *     { value: 'non-accessible', label: 'Non-Accessible', icon: <XCircle className="h-3 w-3" /> },
 *   ]}
 * />
 * ```
 */
export function SegmentedControl({
  value,
  onChange,
  options,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={`flex items-center bg-gray-100 rounded-lg p-0.5 gap-0 ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              transition-all duration-150 whitespace-nowrap
              ${
                active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── SearchFilterBar ───────────────────────────────────────────────

export interface SearchFilterBarProps {
  /** Props forwarded to the inner `<SearchInput>`. */
  searchValue: string;
  /** Callback fired when the search value changes (debounced). */
  onSearchChange: (value: string) => void;
  /** Placeholder for the search input.  @default "Search…" */
  searchPlaceholder?: string;

  /** Total count (before filtering). */
  totalCount?: number;
  /** Filtered count (after filtering / search). */
  filteredCount?: number;
  /**
   * Number of records currently rendered on screen (current page).
   *
   * When provided the result indicator shows **`loadedCount / filteredCount`**
   * instead of the default `filteredCount / totalCount`, giving users a clear
   * view of how many items are visible vs. how many match their criteria.
   */
  loadedCount?: number;
  /** Singular noun for the result count label. @default "result" */
  resultLabel?: string;
  /** Show loading spinner in result count. */
  loading?: boolean;

  /**
   * Render prop / ReactNode for filter controls (dropdowns, segmented
   * controls, etc.) placed in a second row beneath the search input.
   */
  filters?: React.ReactNode;

  /**
   * Active filter chips shown in a third row.
   * Pass an array of `FilterChipDescriptor` objects.
   */
  activeChips?: FilterChipDescriptor[];
  /** Callback fired when "Clear all" is clicked in the chips bar. */
  onClearAllFilters?: () => void;

  /** Extra class names applied to the outer wrapper. */
  className?: string;
}

/**
 * Composable search + filter bar.
 *
 * Combines `<SearchInput>`, `<ResultCount>`, filter controls (via
 * `filters` render slot), and `<FilterChipsBar>` into a consistent,
 * card-styled container.
 *
 * @example
 * ```tsx
 * <SearchFilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Search bus stops…"
 *   totalCount={1000}
 *   filteredCount={42}
 *   resultLabel="stop"
 *   loading={isLoading}
 *   filters={
 *     <>
 *       <SelectFilter value={state} onChange={setState} options={stateOptions} allLabel="All States" />
 *       <SegmentedControl value={access} onChange={setAccess} options={accessOptions} />
 *     </>
 *   }
 *   activeChips={chips}
 *   onClearAllFilters={handleClearAll}
 * />
 * ```
 */
export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  totalCount,
  filteredCount,
  loadedCount,
  resultLabel = 'result',
  loading = false,
  filters,
  activeChips = [],
  onClearAllFilters,
  className = '',
}: SearchFilterBarProps) {
  // Determine whether to show the result count widget.
  // Requires at minimum filteredCount + totalCount; loadedCount is optional.
  const showResultCount = totalCount !== undefined && filteredCount !== undefined;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Row 1: Search + result count */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-0">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {showResultCount && (
          <ResultCount
            loaded={loadedCount}
            filtered={filteredCount!}
            total={totalCount!}
            label={resultLabel}
            loading={loading}
          />
        )}
      </div>

      {/* Row 2: Filter controls */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-2.5 pb-3.5">
          {filters}
        </div>
      )}

      {/* Row 3: Active filter chips */}
      <FilterChipsBar
        chips={activeChips}
        onClearAll={onClearAllFilters}
      />
    </div>
  );
}
