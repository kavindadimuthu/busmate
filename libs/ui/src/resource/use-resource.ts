"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDataTable } from "../patterns/data-table";
import { useDialog } from "../patterns/dialogs";
import type { ResourceConfig, ResourceController, StatItem } from "./types";

/**
 * Data-orchestration controller for a resource: pagination/sort/search/filter
 * state, list/stats/filterOptions loading, delete flow, and export — all
 * driven by a single ResourceConfig instead of a hand-written per-entity hook.
 */
export function useResource<TRow, TFilters extends Record<string, any>>(
  config: ResourceConfig<TRow, TFilters>
): ResourceController<TRow, TFilters> {
  const { state, setPage, setPageSize, setSort, setFilters, clearFilters, setSearch } =
    useDataTable<TFilters>({
      initialPageSize: 10,
      initialSort: config.initialSort,
      initialFilters: config.initialFilters ?? ({} as TFilters),
    });

  const deleteDialog = useDialog<TRow>();

  const [rows, setRows] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, unknown>>({});

  const loadStats = useCallback(() => {
    if (!config.api.stats) return;
    config.api
      .stats()
      .then((raw) => setStats(config.mapStats ? config.mapStats(raw) : []))
      .catch(() => {
        /* stats are non-critical; fail silently */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config.api.filterOptions) {
      config.api
        .filterOptions()
        .then((raw) =>
          setFilterOptions(config.mapFilterOptions ? config.mapFilterOptions(raw) : (raw as Record<string, unknown>) ?? {})
        )
        .catch(() => {
          /* filter options are non-critical; fail silently */
        });
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtersKey = JSON.stringify(state.filters);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const page = await config.api.list({
        page: state.page,
        pageSize: state.pageSize,
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        search: state.searchQuery,
        filters: state.filters,
      });
      setRows(page.content ?? []);
      setTotal(page.totalElements ?? 0);
    } catch {
      toast.error(config.messages?.loadError ?? `Failed to load ${config.title.toLowerCase()}`);
      setRows([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.pageSize, state.sortColumn, state.sortDirection, state.searchQuery, filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteConfirm = useCallback(async () => {
    const row = deleteDialog.data;
    if (!row || !config.api.remove) return;
    try {
      setIsDeleting(true);
      await config.api.remove(row);
      toast.success(config.messages?.deleteSuccess?.(row) ?? `${config.title} deleted`);
      deleteDialog.close();
      load();
      loadStats();
    } catch {
      toast.error(config.messages?.deleteError ?? "Delete failed");
    } finally {
      setIsDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDialog.data, load, loadStats]);

  const handleExportAll = config.api.exportAll
    ? async () => {
        try {
          setIsExporting(true);
          await config.api.exportAll!();
        } catch {
          toast.error(config.messages?.exportError ?? "Export failed");
        } finally {
          setIsExporting(false);
        }
      }
    : undefined;

  const activeFilterCount = useMemo(() => {
    return Object.values(state.filters as Record<string, unknown>).filter(
      (v) => v !== undefined && v !== null && v !== "" && v !== "__all__"
    ).length;
  }, [state.filters]);

  return {
    rows,
    total,
    isLoading,
    state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    clearFilters,
    setSearch,
    stats,
    filterOptions,
    activeFilterCount,
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    isExporting,
    handleExportAll,
    refetch: load,
  };
}
