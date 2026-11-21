import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button, Badge, Card, AspectRatio } from '../src/ui/primitives';
import {
  Input,
  Field,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Slider,
} from '../src/ui/forms';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../src/ui/navigation';
import { PlainProvider, ThemeScope } from '../src/ui/styling';
import { TooltipProvider } from '../src/ui/tooltip';
import { Stack, LayoutPresence } from '../src/ui/layout';
import { Span } from '../src/ui/typography';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../src/ui/overlays';
import { DatePicker } from '../src/ui/calendar';

describe('shared tooltip prop', () => {
  it('names an icon button, preserves native refs/events and supports keyboard dismissal', async () => {
    const ref = React.createRef<HTMLButtonElement>(),
      click = vi.fn(),
      focus = vi.fn();
    render(
      <Button
        ref={ref}
        size="icon"
        tooltip={{ content: 'Save changes', delayDuration: 0 }}
        onClick={click}
        onFocus={focus}
      >
        <svg aria-hidden="true" />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(ref.current).toBe(button);
    expect(button).not.toHaveAttribute('tooltip');
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Save changes');
    expect(button).toHaveAccessibleDescription('Save changes');
    expect(focus).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(click).toHaveBeenCalledOnce();
  });
  it('keeps Field descriptions and validation while tooltips toggle without replacing the input', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const view = (enabled: boolean) => (
      <form>
        <Field label="Account name" description="Shown to your team.">
          <Input
            ref={ref}
            name="account"
            required
            defaultValue="Studio"
            tooltip={enabled ? 'Use your workspace name' : false}
          />
        </Field>
      </form>
    );
    const { rerender, container } = render(view(true));
    const input = screen.getByRole('textbox', { name: 'Account name' });
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(input).toHaveAccessibleDescription(/Shown to your team.*Use your workspace name/);
    await userEvent.type(input, ' A');
    rerender(view(false));
    expect(ref.current).toBe(input);
    expect(input).toHaveValue('Studio A');
    expect(input).toHaveAccessibleDescription('Shown to your team.');
    expect(new FormData(container.querySelector('form')!).get('account')).toBe('Studio A');
    expect(input).toBeRequired();
  });
  it('preserves explicit names, slotted links and cancelled consumer events', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button
        asChild
        ref={ref}
        tooltip="Open account settings"
        onFocus={(event) => event.preventDefault()}
      >
        <a href="/account" aria-label="Account">
          <svg aria-hidden="true" />
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Account' });
    expect(ref.current).toBe(link);
    await userEvent.tab();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(link).toHaveAttribute('href', '/account');
  });
  it('makes disabled actions discoverable without enabling them', async () => {
    const ref = React.createRef<HTMLButtonElement>(),
      click = vi.fn();
    render(
      <Button
        ref={ref}
        disabled
        tooltip={{ content: 'Choose a file first', delayDuration: 0 }}
        onClick={click}
      >
        Upload
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Upload' });
    expect(ref.current).toBe(button);
    expect(button).toBeDisabled();
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Choose a file first');
    expect(screen.getByRole('group', { name: 'Upload' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(click).not.toHaveBeenCalled();
  });
  it('does not replace checked or active primitive state', async () => {
    render(
      <>
        <Checkbox aria-label="Notify me" defaultChecked tooltip="Notifications are enabled" />
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a" tooltip="First view">
              First
            </TabsTrigger>
            <TabsTrigger value="b" tooltip="Second view">
              Second
            </TabsTrigger>
          </TabsList>
          <TabsContent value="a">First content</TabsContent>
          <TabsContent value="b">Second content</TabsContent>
        </Tabs>
      </>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Notify me' });
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    const first = screen.getByRole('tab', { name: 'First' });
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute('data-state', 'active');
    await userEvent.keyboard('{ArrowRight}');
    const second = screen.getByRole('tab', { name: 'Second' });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second content');
  });
  it('shares provider settings, supports controlled rich tooltips and follows local portals', async () => {
    const change = vi.fn();
    const { rerender } = render(
      <PlainProvider persist={false} tooltip={{ delayDuration: 0 }}>
        <ThemeScope dir="rtl" data-testid="scope">
          <Button
            tooltip={{
              content: <strong>Context details</strong>,
              open: true,
              onOpenChange: change,
              side: 'right',
            }}
          >
            Details
          </Button>
        </ThemeScope>
      </PlainProvider>,
    );
    const tip = await screen.findByRole('tooltip');
    expect(screen.getByTestId('scope')).toContainElement(tip);
    await userEvent.keyboard('{Escape}');
    expect(change).toHaveBeenCalledWith(false);
    rerender(
      <PlainProvider persist={false}>
        <Button tooltip={{ content: 'Hidden', open: false }}>Details</Button>
      </PlainProvider>,
    );
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });
  it('supports noninteractive targets and renders complete native HTML during SSR', async () => {
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <Stack tooltip="Workspace tools">
          <Badge tooltip="Unpublished">Draft</Badge>
          <Span tooltip="More details">Info</Span>
          <Card tooltip="Project overview">Project</Card>
        </Stack>
      </TooltipProvider>,
    );
    const badge = screen.getByText('Draft');
    await userEvent.tab();
    await userEvent.tab();
    expect(badge).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Unpublished');
    expect(container.querySelector('[tooltip]')).toBeNull();
    const html = renderToString(
      <Button name="action" value="save" type="submit" tooltip="Save changes">
        Save
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('name="action"');
    expect(html).not.toContain('tooltip="');
    expect(html).not.toContain('role="tooltip"');
  });
  it('keeps Select trigger behavior and selection when a tooltip is configured', async () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger aria-label="Project" tooltip="Choose a project">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Project' });
    await userEvent.tab();
    await screen.findByRole('tooltip');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(trigger).toHaveTextContent('Beta');
    expect(trigger).toHaveFocus();
  });
  it('keeps an explicitly disabled input mounted across disabled state changes', async () => {
    const view = (disabled: boolean) => (
      <Input aria-label="Name" defaultValue="Keep me" disabled={disabled} tooltip="Your name" />
    );
    const { rerender } = render(view(false));
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.type(input, ' please');
    rerender(view(true));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBe(input);
    rerender(view(false));
    expect(input).toHaveValue('Keep me please');
    await act(async () => input.focus());
  });
  it('forwards outer asChild trigger handlers and refs through the optional adapter', async () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    render(
      <Dialog>
        <DialogTrigger asChild tooltip="Open project details" ref={triggerRef}>
          <Button>Project details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Project information</DialogTitle>
          <DialogDescription>Saved project details.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Project details' });
    expect(triggerRef.current).toBe(trigger);
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Open project details');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toHaveTextContent('Project information');
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
  it('associates a compound hint with the focused slider thumb without replacing its value', async () => {
    render(<Slider aria-label="Volume" defaultValue={[40]} tooltip="Adjust the project volume" />);
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    await userEvent.tab();
    expect(thumb).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Adjust the project volume');
    expect(thumb).toHaveAccessibleDescription('Adjust the project volume');
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '41');
  });
  it('keeps date picker trigger composition and native values with a shared tooltip', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <DatePicker
        ref={ref}
        name="date"
        defaultValue={new Date(2026, 10, 21)}
        tooltip="Choose a project date"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Pick a date' });
    expect(ref.current).toBe(trigger);
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Choose a project date');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(document.querySelector('input[name="date"]')).toHaveValue('2026-11-21');
  });
  it('retains a button during loading and does not create hint tab stops for disabled hints', async () => {
    const view = (loading: boolean) => (
      <Button loading={loading} tooltip="Save project">
        Save
      </Button>
    );
    const { rerender } = render(view(false));
    const button = screen.getByRole('button', { name: 'Save' });
    rerender(view(true));
    expect(screen.getByRole('button', { name: 'Save' })).toBe(button);
    expect(button).toBeDisabled();
    rerender(
      <>
        <Badge tooltip={false}>No hint</Badge>
        <Button>Next</Button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
  it('retains updated descriptions while open and removes only its own description on dismissal', async () => {
    const view = (extra: boolean) => (
      <React.StrictMode>
        <p id="first-description">First description</p>
        <p id="next-description">Updated description</p>
        <Input
          aria-label="Project"
          aria-describedby={extra ? 'next-description' : 'first-description'}
          tooltip="Helpful project context"
        />
      </React.StrictMode>
    );
    const { rerender } = render(view(false));
    const input = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(input).toHaveAccessibleDescription('First description Helpful project context');
    rerender(view(true));
    await waitFor(() =>
      expect(input).toHaveAccessibleDescription('Updated description Helpful project context'),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    expect(input).toHaveAccessibleDescription('Updated description');
  });
  it('supports structural layout wrappers while retaining their native refs and content', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <>
        <LayoutPresence ref={ref} presence={false} tooltip="Layout context">
          Layout
        </LayoutPresence>
        <AspectRatio ratio={16 / 9} tooltip="Media context">
          Media
        </AspectRatio>
      </>,
    );
    await userEvent.tab();
    expect(ref.current).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Layout context');
    await userEvent.tab();
    expect(await screen.findByRole('tooltip', { name: 'Media context' })).toHaveTextContent(
      'Media context',
    );
  });
});
