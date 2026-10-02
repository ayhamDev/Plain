import { MultiSelect } from './advanced';
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './forms';
import { DatePicker } from './calendar';
import { useTranslation } from './i18n';
import { Chip } from './chips';
import { Popover, PopoverContent, PopoverTrigger } from './overlays';
import { filterOperators, type DataTableFilter, type DataTableFilterField } from './table-filter';

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return undefined;
  const year = Number(match[1]),
    month = Number(match[2]) - 1,
    day = Number(match[3]);
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : undefined;
}
function fromDate(value?: Date) {
  return value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : '';
}
export function filterSummary<T>(
  field: DataTableFilterField<T>,
  rule: DataTableFilter,
  booleanLabels?: readonly [string, string],
) {
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  return values
    .filter((v) => v !== undefined && v !== '')
    .map(
      (v) =>
        field.options?.find((o) => o.value === v)?.label ??
        (typeof v === 'boolean' && booleanLabels
          ? booleanLabels[v ? 1 : 0]
          : v instanceof Date
            ? fromDate(v)
            : String(v)),
    )
    .join(', ');
}
export function DataTableFilterValue<T>({
  field,
  rule,
  onChange,
}: {
  field: DataTableFilterField<T>;
  rule: DataTableFilter;
  onChange: (value: DataTableFilter['value']) => void;
}) {
  const { t } = useTranslation();
  if (rule.operator === 'empty' || rule.operator === 'notEmpty') return null;
  if (field.type === 'select' || field.type === 'enum' || field.type === 'boolean') {
    const choices =
      field.type === 'boolean'
        ? [
            { value: true, label: t('common.yes') },
            { value: false, label: t('common.no') },
          ]
        : (field.options ?? []);
    const options = choices.map((o, i) => ({ value: String(i), label: o.label }));
    if (rule.operator === 'in' || rule.operator === 'notIn')
      return (
        <MultiSelect
          options={options}
          aria-label={t('table.valueFor', { label: field.label })}
          placeholder={t('select.options')}
          value={choices.flatMap((o, i) =>
            Array.isArray(rule.value) && rule.value.includes(o.value) ? [String(i)] : [],
          )}
          onValueChange={(values) => onChange(values.map((v) => choices[Number(v)].value))}
        />
      );
    const selected = choices.findIndex(
      (o) => o.value === rule.value || String(o.value) === rule.value,
    );
    return (
      <Select
        value={selected >= 0 ? String(selected) : ''}
        onValueChange={(value) => onChange(choices[Number(value)].value)}
      >
        <SelectTrigger aria-label={t('table.valueFor', { label: field.label })}>
          <SelectValue placeholder={t('select.options')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  const control = (value: unknown, change: (value: string | number) => void, label: string) =>
    field.type === 'date' ? (
      <DatePicker
        aria-label={label}
        value={toDate(value)}
        onValueChange={(date) => change(fromDate(date))}
      />
    ) : (
      <Input
        aria-label={label}
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(event) =>
          change(
            field.type === 'number' && event.target.value !== ''
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    );
  if (rule.operator === 'between')
    return (
      <div className="ui-table-filter-between">
        {[0, 1].map((i) => (
          <span key={i}>
            {control(
              Array.isArray(rule.value) ? rule.value[i] : '',
              (value) => {
                const pair = Array.isArray(rule.value) ? [...rule.value] : ['', ''];
                pair[i] = value;
                onChange(pair);
              },
              t(i ? 'table.maximum' : 'table.minimum'),
            )}
          </span>
        ))}
      </div>
    );
  return control(rule.value, onChange, t('table.valueFor', { label: field.label }));
}
export function DataTableSimpleFilter<T>({
  field,
  rule,
  onChange,
  onRemove,
}: {
  field: DataTableFilterField<T>;
  rule?: DataTableFilter;
  onChange: (rule: DataTableFilter) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const current = rule ?? {
    id: `simple-${field.id}`,
    field: field.id,
    operator: filterOperators(field)[0],
  };
  const summary = rule ? filterSummary(field, rule, [t('common.no'), t('common.yes')]) : '';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Chip
          behavior="action"
          selected={!!summary || (!!rule && ['empty', 'notEmpty'].includes(rule.operator))}
          showCheck={false}
        >
          {field.label}
          {summary ? `: ${summary}` : ''}
        </Chip>
      </PopoverTrigger>
      <PopoverContent align="start" className="ui-table-simple-filter">
        <strong>{field.label}</strong>
        <Select
          value={current.operator}
          onValueChange={(operator) =>
            onChange({
              ...current,
              operator: operator as DataTableFilter['operator'],
              value: undefined,
            })
          }
        >
          <SelectTrigger aria-label={t('table.filterOperator')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOperators(field).map((o) => (
              <SelectItem key={o} value={o}>
                {t(`filter.${o}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DataTableFilterValue
          field={field}
          rule={current}
          onChange={(value) => onChange({ ...current, value })}
        />
        <Chip behavior="action" onClick={onRemove}>
          {t('common.clear')}
        </Chip>
      </PopoverContent>
    </Popover>
  );
}
