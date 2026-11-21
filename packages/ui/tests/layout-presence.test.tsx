import * as React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Box,
  Flex,
  Stack,
  Inline,
  Grid,
  Container,
  Center,
  Spacer,
  Masonry,
  Resizable,
  ResizablePanel,
  LayoutPresence,
} from '../src/ui/layout';
import { Card, CardHeader, CardContent, CardFooter, AspectRatio } from '../src/ui/primitives';
import { ScrollArea, Collapsible } from '../src/ui/navigation';
import {
  AppShell,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarInset,
} from '../src/ui/sidebar';
import { MotionPolicyProvider } from '../src/ui/motion-policy';
import { Table, TableBody, TableRow, TableCell } from '../src/ui/table';

type TestAnimation = {
  node: HTMLElement;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  finish: () => void;
  cancel: ReturnType<typeof vi.fn>;
};
let animations: TestAnimation[];
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  animations = [];
  vi.useFakeTimers();
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: vi.fn(function (
      this: HTMLElement,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) {
      let finish!: () => void, reject!: (error: Error) => void;
      const finished = new Promise<void>((resolve, rejectPromise) => {
        finish = resolve;
        reject = rejectPromise;
      });
      const cancel = vi.fn(() => reject(new Error('cancelled')));
      animations.push({ node: this, frames, options, finish, cancel });
      return { finished, cancel } as unknown as Animation;
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
  if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(Element.prototype, 'animate');
});
async function finishAll() {
  await act(async () => {
    for (const animation of [...animations]) animation.finish();
  });
}
const rows = (ids: string[]) =>
  ids.map((id) => (
    <div key={id} data-testid={id}>
      {id}
    </div>
  ));

