import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import {
  Box,
  Container,
  Flex,
  Grid,
  Inline,
  Masonry,
  Spacer,
  SplitPane,
  SplitPaneHandle,
  SplitPanePanel,
  Stack,
} from '../src/ui/layout';
import { VirtualGrid, VirtualList, VirtualMasonry } from '../src/ui/virtual';
import {
  AppShell,
  BottomNavigation,
  SegmentedControl,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarItem,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Stepper,
  TreeView,
} from '../src/ui/sidebar';
import {
  Banner,
  ColorPicker,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  FileUpload,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  LoadingOverlay,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  MultiSelect,
  NumberInput,
  PasswordInput,
  PinInput,
  Rating,
  SearchInput,
  TagsInput,
  Timeline,
} from '../src/ui/advanced';
import { DirectionProvider, StyleProvider, ThemeScope } from '../src/ui/styling';

function data(container: HTMLElement) {
  return new FormData(container.querySelector('form')!);
}

describe('responsive layouts', () => {
  it('keeps responsive columns and spacing local to each layout', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Grid
        ref={ref}
        columns={{ base: 1, md: 3 }}
        gap={{ base: 1, lg: 3 }}
        padding={2}
        aria-label="Layout"
      >
        <Grid columns={2} gap={0} data-testid="nested" />
      </Grid>,
    );
    expect(ref.current?.style.getPropertyValue('--ui-layout-columns-base')).toBe(
      'repeat(1, minmax(0, 1fr))',
    );
    expect(ref.current?.style.getPropertyValue('--ui-layout-columns-sm')).toBe(
      'repeat(1, minmax(0, 1fr))',
    );
    expect(ref.current?.style.getPropertyValue('--ui-layout-columns-md')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
    expect(ref.current?.style.getPropertyValue('--ui-layout-gap-lg')).toBe('24px');
    expect(screen.getByTestId('nested').style.getPropertyValue('--ui-layout-gap-md')).toBe('0px');
  });

  it('preserves semantic child elements, native props, refs, and style overrides', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Box ref={ref} asChild padding={1} style={{ padding: 12 }}>
        <section aria-label="Overview">Content</section>
      </Box>,
    );
    expect(screen.getByRole('region', { name: 'Overview' })).toBe(ref.current);
    expect(ref.current).toHaveStyle({ padding: '12px' });
    expect(ref.current).toHaveAttribute('data-ui', 'box');
  });

  it('keeps masonry in source order and makes layout primitives available without default classes', () => {
    const { container } = render(
      <StyleProvider unstyled>
        <Container>
          <Stack>
            <Flex>
              <Inline>
                <Spacer size={2} />
              </Inline>
            </Flex>
          </Stack>
          <Masonry columns={{ base: 1, lg: 3 }}>
            <a href="#one">One</a>
            <a href="#two">Two</a>
            <a href="#three">Three</a>
          </Masonry>
        </Container>
      </StyleProvider>,
    );
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'One',
      'Two',
      'Three',
    ]);
    container
      .querySelectorAll('[data-ui]')
      .forEach((element) => expect(element.className).toBe(''));
  });

  it('uses the panel engine and exposes a labelled keyboard separator and native group ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SplitPane ref={ref} orientation="horizontal" style={{ height: 240 }}>
        <SplitPanePanel id="left" defaultSize="40%" minSize="20%">
          Left
        </SplitPanePanel>
        <SplitPaneHandle aria-label="Resize project panes" />
        <SplitPanePanel id="right" defaultSize="60%">
          Right
        </SplitPanePanel>
      </SplitPane>,
    );
    expect(ref.current).toHaveAttribute('data-group');
    expect(screen.getByRole('separator', { name: 'Resize project panes' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-controls', 'left');
  });
});

