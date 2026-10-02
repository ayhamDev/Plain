import * as React from 'react';
import { ArrowRight, Check, ChevronRight, Plus, X } from 'lucide-react';
import { Badge, Button, EmptyState, Progress } from '../../../ui/primitives';
import { Checkbox, Field, Input, Slider } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import {
  BlockHeading,
  ChoiceSelect,
  ConfigField,
  ExportButton,
  exportCsv,
  initialValues,
  money,
  SearchField,
  StateBadge,
  Status,
  validateFields,
} from '../helpers';
import type { FinanceConfig, FormField, RecordItem } from '../types';

const expenseFields: FormField[] = [
  { name: 'merchant', label: 'Merchant', type: 'text', required: true },
  { name: 'amount', label: 'Amount (USD)', type: 'number', required: true, min: 0.01 },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Travel', 'Meals', 'Supplies', 'Software'].map((label) => ({ value: label, label })),
  },
  { name: 'date', label: 'Expense date', type: 'date', required: true },
  { name: 'receipt', label: 'Receipt', type: 'file' },
];
export function FinanceBlock({ config }: { config: FinanceConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [amount, setAmount] = React.useState('');
  const [from, setFrom] = React.useState(config.items[0]?.id ?? '');
  const [to, setTo] = React.useState(config.items[1]?.id ?? config.items[0]?.id ?? '');
  const [date, setDate] = React.useState('2026-10-05');
  const [balance, setBalance] = React.useState(config.balance);
  const [review, setReview] = React.useState(false);
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(config.items.map((item) => [item.id, 1])),
  );
  const [tax, setTax] = React.useState(10);
  const [seats, setSeats] = React.useState(config.items[0]?.value ?? 8);
  const [revenue, setRevenue] = React.useState(config.items[0]?.value ?? 8200);
  const [expenses, setExpenses] = React.useState(config.items[1]?.value ?? 12400);
  const [months, setMonths] = React.useState(6);
  const [values, setValues] = React.useState(() => initialValues(expenseFields));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState('');
  const [error, setError] = React.useState('');
  const [dateError, setDateError] = React.useState('');
  const currency = config.currency ?? 'USD';
  const format = (value: number) => money(value, currency);
  const update = (id: string, patch: Partial<RecordItem>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const visible = items.filter(
    (item) =>
      `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'All' || item.status === filter),
  );
  const spending = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const invoiceSubtotal = items.reduce(
    (sum, item) => sum + (item.value ?? 0) * (quantities[item.id] ?? 1),
    0,
  );
  const transfer = config.variant === 'transfer';
  const available = transfer ? (items.find((item) => item.id === from)?.value ?? 0) : balance;
  const exportCurrent = () => {
    if (config.variant === 'invoice') {
      exportCsv(
        'INV-1048.csv',
        ['Item', 'Quantity', 'Rate', 'Amount'],
        [
          ...items.map((item) => [
            item.title,
            quantities[item.id],
            item.value,
            (item.value ?? 0) * quantities[item.id],
          ]),
          ['Tax', '', `${tax}%`, (invoiceSubtotal * tax) / 100],
          ['Total', '', '', invoiceSubtotal * (1 + tax / 100)],
        ],
      );
    } else if (config.variant === 'billing') {
      exportCsv(
        'billing.csv',
        ['Item', 'Quantity', 'Rate', 'Amount'],
        [
          ['Team seats', seats, balance, seats * balance],
          ['Storage add-on', 1, items[1]?.value ?? 12, items[1]?.value ?? 12],
          ['Account credit', 1, items[2]?.value ?? -18, items[2]?.value ?? -18],
          [
            'Total due',
            '',
            '',
            seats * balance + (items[1]?.value ?? 12) + (items[2]?.value ?? -18),
          ],
        ],
      );
    } else if (config.variant === 'forecast') {
      exportCsv(
        'forecast.csv',
        ['Month', 'Revenue', 'Expenses', 'Net cash flow', 'Projected balance'],
        Array.from({ length: months }, (_, index) => [
          index + 1,
          revenue,
          expenses,
          revenue - expenses,
          balance + (index + 1) * (revenue - expenses),
        ]),
      );
    } else {
      exportCsv(
        `${config.variant}.csv`,
        ['Title', 'Details', 'Amount', 'Status'],
        visible.map((item) => [item.title, item.detail, item.value, item.status]),
      );
    }
  };
  const reviewPayment = (event: React.FormEvent) => {
    event.preventDefault();
    setDateError('');
    const number = Number(amount);
    if (!Number.isFinite(number) || number <= 0) setError('Enter an amount greater than zero.');
    else if (number > available) setError('Amount exceeds the available balance.');
    else if (transfer && from === to) setError('Choose two different accounts.');
    else if (!transfer && (!date || date < '2026-10-01')) {
      setError('');
      setDateError('Choose a payout date on or after October 1, 2026.');
    } else {
      setError('');
      setReview(true);
    }
  };
  return (
    <section data-block="finance" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          !['expense', 'transfer', 'payout'].includes(config.variant) ? (
            <ExportButton onClick={exportCurrent} />
          ) : undefined
        }
      />
      {config.variant === 'budget' ? (
        <>
          <div className="pb-finance-balance">
            <span>Allocated</span>
            <strong>{format(spending)}</strong>
            <small>of {format(balance)} available</small>
            <Progress value={(spending / balance) * 100} aria-label="Budget allocated" />
          </div>
          <div className="pb-budget-list">
            {items.map((item) => (
              <div key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <Input
                  type="number"
                  min={0}
                  aria-label={`${item.title} budget`}
                  value={item.value ?? 0}
                  onChange={(event) =>
                    update(item.id, { value: Math.max(0, Number(event.target.value)) })
                  }
                />
                <span>USD</span>
              </div>
            ))}
          </div>
          {spending > balance && (
            <p className="pb-error" role="alert">
              Allocations exceed the budget by {format(spending - balance)}.
            </p>
          )}
          <Button
            disabled={spending > balance}
            onClick={() => setFeedback('Budget allocations saved')}
          >
            <Check aria-hidden="true" />
            Save budget
          </Button>
        </>
      ) : config.variant === 'expense' ? (
        <form
          className="pb-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next = validateFields(expenseFields, values);
            setErrors(next);
            if (!Object.keys(next).length) {
              const id = `expense-${Date.now()}`;
              setItems([
                ...items,
                {
                  id,
                  title: values.merchant,
                  detail: `${values.category} · ${values.receipt || 'No receipt'}`,
                  value: Number(values.amount),
                  date: values.date,
                  status: 'Pending',
                },
              ]);
              setFeedback(
                `Expense recorded: ${values.merchant} · ${format(Number(values.amount))}`,
              );
              setValues(initialValues(expenseFields));
            }
          }}
        >
          {expenseFields.map((field) => (
            <ConfigField
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={(value) => setValues({ ...values, [field.name]: value })}
            />
          ))}
          <Button type="submit">
            <Plus aria-hidden="true" />
            Record expense
          </Button>
          {items
            .filter((item) => item.status)
            .map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <strong>{format(item.value ?? 0)}</strong>
                <StateBadge value={item.status ?? 'Pending'} />
              </div>
            ))}
        </form>
      ) : transfer || config.variant === 'payout' ? (
        <>
          <div className="pb-finance-balance">
            <span>Available balance</span>
            <strong>{format(available)}</strong>
          </div>
          <form className="pb-form" noValidate onSubmit={reviewPayment}>
            {transfer && (
              <Field label="From account">
                <ChoiceSelect
                  label="From account"
                  value={from}
                  onChange={setFrom}
                  choices={items.map((item) => ({
                    value: item.id,
                    label: `${item.title} · ${format(item.value ?? 0)}`,
                  }))}
                />
              </Field>
            )}
            <Field label={transfer ? 'To account' : 'Destination'}>
              <ChoiceSelect
                label={transfer ? 'To account' : 'Payout destination'}
                value={to}
                onChange={setTo}
                choices={items.map((item) => ({ value: item.id, label: item.title }))}
              />
            </Field>
            <Field label="Amount (USD)" required error={error}>
              <Input
                type="number"
                min={0.01}
                max={available}
                step={0.01}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError('');
                }}
              />
            </Field>
            {!transfer && (
              <Field label="Payout date" required error={dateError}>
                <Input
                  type="date"
                  min="2026-10-01"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setDateError('');
                  }}
                />
              </Field>
            )}
            <Button type="submit">
              <ArrowRight aria-hidden="true" />
              Review {transfer ? 'transfer' : 'payout'}
            </Button>
          </form>
          <Dialog open={review} onOpenChange={setReview}>
            <DialogContent>
              <DialogTitle>Confirm {transfer ? 'transfer' : 'payout'}</DialogTitle>
              <DialogDescription>
                {format(Number(amount))} to {items.find((item) => item.id === to)?.title}
              </DialogDescription>
              <dl className="pb-details">
                <div>
                  <dt>Remaining balance</dt>
                  <dd>{format(available - Number(amount))}</dd>
                </div>
                {!transfer && (
                  <div>
                    <dt>Date</dt>
                    <dd>{date}</dd>
                  </div>
                )}
              </dl>
              <Button
                onClick={() => {
                  if (transfer)
                    setItems(
                      items.map((item) =>
                        item.id === from
                          ? { ...item, value: (item.value ?? 0) - Number(amount) }
                          : item.id === to
                            ? { ...item, value: (item.value ?? 0) + Number(amount) }
                            : item,
                      ),
                    );
                  else setBalance(balance - Number(amount));
                  setFeedback(transfer ? 'Transfer recorded' : `Payout scheduled for ${date}`);
                  setReview(false);
                  setAmount('');
                }}
              >
                <Check aria-hidden="true" />
                Confirm
              </Button>
            </DialogContent>
          </Dialog>
        </>
      ) : config.variant === 'invoice' ? (
        <>
          <div className="pb-invoice-address">
            <div>
              <strong>Northstar Studio</strong>
              <span>18 Elm Street, London</span>
            </div>
            <div>
              <span>Bill to</span>
              <strong>Meridian Product Ltd.</strong>
              <span>Due October 15, 2026</span>
            </div>
          </div>
          <div
            className="pb-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Invoice line items"
          >
            <table className="pb-native-table">
              <caption className="sr-only">Invoice line items</caption>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Rate (USD)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">
                      {item.title}
                      <small>{item.detail}</small>
                    </th>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        aria-label={`${item.title} quantity`}
                        value={quantities[item.id]}
                        onChange={(event) =>
                          setQuantities({
                            ...quantities,
                            [item.id]: Math.min(1000, Math.max(1, Number(event.target.value))),
                          })
                        }
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        aria-label={`${item.title} rate`}
                        value={item.value ?? 0}
                        onChange={(event) =>
                          update(item.id, { value: Math.max(0, Number(event.target.value)) })
                        }
                      />
                    </td>
                    <td>{format((item.value ?? 0) * quantities[item.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pb-invoice-totals">
            <Field label="Tax rate (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={tax}
                onChange={(event) => setTax(Math.min(100, Math.max(0, Number(event.target.value))))}
              />
            </Field>
            <dl className="pb-details">
              <div>
                <dt>Subtotal</dt>
                <dd>{format(invoiceSubtotal)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{format((invoiceSubtotal * tax) / 100)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  <strong>{format(invoiceSubtotal * (1 + tax / 100))}</strong>
                </dd>
              </div>
            </dl>
          </div>
          <ExportButton label="Download invoice CSV" onClick={exportCurrent} />
        </>
      ) : config.variant === 'approvals' ? (
        <>
          <div className="pb-finance-balance">
            <span>Pending approval</span>
            <strong>
              {format(
                items
                  .filter((item) => item.status === 'Pending')
                  .reduce((sum, item) => sum + (item.value ?? 0), 0),
              )}
            </strong>
            <small>
              {format(
                items
                  .filter((item) => item.status === 'Approved')
                  .reduce((sum, item) => sum + (item.value ?? 0), 0),
              )}{' '}
              approved
            </small>
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.owner} · {item.detail}
                  </small>
                </span>
                <strong>{format(item.value ?? 0)}</strong>
                <StateBadge value={item.status ?? 'Pending'} />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={item.status !== 'Pending'}
                  aria-label={`Approve ${item.title}`}
                  title="Approve payment"
                  onClick={() => update(item.id, { status: 'Approved' })}
                >
                  <Check aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={item.status !== 'Pending'}
                  aria-label={`Decline ${item.title}`}
                  title="Decline payment"
                  onClick={() => update(item.id, { status: 'Declined' })}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : config.variant === 'transactions' ? (
        <>
          <div className="pb-finance-balance">
            <span>Account balance</span>
            <strong>{format(balance)}</strong>
          </div>
          <div className="pb-toolbar">
            <SearchField value={query} onChange={setQuery} label="Search transactions" />
            <ChoiceSelect
              value={filter}
              onChange={setFilter}
              label="Transaction direction"
              choices={['All', 'Incoming', 'Outgoing'].map((label) => ({ value: label, label }))}
            />
          </div>
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.detail} · {item.date}
                  </small>
                </span>
                <strong className={item.value && item.value > 0 ? 'pb-positive' : undefined}>
                  {format(item.value ?? 0)}
                </strong>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Inspect ${item.title}`}
                  title="Transaction details"
                  onClick={() => setDetail(item)}
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          {!visible.length && <EmptyState title="No matching transactions" />}
        </>
      ) : config.variant === 'reconcile' ? (
        <>
          <div className="pb-reconcile-summary">
            <div>
              <span>Statement balance</span>
              <strong>{format(balance)}</strong>
            </div>
            <div>
              <span>Unmatched entries</span>
              <strong>{items.filter((item) => item.status !== 'Matched').length}</strong>
            </div>
            <div>
              <span>Unmatched value</span>
              <strong>
                {format(
                  items
                    .filter((item) => item.status !== 'Matched')
                    .reduce((sum, item) => sum + (item.value ?? 0), 0),
                )}
              </strong>
            </div>
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <Checkbox
                  aria-label={`Match ${item.title} ${item.id}`}
                  checked={item.status === 'Matched'}
                  onCheckedChange={(value) =>
                    update(item.id, { status: value ? 'Matched' : 'Unmatched' })
                  }
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <strong>{format(item.value ?? 0)}</strong>
                <StateBadge value={item.status ?? 'Unmatched'} />
              </div>
            ))}
          </div>
          <Button
            disabled={items.some((item) => item.status !== 'Matched')}
            onClick={() => setFeedback('Statement reconciled')}
          >
            <Check aria-hidden="true" />
            Complete reconciliation
          </Button>
        </>
      ) : config.variant === 'billing' ? (
        <>
          <div className="pb-billing-period">
            <Badge variant="outline">Oct 1-31, 2026</Badge>
            <span>Next invoice November 1</span>
          </div>
          <Field label="Active seats">
            <Input
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={(event) => setSeats(Math.min(500, Math.max(1, Number(event.target.value))))}
            />
          </Field>
          <dl className="pb-details">
            <div>
              <dt>{seats} team seats</dt>
              <dd>{format(seats * balance)}</dd>
            </div>
            <div>
              <dt>Storage add-on</dt>
              <dd>{format(items[1]?.value ?? 12)}</dd>
            </div>
            <div>
              <dt>Account credit</dt>
              <dd>{format(items[2]?.value ?? -18)}</dd>
            </div>
            <div>
              <dt>Total due</dt>
              <dd>
                <strong>
                  {format(seats * balance + (items[1]?.value ?? 12) + (items[2]?.value ?? -18))}
                </strong>
              </dd>
            </div>
          </dl>
          <Button variant="outline" onClick={() => setFeedback(`Seat count updated to ${seats}`)}>
            <Check aria-hidden="true" />
            Update seats
          </Button>
        </>
      ) : (
        <>
          <div className="pb-finance-balance">
            <span>Current cash</span>
            <strong>{format(balance)}</strong>
            <small>
              {expenses > revenue
                ? `${Math.round((balance / (expenses - revenue)) * 10) / 10} months of runway`
                : 'Positive monthly cash flow'}
            </small>
          </div>
          <div className="pb-forecast-controls">
            <Field label="Monthly revenue">
              <Input
                type="number"
                min={0}
                value={revenue}
                onChange={(event) => setRevenue(Math.max(0, Number(event.target.value)))}
              />
            </Field>
            <Field label="Monthly expenses">
              <Input
                type="number"
                min={0}
                value={expenses}
                onChange={(event) => setExpenses(Math.max(0, Number(event.target.value)))}
              />
            </Field>
            <div>
              <span>Projection: {months} months</span>
              <Slider
                min={1}
                max={12}
                step={1}
                value={[months]}
                onValueChange={(value) => setMonths(value[0])}
                aria-label="Projection months"
              />
            </div>
          </div>
          <div className="pb-table-scroll" tabIndex={0} role="region" aria-label="Cash forecast">
            <table className="pb-native-table">
              <caption className="sr-only">Cash forecast</caption>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Net cash flow</th>
                  <th>Projected balance</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: months }, (_, index) => (
                  <tr key={index}>
                    <th scope="row">Month {index + 1}</th>
                    <td>{format(revenue - expenses)}</td>
                    <td
                      className={
                        balance + (index + 1) * (revenue - expenses) < 0 ? 'pb-negative' : undefined
                      }
                    >
                      {format(balance + (index + 1) * (revenue - expenses))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>{detail?.detail}</DialogDescription>
          <dl className="pb-details">
            <div>
              <dt>Amount</dt>
              <dd>{format(detail?.value ?? 0)}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{detail?.date}</dd>
            </div>
            <div>
              <dt>Direction</dt>
              <dd>{detail?.status}</dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
      <Status>{feedback}</Status>
    </section>
  );
}
