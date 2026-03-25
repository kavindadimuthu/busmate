import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "@busmate/ui/patterns/data-table";
import type { ColumnDef } from "@busmate/ui/patterns/data-table";
import { StatusBadge } from "@busmate/ui/patterns/status-badge";
import { Badge } from "../../components/badge";

interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  status: string;
  stops: number;
  distance: string;
}

const columns: ColumnDef<BusRoute>[] = [
  { id: "routeNumber", header: "Route #", accessorKey: "routeNumber", sortable: true, width: "w-24" },
  { id: "name", header: "Route Name", accessorKey: "name", sortable: true },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ value }) => <StatusBadge status={value as string} />,
  },
  { id: "stops", header: "Stops", accessorKey: "stops", sortable: true, align: "center" },
  { id: "distance", header: "Distance", accessorKey: "distance", align: "right" },
];

const sampleData: BusRoute[] = [
  { id: "1", routeNumber: "138", name: "Colombo Fort → Kaduwela", status: "active", stops: 12, distance: "18.5 km" },
  { id: "2", routeNumber: "176", name: "Colombo Fort → Maharagama", status: "active", stops: 15, distance: "22.3 km" },
  { id: "3", routeNumber: "177", name: "Colombo Fort → Piliyandala", status: "inactive", stops: 10, distance: "16.8 km" },
  { id: "4", routeNumber: "1", name: "Colombo → Kandy (Express)", status: "active", stops: 5, distance: "115 km" },
  { id: "5", routeNumber: "47", name: "Kandy → Dambulla", status: "pending", stops: 8, distance: "72 km" },
  { id: "6", routeNumber: "99", name: "Galle → Matara", status: "active", stops: 9, distance: "42 km" },
  { id: "7", routeNumber: "255", name: "Negombo → Colombo", status: "draft", stops: 7, distance: "38 km" },
  { id: "8", routeNumber: "120", name: "Kandy → Nuwara Eliya", status: "completed", stops: 11, distance: "80 km" },
];

const meta: Meta<typeof DataTable> = {
  title: "Patterns/DataTable",
  component: DataTable,
};

export default meta;

export const Default: StoryObj = {
  render: function DataTableStory() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    return (
      <DataTable
        columns={columns}
        data={sampleData.slice((page - 1) * pageSize, page * pageSize)}
        totalItems={sampleData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        getRowId={(row) => row.id}
      />
    );
  },
};

export const WithSelection: StoryObj = {
  render: function DataTableSelectionStory() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [selected, setSelected] = useState(new Set<string>());

    return (
      <DataTable
        columns={columns}
        data={sampleData.slice((page - 1) * pageSize, page * pageSize)}
        totalItems={sampleData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        getRowId={(row) => row.id}
        selectedRows={selected}
        onToggleRow={(id) => {
          const next = new Set(selected);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setSelected(next);
        }}
        onToggleAll={(ids) => {
          if (selected.size === ids.length) setSelected(new Set());
          else setSelected(new Set(ids));
        }}
        bulkActions={
          <Badge variant="secondary">{selected.size} selected</Badge>
        }
      />
    );
  },
};

export const WithSorting: StoryObj = {
  render: function DataTableSortStory() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortCol, setSortCol] = useState<string | null>("routeNumber");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const sorted = [...sampleData].sort((a, b) => {
      if (!sortCol) return 0;
      const aVal = a[sortCol as keyof BusRoute];
      const bVal = b[sortCol as keyof BusRoute];
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return (
      <DataTable
        columns={columns}
        data={sorted.slice((page - 1) * pageSize, page * pageSize)}
        totalItems={sorted.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        getRowId={(row) => row.id}
        sortColumn={sortCol}
        sortDirection={sortDir}
        onSort={(col) => {
          if (col === sortCol) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          } else {
            setSortCol(col);
            setSortDir("asc");
          }
        }}
      />
    );
  },
};

export const Loading: StoryObj = {
  render: () => (
    <DataTable
      columns={columns}
      data={[]}
      totalItems={0}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      getRowId={(row) => row.id}
      loading
    />
  ),
};
