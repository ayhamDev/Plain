import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Progress, LinearProgress } from '../src/ui/progress';
import { CircularProgress } from '../src/ui/circular-progress';
import { LoadingIndicator } from '../src/ui/loading-indicator';
import {
  Shape,
  ShapedIcon,
  ShapedButton,
  ShapedIconButton,
  ShapedImage,
  ShapedContainer,
  ShapedBadge,
  shapeNames,
  SHAPE_PATHS,
  getShapeClipPath,
} from '../src/ui/shape';
import { LanguageProvider } from '../src/ui/i18n';
import { StyleProvider } from '../src/ui/style-context';
import { MotionPolicyProvider } from '../src/ui/motion-policy';

describe('expressive progress', () => {
  it('keeps LinearProgress compatible with aggregate and native Progress semantics', () => {
    expect(LinearProgress).toBe(Progress);
    const ref = React.createRef<HTMLDivElement>();
    const { container, rerender } = render(
      <Progress ref={ref} value={50} max={200} gap={8} aria-label="Upload" />,
    );
    expect(ref.current).toBe(screen.getByRole('progressbar'));
    expect(ref.current).toHaveAttribute('aria-valuenow', '50');
    expect(ref.current).toHaveAttribute('aria-valuetext', '25%');
    expect(container.querySelector('.ui-progress-indicator')).toHaveStyle({ width: '25%' });
    expect(container.querySelector('.ui-progress-track')).toHaveStyle({
      insetInlineStart: 'calc(25% + 8px)',
    });
    rerender(<Progress value={null} aria-label="Upload" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });
  it('keeps segmented allocations flat when the wave variant is requested', () => {
    const { container } = render(
      <Progress
        variant="wavy"
        aria-label="Storage"
        segments={[{ id: 'a', label: 'Documents', value: 20 }]}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(container.querySelector('.ui-progress-segment')).toHaveStyle({ width: '20%' });
    expect(container.querySelector('svg')).toBeNull();
  });
  it('normalizes invalid geometry and renders complete and empty waves without a residual cap', () => {
    const { container, rerender } = render(
      <Progress
        variant="wavy"
        value={0}
        amplitude={Infinity}
        wavelength={NaN}
        gap={-10}
        aria-label="Upload"
      />,
    );
    expect(container.querySelector('.ui-progress-wave-value')).toBeNull();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    rerender(<Progress variant="wavy" value={100} aria-label="Upload" />);
    expect(container.querySelector('.ui-progress-wave-track')).toBeNull();
    expect(container.querySelector('.ui-progress-wave-value')).toBeInTheDocument();
  });
  it('clamps circular values, normalizes the maximum and forwards its native ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender, container } = render(
      <CircularProgress ref={ref} value={300} max={200} aria-label="Upload">
        Done
      </CircularProgress>,
    );
    expect(ref.current).toBe(screen.getByRole('progressbar'));
    expect(ref.current).toHaveAttribute('aria-valuenow', '200');
    expect(container.querySelector('.ui-circular-progress-track')).toHaveAttribute(
      'visibility',
      'hidden',
    );
    expect(screen.getByText('Done')).toBeVisible();
    rerender(
      <CircularProgress
        value={NaN}
        max={0}
        size={NaN}
        amplitude={Infinity}
        frequency={Infinity}
        variant="wavy"
        aria-label="Upload"
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('uses provider direction, localized percentages and custom loading messages', () => {
    render(
      <LanguageProvider
        locale="ar-EG"
        dir="rtl"
        messages={{ 'common.loading': 'نجهز مساحة العمل' }}
      >
        <Progress value={64} aria-label="الرفع" />
        <CircularProgress value={64} aria-label="الملفات" />
        <LoadingIndicator />
      </LanguageProvider>,
    );
    for (const progress of screen.getAllByRole('progressbar')) {
      expect(progress).toHaveAttribute('dir', 'rtl');
      expect(progress).toHaveAttribute(
        'aria-valuetext',
        new Intl.NumberFormat('ar-EG', { style: 'percent', maximumFractionDigits: 1 }).format(0.64),
      );
    }
    expect(screen.getByRole('status')).toHaveTextContent('نجهز مساحة العمل');
  });
  it.each(['reduced', 'none'] as const)(
    'keeps loading visible without animation under %s motion',
    (policy) => {
      const { container } = render(
        <MotionPolicyProvider policy={policy}>
          <LoadingIndicator label="Preparing" />
          <Progress value={null} variant="wavy" aria-label="Upload" />
          <CircularProgress value={null} aria-label="Files" />
        </MotionPolicyProvider>,
      );
      expect(screen.getByRole('status')).toHaveTextContent('Preparing');
      expect(container.querySelectorAll('animate, animateTransform')).toHaveLength(0);
      for (const progress of screen.getAllByRole('progressbar'))
        expect(progress).toHaveAttribute('data-animated', 'false');
    },
  );
  it('starts with a visible static contour during SSR', () => {
    const html = renderToString(<LoadingIndicator startingShape={4} label="Preparing" />);
    expect(html).toContain('<path');
    expect(html).toContain('Preparing');
    expect(html).not.toContain('<animate');
  });
  it('pauses the native timeline and keeps native handlers and styling slots', () => {
    const pause = vi.fn(),
      resume = vi.fn();
    Object.defineProperties(SVGSVGElement.prototype, {
      pauseAnimations: { value: pause, configurable: true },
      unpauseAnimations: { value: resume, configurable: true },
    });
    try {
      const { rerender, container } = render(
        <LoadingIndicator playing={false} label="Files" duration={NaN} startingShape={NaN} />,
      );
      expect(pause).toHaveBeenCalled();
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
      rerender(<LoadingIndicator playing label="Files" />);
      expect(resume).toHaveBeenCalled();
      expect(container.querySelector('animate')).toHaveAttribute('repeatCount', 'indefinite');
    } finally {
      delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).pauseAnimations;
      delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).unpauseAnimations;
    }
  });
});

describe('shape family', () => {
  it('exports 36 finite matching contours and responsive clip paths without DOM access', () => {
    expect(shapeNames).toHaveLength(36);
    for (const name of shapeNames) {
      expect(SHAPE_PATHS[name].split('L')).toHaveLength(96);
      const clip = getShapeClipPath(name);
      expect(clip.startsWith('polygon(')).toBe(true);
      expect(clip.split(',')).toHaveLength(96);
      expect(clip).not.toMatch(/NaN|Infinity/);
      const coordinates = clip.match(/[\d.]+/g)!.map(Number);
      expect(Math.min(...coordinates)).toBeGreaterThanOrEqual(2);
      expect(Math.max(...coordinates)).toBeLessThanOrEqual(98);
    }
    expect(ShapedIcon).toBe(Shape);
    expect(ShapedIconButton).toBe(ShapedButton);
  });
  it('distinguishes decorative and named graphics, preserves SVG refs and changes shape', () => {
    const ref = React.createRef<SVGSVGElement>();
    const { rerender, container } = render(
      <Shape ref={ref} shape="circle" aria-label="Featured" />,
    );
    expect(ref.current).toBe(screen.getByRole('img', { name: 'Featured' }));
    rerender(<Shape ref={ref} shape="flower" morph={false} />);
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
    expect(ref.current).not.toHaveAttribute('data-morph');
    expect(container.querySelector('path')).toHaveAttribute('d', SHAPE_PATHS.flower);
  });
  it('retains native image alt, ref, loading and events', () => {
    const load = vi.fn(),
      error = vi.fn(),
      ref = React.createRef<HTMLImageElement>();
    render(
      <ShapedImage
        ref={ref}
        src="/workspace.jpg"
        alt="Workspace"
        loading="lazy"
        onLoad={load}
        onError={error}
        shape="arch"
      />,
    );
    const image = screen.getByRole('img', { name: 'Workspace' });
    expect(ref.current).toBe(image);
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveStyle({ clipPath: getShapeClipPath('arch') });
    fireEvent.load(image);
    fireEvent.error(image);
    expect(load).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
  it('retains Button activation, disabled/loading states and form type', async () => {
    const action = vi.fn(),
      ref = React.createRef<HTMLButtonElement>();
    const { rerender } = render(
      <ShapedButton ref={ref} aria-label="Add" onClick={action}>
        +
      </ShapedButton>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Add' }));
    expect(ref.current).toHaveAttribute('type', 'button');
    await userEvent.click(ref.current!);
    expect(action).toHaveBeenCalledTimes(1);
    rerender(
      <ShapedButton loading aria-label="Add" onClick={action}>
        +
      </ShapedButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(screen.getByRole('button'));
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('supports inherited unstyled composition and typed slot overrides', () => {
    const { container } = render(
      <StyleProvider
        unstyled
        styles={{ 'shape.path': 'app-shape', 'circular-progress.indicator': 'app-ring' }}
      >
        <Shape />
        <ShapedContainer>Content</ShapedContainer>
        <ShapedBadge>3</ShapedBadge>
        <CircularProgress value={25} aria-label="Upload" />
      </StyleProvider>,
    );
    expect(container.querySelector('.ui-shape')).toBeNull();
    expect(container.querySelector('.app-shape')).toBeInTheDocument();
    expect(container.querySelector('.app-ring')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeVisible();
  });
});
