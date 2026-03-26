"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDataTable, useDialog } from "@busmate/ui";
import {
  getStaffMembers,
  getStaffStatistics,
  getStaffFilterOptions,
  type StaffMember,
  type StaffType,
} from "@/data/mot/staff";
import type { StaffFilters } from "./staff-filter-bar";

// ── Types ─────────────────────────────────────────────────────────

export type TabValue = "all" | StaffType;

const INITIAL_FILTERS: StaffFilters = {
  status: "__all__",
  province: "__all__",
};

// ── Hook ──────────────────────────────────────────────────────────

export function useStaffManagement() {
  const router = useRouter();

  const allStaff = useMemo(() => getStaffMembers(), []);
  const statistics = useMemo(() => getStaffStatistics(), []);
  const filterOpts = useMemo(() => getStaffFilterOptions(), []);

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<StaffFilters>({
      initialPageSize: 10,
      initialSort: { column: "fullName", direction: "asc" },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<StaffMember>();

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Tab counts ──────────────────────────────────────────────────

  const tabCounts = useMemo(
    () => ({
      all: allStaff.length,
      timekeeper: allStaff.filter((s) => s.staffType === "timekeeper").length,
      inspector: allStaff.filter((s) => s.staffType === "inspector").length,
    }),
    [allStaff],
  );

  // ── Stats ───────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      totalStaff: { count: statistics.totalStaff },
      activeStaff: { count: statistics.activeStaff },
      inactiveStaff: { count: statistics.inactiveStaff },
      totalTimekeepers: { count: statistics.totalTimekeepers },
      totalInspectors: { count: statistics.totalInspectors },
      provincesCount: { count: statistics.provincesCount },
    }),
    [statistics],
  );

  // ── Filter + sort + paginate (client-side) ──────────────────────

  const filteredStaff = useMemo(() => {
    let list = allStaff;

    // Tab filter
    if (activeTab !== "all") {
      list = list.filter((s) => s.staffType === activeTab);
    }

    // Status filter
    if (state.filters.status && state.filters.status !== "__all__") {
      list = list.filter((s) => s.status === state.filters.status);
    }

    // Province filter
    if (state.filters.province && state.filters.province !== "__all__") {
      list = list.filter((s) => s.province === state.filters.province);
    }

    // Search
    if (state.searchQuery) {
      const term = state.searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.nic.toLowerCase().includes(term) ||
          s.phone.toLowerCase().includes(term) ||
          s.assignedLocation.toLowerCase().includes(term),
      );
    }

    // Sort
    const sortCol = state.sortColumn || "fullName";
    const sortDir = state.sortDirection || "asc";
    list = [...list].sort((a, b) => {
      const aVal = (a as any)[sortCol] || "";
      const bVal = (b as any)[sortCol] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [allStaff, activeTab, state.filters, state.searchQuery, state.sortColumn, state.sortDirection]);

  const totalItems = filteredStaff.length;

  const paginatedStaff = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    return filteredStaff.slice(start, start + state.pageSize);
  }, [filteredStaff, state.page, state.pageSize]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleTabChange = useCallback(
    (tab: TabValue) => {
      setActiveTab(tab);
      setPage(1);
    },
    [setPage],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.data) return;
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsDeleting(false);
    deleteDialog.close();
  }, [deleteDialog]);

  const handleExportAll = useCallback(() => {
    const dataToExport = filteredStaff.map((s) => ({
      ID: s.id,
      "Full Name": s.fullName,
      Phone: s.phone,
      Email: s.email,
      NIC: s.nic,
      "Staff Type": s.staffType,
      Province: s.province,
      "Assigned Location": s.assignedLocation,
      Status: s.status,
      "Created At": s.createdAt,
    }));

    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === "string" && value.includes(",")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [filteredStaff]);

  const handleView = useCallback(
    (member: any) => router.push(`/mot/staff-management/${member.id}`),
    [router],
  );

  const handleEdit = useCallback(
    (member: any) => router.push(`/mot/staff-management/${member.id}/edit`),
    [router],
  );

  // ── Active filter count ───────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filters.status && state.filters.status !== "__all__") count++;
    if (state.filters.province && state.filters.province !== "__all__") count++;
    return count;
  }, [state.filters]);

  return {
    // Table data
    paginatedStaff,
    totalItems,
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,

    // Stats / filters
    stats,
    filterOptions: { statuses: filterOpts.statuses, provinces: filterOpts.provinces },
    activeFilterCount,

    // Tabs
    activeTab,
    handleTabChange,
    tabCounts,

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
