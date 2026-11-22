import * as React from 'react';

interface MediaStore {
  factory: typeof window.matchMedia;
  subscribers: Set<() => void>;
  snapshot: () => boolean;
  subscribe: (subscriber: () => void) => () => void;
}
const windows = /* @__PURE__ */ new WeakMap<Window, Map<string, MediaStore>>();
const inactive = () => () => {};
const serverSnapshot = () => false;

function storeFor(query: string): MediaStore | undefined {
  if (typeof window === 'undefined') return;
  let stores = windows.get(window);
  if (!stores) windows.set(window, (stores = new Map()));
  let store = stores.get(query);
  if (store?.factory === window.matchMedia) return store;
  const media = window.matchMedia(query);
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach((subscriber) => subscriber());
  store = {
    factory: window.matchMedia,
    subscribers,
    snapshot: () => media.matches,
    subscribe: (subscriber) => {
      if (!subscribers.size) media.addEventListener('change', notify);
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
        if (!subscribers.size) media.removeEventListener('change', notify);
      };
    },
  };
  // Keep active queries and a bounded set of reusable, unsubscribed queries.
  if (stores.size >= 32) {
    for (const [key, candidate] of stores) {
      if (!candidate.subscribers.size) stores.delete(key);
      if (stores.size < 32) break;
    }
  }
  stores.set(query, store);
  return store;
}

export function mediaQueryMatches(query: string) {
  return storeFor(query)?.snapshot() ?? false;
}

/** One native listener per window/query, with no subscription for fixed layouts. */
export function useMediaQuery(query: string, enabled = true) {
  const store = React.useMemo(() => (enabled ? storeFor(query) : undefined), [query, enabled]);
  return React.useSyncExternalStore(
    store?.subscribe ?? inactive,
    store?.snapshot ?? serverSnapshot,
    serverSnapshot,
  );
}
