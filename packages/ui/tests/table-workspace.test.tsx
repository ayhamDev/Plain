import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DataTable,
  useDataTable,
  type DataTableColumn,
  type DataTableInstance,
  type DataTableQuery,
} from '../src/ui/data-table';
import { emptyTableQuery, isActiveTableFilter, testTableFilter } from '../src/ui/table-filter';
type RecordRow = { id: string; name: string; amount: number; status: string };
const data: RecordRow[] = [
  { id: 'a', name: 'Alpha', amount: 10, status: 'Draft' },
  { id: 'b', name: 'Beta', amount: 20, status: 'Active' },
  { id: 'c', name: 'Gamma', amount: 30, status: 'Active' },
  { id: 'd', name: 'Delta', amount: 40, status: 'Done' },
];
const columns: DataTableColumn<RecordRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
];
const fields = [
  { id: 'amount', label: 'Amount', type: 'number' as const },
  {
    id: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Draft', label: 'Draft' },
    ],
  },
];
describe('structured table queries', () => {
  it('handles typed operators, dates and missing data predictably', () => {
    const rule = { id: 'x', field: 'amount', operator: 'between' as const, value: [10, 30] };
    expect(testTableFilter(20, rule, 'number')).toBe(true);
    expect(testTableFilter(40, rule, 'number')).toBe(false);
    expect(testTableFilter(null, { ...rule, operator: 'empty' })).toBe(true);
    expect(testTableFilter('Alpha', { ...rule, operator: 'contains', value: 'ALP' })).toBe(true);
    expect(testTableFilter('Active', { ...rule, operator: 'in', value: ['Active', 'Done'] })).toBe(
      true,
    );
    expect(
      testTableFilter('2026-10-05', { ...rule, operator: 'gte', value: '2026-10-01' }, 'date'),
    ).toBe(true);
    expect(
      testTableFilter('invalid', { ...rule, operator: 'neq', value: '2026-10-01' }, 'date'),
    ).toBe(false);
    expect(isActiveTableFilter({ ...rule, value: ['', 30] })).toBe(false);
    expect(isActiveTableFilter({ ...rule, operator: 'in', value: [] })).toBe(false);
    expect(isActiveTableFilter({ ...rule, operator: 'eq', value: false })).toBe(true);
    expect(
      testTableFilter(
        '2026-10-05T23:30:00Z',
        { ...rule, operator: 'eq', value: '2026-10-05' },
        'date',
      ),
    ).toBe(true);
    expect(
      testTableFilter(
        new Date('2026-10-05T14:00:00Z'),
        { ...rule, value: ['2026-10-01', '2026-10-05'] },
        'date',
      ),
    ).toBe(true);
  });
  it('combines AND/OR filters with global search and ignores unfinished rules', () => {
    let table!: DataTableInstance<RecordRow>;
    function Fixture() {
      table = useDataTable({ data, columns, filterFields: fields, getRowId: (row) => row.id });
      return <DataTable table={table} />;
    }
    render(<Fixture />);
    const query: DataTableQuery = {
      search: '',
      join: 'and',
      filters: [
        { id: 's', field: 'status', operator: 'eq', value: 'Active' },
        { id: 'n', field: 'amount', operator: 'gte', value: 30 },
      ],
    };
    act(() => table.setGlobalFilter(query));
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['c']);
    act(() => table.setGlobalFilter({ ...query, join: 'or' }));
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['b', 'c', 'd']);
    act(() => table.setGlobalFilter({ ...query, join: 'or', search: 'beta' }));
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['b']);
    act(() =>
      table.setGlobalFilter({
        ...emptyTableQuery,
        filters: [{ id: 's', field: 'status', operator: 'in' }],
      }),
    );
    expect(table.getFilteredRowModel().rows).toHaveLength(4);
  });
  it('honors initial and controlled query state without taking ownership of server pagination', async () => {
    const change = vi.fn();
    let table!: DataTableInstance<RecordRow>;
    function Fixture({ query }: { query?: DataTableQuery }) {
      table = useDataTable({
        data: data.slice(0, 2),
        columns,
        pageSize: 2,
        query,
        onQueryChange: change,
        initialState: { globalFilter: 'beta' },
        manualPagination: true,
        manualFiltering: true,
        rowCount: 100,
      });
      return <DataTable table={table} />;
    }
    const { rerender } = render(<Fixture />);
    expect(screen.getByRole('searchbox')).toHaveValue('beta');
    expect(table.getPageCount()).toBe(50);
    const controlled = { ...emptyTableQuery, search: 'alpha' };
    rerender(<Fixture query={controlled} />);
    act(() => table.setGlobalFilter({ ...controlled, search: 'delta' }));
    expect(change).toHaveBeenLastCalledWith({ ...controlled, search: 'delta' });
    expect(screen.getByRole('searchbox')).toHaveValue('alpha');
    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    expect(table.state.pagination.pageIndex).toBe(49);
    expect(table.getRowModel().rows).toHaveLength(2);
  });
});
describe('table controls', () => {
  it('restores a date rule into the styled date picker and filters the whole UTC day', async () => {
    render(
      <DataTable
        data={[{ created: '2026-10-05T15:30:00Z' }, { created: '2026-10-06T00:00:00Z' }]}
        columns={[{ accessorKey: 'created', header: 'Created' }]}
        filterFields={[{ id: 'created', label: 'Created', type: 'date' }]}
        tableOptions={{
          defaultQuery: {
            ...emptyTableQuery,
            filters: [{ id: 'date', field: 'created', operator: 'eq', value: '2026-10-05' }],
          },
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1-1 of 1');
    await userEvent.click(screen.getByRole('button', { name: /^Filters/ }));
    const date = screen.getByRole('button', { name: 'Filter value for Created' });
    expect(date).toHaveTextContent('2026');
    await userEvent.click(date);
    expect(screen.getByRole('grid')).toHaveAccessibleName('October 2026');
  });
  it('selects page rows, keeps stable IDs across pagination, and supports Shift ranges', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={2}
        selectable
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Select current page' }));
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('checkbox', { name: 'Select row c' })).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(screen.getByRole('checkbox', { name: 'Select row a' })).toBeChecked();
  });
  it('uses native selection handlers for keyboard-modified intervals', async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} getRowId={(row) => row.id} selectable />);
    await user.click(screen.getByRole('checkbox', { name: 'Select row a' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('checkbox', { name: 'Select row c' }));
    await user.keyboard('{/Shift}');
    expect(screen.getByRole('checkbox', { name: 'Select row b' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('3 selected');
  });
  it('resets the page during search and offers first/last/page jump controls', async () => {
    const user = userEvent.setup();
    render(<DataTable data={data} columns={columns} pageSize={1} />);
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(screen.getByRole('spinbutton', { name: 'Go to page' })).toHaveValue(4);
    await user.type(screen.getByRole('searchbox'), 'Alpha');
    expect(screen.getByRole('status')).toHaveTextContent('1-1 of 1');
    expect(within(screen.getByRole('table')).getByText('Alpha')).toBeVisible();
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
  });
});
