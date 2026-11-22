import * as React from 'react';
import type { RowData } from '@tanstack/react-table';
import type { DataTableInstance } from './data-table';
import type { CollectionMode } from './collection-mode';
import { SearchInput, type SearchInputProps } from './search-input';
import { Button, type ButtonProps } from './button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from './dropdown-menu';
import { TableMenu, type TableMenuPresentation } from './table-menu';
import { DataTableSimpleFilter, filterSummary } from './data-table-filter-value';
import {
  tableQuery,
  emptyTableQuery,
  isActiveTableFilter,
  type DataTableFilterField,
} from './table-filter';
import { useStyles, StyleProvider, type PlainStyleProps } from './style-context';
import { numberFormatter, useTranslation } from './i18n';
import { ArrowUpDown, SlidersHorizontal, RotateCcw, X } from 'lucide-react';

function columnLabel(column: { id: string; columnDef: { header?: unknown } }) {
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
}
export interface DataTableSearchProps<T extends RowData> extends Omit<
  SearchInputProps,
  'value' | 'defaultValue'
> {
  table: DataTableInstance<T>;
}
export const DataTableSearch = /* @__PURE__ */ React.forwardRef(function DataTableSearch<
  T extends RowData,
>(
  { table, onValueChange, placeholder, className, unstyled, ...props }: DataTableSearchProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const styles = useStyles();
  const { t } = useTranslation();
  const query = tableQuery(table.state.globalFilter);
  return styles.tooltip(
    <SearchInput
      ref={ref}
      aria-label={placeholder ?? t('table.search')}
      placeholder={placeholder ?? t('table.search')}
      {...styles('data-table.search', '', className, unstyled)}
      unstyled={unstyled}
      {...props}
      value={query.search}
      onValueChange={(search) => {
        table.setGlobalFilter({ ...query, search });
        table.setPageIndex(0);
        onValueChange?.(search);
      }}
    />,
    unstyled,
  );
}) as <T extends RowData>(
  props: DataTableSearchProps<T> & React.RefAttributes<HTMLInputElement>,
) => React.ReactElement;

