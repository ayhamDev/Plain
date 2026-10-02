import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerHandle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Toaster,
  toast,
} from '../src/ui/overlays';
import { Switch } from '../src/ui/forms';
import { Skeleton } from '../src/ui/primitives';
import { inertAttribute } from '../src/ui/utils';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  ScrollArea,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '../src/ui/navigation';
import { StyleProvider, ThemeScope } from '../src/ui/styling';

it('preserves the native inert attribute on React 18 and 19 without false attributes', () => {
  expect(inertAttribute(true, '18.3.1')).toBe('');
  expect(inertAttribute(true, '19.3.0')).toBe(true);
  expect(inertAttribute(false, '18.3.1')).toBeUndefined();
  expect(inertAttribute(false, '19.3.0')).toBeUndefined();
});

const nativeGetComputedStyle = window.getComputedStyle;
beforeEach(() => {
  // JSDOM omits the browser's initial transform value; Vaul expects the native "none" value.
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = nativeGetComputedStyle(element, pseudo);
    if (!style.transform) style.transform = 'none';
    return style;
  });
});
afterEach(() => {
  toast.dismiss();
});

describe('dialog and Vaul panel regressions', () => {
  it('supports the close-button opt-out and restores trigger focus on Escape', async () => {
    render(
      <Dialog>
        <DialogTrigger>Edit profile</DialogTrigger>
        <DialogContent showClose={false}>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Update your profile.</DialogDescription>
          <input aria-label="Name" />
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Edit profile' });
    await userEvent.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('retains the default close button and native content ref', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dialog defaultOpen>
        <DialogContent ref={ref}>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>Review the change.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(ref.current).toBe(screen.getByRole('dialog', { name: 'Confirm' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it.each([
    { inherited: 'ltr', local: undefined, side: 'start', expected: 'left' },
    { inherited: 'rtl', local: undefined, side: 'end', expected: 'left' },
    { inherited: 'rtl', local: 'ltr', side: 'end', expected: 'right' },
    { inherited: 'ltr', local: 'rtl', side: 'start', expected: 'right' },
  ] as const)(
    'aligns legacy $side content, Vaul drag direction, and local RTL ($inherited/$local)',
    async ({ inherited, local, side, expected }) => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ThemeScope dir={inherited} data-testid="scope">
          <Sheet>
            <SheetTrigger>Settings</SheetTrigger>
            <SheetContent ref={ref} side={side} dir={local}>
              <SheetTitle>Project settings</SheetTitle>
              <SheetDescription>Project preferences.</SheetDescription>
            </SheetContent>
          </Sheet>
        </ThemeScope>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
      const panel = screen.getByRole('dialog', { name: 'Project settings' });
      expect(panel).toHaveAttribute('data-vaul-drawer-direction', expected);
      expect(panel).toHaveAttribute('data-side', expected);
      expect(panel).toHaveAttribute('dir', local ?? inherited);
      expect(screen.getByTestId('scope')).toContainElement(panel);
      expect(ref.current).toBe(panel);
      expect(screen.getByRole('button', { name: 'Close panel' })).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    },
  );

  it('honors controlled open state and authoritative native root direction', async () => {
    const onOpenChange = vi.fn();
    function Example({ open }: { open: boolean }) {
      return (
        <Sheet open={open} onOpenChange={onOpenChange} direction="top">
          <SheetTrigger>Open panel</SheetTrigger>
          <SheetContent side="end" showClose>
            <SheetTitle>Controlled panel</SheetTitle>
            <SheetDescription>Controlled from the parent.</SheetDescription>
          </SheetContent>
        </Sheet>
      );
    }
    const { rerender } = render(<Example open={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<Example open />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-vaul-drawer-direction', 'top');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'top');
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<Example open={false} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('forwards snap points and cycles them from a keyboard-accessible native handle', async () => {
    const setActiveSnapPoint = vi.fn();
    const handleRef = React.createRef<HTMLDivElement>();
    function Example() {
      const [snap, setSnap] = React.useState<number | string | null>(0.25);
      return (
        <Drawer
          snapPoints={[0.25, 0.75, 1]}
          fadeFromIndex={1}
          activeSnapPoint={snap}
          setActiveSnapPoint={(next) => {
            setSnap(next);
            setActiveSnapPoint(next);
          }}
          snapToSequentialPoint
          handleOnly
        >
          <DrawerTrigger>Quick actions</DrawerTrigger>
          <DrawerContent showClose={false}>
            <DrawerHandle ref={handleRef} />
            <DrawerTitle>Actions</DrawerTitle>
            <DrawerDescription>Choose an action.</DrawerDescription>
            <output aria-label="Current snap">{snap}</output>
          </DrawerContent>
        </Drawer>
      );
    }
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Quick actions' }));
    const panel = screen.getByRole('dialog', { name: 'Actions' });
    expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    expect(panel).toHaveAttribute('data-vaul-snap-points', 'true');
    expect(screen.queryByRole('button', { name: 'Close panel' })).not.toBeInTheDocument();
    const handle = screen.getByRole('button', { name: 'Resize panel' });
    expect(handleRef.current).toBe(handle);
    handle.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(setActiveSnapPoint).toHaveBeenCalledWith(0.75));
    expect(screen.getByRole('status', { name: 'Current snap' })).toHaveTextContent('0.75');
  });

  it('supports defaultOpen and dismissible=false through the native Vaul root', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer defaultOpen dismissible={false} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Required action</DrawerTitle>
          <DrawerDescription>Finish before dismissing.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('control and scrolling regressions', () => {
  it('keeps switch keyboard and native form behavior under a local RTL scope', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    const { container } = render(
      <form>
        <ThemeScope dir="rtl">
          <Switch ref={ref} name="notifications" value="enabled" aria-label="Notifications" />
        </ThemeScope>
      </form>,
    );
    const control = screen.getByRole('switch', { name: 'Notifications' });
    expect(ref.current).toBe(control);
    expect(control).toHaveAttribute('dir', 'rtl');
    control.focus();
    await userEvent.keyboard(' ');
    expect(control).toBeChecked();
    expect(new FormData(container.querySelector('form')!).get('notifications')).toBe('enabled');
    await userEvent.keyboard(' ');
    expect(control).not.toBeChecked();
    expect(new FormData(container.querySelector('form')!).has('notifications')).toBe(false);
  });

  it('delivers scrolling events and refs from the actual viewport, with both scrollbars available', () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const viewportRef = React.createRef<HTMLDivElement>();
    const onScroll = vi.fn();
    const onViewportScroll = vi.fn();
    const { container } = render(
      <ScrollArea
        ref={rootRef}
        viewportRef={viewportRef}
        type="always"
        orientation="both"
        onScroll={onScroll}
        aria-label="Records"
        viewportProps={{ onScroll: onViewportScroll }}
      >
        <p>Record</p>
      </ScrollArea>,
    );
    const viewport = screen.getByRole('region', { name: 'Records' });
    expect(viewportRef.current).toBe(viewport);
    expect(rootRef.current).toContainElement(viewport);
    viewport.focus();
    expect(viewport).toHaveFocus();
    fireEvent.scroll(viewport, { target: { scrollTop: 32, scrollLeft: 16 } });
    expect(onScroll).toHaveBeenCalledOnce();
    expect(onViewportScroll).toHaveBeenCalledOnce();
    expect(onScroll.mock.calls[0][0].target).toBe(viewport);
    expect(container.querySelectorAll('[data-ui="scroll-bar"][data-slot="root"]')).toHaveLength(2);
  });

  it('preserves unstyled defaults in the viewport, scrollbars, and skeleton while forwarding native refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <StyleProvider unstyled>
        <ScrollArea type="always" orientation="both">
          <span>Content</span>
        </ScrollArea>
        <Skeleton ref={ref} data-testid="placeholder" className="custom-placeholder" />
      </StyleProvider>,
    );
    expect(ref.current).toBe(screen.getByTestId('placeholder'));
    expect(ref.current).toHaveClass('custom-placeholder');
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
    for (const node of container.querySelectorAll(
      '[data-ui="scroll-area"], [data-ui="scroll-bar"]',
    )) {
      expect(node.getAttribute('class') ?? '').toBe('');
    }
  });
});

describe('disclosure and menu state changes', () => {
  it('opens and closes accordion and collapsible regions with keyboard controls', async () => {
    const collapsibleRef = React.createRef<HTMLDivElement>();
    render(
      <>
        <Accordion type="single" collapsible>
          <AccordionItem value="billing">
            <AccordionTrigger>Billing</AccordionTrigger>
            <AccordionContent>Billing details</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Collapsible>
          <CollapsibleTrigger>More</CollapsibleTrigger>
          <CollapsibleContent ref={collapsibleRef}>More details</CollapsibleContent>
        </Collapsible>
      </>,
    );
    for (const name of ['Billing', 'More']) {
      const trigger = screen.getByRole('button', { name });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const region = document.getElementById(trigger.getAttribute('aria-controls')!)!;
      expect(region).toBeVisible();
      if (name === 'More') expect(collapsibleRef.current).toBe(region);
      await userEvent.keyboard('{Enter}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(() => expect(region).not.toBeVisible());
    }
  });

  it('selects a dropdown action from the keyboard and restores trigger focus', async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Options' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('switches navigation content without leaving the previous links accessible', async () => {
    render(
      <NavigationMenu delayDuration={0}>
        <NavigationMenuList>
          <NavigationMenuItem value="projects">
            <NavigationMenuTrigger>Projects</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#projects">All projects</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="teams">
            <NavigationMenuTrigger>Teams</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#teams">All teams</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    screen.getByRole('button', { name: 'Projects' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'All projects' })).toBeVisible();
    screen.getByRole('button', { name: 'Teams' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'All teams' })).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'All projects' })).not.toBeInTheDocument(),
    );
    screen.getByRole('link', { name: 'All teams' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'All teams' })).not.toBeInTheDocument(),
    );
  });
});

describe('toast defaults', () => {
  it('uses inverse theme tokens without a default close button and retains action buttons', async () => {
    const action = vi.fn();
    render(<Toaster />);
    act(() => {
      toast('Saved', {
        id: 'interaction-saved',
        duration: Infinity,
        description: 'Changes stored.',
        action: { label: 'Undo', onClick: action },
      });
    });
    const title = await screen.findByText('Saved');
    const notification = title.closest('[data-sonner-toast]')! as HTMLElement;
    expect(notification).toHaveAttribute('data-invert', 'true');
    expect(notification.style.getPropertyValue('--normal-bg')).toBe(
      'var(--ui-toast-background,var(--ui-foreground))',
    );
    expect(screen.queryByRole('button', { name: 'Close toast' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('respects native close-button and inline-style overrides', async () => {
    render(
      <Toaster closeButton toastOptions={{ style: { background: 'red', borderRadius: '2px' } }} />,
    );
    act(() => {
      toast('Review', { id: 'interaction-review', duration: Infinity });
    });
    const title = await screen.findByText('Review');
    expect(title.closest('[data-sonner-toast]')).toHaveStyle({
      background: 'red',
      borderRadius: '2px',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Close toast' }));
    await waitFor(() => expect(screen.queryByText('Review')).not.toBeInTheDocument());
  });
});
