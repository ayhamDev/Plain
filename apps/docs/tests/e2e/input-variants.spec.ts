import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const variants = ['outlined', 'filled', 'ghost', 'contrast'];
const surface = '.ui-input-variant';
const fields = [
  'input',
  'textarea',
  'number',
  'search',
  'password',
  'pin',
  'tags',
  'multi-select',
  'select',
  'combobox',
  'color',
  'date',
  'date-range',
  'time',
  'date-time',
  'time-range',
  'date-time-range',
  'file-upload',
  'dropzone',
  'command',
];

for (const [width, theme, dir] of [
  [1440, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'light', 'rtl'],
] as const) {
  test(`all input variants render at ${width}px ${theme} ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 960 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/tests/fixtures/input-variants.html?theme=${theme}&dir=${dir}`);
    for (const variant of variants)
      for (const kind of fields) {
        const field = page.getByTestId(`${kind}-${variant}`);
        const frame = field.locator(surface).first();
        await expect(frame).toHaveAttribute('data-variant', variant);
        const styles = await frame.evaluate((node) => {
          const css = getComputedStyle(node);
          const sample = document.createElement('div');
          sample.style.background = 'var(--ui-input-filled-background)';
          node.parentElement!.append(sample);
          const filled = getComputedStyle(sample).backgroundColor;
          sample.remove();
          return {
            background: css.backgroundColor,
            border: css.borderTopColor,
            filled,
            shadow: css.boxShadow,
          };
        });
        if (variant === 'filled') expect(styles.background).toBe(styles.filled);
        if (variant === 'ghost') expect(styles.background).toBe('rgba(0, 0, 0, 0)');
        if (variant === 'filled' || variant === 'ghost')
          expect(styles.border).toBe('rgba(0, 0, 0, 0)');
        if (variant === 'contrast') expect(styles.shadow).toContain('inset');
        const bounds = await frame.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath('variants.png'), fullPage: true });
  });
}

test('focus preserves the resting border and adds the outer outline in all variants', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/input-variants.html');
  for (const variant of variants)
    for (const kind of [
      'input',
      'textarea',
      'number',
      'search',
      'password',
      'pin',
      'tags',
      'multi-select',
      'select',
      'combobox',
      'color',
      'date',
      'date-range',
      'time',
      'date-time',
      'command',
    ]) {
      const field = page.getByTestId(`${kind}-${variant}`);
      const input = field
        .locator(
          'input:not([type="hidden"]), textarea, button[role="combobox"], [data-ui="date-picker"][data-slot="trigger"], .ui-date-range-trigger',
        )
        .first();
      const frame = field.locator(surface).first();
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await field.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const before = await frame.evaluate((n) => {
        const css = getComputedStyle(n);
        return [css.borderTopColor, css.borderTopWidth, css.boxShadow];
      });
      await page.keyboard.press('Tab');
      await input.focus();
      const after = await frame.evaluate((n) => {
        const css = getComputedStyle(n);
        return [css.borderTopColor, css.borderTopWidth, css.boxShadow];
      });
      expect(after).toEqual(before);
      // PIN focuses the slot corresponding to the native caret position.
      const focusedFrame = kind === 'pin' ? field.locator('[data-active]') : frame;
      await expect(focusedFrame).toHaveCSS('outline-width', '2px');
      await expect(focusedFrame).toHaveCSS('outline-style', 'solid');
    }
});

test('shared tokens, disabled ghost fields and invalid borders stay consistent', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/input-variants.html?variant=filled');
  for (const frame of await page.getByTestId('scoped').locator(surface).all()) {
    await expect(frame).toHaveCSS('background-color', 'rgb(220, 232, 240)');
  }
  await page.goto('/tests/fixtures/input-variants.html?variant=ghost&disabled');
  for (const kind of [
    'input',
    'search',
    'pin',
    'tags',
    'select',
    'combobox',
    'date',
    'date-range',
    'time',
    'dropzone',
    'command',
  ]) {
    const frame = page.getByTestId(`${kind}-ghost`).locator(surface).first();
    const resting = await frame.evaluate((n) => getComputedStyle(n).backgroundColor);
    await frame.hover({ force: true });
    await expect(frame).toHaveCSS('background-color', resting);
  }
  await page.goto('/tests/fixtures/input-variants.html?variant=contrast&invalid');
  for (const kind of [
    'input',
    'search',
    'pin',
    'tags',
    'select',
    'combobox',
    'date',
    'date-range',
    'time',
    'color',
    'dropzone',
  ]) {
    const frame = page.getByTestId(`${kind}-contrast`).locator(surface).first();
    const colors = await frame.evaluate((n) => {
      const css = getComputedStyle(n);
      const sample = document.createElement('i');
      sample.style.color = 'var(--ui-danger)';
      n.parentElement!.append(sample);
      const danger = getComputedStyle(sample).color;
      sample.remove();
      return [css.borderTopColor, danger];
    });
    expect(colors[0]).toBe(colors[1]);
  }
});

test('selection and picker triggers retain keyboard interaction and input values', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/input-variants.html?variant=filled');
  const combo = page.getByTestId('combobox-filled').getByRole('combobox');
  await combo.click();
  await page.getByRole('option', { name: 'Engineering', exact: true }).click();
  await expect(combo).toContainText('Engineering');
  const select = page.getByTestId('select-filled').getByRole('combobox');
  await select.focus();
  await page.keyboard.press('Space');
  await page.getByRole('option', { name: 'Engineering', exact: true }).click();
  await expect(select).toContainText('Engineering');
  await page.getByTestId('date-filled').getByRole('button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('date-filled').getByRole('button')).toBeFocused();
  const pin = page.getByTestId('pin-filled').getByRole('textbox');
  await pin.fill('654321');
  await expect(pin).toHaveValue('654321');
  await page.getByRole('button', { name: 'Search workspace', exact: true }).click();
  const panel = page.getByRole('dialog');
  await expect(panel.locator(surface)).toHaveAttribute('data-variant', 'filled');
  await expect(panel.getByRole('combobox')).toBeFocused();
});

test('the PIN documentation exposes every variant and matching source', async ({ page }) => {
  await page.goto('/components/pin-input');
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  const setting = page.getByRole('combobox', { name: 'variant', exact: true });
  await expect(setting).toBeVisible();
  await setting.click();
  await page.getByRole('option', { name: 'filled', exact: true }).click();
  await expect(page.locator('.component-preview .ui-pin-slot').first()).toHaveCSS(
    'border-top-color',
    'rgba(0, 0, 0, 0)',
  );
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Code' })).toContainText('variant="filled"');
});

test('mobile pickers retain the field variant through their date and time steps', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/tests/fixtures/input-variants.html?variant=filled');
  const date = page.getByTestId('date-filled').getByRole('button');
  await date.click();
  const panel = page.getByRole('dialog');
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
  await expect(panel.getByRole('combobox', { name: 'Choose month' })).toHaveAttribute(
    'data-variant',
    'outlined',
  );
  await page.keyboard.press('Escape');
  await expect(date).toBeFocused();
  const time = page.getByTestId('date-time-filled').locator('input');
  await time.click();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(panel.getByRole('spinbutton', { name: 'Hour', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(time).toHaveValue('2026-11-21T09:30');
  await expect(time).toBeFocused();
  await expect(page.getByTestId('date-time-filled').locator(surface)).toHaveAttribute(
    'data-variant',
    'filled',
  );
});