describe('sidebar and navigation', () => {
  it('connects the desktop trigger to the actual sidebar and toggles a collapsed rail', async () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar id="primary" label="Main">
          <SidebarContent>
            <SidebarGroup label="Projects">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarItem active>Overview</SidebarItem>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>Workspace</SidebarInset>
      </SidebarProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Collapse navigation' });
    expect(trigger).toHaveAttribute('aria-controls', 'primary');
    expect(screen.getByRole('complementary', { name: 'Main' })).toHaveAttribute(
      'data-state',
      'expanded',
    );
    await userEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('complementary', { name: 'Main' })).toHaveAttribute(
      'data-state',
      'collapsed',
    );
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('respects controlled collapse state', async () => {
    const onChange = vi.fn();
    render(
      <SidebarProvider collapsed onCollapsedChange={onChange}>
        <SidebarTrigger />
        <Sidebar>Items</Sidebar>
      </SidebarProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('complementary')).toHaveAttribute('data-state', 'collapsed');
  });

  it('blocks disabled composed links before their child handler runs', async () => {
    const handler = vi.fn();
    render(
      <SidebarItem asChild disabled label="Archived">
        <a href="#archived" onClick={handler}>
          Archived
        </a>
      </SidebarItem>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');
    await userEvent.click(screen.getByRole('link'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('opens mobile navigation through the sheet and restores the external trigger after Escape', async () => {
    const original = window.matchMedia;
    const media = original('(max-width: 767px)');
    window.matchMedia = vi.fn((query) => ({
      ...media,
      media: query,
      matches: query === '(max-width: 767px)',
    }));
    try {
      render(
        <SidebarProvider width="280px">
          <SidebarTrigger />
          <Sidebar label="Mobile navigation">
            <SidebarContent>
              <SidebarItem>Inbox</SidebarItem>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>,
      );
      const trigger = await screen.findByRole('button', { name: 'Open navigation' });
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog', { name: 'Mobile navigation' });
      expect(dialog.style.getPropertyValue('--ui-sidebar-width')).toBe('280px');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    } finally {
      window.matchMedia = original;
    }
  });

  it('gives app content a skip destination and bottom navigation visible labelled native actions', async () => {
    const onChange = vi.fn();
    render(
      <AppShell
        contentId="workspace"
        header="Inbox"
        bottomNavigation={
          <BottomNavigation
            defaultValue="home"
            onValueChange={onChange}
            items={[
              { value: 'home', label: 'Home' },
              { value: 'activity', label: 'Activity' },
              { value: 'settings', label: 'Settings', href: '#settings', disabled: true },
            ]}
          />
        }
      >
        Messages
      </AppShell>,
    );
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#workspace',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'workspace');
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'Activity' }));
    expect(onChange).toHaveBeenCalledWith('activity');
    expect(screen.getByRole('button', { name: 'Activity' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Settings').closest('[aria-disabled]')).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('supports linear steps, current-step semantics, and keyboard focus navigation', async () => {
    render(
      <Stepper
        linear
        steps={[
          { value: 'details', label: 'Details' },
          { value: 'review', label: 'Review' },
          { value: 'done', label: 'Done' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    const details = screen.getByRole('button', { name: 'Details' });
    details.focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('uses RTL radios and submits the selected segment as a named form value', async () => {
    const { container } = render(
      <DirectionProvider dir="rtl">
        <form>
          <SegmentedControl
            name="view"
            defaultValue="list"
            aria-label="View"
            options={[
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
            ]}
          />
        </form>
      </DirectionProvider>,
    );
    screen.getByRole('radio', { name: 'List' }).focus();
    await userEvent.keyboard('{ArrowLeft>}');
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked());
    await userEvent.keyboard('{/ArrowLeft}');
    expect(data(container).get('view')).toBe('grid');
  });

  it('expands trees, skips disabled nodes, selects by keyboard, and moves back to a parent', async () => {
    const onSelect = vi.fn();
    render(
      <TreeView
        onSelectionChange={onSelect}
        nodes={[
          {
            id: 'folder',
            label: 'Documents',
            children: [
              { id: 'locked', label: 'Locked', disabled: true },
              { id: 'report', label: 'Report' },
            ],
          },
          { id: 'archive', label: 'Archive' },
        ]}
      />,
    );
    const folder = screen.getByRole('treeitem', { name: 'Documents' });
    folder.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    expect(folder).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'Report' })).toHaveFocus();
    expect(screen.getByRole('treeitem', { name: 'Report' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(onSelect).toHaveBeenCalledWith('report', expect.objectContaining({ label: 'Report' }));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(folder).toHaveFocus();
    expect(folder).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('a');
    expect(screen.getByRole('treeitem', { name: 'Archive' })).toHaveFocus();
  });

  it('uses RTL expansion keys and preserves controlled tree selection', async () => {
    const onSelect = vi.fn();
    render(
      <DirectionProvider dir="rtl">
        <TreeView
          selectedId="folder"
          onSelectionChange={onSelect}
          nodes={[{ id: 'folder', label: 'Folder', children: [{ id: 'file', label: 'File' }] }]}
        />
      </DirectionProvider>,
    );
    screen.getByRole('treeitem', { name: 'Folder' }).focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft} ');
    expect(onSelect).toHaveBeenCalledWith('file', expect.anything());
    expect(screen.getByRole('treeitem', { name: 'Folder' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('advanced form controls', () => {
  it('steps decimal numbers without precision drift and submits a native named number input', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <NumberInput
          ref={ref}
          name="quantity"
          defaultValue={0.1}
          step={0.1}
          min={0}
          max={0.3}
          onChange={onChange}
          aria-label="Quantity"
        />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    expect(ref.current).toHaveValue(0.2);
    await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    expect(ref.current).toHaveValue(0.3);
    expect(screen.getByRole('button', { name: 'Increase value' })).toBeDisabled();
    expect(data(container).get('quantity')).toBe('0.3');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('keeps numeric input editable and clamps a typed out-of-range value on blur', async () => {
    render(<NumberInput defaultValue={1} min={0} max={10} aria-label="Quantity" />);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '123');
    expect(input).toHaveValue(123);
    fireEvent.blur(input);
    expect(input).toHaveValue(10);
  });

  it('supports controlled search inputs using native onChange and restores focus after clearing', async () => {
    function Example() {
      const [value, setValue] = React.useState('reports');
      return (
        <SearchInput
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          aria-label="Find records"
        />
      );
    }
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('searchbox', { name: 'Find records' })).toHaveValue('');
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('reveals passwords without losing the submitted value or native ref', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <form>
        <PasswordInput
          ref={ref}
          defaultValue="secret"
          name="password"
          aria-label="Account password"
        />
      </form>,
    );
    expect(ref.current).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(ref.current).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(data(container).get('password')).toBe('secret');
  });

  it('supports OTP paste, numeric sanitizing, completion, autofill, and one native submitted value', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { container } = render(
      <form>
        <PinInput
          length={4}
          name="code"
          aria-label="Security code"
          onComplete={onComplete}
          required
        />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Security code' });
    await user.click(input);
    await user.paste('12 34');
    expect(input).toHaveValue('1234');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(data(container).getAll('code')).toEqual(['1234']);
    expect((input as HTMLInputElement).checkValidity()).toBe(true);
  });

  it('accepts native files and reports invalid batches without presenting rejected selections', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(
      <FileUpload
        multiple
        accept="image/*"
        maxFiles={2}
        maxSize={10}
        onFilesChange={onFiles}
        onReject={onReject}
        aria-label="Attachments"
      />,
    );
    const input = screen.getByLabelText('Attachments');
    const wrong = new File(['text'], 'notes.txt', { type: 'text/plain' });
    await user.upload(input, wrong);
    expect(onReject).toHaveBeenCalledWith([{ file: wrong, reason: 'type' }]);
    expect(screen.queryByRole('list', { name: 'Selected files' })).not.toBeInTheDocument();
    const valid = new File(['data'], 'photo.png', { type: 'image/png' });
    await user.upload(input, valid);
    expect(onFiles).toHaveBeenCalledWith([valid]);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent('photo.png');
    expect((input as HTMLInputElement).files?.[0]).toBe(valid);
    await user.click(screen.getByRole('button', { name: 'Remove photo.png' }));
    expect((input as HTMLInputElement).files).toHaveLength(0);
  });

  it.each(['controlled', 'uncontrolled'] as const)(
    'restores %s native file selections after form reset without a value change',
    async (mode) => {
      const file = new File(['saved'], 'saved.txt', { type: 'text/plain' });
      const files = [file];
      class Transfer {
        files: File[] = [];
        items = { add: (item: File) => this.files.push(item) };
      }
      // jsdom has no DataTransfer; spy on the native setter to test reset synchronization.
      const transferDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'DataTransfer');
      Object.defineProperty(globalThis, 'DataTransfer', {
        value: Transfer,
        configurable: true,
        writable: true,
      });
      const assign = vi
        .spyOn(HTMLInputElement.prototype, 'files', 'set')
        .mockImplementation(() => {});
      try {
        const { container } = render(
          <form>
            <FileUpload
              name="documents"
              aria-label="Documents"
              {...(mode === 'controlled' ? { value: files } : { defaultValue: files })}
            />
          </form>,
        );
        expect(assign).toHaveBeenCalled();
        assign.mockClear();
        fireEvent.reset(container.querySelector('form')!);
        await waitFor(() => expect(assign).toHaveBeenCalledWith(files));
        expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent('saved.txt');
      } finally {
        assign.mockRestore();
        if (transferDescriptor)
          Object.defineProperty(globalThis, 'DataTransfer', transferDescriptor);
        else Reflect.deleteProperty(globalThis, 'DataTransfer');
      }
    },
  );

  it('selects a labelled color swatch and submits the native color value', async () => {
    const nativeChange = vi.fn();
    const valueChange = vi.fn();
    const formChange = vi.fn();
    const { container } = render(
      <form onChange={formChange}>
        <ColorPicker
          name="accent"
          defaultValue="#123456"
          swatches={['#654321', 'invalid']}
          aria-label="Accent"
          onChange={(event) => nativeChange(event.currentTarget.value)}
          onValueChange={valueChange}
        />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Choose color' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose #654321' }));
    expect(screen.getByLabelText('Accent')).toHaveValue('#654321');
    expect(data(container).get('accent')).toBe('#654321');
    expect(nativeChange).toHaveBeenCalledExactlyOnceWith('#654321');
    expect(valueChange).toHaveBeenCalledExactlyOnceWith('#654321');
    expect(formChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Choose invalid' })).not.toBeInTheDocument();
  });

  it('lets native handlers veto color changes from the popover', async () => {
    const change = vi.fn();
    render(
      <ColorPicker
        aria-label="Accent"
        defaultValue="#123456"
        swatches={['#654321']}
        onChange={(event) => event.preventDefault()}
        onValueChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Choose color' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose #654321' }));
    expect(screen.getByLabelText('Accent')).toHaveValue('#123456');
    expect(change).not.toHaveBeenCalled();
  });

  it('uses keyboard ratings and a single named form value', async () => {
    const { container } = render(
      <form>
        <Rating name="rating" defaultValue={2} allowClear aria-label="Review rating" />
      </form>,
    );
    screen.getByRole('radio', { name: '2 of 5 stars' }).focus();
    await userEvent.keyboard('{ArrowRight>}');
    await waitFor(() => expect(screen.getByRole('radio', { name: '3 of 5 stars' })).toBeChecked());
    await userEvent.keyboard('{/ArrowRight}');
    expect(data(container).getAll('rating')).toEqual(['3']);
    await userEvent.click(screen.getByRole('button', { name: 'Clear rating' }));
    expect(data(container).get('rating')).toBe('0');
  });

  it('adds, deduplicates, removes, and submits tag values as repeated native fields', async () => {
    const { container } = render(
      <form>
        <TagsInput name="tags" defaultValue={['design']} aria-label="Topics" />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Topics' });
    await userEvent.type(input, 'react{Enter}react{Enter}');
    expect(data(container).getAll('tags')).toEqual(['design', 'react']);
    await userEvent.type(input, 'uncommitted{Escape}');
    expect(input).toHaveValue('');
    expect(data(container).getAll('tags')).toEqual(['design', 'react']);
    await userEvent.keyboard('{Backspace}');
    expect(data(container).getAll('tags')).toEqual(['design']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(input).toHaveFocus();
    expect(data(container).getAll('tags')).toEqual([]);
  });

  it('does not commit tags while an IME composition is in progress', () => {
    const onChange = vi.fn();
    render(<TagsInput aria-label="Topics" onValueChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'composition' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('filters a multi-select, skips disabled options, and submits independent selected values', async () => {
    const { container } = render(
      <form>
        <MultiSelect
          name="teams"
          aria-label="Teams"
          defaultValue={['product']}
          options={[
            { value: 'product', label: 'Product' },
            { value: 'locked', label: 'Locked', disabled: true },
            { value: 'design', label: 'Design' },
            { value: 'engineering', label: 'Engineering' },
          ]}
        />
      </form>,
    );
    const input = screen.getByRole('combobox', { name: 'Teams' });
    await userEvent.click(input);
    await userEvent.type(input, 'eng');
    await userEvent.keyboard('{Enter}');
    expect(data(container).getAll('teams')).toEqual(['product', 'engineering']);
    expect(screen.getByRole('option', { name: 'Engineering' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Product' }));
    expect(data(container).getAll('teams')).toEqual(['engineering']);
  });

  it('preserves controlled tag and multi-select values until their parent updates', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <TagsInput value={['kept']} name="tags" onValueChange={onChange} />
        <MultiSelect
          value={['design']}
          name="teams"
          options={[{ value: 'design', label: 'Design' }]}
          onValueChange={onChange}
        />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove kept' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Design' }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(data(container).get('tags')).toBe('kept');
    expect(data(container).get('teams')).toBe('design');
  });

  it('restores uncontrolled inputs and composite values when their native form resets', async () => {
    const { container } = render(
      <form>
        <SearchInput name="search" defaultValue="initial" />
        <NumberInput name="count" defaultValue={2} />
        <TagsInput name="tags" defaultValue={['initial']} />
        <Rating name="rating" defaultValue={2} />
        <MultiSelect
          name="teams"
          defaultValue={['design']}
          options={[{ value: 'design', label: 'Design' }]}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove initial' }));
    await userEvent.click(screen.getByRole('radio', { name: '4 of 5 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Design' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(data(container).getAll('tags')).toEqual(['initial']));
    expect(data(container).get('count')).toBe('2');
    expect(data(container).get('search')).toBe('initial');
    expect(data(container).get('rating')).toBe('2');
    expect(data(container).get('teams')).toBe('design');
  });

  it('excludes disabled composite controls from native form submission', () => {
    const { container } = render(
      <form>
        <TagsInput disabled name="tags" defaultValue={['one']} />
        <MultiSelect
          disabled
          name="teams"
          defaultValue={['design']}
          options={[{ value: 'design', label: 'Design' }]}
        />
        <Rating disabled name="rating" defaultValue={3} />
      </form>,
    );
    expect([...data(container).keys()]).toEqual([]);
  });

  it('connects required composite inputs to native validity without requiring a draft after selection', async () => {
    render(
      <form>
        <TagsInput required defaultValue={['one']} aria-label="Tags" />
        <MultiSelect required aria-label="Teams" options={[{ value: 'design', label: 'Design' }]} />
      </form>,
    );
    expect(screen.getByRole('textbox', { name: 'Tags' })).not.toBeRequired();
    const input = screen.getByRole('combobox', { name: 'Teams' });
    expect(input).toBeRequired();
    await userEvent.click(input);
    await userEvent.keyboard('{Enter}');
    expect(input).not.toBeRequired();
  });

  it('keeps uncommitted drafts from satisfying required tags and selections', async () => {
    render(
      <form>
        <TagsInput required aria-label="Required tags" />
        <MultiSelect
          required
          aria-label="Required teams"
          options={[{ value: 'design', label: 'Design' }]}
        />
      </form>,
    );
    const tags = screen.getByRole('textbox', { name: 'Required tags' }) as HTMLInputElement;
    await userEvent.type(tags, 'draft');
    expect(tags.checkValidity()).toBe(false);
    await userEvent.keyboard('{Enter}');
    expect(tags.checkValidity()).toBe(true);
    const teams = screen.getByRole('combobox', { name: 'Required teams' }) as HTMLInputElement;
    await userEvent.type(teams, 'design');
    expect(teams.checkValidity()).toBe(false);
    await userEvent.keyboard('{Enter}');
    expect(teams.checkValidity()).toBe(true);
  });

  it('submits read-only colors and rating values through external native forms', () => {
    render(
      <>
        <form id="review" aria-label="Review" />
        <ColorPicker readOnly form="review" name="color" defaultValue="#123456" />
        <Rating readOnly form="review" name="rating" defaultValue={4} />
      </>,
    );
    const submitted = new FormData(screen.getByRole('form', { name: 'Review' }) as HTMLFormElement);
    expect(submitted.get('color')).toBe('#123456');
    expect(submitted.get('rating')).toBe('4');
  });
});

describe('menus and feedback', () => {
  it('supports Radix menubar keyboard opening, selection, and disabled menu items', async () => {
    const onSelect = vi.fn();
    render(
      <Menubar aria-label="Application">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>Unavailable</MenubarItem>
            <MenubarItem onSelect={onSelect}>New project</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    screen.getByRole('menuitem', { name: 'File' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    const item = await screen.findByRole('menuitem', { name: 'New project' });
    await waitFor(() => expect(item).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens a context menu and honors the consumer selection event', async () => {
    const onSelect = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Project</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onSelect}>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('Project'), { clientX: 12, clientY: 12 });
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('supports native composed links inside menus', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Links</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem asChild shortcut="P">
            <a href="#project">Open project</a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('Links'));
    const item = await screen.findByRole('menuitem', { name: 'Open project P' });
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '#project');
  });

  it('opens context menus from the keyboard and restores their focused target', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Project actions</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const trigger = screen.getByText('Project actions');
    expect(trigger).toHaveAttribute('tabindex', '0');
    trigger.focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps hover content in a scoped RTL portal and inherits unstyled mode', async () => {
    const { container } = render(
      <ThemeScope dir="rtl" unstyled data-testid="scope">
        <HoverCard defaultOpen>
          <HoverCardTrigger href="#profile">Profile</HoverCardTrigger>
          <HoverCardContent>Profile details</HoverCardContent>
        </HoverCard>
      </ThemeScope>,
    );
    const content = await screen.findByText('Profile details');
    expect(within(screen.getByTestId('scope')).getByText('Profile details')).toBe(content);
    expect(content).toHaveAttribute('dir', 'rtl');
    expect(content.className).toBe('');
    expect(container.querySelector('[data-ui="hover-card"]')).toBeTruthy();
  });

  it('renders semantic timeline dates in source order', () => {
    render(
      <>
        <Timeline
          items={[
            { id: 'created', title: 'Created', time: '09:00', dateTime: '2026-10-01T09:00:00Z' },
            { id: 'approved', title: 'Approved', status: 'current' },
          ]}
        />
      </>,
    );
    expect(screen.getByText('09:00')).toHaveAttribute('datetime', '2026-10-01T09:00:00Z');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Created09:00',
      'Approved',
    ]);
    expect(screen.getByText('Approved').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('announces banners and only dismisses controlled banners after their parent updates', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Banner open variant="danger" title="Upload failed" dismissible onOpenChange={onChange}>
        Try again.
      </Banner>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');
    rerender(<Banner open={false} title="Upload failed" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('makes busy content inert and exposes a labelled loading status', () => {
    const { rerender } = render(
      <LoadingOverlay label="Saving">
        <button type="button">Save</button>
      </LoadingOverlay>,
    );
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();
    expect(screen.getByText('Save').parentElement).toHaveAttribute('inert');
    rerender(
      <LoadingOverlay visible={false}>
        <button type="button">Save</button>
      </LoadingOverlay>,
    );
    expect(screen.getByRole('button', { name: 'Save' }).parentElement).not.toHaveAttribute('inert');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes defaults from all slots of composite controls in an unstyled provider', () => {
    const { container } = render(
      <StyleProvider unstyled>
        <NumberInput />
        <SearchInput />
        <PasswordInput />
        <PinInput />
        <TagsInput defaultValue={['tag']} />
        <MultiSelect options={[]} />
        <ColorPicker swatches={['#123456']} />
        <Rating />
        <Banner title="Saved" dismissible />
        <SidebarProvider>
          <SidebarTrigger />
          <Sidebar>
            <SidebarContent>
              <SidebarItem>Inbox</SidebarItem>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
        <TreeView nodes={[{ id: 'one', label: 'One' }]} />
        <Stepper steps={[{ value: 'one', label: 'One' }]} />
      </StyleProvider>,
    );
    container
      .querySelectorAll('[data-ui]')
      .forEach((element) =>
        expect(
          (element.getAttribute('class') ?? '')
            .split(' ')
            .filter((name) => name && !name.startsWith('lucide')),
        ).toEqual([]),
      );
  });
});

describe('standalone virtual collections', () => {
  const items = Array.from({ length: 100 }, (_, index) => ({
    id: `item-${index}`,
    label: `Item ${index}`,
  }));
  it('renders keyed generic lists with keyboard scroll access and a bounded SSR fallback', () => {
    const html = renderToString(
      <VirtualList
        items={items}
        getItemKey={(item) => item.id}
        renderItem={(item) => <button>{item.label}</button>}
        ssrCount={4}
      />,
    );
    expect(html).toContain('Item 3');
    expect(html).not.toContain('Item 4');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-setsize="100"');
  });

  it('server-renders fixed-height grids and lane-based masonry without accessing window', () => {
    const grid = renderToString(
      <VirtualGrid
        columns={3}
        rowHeight={80}
        items={items}
        getItemKey={(item) => item.id}
        renderItem={(item) => item.label}
        ssrCount={6}
      />,
    );
    const masonry = renderToString(
      <VirtualMasonry
        lanes={2}
        items={items}
        getItemKey={(item) => item.id}
        renderItem={(item) => item.label}
        ssrCount={4}
      />,
    );
    expect(grid).toContain('height:80px');
    expect(grid).toContain('repeat(3, minmax(0, 1fr))');
    expect(masonry.indexOf('Item 0')).toBeLessThan(masonry.indexOf('Item 1'));
    expect(masonry).not.toContain('Item 4');
  });

  it('renders labelled empty collections and forwards their native scroll-container refs', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <VirtualList
        ref={ref}
        items={items.slice(0, 0)}
        getItemKey={(item) => item.id}
        renderItem={(item) => item.label}
        emptyContent="No records"
        aria-label="Records"
      />,
    );
    expect(ref.current).toBe(screen.getByRole('list', { name: 'Records' }));
    expect(ref.current).toHaveTextContent('No records');
  });
});
