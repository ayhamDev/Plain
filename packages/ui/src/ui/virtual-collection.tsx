import type * as React from 'react';
import { type PlainStyleProps } from './style-context';

export interface VirtualCollectionProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>, PlainStyleProps {
  items: readonly T[];
  getItemKey: (item: T, index: number) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number | string;
  overscan?: number;
  /** Initial items rendered on the server and while a hidden viewport is unmeasurable. */
  ssrCount?: number;
  /** Gap in 8px units. Virtual positioning requires a numeric gap. */
  gap?: number;
  emptyContent?: React.ReactNode;
}
