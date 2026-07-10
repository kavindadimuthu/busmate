'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';

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
    const activeFilterCount = [statusFilter, provinceFilter].filter(v => v !== '__all__').length;

    return (
        <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search staff by name, email, NIC..."
            activeFilterCount={activeFilterCount}
            onClearAll={onClearAll}
        >
            <FilterSelect
                label="Statuses"
                value={statusFilter}
                onChange={setStatusFilter}
                options={filterOptions.statuses.map((s) => ({
                    value: s,
                    label: s.charAt(0).toUpperCase() + s.slice(1),
                }))}
            />
            <FilterSelect
                label="Provinces"
                value={provinceFilter}
                onChange={setProvinceFilter}
                options={filterOptions.provinces.map((p) => ({ value: p, label: p }))}
            />
        </FilterBar>
    );
}
