"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/table";
import { Checkbox } from "../../components/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { DataTablePagination } from "./data-table-pagination";
import type { ColumnDef, DataTableProps } from "./types";

const hideBelowMap: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<TData>({
  columns,
  data,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  selectedRows,
  onToggleRow,
  onToggleAll,
  getRowId,
  loading = false,
  emptyState,
  rowActions,
  onRowClick,
  bulkActions,
}: DataTableProps<TData>) {
  const selectable = !!onToggleRow;
  const allIds = data.map(getRowId);
  const allSelected =
    selectable && allIds.length > 0 && allIds.every((id) => selectedRows?.has(id));

  const totalCols =
    columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectable && selectedRows && selectedRows.size > 0 && bulkActions && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          {bulkActions}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => onToggleAll?.(allIds)}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.hideBelow && hideBelowMap[col.hideBelow],
                    col.width,
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.sortable && "cursor-pointer select-none"
                  )}
                  onClick={col.sortable ? () => onSort?.(col.id) : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable &&
                      (sortColumn === col.id ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                      ))}
                  </div>
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className="w-20 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="h-32 text-center">
                  {emptyState ?? (
                    <span className="text-muted-foreground">No results found</span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      selectedRows?.has(id) && "bg-muted/30",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows?.has(id)}
                          onCheckedChange={() => onToggleRow?.(id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => {
                      const value = col.accessorFn
                        ? col.accessorFn(row)
                        : col.accessorKey
                        ? (row[col.accessorKey] as unknown)
                        : undefined;
                      return (
                        <TableCell
                          key={col.id}
                          className={cn(
                            col.hideBelow && hideBelowMap[col.hideBelow],
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right"
                          )}
                        >
                          {col.cell
                            ? col.cell({ row, value })
                            : String(value ?? "")}
                        </TableCell>
                      );
                    })}
                    {rowActions && (
                      <TableCell
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {rowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
