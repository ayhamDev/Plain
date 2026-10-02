import type { BlockDefinition, TemplateDefinition } from './compositions/types';

export type CompositionItem = BlockDefinition | TemplateDefinition;
export const compositionLabels: Readonly<Record<string, string>> = {
  authentication: 'Authentication',
  navigation: 'Navigation',
  overview: 'Overview',
  charts: 'Charts',
  forms: 'Forms',
  tables: 'Tables',
  scheduling: 'Scheduling',
  collaboration: 'Collaboration',
  commerce: 'Commerce',
  finance: 'Finance',
  settings: 'Settings',
  mobile: 'Mobile',
  'web-apps': 'Web Apps',
  'mobile-apps': 'Mobile Apps',
  'desktop-apps': 'Desktop Apps',
  dashboards: 'Dashboards',
  websites: 'Websites',
};
export const previewWidths = { desktop: 1024, tablet: 768, mobile: 375 } as const;
export type PreviewWidth = keyof typeof previewWidths;
export function filterCompositions<T extends CompositionItem>(
  items: readonly T[],
  query: string,
  category: string,
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      terms.every((term) =>
        `${item.id} ${item.name} ${item.description} ${compositionLabels[item.category]} ${item.tags.join(' ')}`
          .toLowerCase()
          .includes(term),
      ),
  );
}
export function compositionImage(item: CompositionItem) {
  if ('family' in item.config)
    return item.config.family === 'commerce'
      ? item.config.products.find((product) => product.image)?.image
      : undefined;
  return item.config.website?.image;
}
export function compositionShape(item: CompositionItem) {
  return 'family' in item.config ? item.config.family : item.config.layout;
}
