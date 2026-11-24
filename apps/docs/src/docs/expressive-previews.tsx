import * as React from 'react';
import { Spinner } from '@plain/ui/spinner';
import { shapeNames } from '@plain/ui';
import type { PropPreview } from './previews';
const Example = React.lazy(() => import('./examples/ExpressiveExample'));
const render = (slug: string) => (state: Record<string, string | number | boolean>) => (
  <React.Suspense fallback={<Spinner />}>
    <Example slug={slug} state={state} />
  </React.Suspense>
);
const variants = { name: 'variant', options: ['standard', 'wavy'] };
const size = { name: 'size', options: ['sm', 'md', 'lg'] };
export const expressivePreviews: Record<string, PropPreview> = {
  progress: {
    defaults: {
      value: 64,
      variant: 'standard',
      size: 'md',
      gap: 4,
      amplitude: 3,
      wavelength: 24,
      indeterminate: false,
      showLegend: true,
    },
    controls: [
      { name: 'value', min: 0, max: 100 },
      variants,
      size,
      { name: 'gap', min: 0, max: 24 },
      { name: 'amplitude', min: 0, max: 12 },
      { name: 'wavelength', min: 8, max: 80 },
      { name: 'indeterminate' },
      { name: 'showLegend' },
    ],
    render: render('progress'),
    code: (s) =>
      `<Progress value={${s.indeterminate ? 'null' : s.value}} variant="${s.variant}" size="${s.size}" gap={${s.gap}} amplitude={${s.amplitude}} wavelength={${s.wavelength}} aria-label="Upload progress" />`,
  },
  'circular-progress': {
    defaults: {
      value: 64,
      variant: 'standard',
      size: 'lg',
      gap: 4,
      thickness: 4,
      amplitude: 2,
      frequency: 10,
      indeterminate: false,
    },
    controls: [
      { name: 'value', min: 0, max: 100 },
      variants,
      { name: 'size', options: ['sm', 'md', 'lg', 'xl'] },
      { name: 'gap', min: 0, max: 16 },
      { name: 'thickness', min: 1, max: 12 },
      { name: 'amplitude', min: 0, max: 6 },
      { name: 'frequency', min: 3, max: 24 },
      { name: 'indeterminate' },
    ],
    render: render('circular-progress'),
    code: (s) =>
      `<CircularProgress value={${s.indeterminate ? 'null' : s.value}} variant="${s.variant}" size="${s.size}" gap={${s.gap}} thickness={${s.thickness}} amplitude={${s.amplitude}} frequency={${s.frequency}} aria-label="Upload progress" />`,
  },
  'loading-indicator': {
    defaults: { variant: 'default', size: 'md', playing: true, duration: 4550, startingShape: 0 },
    controls: [
      { name: 'variant', options: ['default', 'contained'] },
      size,
      { name: 'playing' },
      { name: 'duration', min: 700, max: 10000 },
      { name: 'startingShape', min: 0, max: 6 },
    ],
    render: render('loading-indicator'),
    code: (s) =>
      `<LoadingIndicator variant="${s.variant}" size="${s.size}" playing={${s.playing}} duration={${s.duration}} startingShape={${s.startingShape}} label="Preparing workspace" />`,
  },
  shape: {
    defaults: { shape: 'softBurst', size: 96, morph: true },
    controls: [
      { name: 'shape', options: shapeNames },
      { name: 'size', min: 16, max: 200 },
      { name: 'morph' },
    ],
    render: render('shape'),
    code: (s) =>
      `<Shape shape="${s.shape}" size={${s.size}} morph={${s.morph}} aria-label="Featured" />`,
  },
  'shaped-components': {
    defaults: { shape: 'softBurst', size: 'md' },
    controls: [{ name: 'shape', options: shapeNames }, size],
    render: render('shaped-components'),
    code: (s) =>
      `<ShapedButton shape="${s.shape}" size="${s.size}" aria-label="Add project">+</ShapedButton>`,
  },
};
