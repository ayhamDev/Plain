import * as React from 'react';
import {
  tableFeatures,
  useTable,
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  type ColumnDef,
  type RowData,
  type TableOptions,
  type TableState,
  type Row,
  type ReactTable,
} from '@tanstack/react-table';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Filter,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from './table';
import {
  Input,
  Label,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './forms';
import { DatePicker } from './calendar';
import { SearchInput } from './advanced';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from './overlays';
import { Button, EmptyState, Spinner } from './primitives';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';
import {
  tableQuery,
  testTableFilter,
  isActiveTableFilter,
  filterOperators,
  emptyTableQuery,
  type DataTableQuery,
  type DataTableFilterField,
  type DataTableFilter,
} from './table-filter';
export type {
  DataTableQuery,
  DataTableFilterField,
  DataTableFilter,
  DataTableFilterOperator,
} from './table-filter';

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
});
export type DataTableColumn<T extends RowData> = ColumnDef<typeof dataTableFeatures, T>;
export type DataTableState = TableState<typeof dataTableFeatures>;
export type DataTableInstance<T extends RowData> = ReactTable<typeof dataTableFeatures, T>;
export type DataTableRow<T extends RowData> = Row<typeof dataTableFeatures, T>;
export interface UseDataTableOptions<T extends RowData> extends Omit<
  TableOptions<typeof dataTableFeatures, T>,
  'features'
