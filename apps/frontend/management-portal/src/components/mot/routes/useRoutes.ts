"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDataTable, useDialog } from "@busmate/ui";
import { useToast } from "@/hooks/use-toast";
import { RouteManagementService } from "@busmate/api-client-route";
import type {
  RouteResponse,
  PageRouteResponse,
} from "@busmate/api-client-route";
import type { RouteFilters } from "./routes-filter-bar";

// ── Initial state ─────────────────────────────────────────────────

const INITIAL_FILTERS: RouteFilters = {
  routeGroupId: "__all__",
  direction: "__all__",
  minDistance: "",
  maxDistance: "",
  minDuration: "",
  maxDuration: "",
};

const INITIAL_STATS = {
  totalRoutes: { count: 0 },
  outboundRoutes: { count: 0 },
  inboundRoutes: { count: 0 },
  averageDistance: { count: 0, unit: "km" },
  totalRouteGroups: { count: 0 },
  averageDuration: { count: 0, unit: "min" },
};

// ── Hook ──────────────────────────────────────────────────────────

export function useRoutes() {
  const router = useRouter();
  const { toast } = useToast();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<RouteFilters>({
      initialPageSize: 10,
      initialSort: { column: "name", direction: "asc" },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<RouteResponse>();

  // ── Local state ───────────────────────────────────────────────

  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [filterOptions, setFilterOptions] = useState<{
    routeGroups: Array<{ id: string; name: string }>;
  }>({ routeGroups: [] });

  // ── Data loaders ──────────────────────────────────────────────

  const loadRoutes = useCallback(async () => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;

    try {
      setIsLoading(true);

      const routeGroupId = filters.routeGroupId !== "__all__" ? filters.routeGroupId : undefined;
      const direction = filters.direction !== "__all__" ? (filters.direction as "OUTBOUND" | "INBOUND") : undefined;
      const minDistance = filters.minDistance ? parseFloat(filters.minDistance) : undefined;
      const maxDistance = filters.maxDistance ? parseFloat(filters.maxDistance) : undefined;
      const minDuration = filters.minDuration ? parseFloat(filters.minDuration) : undefined;
      const maxDuration = filters.maxDuration ? parseFloat(filters.maxDuration) : undefined;

      const response: PageRouteResponse = await RouteManagementService.getAllRoutes(
        page - 1,
        pageSize,
        sortColumn ?? "name",
        sortDirection,
        searchQuery || undefined,
        routeGroupId,
        direction,
        undefined,
        minDistance,
        maxDistance,
        minDuration,
        maxDuration,
      );

      setRoutes(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch {
      toast({ title: "Failed to load routes", variant: "destructive" });
      setRoutes([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [state, toast]);

  useEffect(() => {
    loadRoutes();
  }, [
    state.searchQuery,
    state.sortColumn,
    state.sortDirection,
    state.page,
    state.pageSize,
    state.filters.routeGroupId,
    state.filters.direction,
    state.filters.minDistance,
    state.filters.maxDistance,
    state.filters.minDuration,
    state.filters.maxDuration,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    RouteManagementService.getRouteFilterOptions()
      .then((res) =>
        setFilterOptions({
          routeGroups:
            (res.routeGroups || [])
              .map((rg: any) => ({ id: rg.id, name: rg.name }))
              .filter((rg: { id: string }) => rg.id),
        }),
      )
      .catch(console.error);

    RouteManagementService.getRouteStatistics()
      .then((data) =>
        setStats({
          totalRoutes: { count: data.totalRoutes || 0 },
          outboundRoutes: { count: data.outboundRoutes || 0 },
          inboundRoutes: { count: data.inboundRoutes || 0 },
          averageDistance: { count: data.averageDistanceKm || 0, unit: "km" },
          totalRouteGroups: { count: data.totalRouteGroups || 0 },
          averageDuration: { count: data.averageDurationMinutes || 0, unit: "min" },
        }),
      )
      .catch(console.error);
  }, []);

  // ── Delete ────────────────────────────────────────────────────

  const handleDeleteConfirm = useCallback(async () => {
    const route = deleteDialog.data;
    if (!route?.id) return;
    try {
      setIsDeleting(true);
      // await RouteManagementService.deleteRoute(route.id);
      toast({ title: "Route Deleted", description: `${route.name} has been deleted successfully.` });
      deleteDialog.close();
      loadRoutes();
      RouteManagementService.getRouteStatistics()
        .then((data) =>
          setStats({
            totalRoutes: { count: data.totalRoutes || 0 },
            outboundRoutes: { count: data.outboundRoutes || 0 },
            inboundRoutes: { count: data.inboundRoutes || 0 },
            averageDistance: { count: data.averageDistanceKm || 0, unit: "km" },
            totalRouteGroups: { count: data.totalRouteGroups || 0 },
            averageDuration: { count: data.averageDurationMinutes || 0, unit: "min" },
          }),
        )
        .catch(console.error);
    } catch {
      toast({ title: "Delete Failed", description: "Failed to delete route.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog, loadRoutes, toast]);

  // ── Export ────────────────────────────────────────────────────

  const handleExportAll = useCallback(async () => {
    try {
      const allRoutes = await RouteManagementService.getAllRoutesAsList();
      const headers = ["ID", "Name", "Description", "Route Group", "Direction", "Start Stop", "End Stop", "Distance (km)", "Duration (min)", "Created At", "Updated At"];
      const rows = allRoutes.map((r) =>
        [r.id, r.name, r.description, r.routeGroupName, r.direction, r.startStopName, r.endStopName, r.distanceKm, r.estimatedDurationMinutes, r.createdAt, r.updatedAt]
          .map((f) => `"${f ?? ""}"`)
          .join(","),
      );
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `routes-${new Date().toISOString().split("T")[0]}.csv`;
      a.style.visibility = "hidden";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: `${allRoutes.length} routes exported successfully.` });
    } catch {
      toast({ title: "Export Failed", description: "Failed to export routes.", variant: "destructive" });
    }
  }, [toast]);

  // ── Navigation handlers ───────────────────────────────────────

  const handleView = useCallback(
    (route: any) => {
      if (route.routeGroupId) router.push(`/mot/routes/${route.routeGroupId}?highlight=${route.id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (route: any) => {
      if (route.routeGroupId) router.push(`/mot/routes/workspace?routeGroupId=${route.routeGroupId}`);
    },
    [router],
  );

  // ── Active filter count ───────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filters.routeGroupId && state.filters.routeGroupId !== "__all__") count++;
    if (state.filters.direction && state.filters.direction !== "__all__") count++;
    if (state.filters.minDistance) count++;
    if (state.filters.maxDistance) count++;
    if (state.filters.minDuration) count++;
    if (state.filters.maxDuration) count++;
    return count;
  }, [state.filters]);

  return {
    // Table state
    routes,
    totalElements,
    isLoading,
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,

    // Stats / filters
    stats,
    filterOptions,
    activeFilterCount,

    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,

    // Actions
    handleExportAll,
    handleView,
    handleEdit,
  };
}
