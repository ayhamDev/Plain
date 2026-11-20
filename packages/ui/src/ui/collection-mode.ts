import * as React from 'react';

export type CollectionMode = 'browse' | 'selection';
export interface CollectionModeProps {
  mode?: CollectionMode;
  defaultMode?: CollectionMode;
  onModeChange?: (mode: CollectionMode) => void;
}
export function useCollectionMode(
  { mode, defaultMode, onModeChange }: CollectionModeProps,
  fallback: CollectionMode,
) {
  const [local, setLocal] = React.useState(defaultMode);
  const change = (next: CollectionMode) => {
    if (mode === undefined) setLocal(next);
    onModeChange?.(next);
  };
  return [mode ?? local ?? fallback, change] as const;
}
