import * as React from 'react';
import { operationalTemplates } from './catalog/templates-operational';
import { personalTemplates } from './catalog/templates-personal';
import { websiteTemplates } from './catalog/templates-websites';
import { sourceComponentName, sourceURL } from './source';
import type { TemplateConfig, TemplateDefinition } from './types';
import type { TemplateSeed } from './catalog/template-helpers';

const LazyTemplateRenderer = React.lazy(() =>
  import('./TemplateRenderer').then((module) => ({ default: module.TemplateRenderer })),
);
export function TemplateRenderer({ config }: { config: TemplateConfig }) {
  return (
    <React.Suspense
      fallback={
        <div className="pb-loading" role="status">
          Loading {config.brand}
        </div>
      }
    >
      <LazyTemplateRenderer config={config} />
    </React.Suspense>
  );
}
function defineTemplate(item: TemplateSeed): TemplateDefinition {
  const Component = () => <TemplateRenderer config={item.config} />;
  Component.displayName = sourceComponentName(item.id);
  return {
    ...item,
    component: Component,
    render: () => <Component />,
    sourceURL: sourceURL('templates', item.id),
  };
}
export const templateRegistry: readonly TemplateDefinition[] = [
  ...operationalTemplates,
  ...personalTemplates,
  ...websiteTemplates,
].map(defineTemplate);
export const templates = templateRegistry;
export const templateById: ReadonlyMap<string, TemplateDefinition> = new Map(
  templateRegistry.map((item) => [item.id, item]),
);
export function getTemplate(id: string) {
  return templateById.get(id);
}
export function Template({ id, config }: { id: string; config?: TemplateConfig }) {
  const item = getTemplate(id);
  if (!item) throw new Error(`Unknown @plain/ui template: ${id}`);
  return <TemplateRenderer key={id} config={config ?? item.config} />;
}
