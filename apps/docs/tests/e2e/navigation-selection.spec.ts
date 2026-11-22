import { test, expect, type Locator } from '@playwright/test';

async function matchesSelection(indicator: Locator, selected: Locator, background: string) {
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveCSS('background-color', background);
  await expect
    .poll(async () => {
      const mark = (await indicator.boundingBox())!,
        item = (await selected.boundingBox())!;
      return Math.max(
        Math.abs(mark.x - item.x),
        Math.abs(mark.y - item.y),
        Math.abs(mark.width - item.width),
        Math.abs(mark.height - item.height),
      );
    })
    .toBeLessThanOrEqual(1);
}

test('the compact mobile rail keeps the current workspace visible', async ({ page }, info) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/v/0.3.0/components/navigation-rail');
    const rail = page
      .locator('.component-preview')
      .getByRole('navigation', { name: 'Workspaces', exact: true });
    const item = rail.getByRole('button', { name: 'Inbox', exact: true });
    await item.click();
    await page.mouse.move(width - 8, 800);
    await expect(item).toHaveAttribute('aria-current', 'page');
    const indicator = rail.locator('.ui-selection-indicator');
    await expect(indicator).toBeVisible();
    const background = await indicator.evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    expect(background).not.toBe(await rail.evaluate((n) => getComputedStyle(n).backgroundColor));
    await matchesSelection(indicator, item, background);
    await rail.screenshot({ path: info.outputPath(`mobile-active-workspace-${width}.png`) });
  }
});

test('the documentation rail keeps its active workspace visibly highlighted after selection', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/v/0.3.0/components/navigation-rail');
  const preview = page.locator('.component-preview');
  const rail = preview.getByRole('navigation', { name: 'Workspaces', exact: true });
  const indicator = rail.locator('.ui-selection-indicator');
  const background = await preview
    .locator('.ui-sidebar-item[data-active]')
    .evaluate((n) => getComputedStyle(n).backgroundColor);
  for (const name of ['Projects', 'Home', 'Inbox']) {
    const item = rail.getByRole('button', { name, exact: true });
    if (name !== 'Projects') await item.click();
    await page.mouse.move(1380, 900);
    await expect(item).toHaveAttribute('aria-current', 'page');
    await matchesSelection(indicator, item, background);
  }
  await rail.screenshot({ path: info.outputPath('compact-active-workspace.png') });
});

for (const [dir, mode, theme] of [
  ['ltr', 'inline', 'light'],
  ['rtl', 'overlay', 'dark'],
] as const) {
  test(`rail selection honors sidebar colors and has a visible startup fallback in ${dir} ${mode}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(
      `/tests/fixtures/sidebar-overflow.html?hover=rail&mode=${mode}&dir=${dir}&theme=${theme}&selected-colors`,
    );
    const rail = page.getByRole('navigation', { name: 'Workspaces', exact: true });
    const selected = rail.getByRole('button', { name: 'Workspace 1', exact: true });
    const indicator = rail.locator('.ui-selection-indicator');
    const background = await page
      .locator('.ui-sidebar-item[data-active]')
      .evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(background).not.toBe(await rail.evaluate((n) => getComputedStyle(n).backgroundColor));
    await matchesSelection(indicator, selected, background);
    await expect(selected).toHaveCSS('color', 'rgb(18, 52, 86)');
    // A server-rendered or not-yet-measured list must still paint its current item.
    const fallback = await rail.locator('.ui-navigation-rail-items').evaluate((n) => {
      n.removeAttribute('data-has-indicator');
      return getComputedStyle(n.querySelector<HTMLElement>('[aria-current="page"]')!)
        .backgroundColor;
    });
    expect(fallback).toBe(background);
    const next = rail.getByRole('button', { name: 'Workspace 2', exact: true });
    await next.click();
    await expect(next).toHaveAttribute('aria-current', 'page');
    await expect(rail).toHaveAttribute('data-state', 'expanded');
    await matchesSelection(indicator, next, background);
    await expect(next).toHaveCSS('color', 'rgb(18, 52, 86)');
    await page.mouse.move(1050, 700);
    await expect(rail).toHaveAttribute('data-state', 'collapsed');
    await matchesSelection(indicator, next, background);
    await rail.screenshot({ path: info.outputPath('compact-themed-selection.png') });
  });
}
