import {
  DataTable,
  useDataTable,
  useRemoteDataTable,
  Badge,
  Button,
  type DataTableColumn,
  type DataTableFilterField,
  type DataTableRequest,
} from '../../ui';
import { testTableFilter, isActiveTableFilter } from '../../ui/table-filter';
import { invoices } from '../demos';

const records = Array.from({ length: 80 }, (_, i) => ({
  ...invoices[i % invoices.length],
  id: `INV-${String(i + 1).padStart(3, '0')}`,
  amount: invoices[i % invoices.length].amount + i,
  created: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
  verified: i % 3 !== 0,
}));
type Invoice = (typeof records)[number];
const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => (
      <div>
        <strong>{row.original.customer}</strong>
        <div style={{ fontSize: 12, color: 'var(--ui-muted-foreground)' }}>
          {row.original.email}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Paid' ? 'default' : 'outline'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) =>
      new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(
        row.original.amount,
      ),
  },
  { accessorKey: 'created', header: 'Created' },
  {
    accessorKey: 'verified',
    header: 'Verified',
    cell: ({ row }) => (row.original.verified ? 'Yes' : 'No'),
  },
];
const filterFields: DataTableFilterField<Invoice>[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'Paid', label: 'Paid' },
      { value: 'Pending', label: 'Pending' },
    ],
  },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'created', label: 'Created', type: 'date' },
  { id: 'verified', label: 'Verified', type: 'boolean' },
  { id: 'customer', label: 'Customer', type: 'text' },
];
type State = Record<string, string | number | boolean>;
function presentation(state: State) {
  return {
    caption: 'Customer invoices',
    selectable: true,
    filterMode: state.filterMode === 'simple' ? ('simple' as const) : ('advanced' as const),
    filterFields,
    stickyHeader: !!state.stickyHeader,
    stickyFooter: !!state.stickyFooter,
    stickyScrollbar: !!state.stickyScrollbar,
    scrollHeight: state.contained ? 340 : undefined,
  };
}
function LocalTable({ state }: { state: State }) {
  const table = useDataTable({ data: records, columns, filterFields, getRowId: (row) => row.id });
  return <DataTable table={table} {...presentation(state)} />;
}
async function load(request: DataTableRequest, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, 120);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
  });
  const active = request.query.filters.filter(isActiveTableFilter);
  const filtered = records
    .filter((row) => {
      const text = Object.values(row)
        .join(' ')
        .toLocaleLowerCase()
        .includes(request.query.search.toLocaleLowerCase());
      const test = (rule: (typeof active)[number]) =>
        testTableFilter(
          row[rule.field as keyof Invoice],
          rule,
          filterFields.find((field) => field.id === rule.field)?.type,
        );
      return (
        text &&
        (!active.length || (request.query.join === 'or' ? active.some(test) : active.every(test)))
      );
    })
    .sort((a, b) => {
      for (const sort of request.sorting) {
        const av = a[sort.id as keyof Invoice],
          bv = b[sort.id as keyof Invoice];
        const result =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        if (result) return sort.desc ? -result : result;
      }
      return 0;
    });
  const { pageIndex, pageSize } = request.pagination;
  return {
    data: filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    rowCount: filtered.length,
    filterFields,
  };
}
function RemoteTable({ state }: { state: State }) {
  const remote = useRemoteDataTable({ columns, load, filterFields, getRowId: (row) => row.id });
  return (
    <>
      <DataTable
        table={remote.table}
        {...presentation(state)}
        loading={remote.loading}
        filterFields={remote.filterFields}
      />
      {remote.error ? (
        <div role="alert">
          <Button variant="outline" onClick={remote.refresh}>
            Retry
          </Button>
        </div>
      ) : null}
    </>
  );
}
export default function TableWorkspaceExample({ state = {} }: { state?: State }) {
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {state.remote ? <RemoteTable state={state} /> : <LocalTable state={state} />}
    </div>
  );
}
