import * as React from 'react';
import { Check, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../../../ui/primitives';
import { Checkbox } from '../../../ui/forms';
import { DataTable, type DataTableColumn } from '../../../ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import {
  BlockHeading,
  ChoiceSelect,
  EntryDialog,
  ExportButton,
  exportCsv,
  money,
  SearchField,
  StateBadge,
  Status,
} from '../helpers';
import type { FormField, RecordItem, TableConfig } from '../types';

export function TableBlock({ config }: { config: TableConfig }) {
  const [rows, setRows] = React.useState<RecordItem[]>(() => [...config.rows]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [selected, setSelected] = React.useState<string[]>([]);
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [create, setCreate] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const visible = rows.filter(
    (row) =>
      Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'All' || row.status === filter),
  );
  const amountColumn = config.columns.some((column) => column.key === 'value');
  const actionStatus = {
    directory: 'Active',
    inventory: 'In stock',
    invoices: 'Paid',
    tickets: 'Resolved',
    audit: 'Info',
    leads: 'Won',
    deployments: 'Ready',
    expenses: 'Approved',
    orders: 'Dispatched',
    timesheets: 'Approved',
  }[config.variant];
  const actionLabel = {
    directory: 'Activate',
    inventory: 'Restock',
    invoices: 'Mark paid',
    tickets: 'Resolve',
    audit: 'Acknowledge',
    leads: 'Mark won',
    deployments: 'Retry build',
    expenses: 'Approve',
    orders: 'Dispatch',
    timesheets: 'Approve',
  }[config.variant];
  const fields: FormField[] = React.useMemo(
    () =>
      config.columns
        .filter((column) => column.key !== 'id')
        .map((column) => ({
          name: column.key,
          label: column.label,
          type:
            column.key === 'value'
              ? 'number'
              : column.key === 'date' && config.variant !== 'audit'
                ? 'date'
                : column.key === 'status'
                  ? 'select'
                  : 'text',
          required: column.key === 'title',
          options:
            column.key === 'status'
              ? config.statuses.map((label) => ({ value: label, label }))
              : undefined,
          initial: edit
            ? String(detail?.[column.key] ?? '')
            : column.key === 'status'
              ? config.statuses[0]
              : '',
          min: column.key === 'value' ? 0 : undefined,
        })),
    [config, edit, detail],
  );
  const updateStatus = (ids: readonly string[]) => {
    setRows(
      rows.map((row) =>
        ids.includes(row.id)
          ? {
              ...row,
              status: actionStatus,
              ...(config.variant === 'inventory' ? { value: (row.value ?? 0) + 20 } : {}),
            }
          : row,
      ),
    );
    setSelected([]);
    setDetail(undefined);
    setFeedback(`${ids.length} ${ids.length === 1 ? 'record' : 'records'} updated`);
  };
  const columns: DataTableColumn<RecordItem>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="Select visible records"
          checked={visible.length > 0 && visible.every((row) => selected.includes(row.id))}
          onCheckedChange={(checked) =>
            setSelected(
              checked
                ? [...new Set([...selected, ...visible.map((row) => row.id)])]
                : selected.filter((id) => !visible.some((row) => row.id === id)),
            )
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={selected.includes(row.original.id)}
          onCheckedChange={(checked) =>
            setSelected(
              checked
                ? [...selected, row.original.id]
                : selected.filter((id) => id !== row.original.id),
            )
          }
        />
      ),
      enableSorting: false,
    },
    ...config.columns.map((column): DataTableColumn<RecordItem> => ({
      accessorKey: column.key,
      header: column.label,
      cell: ({ row }) =>
        column.format === 'status' ? (
          <StateBadge value={row.original.status ?? 'Pending'} />
        ) : column.format === 'money' ? (
          <span className="pb-number">{money(row.original.value ?? 0)}</span>
        ) : column.key === 'title' ? (
          <button type="button" className="pb-table-name" onClick={() => setDetail(row.original)}>
            {row.original.title}
          </button>
        ) : (
          <span className={column.format === 'number' ? 'pb-number' : undefined}>
            {row.original[column.key]}
          </span>
        ),
    })),
    {
      id: 'actions',
      header: 'Details',
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="ghost"
          title="Open record"
          aria-label={`Open ${row.original.title}`}
          onClick={() => setDetail(row.original)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      ),
      enableSorting: false,
    },
  ];
  return (
    <section data-block="tables" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={`${rows.length} records`}
        actions={
          <>
            <ExportButton
              onClick={() =>
                exportCsv(
                  `${config.variant}.csv`,
                  config.columns.map((column) => column.label),
                  visible.map((row) => config.columns.map((column) => row[column.key])),
                )
              }
            />
            <Button
              size="sm"
              onClick={() => {
                setEdit(false);
                setCreate(true);
              }}
            >
              <Plus aria-hidden="true" />
              {config.action}
            </Button>
          </>
        }
      />
      <div className="pb-toolbar">
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value);
            setSelected([]);
          }}
          label={`Search ${config.title.toLowerCase()}`}
        />
        <ChoiceSelect
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setSelected([]);
          }}
          label="Record status"
          choices={['All', ...config.statuses].map((label) => ({ value: label, label }))}
        />
      </div>
      {selected.length > 0 && (
        <div className="pb-selection-bar">
          <strong>{selected.length} selected</strong>
          <Button size="sm" variant="outline" onClick={() => updateStatus(selected)}>
            <Check aria-hidden="true" />
            {actionLabel}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear selection
          </Button>
        </div>
      )}
      <div
        className="pb-table-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${config.title} table`}
      >
        <DataTable
          data={visible}
          columns={columns}
          searchable={false}
          pageSize={5}
          caption={config.title}
          getRowId={(row) => row.id}
        />
      </div>
      {amountColumn && (
        <footer className="pb-table-total">
          <span>{visible.length} matching records</span>
          <strong>
            {config.columns.find((column) => column.key === 'value')?.label}:{' '}
            {config.columns.find((column) => column.key === 'value')?.format === 'money'
              ? money(visible.reduce((sum, row) => sum + (row.value ?? 0), 0))
              : visible.reduce((sum, row) => sum + (row.value ?? 0), 0).toLocaleString('en-US')}
          </strong>
        </footer>
      )}
      <Dialog open={!!detail && !create} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>
            {detail?.id} · {detail?.detail}
          </DialogDescription>
          <dl className="pb-details">
            {config.columns.map((column) => (
              <div key={column.key}>
                <dt>{column.label}</dt>
                <dd>
                  {column.format === 'money' ? money(detail?.value ?? 0) : detail?.[column.key]}
                </dd>
              </div>
            ))}
          </dl>
          <div className="pb-actions">
            <Button
              disabled={detail?.status === actionStatus && config.variant !== 'inventory'}
              onClick={() => detail && updateStatus([detail.id])}
            >
              <Check aria-hidden="true" />
              {actionLabel}
            </Button>
            {config.editable && (
              <Button
                variant="outline"
                onClick={() => {
                  setEdit(true);
                  setCreate(true);
                }}
              >
                Edit record
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={edit ? 'Edit record' : config.action}
        fields={fields}
        action={edit ? 'Save changes' : 'Create'}
        onSubmit={(values) => {
          const item: RecordItem = {
            id: edit && detail ? detail.id : `REC-${rows.length + 1001}`,
            title: values.title || 'New record',
            detail: values.detail || '',
            status: values.status || config.statuses[0],
            ...(values.value ? { value: Number(values.value) } : {}),
            ...(values.owner ? { owner: values.owner } : {}),
            ...(values.date ? { date: values.date } : {}),
          };
          setRows(edit ? rows.map((row) => (row.id === item.id ? item : row)) : [...rows, item]);
          setDetail(undefined);
          setFeedback(edit ? 'Record updated' : 'Record created');
        }}
      />
      <Status>{feedback}</Status>
    </section>
  );
}
