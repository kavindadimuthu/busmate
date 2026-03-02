'use client';

import { SearchFilterBar, SelectFilter, FilterChipDescriptor } from '@/components/shared/SearchFilterBar';

interface StaffFilterOptions {
    statuses: string[];
    provinces: string[];
    locations: string[];
}

interface StaffAdvancedFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    provinceFilter: string;
    setProvinceFilter: (value: string) => void;
    filterOptions: StaffFilterOptions;
    loading?: boolean;
    totalCount?: number;
    filteredCount?: number;
    onSearch?: (term: string) => void;
    onClearAll?: () => void;
}

export default function StaffAdvancedFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    provinceFilter,
    setProvinceFilter,
    filterOptions,
    loading,
    totalCount = 0,
    filteredCount = 0,
    onClearAll,
}: StaffAdvancedFiltersProps) {
    const activeChips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
        activeChips.push({
            key: 'status',
            label: `Status: ${statusFilter}`,
            onRemove: () => setStatusFilter('all'),
        });
    }
    if (provinceFilter !== 'all') {
        activeChips.push({
            key: 'province',
            label: `Province: ${provinceFilter}`,
            onRemove: () => setProvinceFilter('all'),
        });
    }

    return (
        <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search staff by name, email, NIC..."
            totalCount={totalCount}
            filteredCount={filteredCount}
            resultLabel="staff members"
            loading={loading}
            activeChips={activeChips}
            onClearAllFilters={onClearAll}
            filters={
                <>
                    <SelectFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={filterOptions.statuses.map((s) => ({
                            value: s,
                            label: s.charAt(0).toUpperCase() + s.slice(1),
                        }))}
                        allLabel="All Statuses"
                    />
                    <SelectFilter
                        value={provinceFilter}
                        onChange={setProvinceFilter}
                        options={filterOptions.provinces.map((p) => ({ value: p, label: p }))}
                        allLabel="All Provinces"
                    />
                </>
            }
        />
    );
}