export interface DataTableSortProps<T extends RowData> extends ButtonProps {
  table: DataTableInstance<T>;
  presentation?: TableMenuPresentation;
}
export const DataTableSort = /* @__PURE__ */ React.forwardRef(function DataTableSort<
  T extends RowData,
>(
  { table, presentation, children, className, unstyled, ...props }: DataTableSortProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const styles = useStyles();
  const { t, locale } = useTranslation();
  const sorting = table.state.sorting;
  return (
    <StyleProvider unstyled={unstyled}>
      <TableMenu
        label={t('table.sortOrder')}
        presentation={presentation}
        contentProps={{
          ...styles('data-table.sort-panel', 'ui-table-sort-panel', undefined, unstyled),
          align: 'end',
        }}
        trigger={styles.tooltip(
          <Button
            variant="outline"
            ref={ref}
            {...styles('data-table.sort-trigger', '', className, unstyled)}
            {...props}
          >
            {children ?? (
              <>
                <ArrowUpDown size={14} aria-hidden="true" />
                {t('table.sort')}
              </>
            )}
            {sorting.length > 0 && (
              <span {...styles('data-table.count', 'ui-table-count', undefined, unstyled)}>
                {numberFormatter(locale).format(sorting.length)}
              </span>
            )}
          </Button>,
          unstyled,
        )}
      >
        <strong>{t('table.sortOrder')}</strong>
        {sorting.map((rule, i) => (
          <div
            {...styles('data-table.sort-rule', 'ui-table-sort-rule', undefined, unstyled)}
            key={rule.id}
          >
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
              <SelectTrigger aria-label={t('table.sortDirection', { label: rule.id })}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t('table.ascending')}</SelectItem>
                <SelectItem value="desc">{t('table.descending')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('table.removeSort', { label: rule.id })}
              onClick={() => table.setSorting(sorting.filter((_, n) => n !== i))}
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Select
          value=""
          onValueChange={(id) => table.setSorting([...sorting, { id, desc: false }])}
        >
          <SelectTrigger aria-label={t('table.addSort')}>
            <SelectValue placeholder={t('table.addSort')} />
          </SelectTrigger>
          <SelectContent>
            {table
              .getAllLeafColumns()
              .filter(
                (column) => column.getCanSort() && !sorting.some((rule) => rule.id === column.id),
              )
              .map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {columnLabel(column)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </TableMenu>
    </StyleProvider>
  );
}) as <T extends RowData>(
  props: DataTableSortProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement;

export interface DataTableColumnsProps<T extends RowData> extends ButtonProps {
  table: DataTableInstance<T>;
  align?: 'start' | 'center' | 'end';
}
export const DataTableColumns = /* @__PURE__ */ React.forwardRef(function DataTableColumns<
  T extends RowData,
>(
  { table, align = 'end', children, className, unstyled, ...props }: DataTableColumnsProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <StyleProvider unstyled={unstyled}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {styles.tooltip(
            <Button
              variant="outline"
              ref={ref}
              {...styles('data-table.columns', '', className, unstyled)}
              {...props}
            >
              {children ?? (
                <>
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  {t('table.columns')}
                </>
              )}
            </Button>,
            unstyled,
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
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
    </StyleProvider>
  );
}) as <T extends RowData>(
  props: DataTableColumnsProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement;

export interface DataTableResetProps<T extends RowData> extends ButtonProps {
  table: DataTableInstance<T>;
  /** Render the query-reset action even when search and filters are already empty. */
  alwaysVisible?: boolean;
}
export const DataTableReset = /* @__PURE__ */ React.forwardRef(function DataTableReset<
  T extends RowData,
>(
  {
    table,
    alwaysVisible = false,
    children,
    onClick,
    className,
    unstyled,
    ...props
  }: DataTableResetProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const styles = useStyles();
  const { t } = useTranslation();
  const query = tableQuery(table.state.globalFilter);
  if (!alwaysVisible && !query.search && !query.filters.length && !table.state.columnFilters.length)
    return null;
  return styles.tooltip(
    <Button
      variant="ghost"
      ref={ref}
      unstyled={unstyled}
      {...styles('data-table.reset', '', className, unstyled)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        table.setGlobalFilter(emptyTableQuery);
        table.resetColumnFilters(true);
        table.setPageIndex(0);
      }}
    >
      {children ?? (
        <>
          <RotateCcw size={14} aria-hidden="true" />
          {t('common.reset')}
        </>
      )}
    </Button>,
    unstyled,
  );
}) as <T extends RowData>(
  props: DataTableResetProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

export interface DataTableActiveFiltersProps<T extends RowData>
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  table: DataTableInstance<T>;
  fields?: readonly DataTableFilterField<T>[];
}
export const DataTableActiveFilters = /* @__PURE__ */ React.forwardRef(
  function DataTableActiveFilters<T extends RowData>(
    { table, fields = [], className, unstyled, ...props }: DataTableActiveFiltersProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const styles = useStyles();
    const { t, locale } = useTranslation();
    const query = tableQuery(table.state.globalFilter);
    const active = query.filters.filter(isActiveTableFilter);
    if (!active.length) return null;
    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <div
            ref={ref}
            {...styles('data-table.active-filters', 'ui-table-active-filters', className, unstyled)}
            {...props}
          >
            {active.map((rule) => (
              <Button
                size="sm"
                variant="ghost"
                key={rule.id}
                aria-label={t('table.removeFilter')}
                onClick={() => {
                  table.setGlobalFilter({
                    ...query,
                    filters: query.filters.filter((item) => item.id !== rule.id),
                  });
                  table.setPageIndex(0);
                }}
              >
                {fields.find((field) => field.id === rule.field)?.label ?? rule.field}{' '}
                {t(`filter.${rule.operator}`)}{' '}
                {filterSummary(
                  fields.find((field) => field.id === rule.field) ?? {
                    id: rule.field,
                    label: rule.field,
                  },
                  rule,
                  [t('common.no'), t('common.yes')],
                  locale,
                )}
                <X size={12} aria-hidden="true" />
              </Button>
            ))}
          </div>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
) as <T extends RowData>(
  props: DataTableActiveFiltersProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null;

export interface DataTableFieldFilterProps<T extends RowData> extends Pick<
  PlainStyleProps,
  'tooltip'
> {
  table: DataTableInstance<T>;
  field: DataTableFilterField<T>;
  presentation?: TableMenuPresentation;
}
export function DataTableFieldFilter<T extends RowData>({
  table,
  field,
  presentation,
  tooltip,
}: DataTableFieldFilterProps<T>) {
  const styles = useStyles();
  const query = tableQuery(table.state.globalFilter);
  return (
    <DataTableSimpleFilter
      tooltip={tooltip}
      className={styles('data-table.field-filter', 'ui-table-field-filter').className}
      field={field}
      presentation={presentation}
      rule={query.filters.find((rule) => rule.field === field.id)}
      onChange={(rule) => {
        table.setGlobalFilter({
          ...query,
          filters: [...query.filters.filter((item) => item.field !== field.id), rule],
        });
        table.setPageIndex(0);
      }}
      onRemove={() => {
        table.setGlobalFilter({
          ...query,
          filters: query.filters.filter((rule) => rule.field !== field.id),
        });
        table.setPageIndex(0);
      }}
    />
  );
}

export interface DataTableSelectionToggleProps<T extends RowData> extends ButtonProps {
  table: DataTableInstance<T>;
  mode: CollectionMode;
  onModeChange: (mode: CollectionMode) => void;
  clearSelectionOnExit?: boolean;
}
export const DataTableSelectionToggle = /* @__PURE__ */ React.forwardRef(
  function DataTableSelectionToggle<T extends RowData>(
    {
      table,
      mode,
      onModeChange,
      clearSelectionOnExit = true,
      onClick,
      children,
      className,
      unstyled,
      ...props
    }: DataTableSelectionToggleProps<T>,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    const styles = useStyles();
    const { t } = useTranslation();
    const selecting = mode === 'selection';
    return styles.tooltip(
      <Button
        variant="outline"
        ref={ref}
        aria-pressed={selecting}
        unstyled={unstyled}
        {...styles('data-table.selection-toggle', '', className, unstyled)}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (selecting && clearSelectionOnExit) table.resetRowSelection(true);
          onModeChange(selecting ? 'browse' : 'selection');
        }}
      >
        {children ?? t(selecting ? 'common.done' : 'collection.select')}
      </Button>,
      unstyled,
    );
  },
) as <T extends RowData>(
  props: DataTableSelectionToggleProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement;

export interface DataTableSelectionActionsProps<T extends RowData>
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  table: DataTableInstance<T>;
}
export const DataTableSelectionActions = /* @__PURE__ */ React.forwardRef(
  function DataTableSelectionActions<T extends RowData>(
    { table, children, className, unstyled, ...props }: DataTableSelectionActionsProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const styles = useStyles();
    const { t } = useTranslation();
    const selected = table.getSelectedRowIds().length;
    if (!selected) return null;
    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <div
            ref={ref}
            {...styles(
              'data-table.selection-actions',
              'ui-table-selection-actions',
              className,
              unstyled,
            )}
            role="region"
            aria-label={t('table.selectedActions')}
            {...props}
          >
            <span>{t('collection.selected', { count: selected })}</span>
            {children}
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('table.clearSelection')}
              onClick={() => table.resetRowSelection(true)}
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </div>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
) as <T extends RowData>(
  props: DataTableSelectionActionsProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null;
