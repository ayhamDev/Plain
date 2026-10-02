import * as React from 'react';
import { Spinner } from '../../ui/primitives';
import type { BlockConfig } from './types';

const families = {
  authentication: React.lazy(() =>
    import('./families/AuthenticationBlock').then((module) => ({
      default: module.AuthenticationBlock,
    })),
  ),
  navigation: React.lazy(() =>
    import('./families/NavigationBlock').then((module) => ({ default: module.NavigationBlock })),
  ),
  overview: React.lazy(() =>
    import('./families/OverviewBlock').then((module) => ({ default: module.OverviewBlock })),
  ),
  charts: React.lazy(() =>
    import('./families/ChartBlock').then((module) => ({ default: module.ChartBlock })),
  ),
  forms: React.lazy(() =>
    import('./families/FormBlock').then((module) => ({ default: module.FormBlock })),
  ),
  tables: React.lazy(() =>
    import('./families/TableBlock').then((module) => ({ default: module.TableBlock })),
  ),
  scheduling: React.lazy(() =>
    import('./families/SchedulingBlock').then((module) => ({ default: module.SchedulingBlock })),
  ),
  collaboration: React.lazy(() =>
    import('./families/CollaborationBlock').then((module) => ({
      default: module.CollaborationBlock,
    })),
  ),
  commerce: React.lazy(() =>
    import('./families/CommerceBlock').then((module) => ({ default: module.CommerceBlock })),
  ),
  finance: React.lazy(() =>
    import('./families/FinanceBlock').then((module) => ({ default: module.FinanceBlock })),
  ),
  settings: React.lazy(() =>
    import('./families/SettingsBlock').then((module) => ({ default: module.SettingsBlock })),
  ),
  mobile: React.lazy(() =>
    import('./families/MobileBlock').then((module) => ({ default: module.MobileBlock })),
  ),
};

export function BlockRenderer({ config }: { config: BlockConfig }) {
  // The discriminator and config travel together; the cast keeps the lazy map generic.
  const Component = families[config.family] as React.ComponentType<{ config: BlockConfig }>;
  return (
    <React.Suspense
      fallback={
        <div className="pb-loading">
          <Spinner label={`Loading ${config.title}`} />
        </div>
      }
    >
      <Component config={config} />
    </React.Suspense>
  );
}
