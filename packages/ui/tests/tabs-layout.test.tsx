import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../src/ui/navigation';
import { PlainProvider } from '../src/ui/styling';

describe('section tab layouts', () => {
  it('preserves native refs and controlled/manual keyboard activation with layout options', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const change = vi.fn();
    render(
      <Tabs value="details" onValueChange={change} activationMode="manual">
        <TabsList
          ref={ref}
          aria-label="Record sections"
          variant="underline"
          fullWidth
          scrollable
          size="sm"
          indicatorThickness={1}
          animated={false}
        >
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="locked" disabled>
            Locked
          </TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
        </TabsList>
        <TabsContent value="details">Record details</TabsContent>
        <TabsContent value="accounting">Accounting settings</TabsContent>
      </Tabs>,
    );
    expect(ref.current).toBe(screen.getByRole('tablist', { name: 'Record sections' }));
    expect(ref.current).toHaveStyle({ '--ui-tabs-indicator-thickness': '1px' });
    screen.getByRole('tab', { name: 'Details' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Accounting' })).toHaveFocus();
    expect(change).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(change).toHaveBeenLastCalledWith('accounting');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  });
  it('keeps defaults, style overrides and inherited unstyled behavior', () => {
    const { container, rerender } = render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Sections">
          <TabsTrigger value="one">One</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'segmented');
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-scrollable');
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-full-width');
    rerender(
      <PlainProvider persist={false} unstyled>
        <Tabs defaultValue="one">
          <TabsList
            aria-label="Sections"
            indicatorThickness={1}
            style={{ '--ui-tabs-indicator-thickness': '3px' } as React.CSSProperties}
          >
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
        </Tabs>
      </PlainProvider>,
    );
    expect(screen.getByRole('tablist')).toHaveStyle({ '--ui-tabs-indicator-thickness': '3px' });
    expect(container.querySelector('.ui-tabs-list')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-tabs-trigger')).not.toBeInTheDocument();
  });
});
