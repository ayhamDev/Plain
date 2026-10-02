export const familyExports = {
  authentication: ['AuthenticationBlock', 'AuthenticationConfig'],
  navigation: ['NavigationBlock', 'NavigationConfig'],
  overview: ['OverviewBlock', 'OverviewConfig'],
  charts: ['ChartBlock', 'ChartConfig'],
  forms: ['FormBlock', 'FormConfig'],
  tables: ['TableBlock', 'TableConfig'],
  scheduling: ['SchedulingBlock', 'ScheduleConfig'],
  collaboration: ['CollaborationBlock', 'CollaborationConfig'],
  commerce: ['CommerceBlock', 'CommerceConfig'],
  finance: ['FinanceBlock', 'FinanceConfig'],
  settings: ['SettingsBlock', 'SettingsConfig'],
  mobile: ['MobileBlock', 'MobileConfig'],
} as const;
export function sourceComponentName(id: string) {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('');
}
export function sourceURL(kind: 'blocks' | 'templates', id: string) {
  return `/compositions/${kind}/${encodeURIComponent(id)}.tsx`;
}
const cache = new Map<string, Promise<string>>();
export function loadCompositionSource(url: string): Promise<string> {
  let source = cache.get(url);
  if (!source) {
    source = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Source could not load.');
        return response.text();
      })
      .catch((error: unknown) => {
        cache.delete(url);
        throw error;
      });
    cache.set(url, source);
    if (cache.size > 8) cache.delete(cache.keys().next().value!);
  }
  return source;
}
