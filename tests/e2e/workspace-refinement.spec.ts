import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, slug: string, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript((mobile) => {
    localStorage.setItem(
      'plainui-theme',
      JSON.stringify({ mode: mobile ? 'dark' : 'light', borders: 'subtle', motion: 'none' }),
    );
    localStorage.setItem('plainui-direction', mobile ? 'rtl' : 'ltr');
    localStorage.removeItem('plainui-token-overrides');
  }, width < 640);
  await page.goto(`/components/${slug}`);
  const preview = page.locator('.component-preview');
  await expect(preview).toBeVisible();
  return preview;
}
async function choose(page: Page, label: string, value: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function accessible(page: Page, selector = '.component-preview') {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
  ).toEqual([]);
}
for (const width of [1440, 320]) {
  test(`table filtering, selection and pagination work at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'data-table', width);
    const table = preview.getByRole('table', { name: 'Customer invoices' });
    await preview.getByRole('button', { name: 'Last page', exact: true }).click();
    await expect(preview.getByRole('status')).toContainText('6-8 of 8');
    await preview.getByRole('button', { name: 'First page', exact: true }).click();
    const rows = preview.getByRole('checkbox', { name: /^Select row/ });
    await rows.nth(0).click();
    await rows.nth(2).click({ modifiers: ['Shift'] });
    await expect(preview.getByRole('status')).toContainText('3 selected');
    await preview.getByRole('button', { name: 'Clear selection', exact: true }).click();
    await preview.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('button', { name: 'Add filter', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Paid', exact: true }).check();
    await page.getByRole('button', { name: 'Add filter', exact: true }).click();
    await page.getByRole('combobox', { name: 'Filter field', exact: true }).last().click();
    await page.getByRole('option', { name: 'Amount', exact: true }).click();
    await page.getByRole('combobox', { name: 'Filter operator', exact: true }).last().click();
    await page.getByRole('option', { name: 'between', exact: true }).click();
    await page.getByRole('spinbutton', { name: 'Minimum filter value' }).fill('150');
    await page.getByRole('spinbutton', { name: 'Maximum filter value' }).fill('400');
    await fits(page);
    await accessible(page, '.ui-table-filter-panel');
    await page.keyboard.press('Escape');
    await expect(table.getByText('Pending', { exact: true })).toHaveCount(0);
    await expect(table.getByText('$79.00', { exact: true })).toHaveCount(0);
    await expect(table.locator('tbody tr')).not.toHaveCount(0);
    await preview.screenshot({ path: info.outputPath(`table-${width}.png`) });
    await accessible(page);
    await preview.getByRole('button', { name: 'Reset', exact: true }).click();
    await preview.getByRole('button', { name: 'Columns', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Customer', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(table.getByRole('columnheader', { name: /Customer/ })).toHaveCount(0);
    await fits(page);
  });
  test(`styled time controls stay inside the field at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'time-picker', width);
    const input = preview.locator('input[type="time"]');
    const chooseTime = preview.getByRole('button', { name: 'Choose time', exact: true });
    const shell = input.locator('..');
    const outer = (await shell.boundingBox())!;
    const button = (await chooseTime.boundingBox())!;
    expect(button.x).toBeGreaterThanOrEqual(outer.x);
    expect(button.x + button.width).toBeLessThanOrEqual(outer.x + outer.width + 1);
    await chooseTime.click();
    await choose(page, 'Hour', '11');
    await choose(page, 'Minute', '30');
    await accessible(page, '.ui-temporal-content');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(input).toHaveValue('11:30');
    await expect(input).toBeFocused();
    await preview.screenshot({ path: info.outputPath(`time-${width}.png`) });
    await fits(page);
  });
  test(`custom color picker supports presets and keyboard editing at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'color-picker', width);
    await expect(preview.locator('input[type="color"]')).toHaveCount(0);
    const field = preview.getByRole('textbox', { name: 'Project color' });
    const fieldBox = (await field.boundingBox())!;
    const swatchBox = (await preview
      .getByRole('button', { name: 'Choose color', exact: true })
      .boundingBox())!;
    expect(
      Math.abs(fieldBox.y + fieldBox.height / 2 - swatchBox.y - swatchBox.height / 2),
    ).toBeLessThanOrEqual(1);
    await preview.getByRole('button', { name: 'Choose color', exact: true }).click();
    await page.getByRole('button', { name: 'Choose #2563eb', exact: true }).click();
    await expect(preview.getByRole('textbox', { name: 'Project color' })).toHaveValue('#2563eb');
    const area = page.getByRole('slider', { name: 'Color saturation and brightness' });
    await area.focus();
    await area.press('ArrowRight');
    await expect(preview.getByRole('textbox', { name: 'Project color' })).not.toHaveValue(
      '#2563eb',
    );
    await accessible(page, '.ui-color-panel');
    expect(
      await page
        .locator('.ui-color-hue [data-slot="range"]')
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({ path: info.outputPath(`color-${width}.png`) });
    await page.keyboard.press('Escape');
    await expect(preview.getByRole('button', { name: 'Choose color', exact: true })).toBeFocused();
    await fits(page);
  });
  test(`calendar printing captures events and small-screen views stay usable at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'full-calendar', width);
    await page.evaluate(() => {
      window.print = () => {
        (window as Window & { printedCalendar?: string }).printedCalendar =
          document.querySelector('.ui-calendar-print')?.textContent ?? '';
      };
    });
    await preview.getByRole('button', { name: 'Print calendar' }).click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { printedCalendar?: string }).printedCalendar),
      )
      .toContain('Project kickoff');
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { printedCalendar?: string }).printedCalendar),
      )
      .toContain('Design review');
    await choose(page, 'Calendar view', 'Week');
    await expect(preview.locator('[data-ui="full-calendar"][data-slot="root"]')).toHaveAttribute(
      'data-view',
      'week',
    );
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`calendar-${width}.png`) });
    await fits(page);
  });
}
