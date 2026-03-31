'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';
import { PolicyFilterOptions } from '@/data/mot/policies';

interface PolicyFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    typeFilter: string;
    onTypeChange: (value: string) => void;
    departmentFilter: string;
    onDepartmentChange: (value: string) => void;
    priorityFilter: string;
    onPriorityChange: (value: string) => void;
    filterOptions: PolicyFilterOptions;
    totalCount: number;
    filteredCount: number;
    onClearAll: () => void;
    loading?: boolean;
}

export function PolicyFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    typeFilter,
    onTypeChange,
    departmentFilter,
    onDepartmentChange,
    priorityFilter,
    onPriorityChange,
    filterOptions,
    onClearAll,
}: PolicyFiltersProps) {
    const activeFilterCount = [
        statusFilter !== '__all__',
        typeFilter !== '__all__',
        departmentFilter !== '__all__',
        priorityFilter !== '__all__',
    ].filter(Boolean).length;

    const statusOptions = filterOptions.statuses.map((s) => ({ value: s, label: s }));
    const typeOptions = filterOptions.types.map((t) => ({ value: t, label: t }));
    const departmentOptions = filterOptions.departments.map((d) => ({ value: d, label: d }));
    const priorityOptions = filterOptions.priorities.map((p) => ({ value: p, label: p }));

    return (
        <FilterBar
            searchValue={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search policies by title, type, author..."
            activeFilterCount={activeFilterCount}
            onClearAll={onClearAll}
        >
            <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={onStatusChange}
                options={statusOptions}
            />
            <FilterSelect
                label="Types"
                value={typeFilter}
                onChange={onTypeChange}
                options={typeOptions}
            />
            <FilterSelect
                label="Departments"
                value={departmentFilter}
                onChange={onDepartmentChange}
                options={departmentOptions}
            />
            <FilterSelect
                label="Priorities"
                value={priorityFilter}
                onChange={onPriorityChange}
                options={priorityOptions}
            />
        </FilterBar>
    );
}
