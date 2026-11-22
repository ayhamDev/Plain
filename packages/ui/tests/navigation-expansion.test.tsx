import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppShell,
  NavigationRail,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '../src/ui/sidebar';
import { PlainProvider } from '../src/ui/plain-provider';

const items = [{ value: 'projects', label: 'Projects', icon: <span>P</span> }];
const originalMatchMedia = window.matchMedia;
function media(fine = true, mobile = false) {
  window.matchMedia = vi.fn((query) => ({
    ...originalMatchMedia(query),
    matches:
      query === '(hover: hover) and (pointer: fine)'
        ? fine
        : query === '(max-width: 767px)' && mobile,
  }));
}
function pointer(node: HTMLElement, enter: boolean, pointerType = 'mouse') {
  const event = new Event(enter ? 'pointerover' : 'pointerout', {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(node, event);
}
const tick = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));
function State() {
  const state = useSidebar();
  return <output aria-label="Pinned state">{String(state.collapsed)}</output>;
}
function Example(props: React.ComponentProps<typeof SidebarProvider> = {}) {
  return (
    <SidebarProvider defaultCollapsed expandOnHover {...props}>
      <Sidebar label="Workspace">
        <SidebarHeader collapsedContent={<span>Compact</span>}>Expanded header</SidebarHeader>
        <SidebarInput aria-label="Search workspace" />
        <SidebarContent>
          <SidebarItem>Overview</SidebarItem>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <button>Content action</button>
        <State />
      </SidebarInset>
    </SidebarProvider>
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  media();
});
afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe('temporary navigation expansion', () => {
  it('resumes a closing preview immediately without changing the configured delay for a fresh hover', () => {
    render(<Example hoverOpenDelay={100} hoverCloseDelay={150} />);
    const sidebar = screen.getByRole('complementary');
    pointer(sidebar, true);
    tick(99);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    tick(1);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    pointer(sidebar, false);
    tick(150);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    Object.defineProperty(sidebar, 'getAnimations', {
      value: () => [{ playState: 'running', transitionProperty: 'width' }],
    });
    pointer(sidebar, true);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });

  it('delays hover previews without changing controlled collapse state or hidden input semantics', () => {
    const change = vi.fn();
    render(
      <Example collapsed onCollapsedChange={change} hoverOpenDelay={100} hoverCloseDelay={150} />,
    );
    const sidebar = screen.getByRole('complementary');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    pointer(sidebar, true);
    tick(99);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    tick(1);
    expect(sidebar).toHaveAttribute('data-hover-expanded', 'true');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('inert');
    expect(screen.getByRole('status', { name: 'Pinned state' })).toHaveTextContent('true');
    expect(screen.getByRole('button', { name: 'Keep navigation expanded' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    pointer(sidebar, false);
    tick(149);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    tick(1);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(change).not.toHaveBeenCalled();
  });

  it('preserves native handler cancellation and refs', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <SidebarProvider defaultCollapsed expandOnHover>
        <Sidebar ref={ref} onPointerEnter={(event) => event.preventDefault()}>
          <SidebarItem>Overview</SidebarItem>
        </Sidebar>
      </SidebarProvider>,
    );
    pointer(ref.current!, true);
    tick(300);
    expect(ref.current).toHaveAttribute('data-state', 'collapsed');
  });

  it('holds a focused preview open, closes on Escape and restores the external trigger', () => {
    render(<Example expansionMode="overlay" />);
    const sidebar = screen.getByRole('complementary');
    const item = screen.getByRole('button', { name: 'Overview' });
    act(() => item.focus());
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    pointer(sidebar, false);
    tick(500);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    fireEvent.keyDown(item, { key: 'Escape' });
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveFocus();
  });

  it('pins a preview with the existing trigger and retains it after pointer exit', () => {
    render(<Example hoverOpenDelay={0} />);
    const sidebar = screen.getByRole('complementary');
    pointer(sidebar, true);
    tick(0);
    fireEvent.click(screen.getByRole('button', { name: 'Keep navigation expanded' }));
    pointer(sidebar, false);
    tick(500);
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    expect(sidebar).not.toHaveAttribute('data-hover-expanded');
    expect(screen.getByRole('status', { name: 'Pinned state' })).toHaveTextContent('false');
  });

  it.each(['touch', 'pen'])('ignores %s pointer entry', (pointerType) => {
    render(<Example />);
    const sidebar = screen.getByRole('complementary');
    pointer(sidebar, true, pointerType);
    tick(500);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });

  it('keeps mobile navigation under the Sheet', () => {
    media(false, true);
    render(<Example expansionMode="overlay" />);
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.querySelector('[data-slot="backdrop"]')).not.toBeInTheDocument();
  });
});

describe('overlay and navigation rail composition', () => {
  it('restores a surviving navigation item when an expanded-only header action loses visibility', () => {
    render(
      <SidebarProvider defaultCollapsed expandOnHover expansionMode="overlay">
        <Sidebar>
          <SidebarHeader collapsedContent={<span>Brand</span>}>
            <button>Header action</button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarItem>Overview</SidebarItem>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    const item = screen.getByRole('button', { name: 'Overview' });
    act(() => item.focus());
    const header = screen.getByRole('button', { name: 'Header action' });
    act(() => header.focus());
    fireEvent.keyDown(header, { key: 'Escape' });
    expect(screen.getByRole('complementary')).toHaveAttribute('data-state', 'collapsed');
    expect(item).toHaveFocus();
  });

  it('scopes the backdrop to AppShell and dismisses an uncontrolled overlay', () => {
    render(
      <AppShell sidebar={<NavigationRail items={items} defaultExpanded expansionMode="overlay" />}>
        <button>Content action</button>
      </AppShell>,
    );
    const nav = screen.getByRole('navigation');
    const shade = document.querySelector('[data-ui="navigation-rail"][data-slot="backdrop"]')!;
    expect(shade.parentElement).toHaveAttribute('data-ui', 'app-shell');
    expect(shade).toHaveAttribute('data-active');
    fireEvent.click(shade);
    expect(nav).toHaveAttribute('data-state', 'collapsed');
  });

  it('retains rail selection and controlled expansion while revealing item labels', () => {
    const change = vi.fn(),
      select = vi.fn(),
      ref = React.createRef<HTMLElement>();
    const { rerender } = render(
      <NavigationRail
        ref={ref}
        items={items}
        expanded
        onExpandedChange={change}
        onValueChange={select}
        expansionMode="overlay"
        width={72}
        expandedWidth={280}
      />,
    );
    expect(ref.current).toHaveAttribute('data-state', 'expanded');
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
    expect(select).toHaveBeenCalledWith('projects');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(change).toHaveBeenCalledWith(false);
    expect(ref.current).toHaveAttribute('data-state', 'expanded');
    rerender(<NavigationRail ref={ref} items={items} expanded={false} expandOnHover />);
    pointer(ref.current!, true);
    tick(120);
    expect(ref.current).toHaveAttribute('data-hover-expanded', 'true');
  });

  it('allows a backdrop-free overlay and uses provider-local strings in RTL', () => {
    render(
      <PlainProvider persist={false} locale="ar-EG" dir="rtl">
        <Example expansionMode="overlay" overlayBackdrop={false} hoverOpenDelay={0} />
      </PlainProvider>,
    );
    pointer(screen.getByRole('complementary'), true);
    tick(0);
    expect(screen.getByRole('button', { name: 'إبقاء التنقل موسعًا' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(document.querySelector('[data-slot="backdrop"]')).not.toBeInTheDocument();
  });
});
