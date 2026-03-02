'use client';

import { SearchFilterBar, SelectFilter, FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
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
    totalCount,
    filteredCount,
    onClearAll,
    loading,
}: PolicyFiltersProps) {
    const activeChips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
        activeChips.push({
            key: 'status',
            label: `Status: ${statusFilter}`,
            onRemove: () => onStatusChange('all'),
        });
    }
    if (typeFilter !== 'all') {
        activeChips.push({
            key: 'type',
            label: `Type: ${typeFilter}`,
            onRemove: () => onTypeChange('all'),
        });
    }
    if (departmentFilter !== 'all') {
        activeChips.push({
            key: 'department',
            label: `Dept: ${departmentFilter}`,
            onRemove: () => onDepartmentChange('all'),
        });
    }
    if (priorityFilter !== 'all') {
        activeChips.push({
            key: 'priority',
            label: `Priority: ${priorityFilter}`,
            onRemove: () => onPriorityChange('all'),
        });
    }

    const statusOptions = filterOptions.statuses.map((s) => ({ value: s, label: s }));
    const typeOptions = filterOptions.types.map((t) => ({ value: t, label: t }));
    const departmentOptions = filterOptions.departments.map((d) => ({ value: d, label: d }));
    const priorityOptions = filterOptions.priorities.map((p) => ({ value: p, label: p }));

    return (
        <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search policies by title, type, author..."
            totalCount={totalCount}
            filteredCount={filteredCount}
            resultLabel="policies"
            loading={loading}
            activeChips={activeChips}
            onClearAllFilters={onClearAll}
            filters={
                <>
                    <SelectFilter
                        value={statusFilter}
                        onChange={onStatusChange}
                        options={statusOptions}
                        allLabel="All Status"
                    />
                    <SelectFilter
                        value={typeFilter}
                        onChange={onTypeChange}
                        options={typeOptions}
                        allLabel="All Types"
                    />
                    <SelectFilter
                        value={departmentFilter}
                        onChange={onDepartmentChange}
                        options={departmentOptions}
                        allLabel="All Departments"
                    />
                    <SelectFilter
                        value={priorityFilter}
                        onChange={onPriorityChange}
                        options={priorityOptions}
                        allLabel="All Priorities"
                    />
                </>
            }
        />
    );
}
