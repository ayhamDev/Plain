import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function closePanel(page: Page, name: string) {
  const panel = page.getByRole('dialog', { name, exact: true });
  if (await panel.locator('.ui-table-mobile-panel-footer').count()) {
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
  } else await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
}
for (const [width, mode, dir] of [
  [1440, 'light', 'ltr'],
  [800, 'dark', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`detached table controls share state at ${width}px ${mode} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ mode, dir }) => {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'none' }));
        localStorage.setItem('plainui-direction', dir);
      },
      { mode, dir },
    );
    await page.goto('/components/data-table-controls');
    const workspace = page.getByRole('region', { name: 'Custom invoice workspace', exact: true });
    const table = workspace.getByRole('table', { name: 'Customer invoices', exact: true });
    const footer = workspace.locator('footer');
    const view = workspace.locator('.ui-data-table');
    await expect(table).toBeVisible();
    await expect(view.locator('.ui-table-toolbar')).toHaveCount(0);
    await expect(view.locator('.ui-data-table-footer')).toHaveCount(0);
    const searchHeight = (await workspace.locator('.ui-search-input').boundingBox())!.height;
    const toolHeights = await workspace
      .getByRole('group', { name: 'Invoice tools', exact: true })
      .locator(':scope > button')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    for (const height of toolHeights)
      expect(Math.abs(height - searchHeight)).toBeLessThanOrEqual(1);
    await expect(table.locator('tbody tr')).toHaveCount(3);
    await footer.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(footer.getByRole('status')).toContainText('4-6 of 8');
    const search = workspace.getByRole('searchbox', { name: 'Search invoices', exact: true });
    await search.fill('Sophie');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table).toContainText('INV-002');
    await expect(footer.getByRole('status')).toContainText('1-1 of 1');
    await workspace.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(search).toHaveValue('');
    await workspace.getByRole('button', { name: /^Filters/ }).click();
    const filters = page.getByRole('dialog', { name: 'Filters', exact: true });
    if (width < 640) await expect(filters).toHaveAttribute('data-side', 'bottom');
    await filters.getByRole('button', { name: 'Add filter', exact: true }).click();
    await filters.getByRole('combobox', { name: 'Filter field', exact: true }).click();
    await page.getByRole('option', { name: 'Amount', exact: true }).click();
    await filters
      .getByRole('spinbutton', { name: 'Filter value for Amount', exact: true })
      .fill('399');
    await closePanel(page, 'Filters');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table).toContainText('INV-003');
    await expect(workspace.locator('.ui-table-active-filters')).toContainText('Amount');
    await workspace
      .locator('.ui-table-active-filters')
      .getByRole('button', { name: 'Remove filter', exact: true })
      .click();
    await expect(table.locator('tbody tr')).toHaveCount(3);
    await workspace.getByRole('button', { name: /^Sort/ }).click();
    const sort = page.getByRole('dialog', { name: 'Sort order', exact: true });
    await sort.getByRole('combobox', { name: 'Add sort', exact: true }).click();
    await page.getByRole('option', { name: 'Amount', exact: true }).click();
    await sort.getByRole('combobox', { name: /amount/i }).click();
    await page.getByRole('option', { name: 'Descending', exact: true }).click();
    await closePanel(page, 'Sort order');
    await expect(table.locator('tbody tr').first()).toContainText('INV-003');
    await expect(table.getByRole('columnheader', { name: 'Amount', exact: true })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await workspace.getByRole('button', { name: 'Columns', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Customer', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(table.getByRole('columnheader', { name: 'Customer', exact: true })).toHaveCount(0);
    await workspace.getByRole('button', { name: 'Select', exact: true }).click();
    await table
      .getByRole('checkbox', { name: /^Select row/ })
      .first()
      .click();
    await footer.getByRole('button', { name: 'Next page', exact: true }).click();
    await table
      .getByRole('checkbox', { name: /^Select row/ })
      .first()
      .click();
    const actions = workspace.getByRole('region', { name: 'Selected row actions', exact: true });
    await expect(actions).toContainText('2 selected');
    await expect(
      view.getByRole('region', { name: 'Selected row actions', exact: true }),
    ).toHaveCount(0);
    const { violations } = await new AxeBuilder({ page })
      .include('.component-preview')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual(
      [],
    );
    expect(
      await workspace.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await workspace.screenshot({ path: info.outputPath(`detached-${width}-${mode}-${dir}.png`) });
    await actions.getByRole('button', { name: 'Archive selected invoices', exact: true }).click();
    await expect(actions).toHaveCount(0);
    await expect(footer.getByRole('status')).toContainText('of 6');
    expect(errors).toEqual([]);
  });
}