> {
  pageSize?: number;
  query?: DataTableQuery;
  defaultQuery?: DataTableQuery;
  onQueryChange?: (query: DataTableQuery) => void;
  filterFields?: readonly DataTableFilterField[];
}
export function useDataTable<T extends RowData>({
  pageSize = 10,
  query,
  defaultQuery,
  onQueryChange,
  filterFields = [],
  ...options
}: UseDataTableOptions<T>): DataTableInstance<T> {
  const [localQuery, setLocalQuery] = React.useState(
    () => defaultQuery ?? tableQuery(options.initialState?.globalFilter),
  );
  const active = query ?? options.state?.globalFilter ?? localQuery;
  return useTable({
    ...options,
    features: dataTableFeatures,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10,
      },
      ...options.initialState,
    },
    state: { ...options.state, globalFilter: active },
    onGlobalFilterChange: (updater) => {
      const next = tableQuery(typeof updater === 'function' ? updater(active) : updater);
      if (query === undefined) setLocalQuery(next);
      onQueryChange?.(next);
      options.onGlobalFilterChange?.(updater);
    },
    getColumnCanGlobalFilter: options.getColumnCanGlobalFilter ?? (() => true),
    globalFilterFn: (row, _columnId, value) => {
      const q = tableQuery(value);
      const text = row
        .getAllCells()
        .filter((cell) => cell.column.getCanGlobalFilter())
        .map((cell) => String(cell.getValue() ?? ''))
        .join(' ')
        .toLowerCase();
      const search = q.search
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .every((term) => text.includes(term));
      const results = q.filters.filter(isActiveTableFilter).map((rule) => {
        const field = filterFields.find((field) => field.id === rule.field);
        const value = row
          .getAllCells()
          .find((cell) => cell.column.id === rule.field)
          ?.getValue();
        return field?.test ? field.test(value, rule) : testTableFilter(value, rule, field?.type);
      });
      return (
        search &&
        (!results.length || (q.join === 'or' ? results.some(Boolean) : results.every(Boolean)))
      );
    },
    ...(options.globalFilterFn ? { globalFilterFn: options.globalFilterFn } : {}),
  });
}
export interface DataTableViewProps<T extends RowData>
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  table: DataTableInstance<T>;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterFields?: readonly DataTableFilterField[];
  columnControls?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  renderEmpty?: React.ReactNode;
  caption?: string;
  pageSizes?: readonly number[];
  toolbar?: React.ReactNode | ((table: DataTableInstance<T>) => React.ReactNode);
  toolbarActions?: React.ReactNode;
  selectionActions?: (table: DataTableInstance<T>) => React.ReactNode;
  rowProps?: (row: DataTableRow<T>) => React.HTMLAttributes<HTMLTableRowElement>;
  renderDetail?: (row: DataTableRow<T>) => React.ReactNode;
  footer?: React.ReactNode | ((table: DataTableInstance<T>) => React.ReactNode);
}
export type DataTableProps<T extends RowData> = Omit<DataTableViewProps<T>, 'table'> & {
  data: readonly T[];
  columns: DataTableColumn<T>[];
  table?: DataTableInstance<T>;
  pageSize?: number;
  getRowId?: (row: T, index: number) => string;
  tableOptions?: Omit<UseDataTableOptions<T>, 'data' | 'columns' | 'pageSize' | 'getRowId'>;
};
function OwnedDataTable<T extends RowData>({
  data,
  columns,
  pageSize,
  getRowId,
  tableOptions,
  ...props
}: DataTableProps<T>) {
  const table = useDataTable({
    data,
    columns,
    pageSize,
    getRowId,
    filterFields: props.filterFields,
    ...tableOptions,
  });
  return <DataTableView {...props} table={table} />;
}
export function DataTable<T extends RowData>(props: DataTableProps<T> | DataTableViewProps<T>) {
  if (props.table) {
    const {
      data: _data,
      columns: _columns,
      pageSize: _pageSize,
      getRowId: _id,
      tableOptions: _options,
      ...viewProps
    } = props as DataTableProps<T>;
    void [_data, _columns, _pageSize, _id, _options];
    return <DataTableView {...viewProps} table={props.table} />;
  }
  return <OwnedDataTable {...(props as DataTableProps<T>)} />;
}
function RowSelection<T extends RowData>({ row }: { row: DataTableRow<T> }) {
  const click = React.useRef<React.MouseEvent<HTMLButtonElement> | undefined>(undefined);
  return (
    <Checkbox
      aria-label={`Select row ${row.id}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onClick={(event) => {
        click.current = event;
      }}
      onCheckedChange={(checked) => {
        row.getToggleSelectedHandler()({
          target: { checked: !!checked },
          shiftKey: click.current?.shiftKey ?? false,
          nativeEvent: click.current?.nativeEvent,
        });
        click.current = undefined;
      }}
    />
  );
}
function filterDate(value: unknown) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : undefined;
}
function filterDateString(date: Date | undefined) {
  return date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
}
function columnLabel(column: { id: string; columnDef: { header?: unknown } }) {
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
}
const operatorLabels = {
  contains: 'contains',
  notContains: 'does not contain',
  eq: 'is',
  neq: 'is not',
  in: 'is any of',
  notIn: 'is none of',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  between: 'between',
  empty: 'is empty',
  notEmpty: 'is not empty',
};
export function DataTableFilters<T extends RowData>({
  table,
  fields,
}: {
  table: DataTableInstance<T>;
  fields: readonly DataTableFilterField[];
}) {
  const styles = useStyles();
  const query = tableQuery(table.state.globalFilter);
  const id = React.useId();
  const update = (filters: DataTableFilter[]) => {
    table.setGlobalFilter({ ...query, filters });
    table.setPageIndex(0);
  };
  const patch = (rule: DataTableFilter, value: Partial<DataTableFilter>) =>
    update(query.filters.map((item) => (item.id === rule.id ? { ...item, ...value } : item)));
  const select = (
    value: string,
    onChange: (v: string) => void,
    choices: readonly { value: string; label: string }[],
    label: string,
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {choices.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter size={14} aria-hidden="true" />
          Filters
          {query.filters.length > 0 && (
            <span {...styles('data-table.count', 'ui-table-count')}>{query.filters.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" {...styles('data-table.filter-panel', 'ui-table-filter-panel')}>
        <div {...styles('data-table.filter-heading', 'ui-table-filter-heading')}>
          <strong>Filters</strong>
          {select(
            query.join,
            (join) => {
              table.setGlobalFilter({ ...query, join });
              table.setPageIndex(0);
            },
            [
              { value: 'and', label: 'Match all' },
              { value: 'or', label: 'Match any' },
            ],
            'Filter matching',
          )}
        </div>
        <div {...styles('data-table.filter-rules', 'ui-table-filter-rules')}>
          {query.filters.map((rule) => {
            const field = fields.find((field) => field.id === rule.field) ?? fields[0];
            if (!field) return null;
            const multi = rule.operator === 'in' || rule.operator === 'notIn';
            return (
              <div {...styles('data-table.filter-rule', 'ui-table-filter-rule')} key={rule.id}>
                {select(
                  rule.field,
                  (fieldId) => {
                    const next = fields.find((field) => field.id === fieldId)!;
                    patch(rule, {
                      field: fieldId,
                      operator: filterOperators(next)[0],
                      value: undefined,
                    });
                  },
                  fields.map((field) => ({ value: field.id, label: field.label })),
                  'Filter field',
                )}
                {select(
                  rule.operator,
                  (operator) =>
                    patch(rule, {
                      operator: operator as DataTableFilter['operator'],
                      value: undefined,
                    }),
                  filterOperators(field).map((value) => ({ value, label: operatorLabels[value] })),
                  'Filter operator',
                )}
                {!['empty', 'notEmpty'].includes(rule.operator) &&
                  (field.type === 'select' && multi ? (
                    <div {...styles('data-table.filter-options', 'ui-table-filter-options')}>
                      {field.options?.map((option) => (
                        <Label key={option.value}>
                          <Checkbox
                            checked={Array.isArray(rule.value) && rule.value.includes(option.value)}
                            onCheckedChange={(checked) =>
                              patch(rule, {
                                value: checked
                                  ? [...(Array.isArray(rule.value) ? rule.value : []), option.value]
                                  : (Array.isArray(rule.value) ? rule.value : []).filter(
                                      (value) => value !== option.value,
                                    ),
                              })
                            }
                          />
                          {option.label}
                        </Label>
                      ))}
                    </div>
                  ) : field.type === 'select' || field.type === 'boolean' ? (
                    select(
                      String(rule.value ?? ''),
                      (value) => patch(rule, { value }),
                      field.type === 'boolean'
                        ? [
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' },
                          ]
                        : (field.options ?? []),
                      'Filter value',
                    )
                  ) : rule.operator === 'between' ? (
                    <div {...styles('data-table.filter-between', 'ui-table-filter-between')}>
                      {[0, 1].map((i) =>
                        field.type === 'date' ? (
                          <DatePicker
                            key={i}
                            aria-label={i ? 'Maximum filter value' : 'Minimum filter value'}
                            value={filterDate(Array.isArray(rule.value) ? rule.value[i] : '')}
                            onValueChange={(date) => {
                              const values = Array.isArray(rule.value) ? [...rule.value] : ['', ''];
                              values[i] = filterDateString(date);
                              patch(rule, { value: values });
                            }}
                          />
                        ) : (
                          <Input
                            key={i}
                            aria-label={i ? 'Maximum filter value' : 'Minimum filter value'}
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={Array.isArray(rule.value) ? (rule.value[i] ?? '') : ''}
                            onChange={(event) => {
                              const values = Array.isArray(rule.value) ? [...rule.value] : ['', ''];
                              values[i] = event.target.value;
                              patch(rule, { value: values });
                            }}
                          />
                        ),
                      )}
                    </div>
                  ) : field.type === 'date' ? (
                    <DatePicker
                      aria-label={`Filter value for ${field.label}`}
                      value={filterDate(rule.value)}
                      onValueChange={(date) => patch(rule, { value: filterDateString(date) })}
                    />
                  ) : (
                    <Input
                      aria-label={`Filter value for ${field.label}`}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={
                        typeof rule.value === 'boolean' || Array.isArray(rule.value)
                          ? ''
                          : (rule.value ?? '')
                      }
                      onChange={(event) => patch(rule, { value: event.target.value })}
                    />
                  ))}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove filter"
                  onClick={() => update(query.filters.filter((item) => item.id !== rule.id))}
                >
                  <X size={14} />
                </Button>
              </div>
            );
          })}
        </div>
        <div {...styles('data-table.filter-footer', 'ui-table-filter-footer')}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const field = fields[0];
              if (field)
                update([
                  ...query.filters,
                  {
                    id: `${id}-${Date.now()}-${query.filters.length}`,
                    field: field.id,
                    operator: filterOperators(field)[0],
                  },
                ]);
            }}
          >
            <Plus size={14} />
            Add filter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!query.filters.length}
            onClick={() => update([])}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export function DataTableToolbar<T extends RowData>({
  table,
  searchable = true,
  searchPlaceholder = 'Search records...',
  filterFields = [],
  columnControls = true,
  toolbarActions,
}: Pick<
  DataTableViewProps<T>,
  | 'table'
  | 'searchable'
  | 'searchPlaceholder'
  | 'filterFields'
  | 'columnControls'
  | 'toolbarActions'
>) {
  const styles = useStyles();
  const query = tableQuery(table.state.globalFilter),
    sorting = table.state.sorting;
  return (
    <div {...styles('data-table.toolbar', 'ui-table-toolbar')}>
      {searchable && (
        <SearchInput
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={query.search}
          onValueChange={(search) => {
            table.setGlobalFilter({ ...query, search });
            table.setPageIndex(0);
          }}
        />
      )}
      {filterFields.length > 0 && <DataTableFilters table={table} fields={filterFields} />}
      {!!(query.search || query.filters.length || table.state.columnFilters.length) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.setGlobalFilter(emptyTableQuery);
            table.resetColumnFilters(true);
            table.setPageIndex(0);
          }}
        >
          <RotateCcw size={14} />
          Reset
        </Button>
      )}
      <div {...styles('data-table.toolbar-end', 'ui-table-toolbar-end')}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown size={14} />
              Sort
              {sorting.length > 0 && (
                <span {...styles('data-table.count', 'ui-table-count')}>{sorting.length}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" {...styles('data-table.sort-panel', 'ui-table-sort-panel')}>
            <strong>Sort order</strong>
            {sorting.map((rule, i) => (
              <div {...styles('data-table.sort-rule', 'ui-table-sort-rule')} key={rule.id}>
                <span>{columnLabel(table.getColumn(rule.id)!)}</span>
                <Select
                  value={rule.desc ? 'desc' : 'asc'}
                  onValueChange={(direction) =>
                    table.setSorting(
                      sorting.map((item, n) =>
                        n === i ? { ...item, desc: direction === 'desc' } : item,
                      ),
                    )
                  }
                >
                  <SelectTrigger aria-label={`Direction for ${rule.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove sort ${rule.id}`}
                  onClick={() => table.setSorting(sorting.filter((_, n) => n !== i))}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
            <Select
              value=""
              onValueChange={(id) => table.setSorting([...sorting, { id, desc: false }])}
            >
              <SelectTrigger aria-label="Add sort">
                <SelectValue placeholder="Add sort" />
              </SelectTrigger>
              <SelectContent>
                {table
                  .getAllLeafColumns()
                  .filter(
                    (column) =>
                      column.getCanSort() && !sorting.some((rule) => rule.id === column.id),
                  )
                  .map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {columnLabel(column)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
        {columnControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal size={14} />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    disabled={column.getIsVisible() && table.getVisibleLeafColumns().length === 1}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => column.toggleVisibility(checked)}
                  >
                    {columnLabel(column)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {toolbarActions}
      </div>
      {query.filters.length > 0 && (
        <div {...styles('data-table.active-filters', 'ui-table-active-filters')}>
          {query.filters.map((rule) => (
            <Button
              size="sm"
              variant="ghost"
              key={rule.id}
              aria-label={`Remove ${rule.field} filter`}
              onClick={() => {
                table.setGlobalFilter({
                  ...query,
                  filters: query.filters.filter((item) => item.id !== rule.id),
                });
                table.setPageIndex(0);
              }}
            >
              {filterFields.find((field) => field.id === rule.field)?.label ?? rule.field}{' '}
              {operatorLabels[rule.operator]}{' '}
              {Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value ?? '')}
              <X size={12} />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
export function DataTablePagination<T extends RowData>({
  table,
  pageSizes = [10, 25, 50, 100],
  selectable,
  loading,
}: Pick<DataTableViewProps<T>, 'table' | 'pageSizes' | 'selectable' | 'loading'>) {
  const styles = useStyles();
  const direction = useDirection();
  const { pageIndex, pageSize } = table.state.pagination;
  const count = table.getRowCount(),
    pages = table.getPageCount(),
    unknown = pages < 0;
  const loaded = table.getRowModel().rows.length;
  const firstRow = loaded ? pageIndex * pageSize + 1 : 0,
    lastRow = loaded ? pageIndex * pageSize + loaded : 0;
  const sizes = [...new Set([...pageSizes, pageSize])]
    .filter((size) => Number.isFinite(size) && size > 0)
    .sort((a, b) => a - b);
  const [draft, setDraft] = React.useState(String(pageIndex + 1));
  React.useEffect(() => setDraft(String(pageIndex + 1)), [pageIndex]);
  const jump = () => {
    const target = Number(draft);
    if (Number.isFinite(target) && target >= 1 && (unknown || target <= Math.max(1, pages)))
      table.setPageIndex(Math.floor(target) - 1);
    else setDraft(String(pageIndex + 1));
  };
  const tools = [
    [
      'First page',
      table.firstPage,
      !table.getCanPreviousPage(),
      direction === 'rtl' ? ChevronLast : ChevronFirst,
    ],
    [
      'Previous page',
      table.previousPage,
      !table.getCanPreviousPage(),
      direction === 'rtl' ? ChevronRight : ChevronLeft,
    ],
    [
      'Next page',
      table.nextPage,
      !table.getCanNextPage(),
      direction === 'rtl' ? ChevronLeft : ChevronRight,
    ],
    [
      'Last page',
      table.lastPage,
      unknown || !table.getCanNextPage(),
      direction === 'rtl' ? ChevronFirst : ChevronLast,
    ],
  ] as const;
  return (
    <div {...styles('data-table.pagination', 'ui-table-pagination')}>
      <span role="status" dir="auto" {...styles('data-table.status', 'ui-table-status')}>
        {selectable ? `${table.getSelectedRowIds().length} selected · ` : ''}
        {firstRow}-{lastRow} of {unknown ? 'many' : count}
      </span>
      <div {...styles('data-table.page-size', 'ui-table-page-size')}>
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          disabled={loading}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div {...styles('data-table.page-jump', 'ui-table-page-jump')}>
        <span>Page</span>
        <Input
          type="number"
          min={1}
          max={unknown ? undefined : Math.max(1, pages)}
          aria-label="Go to page"
          value={draft}
          disabled={loading || !count}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={jump}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              jump();
            }
          }}
        />
        <span>of {unknown ? '?' : Math.max(1, pages)}</span>
      </div>
      <div {...styles('data-table.page-buttons', 'ui-table-page-buttons')}>
        {tools.map(([label, click, unavailable, Icon]) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            disabled={loading || unavailable}
            onClick={click}
            aria-label={label}
            title={label}
          >
            <Icon size={16} aria-hidden="true" />
          </Button>
        ))}
      </div>
    </div>
  );
}
export function DataTableView<T extends RowData>({
  table,
  searchable = true,
  searchPlaceholder,
  filterFields,
  columnControls = true,
  selectable = false,
  loading,
  emptyTitle = 'No results found',
  renderEmpty,
  caption = 'Records',
  pageSizes,
  toolbar,
  toolbarActions,
  selectionActions,
  rowProps,
  renderDetail,
  footer,
  className,
  unstyled,
  ...props
}: DataTableViewProps<T>) {
  const styles = useStyles();
  const rows = table.getRowModel().rows,
    columnCount = Math.max(1, table.getVisibleLeafColumns().length + Number(selectable));
  const selected = table.getSelectedRowIds().length;
  const left = table.getStartVisibleLeafColumns(),
    right = table.getEndVisibleLeafColumns();
  const pinnedStyle = (
    column: ReturnType<typeof table.getAllLeafColumns>[number],
  ): React.CSSProperties | undefined => {
    const position = column.getIsPinned();
    if (!position)
      return table.getIsSomeColumnsPinned()
        ? { width: column.getSize(), minWidth: column.getSize() }
        : undefined;
    const list = position === 'start' ? left : right;
    const index = list.indexOf(column);
    const offset = position === 'start' ? list.slice(0, index) : list.slice(index + 1);
    return {
      position: 'sticky',
      [position === 'start' ? 'insetInlineStart' : 'insetInlineEnd']: offset.reduce(
        (sum, c) => sum + c.getSize(),
        selectable && position === 'start' ? 48 : 0,
      ),
      zIndex: 1,
      background: 'var(--ui-surface)',
      width: column.getSize(),
      minWidth: column.getSize(),
    };
  };
  return (
    <StyleProvider unstyled={unstyled}>
      <div {...styles('data-table.root', 'ui-data-table', className, unstyled)} {...props}>
        {toolbar === undefined ? (
          <DataTableToolbar
            table={table}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            filterFields={filterFields}
            columnControls={columnControls}
            toolbarActions={toolbarActions}
          />
        ) : typeof toolbar === 'function' ? (
          toolbar(table)
        ) : (
          toolbar
        )}
        <div
          {...styles(
            'data-table.table-wrapper',
            'ui-table-frame overflow-hidden rounded-ui border',
            undefined,
            unstyled,
          )}
        >
          <Table
            aria-label={caption}
            aria-busy={loading || undefined}
            style={
              table.getIsSomeColumnsPinned()
                ? {
                    width: table.getTotalSize() + Number(selectable) * 48,
                    minWidth: table.getTotalSize() + Number(selectable) * 48,
                    tableLayout: 'fixed',
                  }
                : undefined
            }
          >
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {selectable && (
                    <TableHead {...styles('data-table.selection-cell', 'ui-table-selection-cell')}>
                      <Checkbox
                        aria-label="Select current page"
                        disabled={loading || !rows.length}
                        checked={
                          table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
                      />
                    </TableHead>
                  )}
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={pinnedStyle(header.column)}
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
                          disabled={loading}
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
                            <ArrowUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                          {header.column.getIsSorted() && table.state.sorting.length > 1 && (
                            <span {...styles('data-table.count', 'ui-table-count')}>
                              {header.column.getSortIndex() + 1}
                            </span>
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
                    <div {...styles('data-table.loading', 'ui-table-loading')}>
                      <Spinner label="Loading records" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow data-selected={row.getIsSelected() || undefined} {...rowProps?.(row)}>
                      {selectable && (
                        <TableCell
                          {...styles('data-table.selection-cell', 'ui-table-selection-cell')}
                        >
                          <RowSelection row={row} />
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={pinnedStyle(cell.column)}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderDetail && (
                      <TableRow>
                        <TableCell colSpan={columnCount}>{renderDetail(row)}</TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    {renderEmpty ?? (
                      <EmptyState
                        title={emptyTitle}
                        description="Try another search or clear your filters."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              table.setGlobalFilter(emptyTableQuery);
                              table.resetColumnFilters(true);
                              table.setPageIndex(0);
                            }}
                          >
                            Clear filters
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!!selected && selectionActions && (
          <div
            {...styles('data-table.selection-actions', 'ui-table-selection-actions')}
            role="region"
            aria-label="Selected row actions"
          >
            <span>{selected} selected</span>
            {selectionActions(table)}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear selection"
              onClick={() => table.resetRowSelection(true)}
            >
              <X size={14} />
            </Button>
          </div>
        )}
        {footer === undefined ? (
          <DataTablePagination
            table={table}
            pageSizes={pageSizes}
            selectable={selectable}
            loading={loading}
          />
        ) : typeof footer === 'function' ? (
          footer(table)
        ) : (
          footer
        )}
      </div>
    </StyleProvider>
  );
}
