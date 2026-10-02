import * as React from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import { Badge, Button } from '../../ui/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../ui/overlays';
import {
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
} from '../../ui/forms';
import type { Choice, FormField } from './types';

export const money = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(
    value,
  );
export function downloadText(filename: string, contents: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (typeof value === 'string' && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
) {
  downloadText(
    filename,
    [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'),
    'text/csv;charset=utf-8',
  );
}
export function BlockHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="pb-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="pb-actions">{actions}</div>}
    </header>
  );
}
export function Status({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-feedback" role="status" aria-live="polite">
      {children && (
        <>
          <Check size={15} aria-hidden="true" />
          {children}
        </>
      )}
    </p>
  );
}
export function StateBadge({ value }: { value: string }) {
  const positive = /paid|active|complete|approved|healthy|delivered|ready|resolved/i.test(value);
  const negative = /overdue|failed|blocked|critical|declined/i.test(value);
  return (
    <Badge variant={negative ? 'destructive' : positive ? 'accent' : 'outline'}>{value}</Badge>
  );
}
export function SearchField({
  value,
  onChange,
  label = 'Search',
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div className="pb-search">
      <Search size={16} aria-hidden="true" />
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Clear ${label.toLowerCase()}`}
          title="Clear search"
          onClick={() => onChange('')}
        >
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
export function ChoiceSelect({
  value,
  onChange,
  choices,
  label,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  choices: readonly Choice[];
  label: string;
} & Pick<
  React.ComponentProps<typeof SelectTrigger>,
  'id' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'aria-required'
>) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} {...props}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {choices.map((choice) => (
          <SelectItem key={choice.value} value={choice.value}>
            {choice.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function validateFields(
  fields: readonly FormField[],
  values: Readonly<Record<string, string>>,
) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.name] ?? '').trim();
    if (field.required && (!value || (field.type === 'checkbox' && value !== 'true')))
      errors[field.name] = `${field.label} is required.`;
    else if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      errors[field.name] = 'Enter a valid email address.';
    else if (value && field.type === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number)) errors[field.name] = 'Enter a valid number.';
      else if (field.min !== undefined && number < field.min)
        errors[field.name] = `Minimum ${field.min}.`;
      else if (field.max !== undefined && number > field.max)
        errors[field.name] = `Maximum ${field.max}.`;
    } else if (value && field.type === 'password' && value.length < 8)
      errors[field.name] = 'Use at least 8 characters.';
  }
  return errors;
}
export function initialValues(fields: readonly FormField[]) {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.initial ?? (field.type === 'checkbox' ? 'false' : ''),
    ]),
  );
}
export function ConfigField({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = React.useId();
  if (field.type === 'checkbox')
    return (
      <div className="pb-check-field">
        <Checkbox
          id={id}
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(String(checked === true))}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Label htmlFor={id}>{field.label}</Label>
        {error && (
          <p role="alert" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  return (
    <Field label={field.label} required={field.required} error={error}>
      {field.type === 'textarea' ? (
        <Textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === 'select' ? (
        <select
          className="pb-native-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose...</option>
          {field.options?.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      ) : field.type === 'file' ? (
        <Input type="file" onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')} />
      ) : (
        <Input
          type={field.type}
          value={value}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}
export function EntryDialog({
  open,
  onOpenChange,
  title,
  fields,
  action = 'Create',
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: readonly FormField[];
  action?: string;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = React.useState(() => initialValues(fields));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (open) {
      setValues(initialValues(fields));
      setErrors({});
    }
  }, [open, fields]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title} details</DialogDescription>
        <form
          className="pb-dialog-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next = validateFields(fields, values);
            setErrors(next);
            if (!Object.keys(next).length) {
              onSubmit(values);
              onOpenChange(false);
            }
          }}
        >
          {fields.map((field) => (
            <ConfigField
              key={field.name}
              field={field}
              value={values[field.name] ?? ''}
              error={errors[field.name]}
              onChange={(value) => setValues({ ...values, [field.name]: value })}
            />
          ))}
          <div className="pb-actions">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Check aria-hidden="true" />
              {action}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ExportButton({
  onClick,
  label = 'Export CSV',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download aria-hidden="true" />
      {label}
    </Button>
  );
}
