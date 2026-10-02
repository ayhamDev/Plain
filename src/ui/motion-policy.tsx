import * as React from 'react';

export type MotionPolicy = 'system' | 'reduced' | 'none';
const MotionPolicyContext = /* @__PURE__ */ React.createContext<MotionPolicy>('system');
export function MotionPolicyProvider({
  policy,
  children,
}: {
  policy: MotionPolicy;
  children: React.ReactNode;
}) {
  return <MotionPolicyContext.Provider value={policy}>{children}</MotionPolicyContext.Provider>;
}
export function useMotionSettings() {
  const policy = React.useContext(MotionPolicyContext);
  const [systemReduced, setSystemReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduced(query.matches);
    const update = (event: MediaQueryListEvent) => setSystemReduced(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const reduced = policy !== 'system' || systemReduced;
  return { policy, reduced, enabled: !reduced };
}
