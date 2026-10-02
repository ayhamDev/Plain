import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { version } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inertAttribute(enabled: boolean, reactVersion = version): boolean | undefined {
  if (!enabled) return undefined;
  // React 18 forwards inert as a string; React 19 handles the native boolean attribute.
  return reactVersion.startsWith('18.') ? ('' as unknown as boolean) : true;
}
