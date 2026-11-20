import { createRef, type CSSProperties } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScrollArea } from '../src/ui/navigation';

function dimensions(node: HTMLElement) {
  Object.defineProperties(node, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 400 },
    clientWidth: { configurable: true, value: 100 },
    scrollWidth: { configurable: true, value: 500 },
  });
}
describe('ScrollArea effects', () => {
  it('keeps native refs, handlers and consumer styles while updating logical edge state', async () => {
    const viewportRef = createRef<HTMLDivElement>(),
      rootRef = createRef<HTMLDivElement>();
    const onScroll = vi.fn(),
      onViewportScroll = vi.fn();
    render(
      <ScrollArea
        ref={rootRef}
        viewportRef={viewportRef}
        orientation="both"
        dir="rtl"
        fadeEdges
        scrollbarSize={8}
        scrollbarHoverSize="1rem"
        onScroll={onScroll}
        viewportProps={{ onScroll: onViewportScroll }}
        style={{ '--ui-scroll-area-fade-size': '40px' } as CSSProperties}
        aria-label="Records"
      >
        <p>Records</p>
      </ScrollArea>,
    );
    const viewport = screen.getByRole('region', { name: 'Records' });
    expect(viewportRef.current).toBe(viewport);
    dimensions(viewport);
    fireEvent.scroll(viewport, { target: { scrollTop: 50, scrollLeft: -100 } });
    await waitFor(() => expect(viewport).toHaveAttribute('data-fade-start'));
    for (const edge of ['top', 'bottom', 'start', 'end'])
      expect(viewport).toHaveAttribute(`data-fade-${edge}`);
    expect(onScroll).toHaveBeenCalledOnce();
    expect(onViewportScroll).toHaveBeenCalledOnce();
    expect(onScroll.mock.calls[0][0].target).toBe(viewport);
    expect(rootRef.current?.style.getPropertyValue('--ui-scrollbar-width')).toBe('8px');
    expect(rootRef.current?.style.getPropertyValue('--ui-scrollbar-hover-width')).toBe('1rem');
    expect(rootRef.current?.style.getPropertyValue('--ui-scroll-area-fade-size')).toBe('40px');
  });
  it('supports selected persistent edges, clamps intensity and removes effects when disabled', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <ScrollArea
        viewportRef={ref}
        aria-label="Items"
        fadeEdges={{ edges: ['bottom', 'end'], mode: 'always', intensity: 4, size: -10 }}
      >
        <p>One item</p>
      </ScrollArea>,
    );
    expect(ref.current).toHaveAttribute('data-fade-bottom');
    expect(ref.current).toHaveAttribute('data-fade-end');
    expect(ref.current).not.toHaveAttribute('data-fade-top');
    expect(
      ref.current?.parentElement?.style.getPropertyValue('--ui-scroll-area-fade-intensity'),
    ).toBe('1');
    expect(ref.current?.parentElement?.style.getPropertyValue('--ui-scroll-area-fade-size')).toBe(
      '0px',
    );
    rerender(
      <ScrollArea viewportRef={ref} aria-label="Items" fadeEdges={false}>
        <p>One item</p>
      </ScrollArea>,
    );
    expect(ref.current).not.toHaveAttribute('data-fade-edges');
    expect(ref.current).not.toHaveAttribute('data-fade-bottom');
    expect(ref.current).not.toHaveAttribute('data-fade-end');
  });
  it('keeps defaults unfaded and unstyled parts free of visual classes', () => {
    const { container, rerender } = render(
      <ScrollArea type="always" orientation="both" aria-label="Items">
        One item
      </ScrollArea>,
    );
    expect(screen.getByRole('region')).not.toHaveAttribute('data-fade-edges');
    rerender(
      <ScrollArea unstyled type="always" orientation="both" fadeEdges>
        One item
      </ScrollArea>,
    );
    for (const node of container.querySelectorAll(
      '[data-ui="scroll-area"], [data-ui="scroll-bar"]',
    ))
      expect(node.getAttribute('class') ?? '').toBe('');
  });
});
