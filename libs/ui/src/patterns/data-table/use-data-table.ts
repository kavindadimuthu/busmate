import { useState, useCallback, useMemo } from "react";

export interface DataTableState<TFilter = Record<string, unknown>> {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filters: TFilter;
  selectedRows: Set<string>;
  searchQuery: string;
}

export interface UseDataTableOptions<TFilter = Record<string, unknown>> {
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: { column: string; direction: "asc" | "desc" };
  initialFilters?: TFilter;
}

export function useDataTable<TFilter = Record<string, unknown>>(
  options: UseDataTableOptions<TFilter> = {}
) {
  const [state, setState] = useState<DataTableState<TFilter>>({
    page: options.initialPage ?? 1,
    pageSize: options.initialPageSize ?? 10,
    sortColumn: options.initialSort?.column ?? null,
    sortDirection: options.initialSort?.direction ?? "asc",
    filters: options.initialFilters ?? ({} as TFilter),
    selectedRows: new Set(),
    searchQuery: "",
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setSort = useCallback((column: string) => {
    setState((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const setFilters = useCallback((filters: Partial<TFilter>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {} as TFilter,
      searchQuery: "",
      page: 1,
    }));
  }, []);

  const setSearch = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query, page: 1 }));
  }, []);

  const toggleRow = useCallback((id: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedRows);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selectedRows: next };
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setState((prev) => {
      const allSelected = ids.every((id) => prev.selectedRows.has(id));
      return {
        ...prev,
        selectedRows: allSelected ? new Set() : new Set(ids),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRows: new Set() }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      Object.values(state.filters as Record<string, unknown>).some(
        (v) => v !== undefined && v !== null && v !== ""
      ) || state.searchQuery !== ""
    );
  }, [state.filters, state.searchQuery]);

  return {
    state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    clearFilters,
    setSearch,
    toggleRow,
    toggleAll,
    clearSelection,
    hasActiveFilters,
  };
}
