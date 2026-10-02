import type { ComponentType, ReactElement } from 'react';

export const blockCategories = [
  'authentication',
  'navigation',
  'overview',
  'charts',
  'forms',
  'tables',
  'scheduling',
  'collaboration',
  'commerce',
  'finance',
  'settings',
  'mobile',
] as const;
export type BlockCategory = (typeof blockCategories)[number];
export const templateCategories = [
  'web-apps',
  'mobile-apps',
  'desktop-apps',
  'dashboards',
  'websites',
] as const;
export type TemplateCategory = (typeof templateCategories)[number];

export interface ItemMetadata<C extends string> {
  id: string;
  name: string;
  category: C;
  description: string;
  tags: readonly string[];
}
export interface Choice {
  value: string;
  label: string;
}
export interface RecordItem {
  id: string;
  title: string;
  detail: string;
  status?: string;
  value?: number;
  owner?: string;
  date?: string;
}
export interface ConfigBase {
  title: string;
  subtitle?: string;
}
export interface AuthenticationConfig extends ConfigBase {
  family: 'authentication';
  variant:
    | 'password'
    | 'signup'
    | 'magic-link'
    | 'verification'
    | 'recovery'
    | 'reset'
    | 'invitation'
    | 'workspace'
    | 'unlock'
    | 'device';
  brand: string;
  action: string;
  choices?: readonly Choice[];
}
export interface NavigationConfig extends ConfigBase {
  family: 'navigation';
  variant:
    | 'sidebar'
    | 'topbar'
    | 'command'
    | 'breadcrumb'
    | 'tabs'
    | 'rail'
    | 'tree'
    | 'workspace'
    | 'pagination'
    | 'bottom';
  items: readonly RecordItem[];
}
export interface OverviewConfig extends ConfigBase {
  family: 'overview';
  variant:
    | 'metrics'
    | 'health'
    | 'checklist'
    | 'activity'
    | 'goals'
    | 'tasks'
    | 'files'
    | 'usage'
    | 'announcements'
    | 'risks';
  items: readonly RecordItem[];
}
export interface ChartDatum {
  name: string;
  primary: number;
  secondary?: number;
}
export interface ChartConfig extends ConfigBase {
  family: 'charts';
  variant:
    | 'area'
    | 'bar'
    | 'line'
    | 'donut'
    | 'stacked'
    | 'horizontal'
    | 'composed'
    | 'radar'
    | 'scatter'
    | 'funnel';
  series: readonly ChartDatum[];
  primaryLabel: string;
  secondaryLabel?: string;
  unit?: string;
}
export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'time'
    | 'checkbox'
    | 'password'
    | 'file';
  required?: boolean;
  placeholder?: string;
  options?: readonly Choice[];
  initial?: string;
  min?: number;
  max?: number;
  group?: string;
}
export interface FormConfig extends ConfigBase {
  family: 'forms';
  variant:
    | 'stacked'
    | 'sections'
    | 'wizard'
    | 'split'
    | 'inline'
    | 'survey'
    | 'upload'
    | 'editor'
    | 'address'
    | 'reservation';
  fields: readonly FormField[];
  action: string;
}
export interface TableColumnConfig {
  key: keyof RecordItem;
  label: string;
  format?: 'money' | 'number' | 'status';
}
export interface TableConfig extends ConfigBase {
  family: 'tables';
  variant:
    | 'directory'
    | 'inventory'
    | 'invoices'
    | 'tickets'
    | 'audit'
    | 'leads'
    | 'deployments'
    | 'expenses'
    | 'orders'
    | 'timesheets';
  columns: readonly TableColumnConfig[];
  rows: readonly RecordItem[];
  action: string;
  statuses: readonly string[];
  editable?: boolean;
}
export interface ScheduleConfig extends ConfigBase {
  family: 'scheduling';
  variant:
    | 'booking'
    | 'agenda'
    | 'week'
    | 'availability'
    | 'shifts'
    | 'rooms'
    | 'deadline'
    | 'range'
    | 'event'
    | 'timezone';
  date: string;
  items: readonly RecordItem[];
  slots: readonly string[];
}
export interface CollaborationConfig extends ConfigBase {
  family: 'collaboration';
  variant:
    | 'board'
    | 'thread'
    | 'comments'
    | 'members'
    | 'approval'
    | 'notes'
    | 'poll'
    | 'inbox'
    | 'handoff'
    | 'files';
  items: readonly RecordItem[];
  choices?: readonly string[];
}
export interface ProductItem {
  id: string;
  name: string;
  detail: string;
  price: number;
  image?: string;
  options?: readonly string[];
}
export interface CommerceConfig extends ConfigBase {
  family: 'commerce';
  variant:
    | 'product'
    | 'catalog'
    | 'cart'
    | 'checkout'
    | 'order'
    | 'plans'
    | 'bundle'
    | 'discount'
    | 'returns'
    | 'compare';
  products: readonly ProductItem[];
}
export interface FinanceConfig extends ConfigBase {
  family: 'finance';
  variant:
    | 'budget'
    | 'expense'
    | 'transfer'
    | 'invoice'
    | 'approvals'
    | 'transactions'
    | 'reconcile'
    | 'payout'
    | 'billing'
    | 'forecast';
  items: readonly RecordItem[];
  balance: number;
  currency?: string;
}
export interface SettingItem {
  id: string;
  label: string;
  detail: string;
  enabled?: boolean;
  value?: string;
}
export interface SettingsConfig extends ConfigBase {
  family: 'settings';
  variant:
    | 'profile'
    | 'workspace'
    | 'notifications'
    | 'security'
    | 'billing'
    | 'api'
    | 'integrations'
    | 'team'
    | 'appearance'
    | 'danger';
  items: readonly SettingItem[];
}
export interface MobileConfig extends ConfigBase {
  family: 'mobile';
  variant:
    | 'inbox'
    | 'wallet'
    | 'fitness'
    | 'delivery'
    | 'player'
    | 'contacts'
    | 'checkin'
    | 'habits'
    | 'tickets'
    | 'capture';
  items: readonly RecordItem[];
}
export type BlockConfig =
  | AuthenticationConfig
  | NavigationConfig
  | OverviewConfig
  | ChartConfig
  | FormConfig
  | TableConfig
  | ScheduleConfig
  | CollaborationConfig
  | CommerceConfig
  | FinanceConfig
  | SettingsConfig
  | MobileConfig;
export interface BlockDefinition extends ItemMetadata<BlockCategory> {
  config: BlockConfig;
  component: ComponentType;
  render: () => ReactElement;
  /** Documentation-only, self-contained copy/paste TSX. Not an npm package export. */
  sourceURL: string;
}
export type TemplateLayout =
  'sidebar' | 'topbar' | 'split' | 'workbench' | 'dashboard' | 'mobile' | 'website' | 'editorial';
export interface TemplateRoute {
  id: string;
  label: string;
  title: string;
  blockIds: readonly string[];
  blockOverrides?: Readonly<Record<string, BlockConfig>>;
  layout?: 'columns' | 'stack' | 'wide-first';
}
export interface WebsiteConfig {
  heroTitle: string;
  heroCopy: string;
  image?: string;
  imageAlt?: string;
  action: string;
}
export interface TemplateConfig {
  brand: string;
  layout: TemplateLayout;
  routes: readonly TemplateRoute[];
  initialRoute?: string;
  primaryAction: string;
  createFields: readonly FormField[];
  website?: WebsiteConfig;
}
export interface TemplateDefinition extends ItemMetadata<TemplateCategory> {
  config: TemplateConfig;
  component: ComponentType;
  render: () => ReactElement;
  sourceURL: string;
}
