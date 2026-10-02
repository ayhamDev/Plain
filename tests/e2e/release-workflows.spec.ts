import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const profile of [
  { width: 1440, height: 900, mode: 'light', dir: 'ltr' },
  { width: 390, height: 844, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`version combobox navigates the release archive at ${profile.width}px`, async ({ page }) => {
    await page.setViewportSize(profile);
    await page.addInitScript(({ mode, dir }) => {
      localStorage.setItem('plainui-theme', JSON.stringify({ mode }));
      localStorage.setItem('plainui-direction', dir);
    }, profile);
    await page.goto('/');
    if (profile.width < 800) await page.getByRole('button', { name: 'Open navigation' }).click();
    const combo = page.getByRole('combobox', {
      name: profile.width < 800 ? 'Documentation version' : 'Library version',
      exact: true,
    });
    await combo.click();
    const search = page.getByRole('combobox', { name: 'Find a version...' });
    await search.fill('0.1');
    await page.getByRole('option', { name: /0.1.0/ }).click();
    await expect(page).toHaveURL(/\/changelog#release-0-1$/);
    if (profile.width < 800) {
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await expect(page.locator('#release-0-1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('custom source color remains editable when cleared and only applies valid hex values', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Source color', exact: true });
  await input.fill('#2563eb');
  await expect(input).toHaveValue('#2563eb');
  const color = await page
    .locator('html')
    .evaluate((node) => getComputedStyle(node).getPropertyValue('--ui-background'));
  await input.clear();
  await expect(input).toHaveValue('');
  await input.fill('invalid');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(
    await page
      .locator('html')
      .evaluate((node) => getComputedStyle(node).getPropertyValue('--ui-background')),
  ).toBe(color);
  await input.fill('#087f5b');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((node) => getComputedStyle(node).getPropertyValue('--ui-background')),
    )
    .not.toBe(color);
});

test('component overrides are independent from roots and survive theme changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'plainui-token-overrides',
      JSON.stringify({
        'table.background': '#fdf2f8',
        'table.border': '#be185d',
        'select.background': '#ecfdf5',
        'calendar.day-size': '28px',
      }),
    );
  });
  await page.goto('/components/table');
  const table = page.locator('.component-preview [data-ui="table"][data-slot="root"]');
  await expect(table).toHaveCSS('background-color', 'rgb(253, 242, 248)');
  await expect(
    page.locator('.component-preview [data-ui="table"][data-slot="row"]').first(),
  ).toHaveCSS('border-bottom-color', 'rgb(190, 24, 93)');
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(table).toHaveCSS('background-color', 'rgb(253, 242, 248)');
  await page.goto('/components/select');
  await expect(page.getByRole('combobox', { name: 'Department' })).toHaveCSS(
    'background-color',
    'rgb(236, 253, 245)',
  );
  await page.goto('/components/calendar');
  await expect(page.locator('.component-preview .rdp-day_button').first()).toHaveCSS(
    'width',
    '28px',
  );
});
