import * as React from 'react';
import { Layers } from 'lucide-react';
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from '../../ui';

export function EmptyCollection({ kind }: { kind: 'Blocks' | 'Templates' }) {
  React.useEffect(() => {
    document.title = `${kind} - P.UI`;
  }, [kind]);
  return (
    <article className="documentation-page collection-page">
      <h1>{kind}</h1>
      <EmptyState>
        <EmptyStateIcon>
          <Layers size={24} aria-hidden="true" />
        </EmptyStateIcon>
        <EmptyStateTitle>No {kind.toLowerCase()} yet</EmptyStateTitle>
        <EmptyStateDescription>This collection is starting fresh.</EmptyStateDescription>
      </EmptyState>
    </article>
  );
}
export default function BlocksPage() {
  return <EmptyCollection kind="Blocks" />;
}
