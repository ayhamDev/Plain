import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PhoneInput, type PhoneInputDetails } from '../src/ui/phone-input';
import { Field } from '../src/ui/forms';
import { PlainProvider, ThemeScope } from '../src/ui/styling';
import { LanguageProvider } from '../src/ui/i18n';

const sample = '+12025550123';

describe('PhoneInput', () => {
  it('labels and focuses the actual tel input, and submits one canonical value', async () => {
    const user = userEvent.setup();
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <form aria-label="Contact">
        <Field label="Contact phone" description="We only call about your booking.">
          <PhoneInput ref={ref} name="phone" defaultCountry="US" defaultValue={sample} />
        </Field>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Contact phone' });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('type', 'tel');
    expect(input).toHaveAttribute('autocomplete', 'tel');
    expect(input).toHaveAccessibleDescription('We only call about your booking.');
    await user.click(screen.getByText('Contact phone'));
    expect(input).toHaveFocus();
    expect([...new FormData(container.querySelector('form')!)]).toEqual([['phone', sample]]);
  });

  it('formats national typing and emits native events separately from international digits', async () => {
    const user = userEvent.setup();
    const changes: Array<[string, PhoneInputDetails]> = [];
    const native = vi.fn();
    render(
      <PhoneInput
        aria-label="Mobile"
        defaultCountry="US"
        international={false}
        onChange={(event) => native(event.currentTarget.type)}
        onValueChange={(...args) => changes.push(args)}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Mobile' }), '2025550123');
    expect(native).toHaveBeenCalledWith('tel');
    expect(changes.at(-1)).toEqual([sample, { country: 'US', possible: true, valid: true }]);
    expect(screen.getByRole('textbox')).toHaveValue('(202) 555-0123');
  });

  it('accepts a pasted international number and updates its country', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<PhoneInput defaultCountry="US" onValueChange={changed} />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Control>}a{/Control}');
    await user.paste('+44 20 7946 0018');
    expect(changed).toHaveBeenLastCalledWith('+442079460018', {
      country: 'GB',
      possible: true,
      valid: true,
    });
    expect(screen.getByRole('combobox', { name: /Country: United Kingdom/ })).toBeInTheDocument();
  });

  it('keeps callback refs stable while formatting accepted edits', async () => {
    const user = userEvent.setup();
    const ref = vi.fn();
    render(<PhoneInput ref={ref} defaultCountry="US" international={false} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '2025550123');
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(input);
  });

  it('searches country names, ISO codes and calling codes, and restores trigger focus', async () => {
    const user = userEvent.setup();
    const countryChange = vi.fn();
    render(
      <PhoneInput
        defaultCountry="US"
        countries={['US', 'GB', 'EG']}
        onCountryChange={countryChange}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: /Country: United States/ });
    await user.click(trigger);
    const search = screen.getByRole('combobox', { name: 'Search countries...' });
    await user.type(search, '+20');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(countryChange).toHaveBeenLastCalledWith('EG');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName('Country: Egypt (+20)');
    await user.click(trigger);
    await user.type(screen.getByRole('combobox', { name: 'Search countries...' }), 'Atlantis');
    expect(screen.getByText('No countries found.')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('updates controlled values and treats an explicit undefined as empty', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<PhoneInput value={sample} onValueChange={onValueChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('+1 202 555 0123');
    rerender(<PhoneInput value="+442079460018" onValueChange={onValueChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('+44 20 7946 0018');
    rerender(<PhoneInput value={undefined} onValueChange={onValueChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('honors preventDefault on the native change and keeps the accepted value', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <PhoneInput
        defaultCountry="US"
        international={false}
        defaultValue={sample}
        onChange={(event) => event.preventDefault()}
        onValueChange={changed}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '9');
    expect(input).toHaveValue('(202) 555-0123');
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps rejected controlled edits consistent with form data and preserves focus', async () => {
    const user = userEvent.setup();
    const rejected = vi.fn();
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <form>
        <PhoneInput
          ref={ref}
          name="phone"
          defaultCountry="US"
          value={sample}
          onValueChange={rejected}
        />
      </form>,
    );
    await user.type(screen.getByRole('textbox'), '9');
    expect(screen.getByRole('textbox')).toHaveValue('+1 202 555 0123');
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(new FormData(container.querySelector('form')!).get('phone')).toBe(sample);
    expect(rejected).toHaveBeenCalledWith(`${sample}9`, expect.any(Object));
  });

  it('distinguishes empty, incomplete, possible and strictly valid numbers', async () => {
    const { rerender } = render(<PhoneInput aria-label="Phone" value="" required />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.validationMessage).toBe('Enter a phone number.');
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    rerender(<PhoneInput aria-label="Phone" value="+1202" />);
    expect(input.validationMessage).toBe('Enter a valid phone number.');
    rerender(<PhoneInput aria-label="Phone" value="+12223333333" />);
    expect(input.checkValidity()).toBe(true);
    rerender(<PhoneInput aria-label="Phone" value="+12223333333" validation="valid" />);
    expect(input.checkValidity()).toBe(false);
    rerender(<PhoneInput aria-label="Phone" value="+1202" validation={false} />);
    expect(input.checkValidity()).toBe(true);
    rerender(<PhoneInput aria-label="Phone" value="" />);
    expect(input.checkValidity()).toBe(true);
  });

  it('resets the uncontrolled value and country without emitting an edit', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    const ref = React.createRef<HTMLInputElement>();
    const { container } = render(
      <form>
        <PhoneInput
          ref={ref}
          name="phone"
          defaultCountry="US"
          defaultValue={sample}
          onValueChange={changed}
        />
        <button type="reset">Reset</button>
      </form>,
    );
    await user.clear(screen.getByRole('textbox'));
    await user.paste('+442079460018');
    changed.mockClear();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('+1 202 555 0123'));
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(new FormData(container.querySelector('form')!).get('phone')).toBe(sample);
    expect(screen.getByRole('combobox', { name: /Country: United States/ })).toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
  });

  it('honors canceled resets and supports an external form owner', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <form id="contact" onReset={(event) => event.preventDefault()} />
        <PhoneInput name="phone" form="contact" defaultCountry="US" defaultValue={sample} />
        <button type="reset" form="contact">
          Reset
        </button>
      </>,
    );
    await user.clear(screen.getByRole('textbox'));
    await user.paste('+442079460018');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('textbox')).toHaveValue('+44 20 7946 0018');
    expect(new FormData(container.querySelector('form')!).get('phone')).toBe('+442079460018');
  });

  it('keeps parent-owned state on form reset', async () => {
    const { container } = render(
      <form>
        <PhoneInput value={sample} defaultCountry="US" />
      </form>,
    );
    await act(() => container.querySelector('form')!.reset());
    expect(screen.getByRole('textbox')).toHaveValue('+1 202 555 0123');
  });

  it('prevents editing read-only/disabled controls and excludes only disabled fields from submission', () => {
    const { container } = render(
      <form>
        <PhoneInput aria-label="Read only" name="readonly" readOnly defaultValue={sample} />
        <PhoneInput aria-label="Disabled" name="disabled" disabled defaultValue={sample} />
      </form>,
    );
    expect(screen.getByRole('textbox', { name: 'Read only' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
    expect(
      screen.getAllByRole('combobox').every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true);
    expect([...new FormData(container.querySelector('form')!)]).toEqual([['readonly', sample]]);
  });

  it('localizes country search and validation inside a scoped RTL portal while digits stay LTR', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PlainProvider persist={false}>
        <ThemeScope locale="ar" dir="rtl" mode="dark" data-testid="scope">
          <PhoneInput defaultCountry="EG" value="+201" />
        </ThemeScope>
      </PlainProvider>,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('dir', 'ltr');
    expect((screen.getByRole('textbox') as HTMLInputElement).validationMessage).toBe(
      'أدخل رقم هاتف صحيحاً.',
    );
    await user.click(screen.getByRole('combobox', { name: /الدولة: مصر/ }));
    const search = screen.getByRole('combobox', { name: 'البحث عن دولة...' });
    expect(container.querySelector('[data-testid="scope"]')).toContainElement(search);
    await user.type(search, 'United Kingdom');
    expect(screen.getByRole('option', { name: /المملكة المتحدة/ })).toBeInTheDocument();
  });

  it('accepts custom names, messages, per-field variants and inherited unstyled composition', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LanguageProvider messages={{ 'phone.searchCountry': 'Find a region' }}>
        <PhoneInput
          defaultCountry="US"
          countryLabels={{ US: 'United States of America' }}
          variant="filled"
          unstyled
          className="consumer-root"
        />
      </LanguageProvider>,
    );
    const root = container.querySelector('[data-ui="phone-input"][data-slot="root"]');
    expect(root).toHaveClass('consumer-root');
    expect(root).not.toHaveClass('ui-input-control');
    expect(root).toHaveAttribute('data-variant', 'filled');
    expect(screen.getByRole('textbox')).not.toHaveClass('ui-advanced-input');
    await user.click(screen.getByRole('combobox', { name: /Country: United States of America/ }));
    expect(screen.getByRole('combobox', { name: 'Find a region' })).not.toHaveClass('h-11');
  });

  it('can hide the country selector and renders safely on the server', () => {
    render(<PhoneInput defaultCountry="US" showCountrySelect={false} defaultValue={sample} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    const html = renderToString(<PhoneInput name="phone" defaultValue={sample} />);
    expect(html).toContain('type="tel"');
    expect(html).toContain('value="+12025550123"');
  });
});
