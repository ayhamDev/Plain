import * as React from 'react';
import {
  useDataTable,
  DataTableView,
  DataTableSearch,
  DataTableFilters,
  DataTableFieldFilter,
  DataTableSort,
  DataTableColumns,
  DataTableReset,
  DataTableActiveFilters,
  DataTablePagination,
  DataTableSelectionToggle,
  DataTableSelectionActions,
  H3,
  P,
  Button,
  type DataTableFilterField,
} from '@plain/ui';
import { invoices, invoiceColumns } from '../demos';

type Invoice = (typeof invoices)[number];
const fields: DataTableFilterField<Invoice>[] = [
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
  { id: 'customer', label: 'Customer', type: 'text' },
];

export default function DataTableControlsExample() {
  const [data, setData] = React.useState(invoices);
  const [mode, setMode] = React.useState<'browse' | 'selection'>('browse');
  const table = useDataTable({
    data,
    columns: invoiceColumns,
    filterFields: fields,
    getRowId: (row) => row.id,
    pageSize: 3,
  });
  return (
    <section
      aria-label="Custom invoice workspace"
      style={{ display: 'grid', gap: 24, inlineSize: '100%', minInlineSize: 0 }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <H3>Invoices</H3>
          <P tone="muted">Controls live in your page layout.</P>
        </div>
        <div style={{ flex: '1 1 220px', maxWidth: 320, minWidth: 0 }}>
          <DataTableSearch table={table} placeholder="Search invoices" />
        </div>
      </header>
      <div
        role="group"
        aria-label="Invoice tools"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
      >
        <DataTableFilters table={table} fields={fields} />
        <DataTableFieldFilter table={table} field={fields[0]} />
        <DataTableSort table={table} />
        <DataTableColumns table={table} />
        <DataTableSelectionToggle table={table} mode={mode} onModeChange={setMode} />
        <DataTableReset table={table} />
      </div>
      <DataTableActiveFilters table={table} fields={fields} />
      <DataTableView
        table={table}
        caption="Customer invoices"
        showToolbar={false}
        showPagination={false}
        selectable
        mode={mode}
        onModeChange={setMode}
      />
      <DataTableSelectionActions table={table}>
        <Button
          size="sm"
          onClick={() => {
            const selected = new Set(table.getSelectedRowIds());
            setData((current) => current.filter((row) => !selected.has(row.id)));
            table.resetRowSelection(true);
          }}
        >
          Archive selected invoices
        </Button>
      </DataTableSelectionActions>
      <footer aria-label="Invoice pagination">
        <DataTablePagination
          table={table}
          pageSizes={[3, 6, 12]}
          selectable={mode === 'selection'}
        />
      </footer>
    </section>
  );
}
