import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Resizable, ResizablePanel, ResizableHandle } from '../src/ui/layout';
import { SidebarProvider, Sidebar, SidebarRail } from '../src/ui/sidebar';
import { PlainProvider } from '../src/ui/styling';

describe('edge handle contracts', () => {
  it('defaults to an edge and preserves the grip opt-in, custom children and native ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    const draw = (handle: React.ReactNode) => (
      <Resizable mobileOrientation={false}>
        <ResizablePanel>Files</ResizablePanel>
        {handle}
        <ResizablePanel>Editor</ResizablePanel>
      </Resizable>
    );
    const { container, rerender } = render(
      draw(<ResizableHandle ref={ref} aria-label="Resize files" />),
    );
    expect(ref.current).toBe(screen.getByRole('separator', { name: 'Resize files' }));
    expect(container.querySelector('[data-slot="icon"]')).not.toBeInTheDocument();
    rerender(draw(<ResizableHandle withHandle />));
    expect(container.querySelector('[data-slot="icon"]')).toBeInTheDocument();
    rerender(
      draw(
        <ResizableHandle withHandle>
          <span>Custom grip</span>
        </ResizableHandle>,
      ),
    );
    expect(screen.getByText('Custom grip')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="icon"]')).not.toBeInTheDocument();
  });
  it('keeps sidebar caller cancellation, collapse behavior, refs and unstyled parts', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    const change = vi.fn();
    const draw = (cancel: boolean) => (
      <PlainProvider persist={false} unstyled>
        <SidebarProvider onCollapsedChange={change}>
          <Sidebar>
            <SidebarRail
              ref={ref}
              onClick={(event) => {
                if (cancel) event.preventDefault();
              }}
            />
          </Sidebar>
        </SidebarProvider>
      </PlainProvider>
    );
    const { container, rerender } = render(draw(true));
    const rail = screen.getByRole('button', { name: 'Collapse navigation' });
    expect(ref.current).toBe(rail);
    expect(container.querySelector('.ui-edge-handle')).not.toBeInTheDocument();
    await userEvent.click(rail);
    expect(change).not.toHaveBeenCalled();
    rerender(draw(false));
    await userEvent.click(rail);
    expect(change).toHaveBeenCalledWith(true);
  });
});
