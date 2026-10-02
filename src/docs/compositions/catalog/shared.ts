import type {
  BlockConfig,
  BlockCategory,
  Choice,
  FormField,
  ItemMetadata,
  RecordItem,
} from '../types';

export interface BlockSeed extends ItemMetadata<BlockCategory> {
  config: BlockConfig;
}
export const seed = (
  id: string,
  name: string,
  description: string,
  tags: readonly string[],
  config: BlockConfig,
): BlockSeed => ({ id, name, description, tags, category: config.family, config });
export const row = (
  id: string,
  title: string,
  detail: string,
  status?: string,
  value?: number,
  owner?: string,
  date?: string,
): RecordItem => ({
  id,
  title,
  detail,
  ...(status ? { status } : {}),
  ...(value !== undefined ? { value } : {}),
  ...(owner ? { owner } : {}),
  ...(date ? { date } : {}),
});
export const choices = (...labels: string[]): Choice[] =>
  labels.map((label) => ({ value: label, label }));
export const field = (
  name: string,
  label: string,
  type: FormField['type'] = 'text',
  extra: Partial<Omit<FormField, 'name' | 'label' | 'type'>> = {},
): FormField => ({ name, label, type, ...extra });
