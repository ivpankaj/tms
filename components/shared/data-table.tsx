"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "./empty-state";
import { Search, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  actions,
  filters,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display matching the current criteria.",
  emptyActionLabel,
  onEmptyAction,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          {onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
          {filters}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Surface */}
      <div className="rounded-xl border bg-card overflow-x-auto shadow-2xs">
        <Table className="min-w-[600px] md:min-w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <EmptyState
                    icon={Inbox}
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIdx) => {
                const rowKey = item._id || item.id || `row-${rowIdx}`;
                return (
                  <TableRow
                    key={rowKey}
                    onClick={() => onRowClick?.(item)}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell key={colIdx} className={col.className}>
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String((item as any)[col.accessorKey] ?? "")
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && data.length > 0 && totalPages > 1 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
          <div>
            Showing page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span> ({total} total)
          </div>
          <Pagination className="justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="h-8 px-2"
                >
                  Previous
                </Button>
              </PaginationItem>

              <PaginationItem>
                <span className="px-3 py-1 font-medium">{page}</span>
              </PaginationItem>

              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="h-8 px-2"
                >
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
