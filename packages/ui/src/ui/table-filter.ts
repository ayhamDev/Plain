export type DataTableFilterOperator =
  | 'contains'
  | 'notContains'
  | 'eq'
  | 'neq'
  | 'in'
  | 'notIn'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'empty'
  | 'notEmpty';
export interface DataTableFilter {
  id: string;
  field: string;
  operator: DataTableFilterOperator;
  value?: string | number | boolean | Date | (string | number | boolean | Date)[];
}
export interface DataTableQuery {
  search: string;
  filters: DataTableFilter[];
  join: 'and' | 'or';
}
export interface DataTableFilterField<T = unknown> {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'enum' | 'boolean';
  options?: readonly { value: string | number | boolean; label: string }[];
  getValue?: (row: T) => unknown;
  operators?: readonly DataTableFilterOperator[];
  test?: (value: unknown, filter: DataTableFilter) => boolean;
}
export const emptyTableQuery: DataTableQuery = { search: '', filters: [], join: 'and' };
export function tableQuery(value: unknown): DataTableQuery {
  return typeof value === 'string'
    ? { ...emptyTableQuery, search: value }
    : value && typeof value === 'object' && 'filters' in value
      ? (value as DataTableQuery)
      : emptyTableQuery;
}
export function isActiveTableFilter(rule: DataTableFilter) {
  if (rule.operator === 'empty' || rule.operator === 'notEmpty') return true;
  if (Array.isArray(rule.value))
    return (
      rule.value.length > 0 &&
      (rule.operator !== 'between' || rule.value.length === 2) &&
      rule.value.every((value) => value !== '')
    );
  return rule.value !== undefined && rule.value !== '';
}
export function testTableFilter(
  value: unknown,
  rule: DataTableFilter,
  kind: DataTableFilterField['type'] = 'text',
) {
  const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
  if (rule.operator === 'empty') return empty;
  if (rule.operator === 'notEmpty') return !empty;
  if (empty || rule.value === undefined || rule.value === '') return false;
  const comparable = (v: unknown): string | number =>
    kind === 'number'
      ? Number(v)
      : kind === 'date'
        ? v instanceof Date
          ? Math.floor(v.getTime() / 86400000)
          : Math.floor(Date.parse(String(v)) / 86400000)
        : String(v).toLowerCase();
  const current = comparable(value),
    expected = comparable(rule.value);
  if (typeof current === 'number' && !Number.isFinite(current)) return false;
  if (!Array.isArray(rule.value) && typeof expected === 'number' && !Number.isFinite(expected))
    return false;
  switch (rule.operator) {
    case 'contains':
      return String(current).includes(String(expected));
    case 'notContains':
      return !String(current).includes(String(expected));
    case 'eq':
      return current === expected;
    case 'neq':
      return current !== expected;
    case 'in':
      return Array.isArray(rule.value) && rule.value.some((item) => comparable(item) === current);
    case 'notIn':
      return Array.isArray(rule.value) && !rule.value.some((item) => comparable(item) === current);
    case 'gt':
      return current > expected;
    case 'gte':
      return current >= expected;
    case 'lt':
      return current < expected;
    case 'lte':
      return current <= expected;
    case 'between':
      return (
        Array.isArray(rule.value) &&
        rule.value.length === 2 &&
        current >= comparable(rule.value[0]) &&
        current <= comparable(rule.value[1])
      );
  }
}
export function filterOperators<T>(
  field: DataTableFilterField<T>,
): readonly DataTableFilterOperator[] {
  return (
    field.operators ??
    (field.type === 'select' || field.type === 'enum'
      ? ['in', 'notIn', 'eq', 'neq', 'empty', 'notEmpty']
      : field.type === 'boolean'
        ? ['eq', 'neq']
        : field.type === 'number' || field.type === 'date'
          ? ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty']
          : ['contains', 'notContains', 'eq', 'neq', 'empty', 'notEmpty'])
  );
}
