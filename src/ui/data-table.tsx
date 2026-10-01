import {
  tableFeatures,
  useTable,
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from './table';
import { Input } from './forms';
import { Pagination } from './navigation';
import { Button, EmptyState, Spinner } from './primitives';
import type { HTMLAttributes } from 'react';
import { StyleProvider, useStyles, type PlainStyleProps } from './styling';

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
});
export type DataTableColumn<T extends RowData> = ColumnDef<typeof features, T>;
export interface DataTableProps<T extends RowData>
  extends HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyTitle?: string;
  caption?: string;
  className?: string;
  getRowId?: (row: T) => string;
}
export function DataTable<T extends RowData>({
  data,
  columns,
  pageSize = 5,
  searchable = true,
  searchPlaceholder = 'Search records...',
  loading,
  emptyTitle = 'No results found',
  caption = 'Records',
  className,
  getRowId,
  unstyled,
  ...props
}: DataTableProps<T>) {
  const styles = useStyles();
  const table = useTable({
    data,
    columns,
    features,
    getRowId,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 5,
      },
    },
  });
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(1, table.getAllLeafColumns().length);
  return (
    <StyleProvider unstyled={unstyled}>
      <div {...styles('data-table.root', 'space-y-4', className, unstyled)} {...props}>
        {searchable && (
          <div {...styles('data-table.search', 'relative max-w-sm', undefined, unstyled)}>
            <Search
              {...styles(
                'data-table.search-icon',
                'absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground',
                undefined,
                unstyled,
              )}
              aria-hidden="true"
            />
            <Input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={String(table.state.globalFilter ?? '')}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value);
                table.setPageIndex(0);
              }}
              {...styles('data-table.search-input', 'ps-9', undefined, unstyled)}
            />
          </div>
        )}
        <div
          {...styles(
            'data-table.table-wrapper',
            'overflow-hidden rounded-ui border',
            undefined,
            unstyled,
          )}
        >
          <Table aria-label={caption} aria-busy={loading || undefined}>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                            ? 'descending'
                            : header.column.getCanSort()
                              ? 'none'
                              : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={header.column.getToggleSortingHandler()}
                          {...styles(
                            'data-table.sort',
                            '-ms-3 text-xs text-muted-foreground',
                            undefined,
                            unstyled,
                          )}
                        >
                          <table.FlexRender header={header} />
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp aria-hidden="true" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown aria-hidden="true" />
                          ) : (
                            <ArrowUpDown className="size-3!" aria-hidden="true" />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <div
                      {...styles(
                        'data-table.loading',
                        'flex justify-center py-12',
                        undefined,
                        unstyled,
                      )}
                    >
                      <Spinner label="Loading records" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <EmptyState
                      title={emptyTitle}
                      description="Try another search or clear your filters."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div
          {...styles(
            'data-table.footer',
            'flex flex-wrap items-center justify-between gap-3',
            undefined,
            unstyled,
          )}
        >
          <span
            {...styles('data-table.status', 'text-xs text-muted-foreground', undefined, unstyled)}
            role="status"
          >
            {table.getFilteredRowModel().rows.length} record
            {table.getFilteredRowModel().rows.length !== 1 && 's'}
          </span>
          <Pagination
            page={table.state.pagination.pageIndex + 1}
            pageCount={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      </div>
    </StyleProvider>
  );
}
