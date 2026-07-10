'use client';

import * as React from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

export type TicketBookingStatus = 'CONFIRMED' | 'BOARDED' | 'PENDING_PAYMENT' | 'PAYMENT_FAILED' | 'CANCELLED';
export type TicketIssueMethod = 'CONDUCTOR' | 'ONLINE';

export interface TicketFilters {
  bookingStatus: TicketBookingStatus | '__all__';
  issueMethod: TicketIssueMethod | '__all__';
  fromDate: string;
  toDate: string;
}

interface TicketFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: TicketFilters;
  onFiltersChange: (filters: Partial<TicketFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

const STATUS_OPTIONS: { value: TicketBookingStatus; label: string }[] = [
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'BOARDED', label: 'Boarded' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const METHOD_OPTIONS: { value: TicketIssueMethod; label: string }[] = [
  { value: 'CONDUCTOR', label: 'Cash (Conductor)' },
  { value: 'ONLINE', label: 'Online' },
];

export function TicketFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount = 0,
}: TicketFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by passenger, seat, bus, or trip..."
      activeFilterCount={activeFilterCount}
      onClearAll={activeFilterCount > 0 ? onClearAll : undefined}
    >
      <FilterSelect
        label="Status"
        value={filters.bookingStatus === '__all__' ? '__all__' : filters.bookingStatus}
        onChange={(value) => onFiltersChange({ bookingStatus: value as TicketBookingStatus | '__all__' })}
        options={STATUS_OPTIONS}
        placeholder="All Statuses"
        className="w-44"
      />
      <FilterSelect
        label="Payment Method"
        value={filters.issueMethod === '__all__' ? '__all__' : filters.issueMethod}
        onChange={(value) => onFiltersChange({ issueMethod: value as TicketIssueMethod | '__all__' })}
        options={METHOD_OPTIONS}
        placeholder="All Methods"
        className="w-40"
      />
      <input
        type="date"
        value={filters.fromDate}
        onChange={(e) => onFiltersChange({ fromDate: e.target.value })}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        title="From Date"
      />
      <input
        type="date"
        value={filters.toDate}
        onChange={(e) => onFiltersChange({ toDate: e.target.value })}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        title="To Date"
      />
    </FilterBar>
  );
}
