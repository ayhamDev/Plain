import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [width, mode, dir] of [
  [1440, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'light', 'rtl'],
] as const) {
  test(`phone appearances and bounded country search at ${width}px ${mode} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 920 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/tests/fixtures/phone-input.html?mode=${mode}&dir=${dir}`);
    const countryLabel = dir === 'rtl' ? /الدولة: الولايات المتحدة/ : /Country: United States/;
    const main = page.getByRole('form', { name: 'Contact' });
    const input = main.getByRole('textbox');
    expect(await input.inputValue()).toBe('+1 202 555 0123');
    await page.getByRole('button', { name: 'Focus phone' }).click();
    await expect(input).toBeFocused();
    const frame = input.locator('..');
    const focus = await frame.evaluate((node) => {
      const css = getComputedStyle(node);
      return { outline: css.outlineWidth, border: css.borderTopWidth };
    });
    expect(focus).toEqual({ outline: '2px', border: '1px' });
    for (const variant of ['outlined', 'filled', 'ghost', 'contrast']) {
      const root = page
        .getByTestId(`phone-${variant}`)
        .locator('[data-ui="phone-input"][data-slot="root"]');
      await expect(root).toHaveAttribute('data-variant', variant);
      const css = await root.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          height: node.getBoundingClientRect().height,
          background: style.backgroundColor,
          border: style.borderTopColor,
          shadow: style.boxShadow,
        };
      });
      expect(css.height).toBe(40);
      if (variant === 'ghost' || variant === 'filled') expect(css.border).toBe('rgba(0, 0, 0, 0)');
      if (variant === 'ghost') expect(css.background).toBe('rgba(0, 0, 0, 0)');
      if (variant === 'contrast') expect(css.shadow).toContain('inset');
    }
    const trigger = main.getByRole('combobox', { name: countryLabel });
    await trigger.click();
    const search = page.getByRole('combobox', {
      name: dir === 'rtl' ? 'البحث عن دولة...' : 'Search countries...',
    });
    if (width >= 768) await expect(search).toBeFocused();
    else await expect(search).not.toBeFocused();
    await search.fill('+44');
    const popup = page.getByRole('dialog', {
      name: dir === 'rtl' ? 'الدولة' : 'Country',
      exact: true,
    });
    await expect
      .poll(async () => {
        const box = (await popup.boundingBox())!;
        return box.y + box.height;
      })
      .toBeLessThanOrEqual(920);
    const box = await popup.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(920);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath('country-search.png'), fullPage: true });
    await search.press('Escape');
    await expect(trigger).toBeFocused();
    const scoped = page.getByTestId('local-scope');
    const scopedFrame = scoped.locator('[data-ui="phone-input"][data-slot="root"]');
    expect(await scopedFrame.evaluate((node) => getComputedStyle(node).borderRadius)).toBe('16px');
    await scoped.getByRole('combobox').click();
    await expect(scoped.getByRole('dialog')).toBeVisible();
    expect(
      await scoped.getByRole('dialog').evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe('rgb(27, 30, 28)');
    await page.keyboard.press('Escape');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('typing, paste, middle editing, canonical submit and native reset', async ({ page }) => {
  await page.goto('/tests/fixtures/phone-input.html');
  const form = page.getByRole('form', { name: 'Contact' });
  const input = form.getByRole('textbox');
  await input.fill('+44 20 7946 0018');
  await expect(input).toHaveValue('+44 20 7946 0018');
  await form.getByRole('button', { name: 'Save contact' }).click();
  await expect(page.getByRole('status', { name: 'Submitted phone' })).toHaveText('+442079460018');
  const national = page.getByRole('textbox', { name: 'National phone', exact: true });
  await national.fill('2025550123');
  await national.focus();
  await national.evaluate((node: HTMLInputElement) => node.setSelectionRange(6, 7));
  await national.press('4');
  await expect(national).toHaveValue('(202) 455-0123');
  await expect(national).toBeFocused();
  const caret = await national.evaluate((node: HTMLInputElement) => node.selectionStart);
  expect(caret).toBeLessThan(10);
  await form.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('+1 202 555 0123');
  await input.fill('+1202');
  await form.getByRole('button', { name: 'Save contact' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(await input.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(false);
  const controlled = page.getByRole('textbox', { name: 'Controlled phone', exact: true });
  await controlled.fill('+442079460018');
  await expect(page.getByRole('status', { name: 'Controlled value' })).toHaveText('+442079460018');
  await page.getByRole('button', { name: 'Clear controlled' }).click();
  await expect(controlled).toHaveValue('+1');
  await expect(page.getByRole('status', { name: 'Controlled value' })).toHaveText('');
  const fixed = page.getByRole('textbox', { name: 'Fixed phone', exact: true });
  await fixed.fill('+442079460018');
  await expect(fixed).toHaveValue('+1 202 555 0123');
  await expect(fixed).toBeFocused();
});

test('keyboard country selection, mobile-height collision and read-only states', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/tests/fixtures/phone-input.html?motion=none');
  const trigger = page.getByRole('form', { name: 'Contact' }).getByRole('combobox');
  await trigger.focus();
  await trigger.press('Enter');
  const search = page.getByRole('combobox', { name: 'Search countries...' });
  await search.fill('Egypt');
  await search.press('Enter');
  await expect(trigger).toHaveAccessibleName('Country: Egypt (+20)');
  await expect(trigger).toBeFocused();
  const readonly = page.getByRole('textbox', { name: 'Read only', exact: true });
  await expect(readonly).toHaveAttribute('readonly', '');
  await expect(readonly.locator('..').getByRole('combobox')).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Disabled', exact: true })).toBeDisabled();
  await trigger.click();
  const popup = page.getByRole('dialog', { name: 'Country', exact: true });
  const bounds = await popup.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(480);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('phone documentation playground exposes every input appearance', async ({ page }) => {
  await page.goto('/components/phone-input');
  await expect(
    page.getByRole('heading', { name: 'Phone input', exact: true }).first(),
  ).toBeVisible();
  const phone = page.locator('.component-preview input[type="tel"]').first();
  await expect(phone).toBeVisible();
  await phone.fill('+442079460018');
  await expect(phone).toHaveValue('+44 20 7946 0018');
  await expect(page.getByText('onValueChange', { exact: true }).first()).toBeVisible();
});
