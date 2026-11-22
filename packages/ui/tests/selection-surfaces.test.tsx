import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhoneInput } from '../src/ui/phone-input';
import { Combobox } from '../src/ui/command';
import { MultiSelect } from '../src/ui/advanced';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../src/ui/forms';
import { PlainProvider, ThemeScope } from '../src/ui/styling';
import { LanguageProvider } from '../src/ui/i18n';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '../src/ui/overlays';
import type { SelectionPresentation } from '../src/ui/forms';

let compact = true;
let originalMatchMedia: typeof window.matchMedia;
const mediaListeners = new Set<() => void>();
beforeEach(() => {
  compact = true;
  originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return query === '(max-width: 767px)' && compact;
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, listener: () => void) => {
      mediaListeners.add(listener);
    }),
    removeEventListener: vi.fn((_: string, listener: () => void) => {
      mediaListeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
});
afterEach(() => {
  window.matchMedia = originalMatchMedia;
  mediaListeners.clear();
});
const options = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'unavailable', label: 'Unavailable', disabled: true },
];
function SelectExample({ presentation }: { presentation?: SelectionPresentation }) {
  return (
    <Select
      name="team"
      defaultValue="design"
      presentation={presentation}
      sheetTitle="Choose a team"
    >
      <SelectTrigger aria-label="Team">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

describe('responsive selection surfaces', () => {
  it.each(['select', 'combobox', 'multi-select'] as const)(
    '%s starts a sheet drag from its heading while leaving options and search alone',
    async (kind) => {
      const user = userEvent.setup();
      const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
      try {
        render(
          kind === 'select' ? (
            <SelectExample presentation="sheet" />
          ) : kind === 'combobox' ? (
            <Combobox aria-label="Team" presentation="sheet" options={options} />
          ) : (
            <MultiSelect aria-label="Team" presentation="sheet" options={options} />
          ),
        );
        await user.click(screen.getByRole('combobox', { name: 'Team' }));
        const sheet = await screen.findByRole('dialog');
        // JSDOM has no stylesheet-backed transform for Vaul's release calculation.
        sheet.style.transform = 'none';
        const heading = within(sheet).getByRole('heading');
        capture.mockClear();
        fireEvent.pointerDown(heading, { pointerId: 1, button: 0, pointerType: 'mouse' });
        expect(capture.mock.instances).toEqual([heading]);
        fireEvent.pointerUp(heading, { pointerId: 1, pointerType: 'mouse' });
        capture.mockClear();
        for (const control of [
          within(sheet).getByRole('option', { name: 'Design' }),
          ...within(sheet).queryAllByRole('combobox'),
        ]) {
          fireEvent.pointerDown(control, { pointerId: 2, button: 0, pointerType: 'mouse' });
          fireEvent.pointerUp(control, { pointerId: 2, pointerType: 'mouse' });
        }
        expect(capture).not.toHaveBeenCalled();
      } finally {
        capture.mockRestore();
      }
    },
  );

  it('opens phone country search in a mobile sheet, selects once and restores the stable trigger', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const ref = React.createRef<HTMLInputElement>();
    render(
      <PhoneInput
        ref={ref}
        defaultCountry="US"
        countries={['US', 'GB', 'EG']}
        onCountryChange={change}
      />,
    );
    const input = screen.getByRole('textbox');
    const trigger = screen.getByRole('combobox', { name: /Country: United States/ });
    await user.click(trigger);
    const sheet = screen.getByRole('dialog', { name: 'Country' });
    expect(sheet).toHaveAttribute('data-presentation', 'sheet');
    await user.type(within(sheet).getByRole('combobox', { name: 'Search countries...' }), '+20');
    await user.click(screen.getByRole('option', { name: /Egypt/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(change).toHaveBeenCalledExactlyOnceWith('EG');
    expect(trigger).toHaveFocus();
    expect(ref.current).toBe(input);
  });

  it('keeps an open surface stable across resize, then adapts the next opening', async () => {
    const user = userEvent.setup();
    render(<PhoneInput defaultCountry="US" countries={['US', 'EG']} />);
    const trigger = screen.getByRole('combobox', { name: /Country: United States/ });
    await user.click(trigger);
    const sheet = screen.getByRole('dialog');
    act(() => {
      compact = false;
      mediaListeners.forEach((listener) => listener());
    });
    expect(screen.getByRole('dialog')).toBe(sheet);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'popover');
  });

  it('allows explicit popovers on mobile and explicit sheets on desktop', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PhoneInput presentation="popover" defaultCountry="US" />);
    await user.click(screen.getByRole('combobox', { name: /Country: United States/ }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'popover');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    compact = false;
    rerender(<PhoneInput presentation="sheet" defaultCountry="US" />);
    await user.click(screen.getByRole('combobox', { name: /Country: United States/ }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'sheet');
  });

  it.each([undefined, 'auto', 'sheet'] as const)(
    'retains native Select selection and form values (presentation: %s)',
    async (presentation) => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <SelectExample presentation={presentation} />
        </form>,
      );
      const trigger = screen.getByRole('combobox', { name: 'Team' });
      await user.click(trigger);
      const list = await screen.findByRole('listbox');
      await waitFor(() => expect(screen.getByRole('option', { name: 'Design' })).toHaveFocus());
      expect((screen.queryByRole('dialog') ?? list).classList.contains('ui-select-sheet')).toBe(
        presentation !== undefined,
      );
      expect(screen.getByRole('option', { name: 'Unavailable' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await user.click(screen.getByRole('option', { name: 'Engineering' }));
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(new FormData(container.querySelector('form')!).get('team')).toBe('engineering');
      expect(trigger).toHaveFocus();
      await act(() => container.querySelector('form')!.reset());
      expect(new FormData(container.querySelector('form')!).get('team')).toBe('design');
    },
  );

  it('preserves the Sheet header and option interaction when SelectContent has a tooltip', async () => {
    const user = userEvent.setup();
    render(
      <Select presentation="sheet" defaultValue="design" sheetTitle="Choose team">
        <SelectTrigger aria-label="Team">
          <SelectValue />
        </SelectTrigger>
        <SelectContent tooltip="Choose a team for this project">
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="engineering">Engineering</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Team' });
    await user.click(trigger);
    const sheet = await screen.findByRole('dialog', { name: 'Choose team' });
    expect(within(sheet).getByRole('heading', { name: 'Choose team' })).toBeInTheDocument();
    expect(sheet.querySelector('[data-vaul-handle]')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Engineering' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent('Engineering');
    expect(trigger).toHaveFocus();
  });

  it('uses stable values for duplicate Combobox labels and supports localized sheet search', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();
    const { container } = render(
      <LanguageProvider locale="ar" messages={{ 'select.search': 'Find department' }}>
        <form id="form" />
        <Combobox
          ref={ref}
          aria-label="Department"
          dir="rtl"
          presentation="auto"
          name="team"
          form="form"
          onValueChange={change}
          options={[
            { value: 'first', label: 'Support', keywords: ['first team'] },
            { value: 'second', label: 'Support', keywords: ['second team'] },
            { value: 'disabled', label: 'Disabled', disabled: true },
          ]}
        />
      </LanguageProvider>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Department' });
    await user.click(trigger);
    const sheet = screen.getByRole('dialog', { name: 'Department' });
    expect(sheet).toHaveAttribute('dir', 'rtl');
    await user.type(
      within(sheet).getByRole('combobox', { name: 'Find department' }),
      'second team',
    );
    await user.keyboard('{Enter}');
    expect(change).toHaveBeenCalledExactlyOnceWith('second');
    expect(new FormData(container.querySelector('form')!).get('team')).toBe('second');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(ref.current).toBe(trigger);
  });

  it('keeps MultiSelect open until Done, honors limits, and validates/submits the original form', async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLInputElement>();
    const changed = vi.fn();
    const { container } = render(
      <form>
        <MultiSelect
          ref={ref}
          aria-label="Departments"
          name="teams"
          presentation="auto"
          options={options}
          maxSelected={1}
          required
          onValueChange={changed}
        />
      </form>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Departments' });
    expect(ref.current?.checkValidity()).toBe(false);
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Design' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Engineering' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(ref.current?.checkValidity()).toBe(true);
    expect([...new FormData(container.querySelector('form')!)]).toEqual([['teams', 'design']]);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(ref.current).toBe(trigger);
    expect(changed).toHaveBeenCalledExactlyOnceWith(['design']);
    await act(() => container.querySelector('form')!.reset());
    expect(new FormData(container.querySelector('form')!).has('teams')).toBe(false);
    expect(ref.current?.checkValidity()).toBe(false);
  });

  it('supports MultiSelect filtering, keyboard operation, cancellation and focus return without reopening', async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="Departments" options={options} presentation="sheet" />);
    const trigger = screen.getByRole('combobox', { name: 'Departments' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const search = screen.getByRole('combobox', { name: 'Search options...' });
    await user.type(search, 'Engineer');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('option', { name: 'Engineering' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('keeps Arabic messages, direction, theme and inherited unstyled scope inside the mobile portal', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PlainProvider persist={false}>
        <ThemeScope data-testid="scope" locale="ar" dir="rtl" mode="dark" unstyled>
          <MultiSelect aria-label="الفريق" presentation="auto" options={options} />
        </ThemeScope>
      </PlainProvider>,
    );
    await user.click(screen.getByRole('combobox', { name: 'الفريق' }));
    const sheet = screen.getByRole('dialog', { name: 'الفريق' });
    expect(sheet).toHaveAttribute('dir', 'rtl');
    expect(container.querySelector('[data-testid="scope"]')).toContainElement(sheet);
    expect(sheet).not.toHaveClass('ui-selection-sheet');
    expect(sheet.style.padding).toBe('');
    expect(screen.getByRole('combobox', { name: 'البحث في الخيارات...' })).not.toHaveClass(
      'ui-selection-search',
    );
    expect(screen.getByRole('button', { name: 'تم' })).toBeInTheDocument();
  });

  it('applies provider direction to generic popovers outside a scoped portal container', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider locale="ar">
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Details">Context</PopoverContent>
        </Popover>
      </LanguageProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Details' })).toHaveAttribute('dir', 'rtl');
  });

  it.each(['dialog', 'alertdialog'])(
    'applies provider direction to %s content and permits a native local override',
    async (kind) => {
      const user = userEvent.setup();
      const example = (dir?: 'ltr') => (
        <LanguageProvider locale="ar">
          {kind === 'dialog' ? (
            <Dialog>
              <DialogTrigger>Open</DialogTrigger>
              <DialogContent dir={dir}>
                <DialogTitle>Details</DialogTitle>
                <DialogDescription>Context</DialogDescription>
              </DialogContent>
            </Dialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger>Open</AlertDialogTrigger>
              <AlertDialogContent dir={dir}>
                <AlertDialogTitle>Details</AlertDialogTitle>
                <AlertDialogDescription>Context</AlertDialogDescription>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </LanguageProvider>
      );
      const { rerender } = render(example());
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole(kind, { name: 'Details' })).toHaveAttribute('dir', 'rtl');
      rerender(example('ltr'));
      expect(screen.getByRole(kind, { name: 'Details' })).toHaveAttribute('dir', 'ltr');
    },
  );
});
