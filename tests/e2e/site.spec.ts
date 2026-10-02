import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { components } from '../../src/docs/catalog';

async function expectAccessible(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  ).toEqual([]);
}
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
]) {
  test(`home is accessible and contained at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'PlainUI.', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start building' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await expectAccessible(page);
    expect(errors).toEqual([]);
  });
}
for (const component of components) {
  test(`${component.name} documentation renders and passes accessibility checks`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/components/${component.slug}`);
    await expect(page.getByRole('heading', { name: component.name, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API reference' })).toBeVisible();
    if (component.slug === 'motion')
      await expect(page.locator('.component-preview [data-ui="motion"]')).toHaveCSS('opacity', '1');
    await expectAccessible(page);
    expect(errors).toEqual([]);
  });
  test(`${component.name} stays accessible on mobile in dark RTL`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode: 'dark', accent: 'neutral', radius: 6, density: 'comfortable' }),
      );
      localStorage.setItem('plainui-direction', 'rtl');
    });
    await page.goto(`/components/${component.slug}`);
    await expect(page.getByRole('heading', { name: component.name, exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    if (component.slug === 'motion')
      await expect(page.locator('.component-preview [data-ui="motion"]')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expectAccessible(page);
  });
}
for (const mode of ['light', 'dark']) {
  for (const accent of ['neutral', 'emerald', 'blue', 'rose', 'amber', 'violet']) {
    test(`${mode} ${accent} palette passes contrast checks`, async ({ page }) => {
      await page.addInitScript(
        ({ mode, accent }) => {
          localStorage.setItem(
            'plainui-theme',
            JSON.stringify({ mode, accent, radius: 6, density: 'comfortable' }),
          );
        },
        { mode, accent },
      );
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
      await expect(page.locator('html')).toHaveAttribute('data-accent', accent);
      await expectAccessible(page);
      await page.getByRole('button', { name: 'Publish', exact: true }).hover();
      await expectAccessible(page);
    });
  }
}
test('RTL sliders and submenus support keyboard interaction', async ({ page }) => {
  await page.goto('/components/slider');
  await page.getByRole('button', { name: 'Switch to right-to-left' }).click();
  const slider = page.getByRole('slider', { name: 'Volume' });
  const value = Number(await slider.getAttribute('aria-valuenow'));
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveAttribute('aria-valuenow', String(value + 1));
  await page.goto('/components/dropdown-menu');
  const trigger = page.getByRole('button', { name: 'Project actions' });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Move to', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('menuitem', { name: 'Team workspace' })).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
test('checkbox indeterminate indicator and focus styles are visible', async ({ page }) => {
  await page.goto('/components/checkbox');
  const checkbox = page.getByRole('checkbox', { name: 'Some items selected' });
  await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  await expect(checkbox.locator('[data-slot="indeterminate-icon"]')).toBeVisible();
  await expect(checkbox.locator('[data-slot="icon"]')).toBeHidden();
  await page.goto('/components/input');
  await page.getByRole('textbox', { name: 'Email address' }).focus();
  const outline = await page
    .getByRole('textbox', { name: 'Email address' })
    .evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
});
test('an open select is accessible and restores native background interactivity', async ({
  page,
}) => {
  await page.goto('/components/select');
  const select = page.getByRole('combobox', { name: 'Department' });
  await select.click();
  await expect(page.getByRole('option', { name: 'Engineering', exact: true })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('option', { name: 'Engineering', exact: true }).click();
  await expect(select).toContainText('Engineering');
  await expect(select).toBeFocused();
  await expect(page.locator('header')).not.toHaveAttribute('inert', '');
});
test('search finds and navigates to a component with the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search documentation' }).fill('combobox');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components\/combobox/);
  await expect(page.getByRole('heading', { name: 'Combobox', exact: true })).toBeVisible();
});
test('navigation restores the home title and the skip link focuses main content', async ({
  page,
}) => {
  await page.goto('/docs/installation');
  await page.getByRole('link', { name: 'Overview', exact: true }).first().click();
  await expect(page).toHaveTitle('P.UI - A little less. A lot more.');
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
test('theme settings persist and exported CSS reflects the chosen theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).click();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.getByRole('radio', { name: 'Spacious 48px' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'blue');
  await expectAccessible(page);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSS' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('plainui-theme.css');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'blue');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'spacious');
  await expectAccessible(page);
});
test('RTL layout, end sheet placement, and tabs use the intended direction', async ({ page }) => {
  await page.goto('/components/tabs');
  await page.getByRole('button', { name: 'Switch to right-to-left' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const accountTab = page.getByRole('tab', { name: 'Account', exact: true });
  await accountTab.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Security', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Make it yours' });
  await expect(sheet).toHaveAttribute('data-side', 'left');
  await expectAccessible(page);
});
test('dialogs support editing and return keyboard focus', async ({ page }) => {
  await page.goto('/components/dialog');
  const trigger = page.getByRole('button', { name: 'Edit profile' });
  await trigger.click();
  await expectAccessible(page);
  await page.getByRole('textbox', { name: 'Display name' }).fill('Alex Updated');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('calendar and combobox work with keyboard and clearable dates', async ({ page }) => {
  await page.goto('/components/combobox');
  const combo = page.getByRole('combobox', { name: 'Framework' });
  await combo.click();
  await page.getByRole('combobox', { name: 'Search options...' }).fill('Astro');
  await expectAccessible(page);
  await page.keyboard.press('Enter');
  await expect(combo).toHaveText('Astro');
  await page.goto('/components/date-picker');
  await page.getByRole('button', { name: 'Due date' }).click();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Clear date' }).click();
  await expect(page.getByRole('button', { name: 'Due date' })).toContainText('Pick a date');
});
test('table filtering, sorting, pagination and CSV download are functional', async ({ page }) => {
  await page.goto('/examples');
  await expect(page.getByRole('cell', { name: 'INV-001', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('cell', { name: 'INV-006', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search records...' }).fill('Sophie');
  await expect(page.getByRole('cell', { name: 'INV-002', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search records...' }).clear();
  await page.getByRole('button', { name: 'Amount', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expect(page.locator('tbody tr').first()).toContainText('$399.00');
  await page.getByRole('button', { name: 'Amount', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await expect(page.locator('tbody tr').first()).toContainText('$79.00');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('invoices.csv');
  await expectAccessible(page);
});
test('mobile navigation and empty component search are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expectAccessible(page);
  await page.getByRole('link', { name: 'All components' }).last().click();
  await expect(page).toHaveURL(/\/components$/);
  await page.getByRole('textbox', { name: 'Find a component' }).fill('not-a-component');
  await expect(page.getByRole('heading', { name: 'Nothing here just yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.component-tile')).toHaveCount(components.length);
});
for (const path of [
  '/docs/installation',
  '/docs/customization',
  '/docs/rtl',
  '/docs/tokens',
  '/examples?view=settings',
]) {
  test(`guide and app ${path} remain accessible on mobile in dark RTL mode`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode: 'dark', accent: 'neutral', radius: 6, density: 'comfortable' }),
      );
      localStorage.setItem('plainui-direction', 'rtl');
    });
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await expectAccessible(page);
  });
}
