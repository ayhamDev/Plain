import type {
  BlockConfig,
  FormField,
  TemplateCategory,
  TemplateConfig,
  TemplateRoute,
} from '../types';
import { blockSeedById as blockById } from './blocks';
import { field, row } from './shared';

export interface TemplateSeed {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  tags: readonly string[];
  config: TemplateConfig;
}
export const route = (
  id: string,
  label: string,
  title: string,
  blockIds: readonly string[],
  layout: TemplateRoute['layout'] = 'stack',
  blockOverrides?: TemplateRoute['blockOverrides'],
): TemplateRoute => ({
  id,
  label,
  title,
  blockIds,
  layout,
  ...(blockOverrides ? { blockOverrides } : {}),
});
export function adapted(id: string, title: string, subtitle?: string): BlockConfig {
  const item = blockById.get(id);
  if (!item) throw new Error(`Missing template block ${id}`);
  return { ...item.config, title, subtitle };
}
export function metrics(
  title: string,
  entries: readonly [string, string, number, string][],
): BlockConfig {
  return {
    family: 'overview',
    variant: 'metrics',
    title,
    items: entries.map(([id, label, value, detail]) => row(id, label, detail, undefined, value)),
  };
}
export function checklist(
  title: string,
  entries: readonly [string, string, string][],
): BlockConfig {
  return {
    family: 'overview',
    variant: 'checklist',
    title,
    items: entries.map(([id, label, detail], index) =>
      row(id, label, detail, index === 0 ? 'Complete' : 'Pending'),
    ),
  };
}
export const makeTemplate = (
  category: TemplateCategory,
  slug: string,
  name: string,
  description: string,
  tags: readonly string[],
  config: TemplateConfig,
): TemplateSeed => ({ category, id: `${category}-${slug}`, name, description, tags, config });
export const createRecord: readonly FormField[] = [
  field('title', 'Title', 'text', { required: true }),
  field('details', 'Details', 'textarea', { required: true }),
];
export const createProject: readonly FormField[] = [
  field('title', 'Project name', 'text', { required: true }),
  field('owner', 'Owner', 'text', { required: true }),
  field('date', 'Target date', 'date', { required: true }),
];
export const createPerson: readonly FormField[] = [
  field('title', 'Full name', 'text', { required: true }),
  field('email', 'Email', 'email', { required: true }),
  field('role', 'Role', 'text', { required: true }),
];
export const createEvent: readonly FormField[] = [
  field('title', 'Event name', 'text', { required: true }),
  field('date', 'Date', 'date', { required: true }),
  field('time', 'Time', 'time', { required: true }),
];
