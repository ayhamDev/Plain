import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('phone virtualization keeps a small DOM and reaches both ends through keyboard and wheel scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html');
  const trigger = page.getByRole('form').getByRole('combobox', { name: /Country:/ });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Country', exact: true });
  const search = panel.getByRole('combobox');
  const list = panel.getByRole('listbox');
  const mounted = panel.getByRole('option');
  expect(await mounted.count()).toBeLessThan(40);
  const selected = panel.getByRole('option', { selected: true });
  await expect(selected).toBeInViewport();
  await search.press('End');
  const active = () => search.getAttribute('aria-activedescendant');
  await expect
    .poll(async () => page.locator(`[id="${await active()}"]`).textContent())
    .toContain('Zimbabwe');
  await expect(page.locator(`[id="${await active()}"]`)).toBeInViewport();
  expect(await mounted.count()).toBeLessThan(40);
  await search.press('Home');
  await expect(page.locator(`[id="${await active()}"]`)).toBeInViewport();
  const before = await list.evaluate((node) => node.scrollTop);
  await list.hover();
  await page.mouse.wheel(0, 800);
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(before + 400);
  expect(await mounted.count()).toBeLessThan(40);
  await search.fill('United Kingdom');
  await expect(mounted).toHaveCount(1);
  await mounted.click();
  await expect(trigger).toHaveAccessibleName('Country: United Kingdom (+44)');
});

test('Select presentation composes the real Sheet with entry, exit and handle gestures', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html?motion=system');
  const trigger = page.getByRole('combobox', { name: 'Team', exact: true });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Choose team', exact: true });
  await expect(sheet).toHaveAttribute('data-vaul-drawer', '');
  await expect(sheet).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
  await expect(sheet.locator('[data-vaul-handle]')).toBeVisible();
  const duration = await sheet.evaluate((node) => {
    const style = getComputedStyle(node);
    return Math.max(
      ...[...style.animationDuration.split(','), ...style.transitionDuration.split(',')].map(
        parseFloat,
      ),
    );
  });
  expect(duration).toBeGreaterThan(0);
  await expect
    .poll(() => sheet.evaluate((node) => getComputedStyle(node).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await sheet.getByRole('button', { name: 'Close panel', exact: true }).click();
  // The actual Sheet retains the panel for its closing transition.
  await expect(sheet).toHaveAttribute('data-state', 'closed');
  await expect(sheet).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(sheet).toBeVisible();
  await expect
    .poll(() => sheet.evaluate((node) => getComputedStyle(node).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  const handle = sheet.locator('[data-vaul-handle]');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, 840, { steps: 12 });
  await page.mouse.up();
  await expect(sheet).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('Select sheets inherit Sheet tokens independently of popover tokens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html?surface=custom');
  await page.getByRole('combobox', { name: 'Team', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Choose team', exact: true });
  await expect(sheet).toHaveCSS('background-color', 'rgb(231, 240, 255)');
  await expect(sheet).toHaveCSS('border-top-left-radius', '18px');
});

for (const [width, mode, dir] of [
  [1440, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'light', 'rtl'],
] as const) {
  test(`feature CSS preserves compiled controls and plots at ${width}px ${mode} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 920 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const samples = async () =>
      page
        .locator(
          'form input:not([type="hidden"]):not([aria-hidden]), form textarea, form button, [data-ui="item"][data-slot="root"], [data-testid="calendar"] [data-ui="select"][data-slot="trigger"]',
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const css = getComputedStyle(node);
            return {
              height: node.getBoundingClientRect().height,
              background: css.backgroundColor,
              color: css.color,
              border: css.borderTopColor,
              radius: css.borderRadius,
              padding: css.padding,
              font: css.fontSize,
            };
          }),
        );
    const url = `/tests/fixtures/production-entries.html?mode=${mode}&dir=${dir}`;
    await page.goto(url);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeVisible();
    const full = await samples();
    await page.goto(url + '&css=features');
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeVisible();
    expect(await samples()).toEqual(full);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    for (const name of ['Bar totals', 'Line totals', 'Share totals']) {
      const chart = page.getByRole('figure', { name, exact: true });
      await expect(chart.locator('svg[role="application"]')).toBeVisible();
      await expect(chart.getByRole('table')).toContainText('May');
    }
    await expect(
      page
        .getByRole('figure', { name: 'Pending totals' })
        .locator('[data-ui="chart-skeleton"][data-slot="root"]'),
    ).toHaveAttribute('data-variant', 'bar');
    await page.getByLabel('Start time', { exact: true }).click();
    const time = page.getByRole('dialog').last();
    await expect(time).toBeVisible();
    const box = (await time.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.y + box.height).toBeLessThanOrEqual(921);
    await page.screenshot({ path: info.outputPath('feature-styles.png') });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
