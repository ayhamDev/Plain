import { BlockRenderer } from './renderers';
import { blockSeeds } from './catalog/blocks';
import { sourceComponentName, sourceURL } from './source';
import type { BlockDefinition, BlockConfig } from './types';
import type { BlockSeed } from './catalog/shared';

function defineBlock(item: BlockSeed): BlockDefinition {
  const Component = () => <BlockRenderer config={item.config} />;
  Component.displayName = sourceComponentName(item.id);
  return {
    ...item,
    component: Component,
    render: () => <Component />,
    sourceURL: sourceURL('blocks', item.id),
  };
}
export const blockRegistry: readonly BlockDefinition[] = blockSeeds.map(defineBlock);
export const blocks = blockRegistry;
export const blockById: ReadonlyMap<string, BlockDefinition> = new Map(
  blockRegistry.map((item) => [item.id, item]),
);
export function getBlock(id: string) {
  return blockById.get(id);
}
export function Block({ id, config }: { id: string; config?: BlockConfig }) {
  const item = getBlock(id);
  if (!item) throw new Error(`Unknown @plain/ui block: ${id}`);
  return <BlockRenderer key={id} config={config ?? item.config} />;
}
