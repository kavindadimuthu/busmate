/**
 * @module shared
 *
 * Barrel export for all reusable base components.
 *
 * Import individual components or types via this module:
 *
 * ```ts
 * import {
 *   StatsCard,
 *   StatsCardsContainer,
 *   ActionButton,
 *   ActionButtonsContainer,
 *   SearchFilterBar,
 *   SwitchableTabs,
 *   DataTable,
 *   DataPagination,
 * } from '@/components/shared/base';
 * ```
 */

// ── Statistics cards ──────────────────────────────────────────────

export {
  Sparkline,
  TrendIcon,
  StatsCard,
  StatsCardSkeleton,
} from './StatsCard';

export type {
  TrendDirection,
  StatsCardColor,
  StatsCardMetric,
} from './StatsCard';

export { StatsCardsContainer } from './StatsCardsContainer';
export type { StatsCardsContainerProps } from './StatsCardsContainer';

// ── Action buttons ────────────────────────────────────────────────

export {
  ActionButton,
  OverflowMenu,
  ActionButtonsContainer,
} from './ActionButton';

export type {
  ActionButtonVariant,
  ActionButtonProps,
  OverflowMenuItem,
  ActionButtonsContainerProps,
} from './ActionButton';

// ── Search, filters & chips ───────────────────────────────────────

export {
  FilterChip,
  FilterChipsBar,
  SearchInput,
  ResultCount,
  SelectFilter,
  SegmentedControl,
  SearchFilterBar,
} from './SearchFilterBar';

export type {
  FilterChipProps,
  FilterChipDescriptor,
  FilterChipsBarProps,
  SearchInputProps,
  ResultCountProps,
  SelectFilterOption,
  SelectFilterProps,
  SegmentOption,
  SegmentedControlProps,
  SearchFilterBarProps,
} from './SearchFilterBar';

// ── Switchable tabs ───────────────────────────────────────────────

export { SwitchableTabs } from './SwitchableTabs';
export type { TabItem, SwitchableTabsProps } from './SwitchableTabs';

// ── Data table ────────────────────────────────────────────────────

export { DataTable } from './DataTable';
export type {
  DataTableColumn,
  SortState,
  DataTableProps,
} from './DataTable';

// ── Pagination ────────────────────────────────────────────────────

export { DataPagination } from './DataPagination';
export type { DataPaginationProps } from './DataPagination';