describe('layout presence', () => {
  it('animates first mount and additions while retaining removed keyed DOM until exit completes', async () => {
    const exited = vi.fn();
    const { rerender } = render(
      <Stack presence={{ onExitComplete: exited }}>{rows(['a', 'b'])}</Stack>,
    );
    expect(animations).toHaveLength(2);
    const b = screen.getByTestId('b');
    await finishAll();
    rerender(<Stack presence={{ onExitComplete: exited }}>{rows(['a', 'c'])}</Stack>);
    expect(screen.getByTestId('b')).toBe(b);
    expect(b).toHaveAttribute('data-ui-presence', 'exit');
    expect(b).toHaveAttribute('inert');
    expect(b).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('c')).toHaveAttribute('data-ui-presence', 'enter');
    await finishAll();
    expect(screen.queryByTestId('b')).not.toBeInTheDocument();
    expect(exited).toHaveBeenCalledOnce();
  });

  it('supports initial=false, bounded staggering, custom timings and animation caps', () => {
    const { rerender } = render(<Grid presence={{ initial: false }}>{rows(['a'])}</Grid>);
    expect(animations).toHaveLength(0);
    rerender(
      <Grid
        presence={{ initial: false, duration: 350, stagger: 100, maxItems: 4, preset: 'slide' }}
      >
        {rows(['a', 'b', 'c', 'd', 'e', 'f'])}
      </Grid>,
    );
    expect(animations).toHaveLength(4);
    expect(animations.map(({ options }) => options.delay)).toEqual([0, 100, 200, 200]);
    expect(animations[0].options.duration).toBe(350);
    expect(animations[0].frames[0]).toMatchObject({ opacity: 0, translate: '0 8px' });
  });
  it('keeps the concurrency cap across overlapping batches rather than restarting the budget', async () => {
    const { rerender } = render(
      <Grid presence={{ initial: false, maxItems: 2 }}>{rows(['a'])}</Grid>,
    );
    rerender(<Grid presence={{ initial: false, maxItems: 2 }}>{rows(['a', 'b', 'c'])}</Grid>);
    rerender(
      <Grid presence={{ initial: false, maxItems: 2 }}>{rows(['a', 'b', 'c', 'd', 'e'])}</Grid>,
    );
    expect(animations).toHaveLength(2);
    expect(document.querySelectorAll('[data-ui-presence]')).toHaveLength(2);
    rerender(<Grid presence={{ initial: false, maxItems: 2 }} />);
    expect(document.querySelectorAll('[data-ui-presence]')).toHaveLength(2);
    await finishAll();
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
  });

  it('preserves child input state and refs when an exiting key is reintroduced or presence is toggled', async () => {
    const ref = React.createRef<HTMLDivElement>();
    function View({ ids, enabled }: { ids: string[]; enabled: boolean }) {
      return (
        <Stack ref={ref} presence={enabled}>
          {ids.map((id) => (
            <input key={id} aria-label={id} defaultValue={id} />
          ))}
        </Stack>
      );
    }
    const { rerender } = render(<View ids={['a', 'b']} enabled />);
    await finishAll();
    const input = screen.getByLabelText('b');
    fireEvent.change(input, { target: { value: 'local draft' } });
    rerender(<View ids={['a']} enabled />);
    rerender(<View ids={['a', 'b']} enabled />);
    expect(screen.getByLabelText('b')).toBe(input);
    expect(input).toHaveValue('local draft');
    expect(input).not.toHaveAttribute('aria-hidden');
    expect(input).not.toHaveAttribute('inert');
    rerender(<View ids={['a', 'b']} enabled={false} />);
    expect(screen.getByLabelText('b')).toBe(input);
    expect(ref.current).toHaveClass('ui-flex');
  });

  it('moves focus out of an exiting child and restores application-owned attributes on cancellation', async () => {
    const { rerender } = render(
      <Box presence>
        <button key="a">Remove me</button>
      </Box>,
    );
    await finishAll();
    const button = screen.getByRole('button');
    button.focus();
    rerender(<Box presence />);
    expect(button.parentElement).toHaveFocus();
    expect(button).toHaveAttribute('inert');
    rerender(
      <Box presence>
        <button key="a">Remove me</button>
      </Box>,
    );
    expect(button).not.toHaveAttribute('inert');
    expect(button.style.pointerEvents).toBe('');
    button.focus();
    expect(button.parentElement).not.toHaveAttribute('tabindex');
  });

  for (const policy of ['none', 'reduced'] as const) {
    it(`removes immediately and starts no animations under ${policy} policy`, () => {
      const { rerender } = render(
        <MotionPolicyProvider policy={policy}>
          <Stack presence>{rows(['a'])}</Stack>
        </MotionPolicyProvider>,
      );
      rerender(
        <MotionPolicyProvider policy={policy}>
          <Stack presence />
        </MotionPolicyProvider>,
      );
      expect(animations).toHaveLength(0);
      expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    });
  }
  it('cancels pending exits immediately when the provider disables motion', async () => {
    const view = (show: boolean, policy: 'system' | 'none') => (
      <MotionPolicyProvider policy={policy}>
        <Stack presence>{show && rows(['a'])}</Stack>
      </MotionPolicyProvider>
    );
    const { rerender } = render(view(true, 'system'));
    await finishAll();
    rerender(view(false, 'system'));
    expect(screen.getByTestId('a')).toBeInTheDocument();
    rerender(view(false, 'none'));
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    expect(animations.at(-1)!.cancel).toHaveBeenCalledOnce();
  });
  it('shares one preference listener and reacts to live system reduction before animating again', async () => {
    const listeners = new Set<() => void>();
    let matches = false;
    const add = vi.fn((_event: string, listener: () => void) => listeners.add(listener));
    const remove = vi.fn((_event: string, listener: () => void) => listeners.delete(listener));
    window.matchMedia = (query) =>
      ({
        get matches() {
          return matches;
        },
        media: query,
        addEventListener: add,
        removeEventListener: remove,
      }) as unknown as MediaQueryList;
    const view = (show: boolean) => (
      <>
        <Stack presence>{show && rows(['a'])}</Stack>
        <Box presence>{rows(['b'])}</Box>
      </>
    );
    const { rerender, unmount } = render(view(true));
    expect(add).toHaveBeenCalledOnce();
    await finishAll();
    rerender(view(false));
    act(() => {
      matches = true;
      for (const listener of [...listeners]) listener();
    });
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    const count = animations.length;
    rerender(view(true));
    expect(animations).toHaveLength(count);
    unmount();
    expect(remove).toHaveBeenCalledOnce();
  });
  it('keeps StrictMode setup/cleanup balanced and removes unsupported SVG roots immediately', async () => {
    const view = (visible: boolean) => (
      <React.StrictMode>
        <Stack presence>{visible && <svg key="svg" aria-label="Drawing" />}</Stack>
      </React.StrictMode>
    );
    const { rerender } = render(view(true));
    rerender(view(false));
    expect(screen.queryByLabelText('Drawing')).not.toBeInTheDocument();
    await finishAll();
  });
  it('falls back immediately without Web Animations, for unsupported child geometry and zero durations', () => {
    Reflect.deleteProperty(Element.prototype, 'animate');
    const { rerender } = render(<Stack presence>{rows(['a'])}</Stack>);
    rerender(<Stack presence />);
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    rerender(
      <Stack presence>
        <React.Fragment key="group">
          <span>A</span>
          <span>B</span>
        </React.Fragment>
      </Stack>,
    );
    rerender(<Stack presence />);
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });
  it('does not retain exits or start native animations when durations are zero', () => {
    const { rerender } = render(
      <Stack presence={{ duration: 0, exitDuration: 0 }}>{rows(['a'])}</Stack>,
    );
    rerender(<Stack presence={{ duration: 0, exitDuration: 0 }} />);
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    expect(animations).toHaveLength(0);
  });
  it('batches simultaneous exit completions without resurrecting any removed keys', async () => {
    const { rerender } = render(<Stack presence>{rows(['a', 'b', 'c', 'd'])}</Stack>);
    await finishAll();
    rerender(<Stack presence>{rows(['d'])}</Stack>);
    expect(document.querySelectorAll('[data-ui-presence="exit"]')).toHaveLength(3);
    await finishAll();
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    expect(screen.queryByTestId('b')).not.toBeInTheDocument();
    expect(screen.queryByTestId('c')).not.toBeInTheDocument();
    expect(screen.getByTestId('d')).toBeInTheDocument();
  });
  it('excludes exiting fields from form submission and restores their native disabled state on reentry', async () => {
    const view = (show: boolean) => (
      <form>
        <Stack presence>
          {show && (
            <div key="fields">
              <input name="value" defaultValue="draft" />
              <button disabled>Disabled</button>
            </div>
          )}
        </Stack>
      </form>
    );
    const { container, rerender } = render(view(true));
    await finishAll();
    const form = container.querySelector('form')!;
    rerender(view(false));
    expect(new FormData(form).has('value')).toBe(false);
    rerender(view(true));
    expect(new FormData(form).get('value')).toBe('draft');
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('animates changed positions only when reflow is explicitly enabled', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const index = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
      return {
        x: 0,
        y: this.hasAttribute('data-testid') ? index * 40 : 0,
        width: 200,
        height: 40,
        top: 0,
        left: 0,
        right: 200,
        bottom: 40,
        toJSON() {},
      };
    });
    const { rerender } = render(
      <Stack presence={{ initial: false, layout: true }}>{rows(['a', 'b'])}</Stack>,
    );
    rerender(<Stack presence={{ initial: false, layout: true }}>{rows(['b', 'a'])}</Stack>);
    expect(animations.map((animation) => animation.frames[0])).toEqual([
      { translate: '0px 40px' },
      { translate: '0px -40px' },
    ]);
    await finishAll();
  });
  it('preserves native table row structure and ref while rows exit', async () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    const view = (ids: string[]) => (
      <Table>
        <TableBody presence ref={ref}>
          {ids.map((id) => (
            <TableRow key={id}>
              <TableCell>{id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    const { container, rerender } = render(view(['a', 'b']));
    await finishAll();
    rerender(view(['b']));
    expect(ref.current?.tagName).toBe('TBODY');
    expect(screen.getByText('a').parentElement).toHaveAttribute('data-ui-presence', 'exit');
    await finishAll();
    expect(container.querySelector('tbody')?.children).toHaveLength(1);
  });
  it('uses a completion fallback and cancels native animations on unmount', async () => {
    const { rerender, unmount } = render(<Box presence={{ exitDuration: 100 }}>{rows(['a'])}</Box>);
    await finishAll();
    rerender(<Box presence={{ exitDuration: 100 }} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    rerender(<Box presence>{rows(['b'])}</Box>);
    unmount();
    expect(animations.at(-1)!.cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('adds no wrapper and retains native semantics, props and refs with asChild', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const clicked = vi.fn();
    const { container, rerender } = render(
      <Grid asChild presence ref={ref}>
        <ul onClick={clicked}>{[<li key="a">A</li>, <li key="b">B</li>]}</ul>
      </Grid>,
    );
    expect(container.firstElementChild?.tagName).toBe('UL');
    expect(container.querySelector('ul')?.children).toHaveLength(2);
    expect(ref.current?.tagName).toBe('UL');
    fireEvent.click(screen.getByText('A'));
    expect(clicked).toHaveBeenCalledOnce();
    await finishAll();
    rerender(
      <Grid asChild presence ref={ref}>
        <ul onClick={clicked}>
          <li key="b">B</li>
        </ul>
      </Grid>,
    );
    expect(screen.getByText('A')).toHaveAttribute('data-ui-presence', 'exit');
    await finishAll();
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });
  it('preserves void asChild elements and their native form participation', () => {
    const { container, rerender } = render(
      <form>
        <Box asChild>
          <input aria-label="Name" name="name" defaultValue="Draft" />
        </Box>
      </form>,
    );
    const input = screen.getByLabelText('Name');
    rerender(
      <form>
        <Box asChild presence>
          <input aria-label="Name" name="name" defaultValue="Draft" />
        </Box>
      </form>,
    );
    expect(screen.getByLabelText('Name')).toBe(input);
    expect(new FormData(container.querySelector('form')!).get('name')).toBe('Draft');
  });
  it('keeps SSR visible and does not perform animation or geometry work when disabled', () => {
    const markup = renderToString(
      <Stack presence>
        <p key="a">Readable on the server</p>
      </Stack>,
    );
    expect(markup).toContain('Readable on the server');
    expect(markup).not.toMatch(/opacity|data-ui-presence|inert/);
    const geometry = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    render(<Box>{rows(['a'])}</Box>);
    expect(geometry).not.toHaveBeenCalled();
    expect(animations).toHaveLength(0);
  });
  it('keeps nested scopes independent and never drives React renders from animation frames', async () => {
    let renders = 0;
    function Child() {
      renders++;
      return <p>Nested</p>;
    }
    const { rerender } = render(
      <Stack presence>
        <Grid key="inner" presence>
          <Child key="a" />
        </Grid>
      </Stack>,
    );
    const count = renders;
    await finishAll();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(renders).toBe(count);
    rerender(
      <Stack presence>
        <Grid key="inner" presence />
      </Stack>,
    );
    expect(screen.getByText('Nested')).toHaveAttribute('data-ui-presence', 'exit');
    await finishAll();
    expect(screen.queryByText('Nested')).not.toBeInTheDocument();
  });
  const containers = {
    Box,
    Flex,
    Stack,
    Inline,
    Grid,
    Container,
    Center,
    Spacer,
    Masonry,
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    AspectRatio,
    ScrollArea,
    Collapsible,
    LayoutPresence,
  };
  for (const [name, Component] of Object.entries(containers)) {
    it(`integrates keyed exits in ${name} without forwarding presence to the DOM`, async () => {
      const { container, rerender } = render(<Component presence>{rows(['a', 'b'])}</Component>);
      await finishAll();
      rerender(<Component presence>{rows(['b'])}</Component>);
      expect(screen.getByTestId('a')).toBeInTheDocument();
      expect(container.querySelector('[presence]')).toBeNull();
      await finishAll();
      expect(screen.queryByTestId('a')).not.toBeInTheDocument();
    });
  }
  it('integrates AppShell main content and resizable panel content without changing engine markup', async () => {
    const { rerender } = render(<AppShell presence>{rows(['a'])}</AppShell>);
    await finishAll();
    rerender(<AppShell presence />);
    expect(screen.getByTestId('a').parentElement?.tagName).toBe('MAIN');
    await finishAll();
    rerender(
      <Resizable>
        <ResizablePanel id="files" presence>
          {rows(['b'])}
        </ResizablePanel>
      </Resizable>,
    );
    await finishAll();
    rerender(
      <Resizable>
        <ResizablePanel id="files" presence />
      </Resizable>,
    );
    expect(screen.getByTestId('b')).toHaveAttribute('data-ui-presence', 'exit');
    await finishAll();
    expect(screen.queryByTestId('b')).not.toBeInTheDocument();
  });
  it('integrates sidebar sections and menus with valid native list structure', async () => {
    const view = (visible: boolean) => (
      <SidebarProvider shortcut={false}>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu presence>{visible && <li key="a">Project</li>}</SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset presence>{visible && <p key="page">Page</p>}</SidebarInset>
      </SidebarProvider>
    );
    const { container, rerender } = render(view(true));
    await finishAll();
    rerender(view(false));
    expect(screen.getByText('Project').parentElement?.tagName).toBe('UL');
    await finishAll();
    expect(container.querySelector('li')).toBeNull();
    expect(screen.queryByText('Page')).not.toBeInTheDocument();
  });
});
