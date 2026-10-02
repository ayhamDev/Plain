import * as React from 'react';
import { type RowData } from '@tanstack/react-table';
import { useDataTable, type DataTableColumn, type DataTableState } from './data-table';
import { emptyTableQuery, type DataTableQuery, type DataTableFilterField } from './table-filter';

export interface DataTableRequest {
  pagination: DataTableState['pagination'];
  sorting: DataTableState['sorting'];
  query: DataTableQuery;
}
export interface DataTableResponse<T> {
  data: T[];
  rowCount: number;
  filterFields?: readonly DataTableFilterField<T>[];
}
export interface RemoteDataTableOptions<T extends RowData> {
  columns: DataTableColumn<T>[];
  load: (request: DataTableRequest, signal: AbortSignal) => Promise<DataTableResponse<T>>;
  initialRequest?: Partial<DataTableRequest>;
  initialData?: DataTableResponse<T>;
  debounceMs?: number;
  getRowId?: (row: T, index: number) => string;
  filterFields?: readonly DataTableFilterField<T>[];
  onRequestChange?: (request: DataTableRequest) => void;
}
/** Abort stale queries and keep server totals independent of the loaded page. The application owns transport. */
export function useRemoteDataTable<T extends RowData>({
  columns,
  load,
  initialRequest,
  initialData,
  debounceMs = 150,
  getRowId,
  filterFields,
  onRequestChange,
}: RemoteDataTableOptions<T>) {
  const [request, setRequest] = React.useState<DataTableRequest>(() => ({
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [],
    query: emptyTableQuery,
    ...initialRequest,
  }));
  const [result, setResult] = React.useState<DataTableResponse<T>>(
    initialData ?? { data: [], rowCount: 0 },
  );
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<unknown>();
  const [revision, refresh] = React.useReducer((n: number) => n + 1, 0);
  const callbacks = React.useRef({ load, onRequestChange });
  React.useEffect(() => {
    callbacks.current = { load, onRequestChange };
  }, [load, onRequestChange]);
  React.useEffect(() => {
    const controller = new AbortController();
    callbacks.current.onRequestChange?.(request);
    const timer = setTimeout(
      () => {
        setLoading(true);
        setError(undefined);
        Promise.resolve()
          .then(() => callbacks.current.load(request, controller.signal))
          .then(
            (response) => {
              if (controller.signal.aborted) return;
              setResult(response);
              setLoading(false);
            },
            (failure: unknown) => {
              if (controller.signal.aborted) return;
              setError(failure);
              setLoading(false);
            },
          );
      },
      Math.max(0, debounceMs),
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, revision, debounceMs]);
  const fields = result.filterFields ?? filterFields ?? [];
  const table = useDataTable({
    data: result.data,
    columns,
    getRowId,
    serverSide: true,
    rowCount: result.rowCount,
    state: { pagination: request.pagination, sorting: request.sorting },
    query: request.query,
    filterFields: fields,
    onQueryChange: (query) =>
      setRequest((previous) => ({
        ...previous,
        query,
        pagination: { ...previous.pagination, pageIndex: 0 },
      })),
    onPaginationChange: (updater) =>
      setRequest((previous) => ({
        ...previous,
        pagination: typeof updater === 'function' ? updater(previous.pagination) : updater,
      })),
    onSortingChange: (updater) =>
      setRequest((previous) => ({
        ...previous,
        sorting: typeof updater === 'function' ? updater(previous.sorting) : updater,
        pagination: { ...previous.pagination, pageIndex: 0 },
      })),
  });
  return { table, request, setRequest, loading, error, refresh, filterFields: fields };
}
