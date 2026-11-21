import * as React from 'react';

export type MotionPolicy = 'system' | 'reduced' | 'none';
const MotionPolicyContext = /* @__PURE__ */ React.createContext<MotionPolicy>('system');
const subscribers = new Set<() => void>();
let media: MediaQueryList | undefined;
const notify = () => {
  for (const subscriber of subscribers) subscriber();
};
const subscribe = (subscriber: () => void) => {
  if (!media) {
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', notify);
  }
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
    if (!subscribers.size) {
      media?.removeEventListener('change', notify);
      media = undefined;
    }
  };
};
const snapshot = () => (media ?? window.matchMedia('(prefers-reduced-motion: reduce)')).matches;
const serverSnapshot = () => false;
const inactive = () => () => {};
export function MotionPolicyProvider({
  policy,
  children,
}: {
  policy: MotionPolicy;
  children: React.ReactNode;
}) {
  return <MotionPolicyContext.Provider value={policy}>{children}</MotionPolicyContext.Provider>;
}
export function useMotionSettings(active = true) {
  const policy = React.useContext(MotionPolicyContext);
  const watch = active && policy === 'system';
  const systemReduced = React.useSyncExternalStore(
    watch ? subscribe : inactive,
    watch ? snapshot : serverSnapshot,
    serverSnapshot,
  );
  const reduced = policy !== 'system' || systemReduced;
  return { policy, reduced, enabled: !reduced };
}
