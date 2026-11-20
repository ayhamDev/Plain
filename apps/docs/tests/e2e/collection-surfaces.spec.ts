import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const background = (row: Locator) => row.evaluate((node) => getComputedStyle(node).backgroundColor);
async function fits(page: Page, area: Locator) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  expect(await area.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
}
for (const [width, dir, theme] of [
  [1000, 'ltr', 'light'],
  [320, 'ltr', 'light'],
  [390, 'rtl', 'dark'],
] as const) {
  test(`List selection uses checkbox feedback with normal hover at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(`/tests/fixtures/collection-surfaces.html?dir=${dir}&theme=${theme}`);
    const list = page.locator('.ui-list'),
      rows = list.locator('.ui-list-row');
    const first = rows.first();
    await page.mouse.move(1, 1);
    const resting = await background(first);
    await first.hover();
    await expect.poll(() => background(first)).not.toBe(resting);
    await first.evaluate(async (node) => {
      await Promise.all(node.getAnimations().map((animation) => animation.finished));
    });
    const hovered = await background(first);
    await list.locator('.ui-list-mode-controls button').click();
    const checkbox = first.getByRole('checkbox');
    await checkbox.focus();
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(first).toHaveAttribute('data-selected');
    await page.mouse.move(1, 1);
    await expect.poll(() => background(first)).toBe(resting);
    await first.hover();
    await expect.poll(() => background(first)).toBe(hovered);
    await rows.nth(1).hover();
    await expect.poll(() => background(rows.nth(1))).toBe(resting);
    await expect(rows.nth(1).getByRole('checkbox')).toBeDisabled();
    await fits(page, list);
    for (const row of await rows.all())
      expect(await row.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
        1,
      );
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([]);
    await page.mouse.move(1, 1);
    await expect.poll(() => background(first)).toBe(resting);
    await list.screenshot({ path: info.outputPath(`list-${width}-${dir}.png`) });
    await list
      .getByRole('button', { name: 'Archive the selected discussions and clear this selection' })
      .click();
    await expect(checkbox).not.toBeChecked();
  });
}
for (const [width, dir, theme] of [
  [320, 'ltr', 'light'],
  [390, 'rtl', 'dark'],
  [640, 'ltr', 'light'],
] as const) {
  test(`mobile sort sheets contain long controls and one scroll region at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(
      `/tests/fixtures/collection-surfaces.html?view=table&dir=${dir}&theme=${theme}`,
    );
    const trigger = page.getByRole('button', { name: /^Sort/ });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Sort order', exact: true });
    await expect(panel).toBeVisible();
    const body = panel.locator('.ui-table-mobile-panel-body');
    await expect(body.locator('.ui-table-sort-rule')).toHaveCount(12);
    await expect(panel).toHaveCSS('overflow-y', 'hidden');
    await expect(panel).toHaveCSS('overflow-x', 'hidden');
    await fits(page, body);
    expect(await body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const box = (await body.boundingBox())!;
    for (const control of await body.getByRole('combobox').all()) {
      const bounds = (await control.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(box.x - 1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
    await body.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Descending', exact: true }).click();
    await expect(body.getByRole('combobox').first()).toContainText('Descending');
    await body.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const done = panel.getByRole('button', { name: 'Done', exact: true });
    await expect(done).toBeInViewport();
    await panel.screenshot({ path: info.outputPath(`sort-${width}-${dir}.png`) });
    await done.click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
test.describe('touch selection', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 900 } });
  test('selected touch rows do not retain synthetic hover fill', async ({ page }) => {
    await page.goto('/tests/fixtures/collection-surfaces.html');
    const list = page.locator('.ui-list'),
      row = list.locator('.ui-list-row').first();
    const resting = await background(row);
    await list.locator('.ui-list-mode-controls button').tap();
    await row.getByRole('checkbox').tap();
    await expect(row.getByRole('checkbox')).toBeChecked();
    await expect.poll(() => background(row)).toBe(resting);
  });
});
test('unstyled mobile sorting keeps native controls without default panel classes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/tests/fixtures/collection-surfaces.html?view=table&unstyled');
  await page.getByRole('button', { name: /^Sort/ }).click();
  const panel = page.getByRole('dialog', { name: 'Sort order', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.locator('[class*="ui-table-mobile-panel"]')).toHaveCount(0);
  await expect(panel).not.toHaveClass(/overflow-hidden/);
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(panel).toHaveCount(0);
});

test('built collection previews retain checkbox-only selection and bounded sort sheets', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('plainui-theme', JSON.stringify({ mode: 'dark' }));
    localStorage.setItem('plainui-direction', 'rtl');
    localStorage.removeItem('plainui-token-overrides');
  });
  await page.goto('/components/list');
  const preview = page.locator('.component-preview');
  const row = preview.locator('.ui-list-row').first();
  await page.mouse.move(1, 1);
  const resting = await background(row);
  await preview.getByRole('button', { name: 'Select', exact: true }).click();
  const checkbox = row.getByRole('checkbox');
  await checkbox.focus();
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(row).toHaveAttribute('data-selected');
  await expect.poll(() => background(row)).toBe(resting);
  await fits(page, preview);
  await preview.screenshot({ path: info.outputPath('built-list-selection.png') });

  await page.goto('/components/data-table');
  const trigger = preview.getByRole('button', { name: /^Sort/ });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Sort order', exact: true });
  const body = panel.locator('.ui-table-mobile-panel-body');
  await body.getByRole('combobox', { name: 'Add sort', exact: true }).click();
  await page.getByRole('option', { name: 'Customer', exact: true }).click();
  await body.locator('.ui-table-sort-rule').getByRole('combobox').click();
  await page.getByRole('option', { name: 'Descending', exact: true }).click();
  await expect(body.locator('.ui-table-sort-rule').getByRole('combobox')).toContainText(
    'Descending',
  );
  await fits(page, body);
  await expect(panel).toHaveCSS('overflow-y', 'hidden');
  const done = panel.getByRole('button', { name: 'Done', exact: true });
  await expect(done).toBeInViewport();
  const { violations } = await new AxeBuilder({ page })
    .include('[data-vaul-drawer]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  await panel.screenshot({ path: info.outputPath('built-sort-sheet.png') });
  await done.click();
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
