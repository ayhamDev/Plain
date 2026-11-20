import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, slug: string, width = 1440, dir = 'ltr', motion = 'system') {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(
    ({ dir, motion, width }) => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode: width < 640 ? 'dark' : 'light', motion }),
      );
      localStorage.setItem('plainui-direction', dir);
      localStorage.removeItem('plainui-token-overrides');
    },
    { dir, motion, width },
  );
  await page.goto(`/components/${slug}`);
  const preview = page.locator('.component-preview');
  await expect(preview).toBeVisible();
  return preview;
}
async function fits(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function accessible(page: Page, selector = '.component-preview') {
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    // Radix uses this visually hidden focus proxy to bridge the portaled viewport.
    // Verify its forward/backward Tab behavior explicitly in the menu regression below.
    .exclude('[data-ui="navigation-menu"] [aria-hidden="true"][tabindex="0"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }))).toEqual(
    [],
  );
}
async function choose(page: Page, label: string, value: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

for (const width of [1440, 320]) {
  test(`grouped progress retains labeled allocations at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'progress', width, width < 640 ? 'rtl' : 'ltr');
    const progress = preview.getByRole('progressbar', { name: 'Workspace storage' });
    await expect(progress).toHaveAttribute('aria-valuenow', '74');
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      /Documents: 24 GB; Images: 32 GB; Video: 18 GB/,
    );
    const track = (await progress.boundingBox())!;
    const parts = await progress.locator('.ui-progress-segment').all();
    for (const [index, part] of parts.entries()) {
      expect((await part.boundingBox())!.width / track.width).toBeCloseTo(
        [0.24, 0.32, 0.18][index],
        2,
      );
    }
    await expect(preview.getByText('32 GB', { exact: true })).toBeVisible();
    await expect(preview.getByText('32 GB', { exact: true })).toHaveCSS('direction', 'ltr');
    await fits(page);
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`storage-${width}.png`) });
  });
  test(`List browse and selection modes at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'list', width, width < 640 ? 'rtl' : 'ltr');
    await expect(preview.getByRole('checkbox')).toHaveCount(0);
    await preview.getByRole('button', { name: 'Select', exact: true }).click();
    const checkbox = preview.getByRole('checkbox').first();
    await checkbox.focus();
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(preview.getByRole('status')).toHaveText('1 selected');
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`list-selection-${width}.png`) });
    await preview.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(preview.getByRole('checkbox')).toHaveCount(0);
    await fits(page);
  });
  test(`detached sheet constrains width and protects slider gestures at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'sheet', width, width < 640 ? 'rtl' : 'ltr');
    const trigger = preview.getByRole('button', { name: 'Detached sheet', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Playback settings' });
    await expect(panel).toBeVisible();
    await expect
      .poll(async () => (await panel.boundingBox())!.y + (await panel.boundingBox())!.height)
      .toBeCloseTo(988, 0);
    const before = (await panel.boundingBox())!;
    expect(before.width).toBeLessThanOrEqual(560);
    expect(before.x).toBeGreaterThanOrEqual(12);
    expect(Math.abs(before.x + before.width / 2 - width / 2)).toBeLessThan(1);
    const slider = panel.getByRole('slider');
    const thumb = (await slider.boundingBox())!;
    const priorValue = await slider.getAttribute('aria-valuenow');
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
    await page.mouse.down();
    await page.mouse.move(thumb.x + 70, thumb.y + 45, { steps: 6 });
    await page.mouse.up();
    await expect(slider).not.toHaveAttribute('aria-valuenow', priorValue!);
    expect(Math.abs((await panel.boundingBox())!.y - before.y)).toBeLessThan(1);
    await expect(panel.getByRole('textbox', { name: 'Workspace name' })).toHaveValue(
      'Design studio',
    );
    await accessible(page, '[data-vaul-drawer]');
    await page.screenshot({ path: info.outputPath(`sheet-${width}.png`) });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await fits(page);
  });
}

for (const dir of ['ltr', 'rtl']) {
  test(`Sidebar collapse keeps icons anchored and rail independent in ${dir}`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'navigation-rail', 1440, dir);
    const sidebar = preview.locator('.ui-sidebar-desktop');
    const rail = preview.getByRole('navigation', { name: 'Workspaces', exact: true });
    const railWidth = (await rail.boundingBox())!.width;
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    const expanded = (await sidebar.boundingBox())!.width;
    await preview
      .getByRole('button', { name: 'Collapse navigation', exact: true })
      .scrollIntoViewIfNeeded();
    const samples = await sidebar.evaluate(async (node) => {
      (
        node
          .closest('.ui-sidebar-provider')!
          .querySelector('.ui-sidebar-trigger') as HTMLButtonElement
      ).click();
      const frames: { width: number; icon: number }[] = [];
      for (let i = 0; i < 18; i++) {
        await new Promise(requestAnimationFrame);
        const box = node.getBoundingClientRect();
        const icon = node.querySelector('.ui-sidebar-item-icon')!.getBoundingClientRect();
        frames.push({
          width: box.width,
          icon:
            getComputedStyle(node).direction === 'rtl'
              ? box.right - icon.right
              : icon.left - box.left,
        });
      }
      return frames;
    });
    expect(samples.some((frame) => frame.width > 65 && frame.width < expanded - 1)).toBe(true);
    expect(
      Math.max(...samples.map((frame) => frame.icon)) -
        Math.min(...samples.map((frame) => frame.icon)),
    ).toBeLessThan(1);
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeCloseTo(64, 0);
    await expect(rail.getByRole('button', { name: 'Projects', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect((await rail.boundingBox())!.width).toBe(railWidth);
    await preview.screenshot({ path: info.outputPath(`rail-collapsed-${dir}.png`) });
    for (let i = 0; i < 5; i++) await preview.locator('.ui-sidebar-trigger').press('Space');
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeCloseTo(expanded, 0);
    await accessible(page);
    await fits(page);
  });
  test(`NavigationMenu content remains visible when switching in ${dir}`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'navigation-menu', 1440, dir);
    await preview.getByRole('button', { name: 'Explore', exact: true }).click();
    await expect(preview.getByRole('link', { name: 'Documentation', exact: true })).toBeVisible();
    await preview.getByRole('button', { name: 'Resources', exact: true }).hover();
    const link = preview.getByRole('link', { name: 'Accessibility', exact: true });
    await expect(link).toBeVisible();
    const viewport = preview.locator('.ui-navigation-viewport');
    await expect.poll(async () => (await viewport.boundingBox())!.height).toBeGreaterThan(100);
    await link.focus();
    await expect(link).toHaveCSS('opacity', '1');
    const resources = preview.getByRole('button', { name: 'Resources', exact: true });
    await resources.focus();
    await resources.press('ArrowDown');
    await expect(preview.getByRole('link', { name: 'Theming', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(preview.getByRole('link', { name: 'Changelog', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(preview.getByRole('link', { name: 'Examples', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(preview.getByRole('link', { name: 'Changelog', exact: true })).toBeFocused();
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`navigation-${dir}.png`) });
    await page.keyboard.press('Escape');
    await expect(link).not.toBeVisible();
    await expect(preview.getByRole('button', { name: 'Resources', exact: true })).toBeFocused();
  });
}

for (const slug of ['tabs', 'segmented-control']) {
  for (const motion of ['system', 'reduced', 'none']) {
    test(`${slug} moves its shared highlight with ${motion} motion`, async ({ page }) => {
      const preview = await open(page, slug, 1440, 'rtl', motion);
      const options = preview.getByRole(slug === 'tabs' ? 'tab' : 'radio');
      const indicator = preview.locator('.ui-selection-indicator');
      await expect(indicator).toHaveAttribute('data-ready', '');
      const before = (await indicator.boundingBox())!;
      await options.last().click();
      await expect
        .poll(async () => Math.abs((await indicator.boundingBox())!.x - before.x))
        .toBeGreaterThan(10);
      const duration = await indicator.evaluate((node) =>
        Math.max(...getComputedStyle(node).transitionDuration.split(',').map(parseFloat)),
      );
      if (motion === 'system') expect(duration).toBeGreaterThanOrEqual(0.26);
      else expect(duration).toBeLessThanOrEqual(0.001);
      await fits(page);
      if (motion === 'system') {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect
          .poll(() =>
            indicator.evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
          )
          .toBeLessThanOrEqual(0.001);
      }
    });
  }
}

test('mobile filters use a scrollable sheet with native Select controls', async ({
  page,
}, info) => {
  const preview = await open(page, 'data-table', 320, 'rtl');
  const search = (await preview
    .locator('[data-ui="search-input"][data-slot="root"]')
    .boundingBox())!;
  const trigger = preview.getByRole('button', { name: /^Filters/ });
  expect((await trigger.boundingBox())!.height).toBe(search.height);
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Filters', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-side', 'bottom');
  await panel.getByRole('button', { name: 'Add filter', exact: true }).click();
  const field = panel.getByRole('combobox').nth(1);
  await field.click();
  await page.getByRole('option', { name: 'Status', exact: true }).click();
  await panel.getByRole('combobox', { name: 'Filter value for Status', exact: true }).click();
  await page.getByRole('option', { name: 'Pending', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  const controls = panel.getByRole('combobox');
  const heights = await controls.evaluateAll((nodes) =>
    nodes.map((node) => (node.closest('.ui-multi-select') ?? node).getBoundingClientRect().height),
  );
  expect(new Set(heights).size).toBe(1);
  await accessible(page, '[data-vaul-drawer]');
  await page.screenshot({ path: info.outputPath('mobile-filter.png') });
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(preview.getByRole('table').getByText('Paid', { exact: true })).toHaveCount(0);
  await fits(page);
});

test('table controls and selection mode can be configured independently', async ({ page }) => {
  const preview = await open(page, 'data-table');
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await choose(page, 'mode', 'browse');
  await expect(preview.getByRole('table')).toBeVisible();
  const headerCount = await preview.getByRole('columnheader').count();
  await expect(preview.getByRole('checkbox')).toHaveCount(0);
  await preview.getByRole('button', { name: 'Select', exact: true }).click();
  await expect(preview.getByRole('checkbox')).not.toHaveCount(0);
  await preview.getByRole('button', { name: 'Done', exact: true }).click();
  for (const name of [
    'searchable',
    'filterable',
    'sortable',
    'columnControls',
    'showToolbar',
    'pagination',
  ]) {
    await page.getByRole('switch', { name, exact: true }).click();
  }
  await expect(preview.getByRole('textbox')).toHaveCount(0);
  await expect(preview.getByRole('button')).toHaveCount(0);
  await expect(preview.getByRole('columnheader')).toHaveCount(headerCount);
  await fits(page);
});

test('toast surface, action and close controls stay aligned', async ({ page }, info) => {
  const preview = await open(page, 'toast', 390, 'rtl');
  await preview.getByRole('button', { name: 'With action', exact: true }).click();
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: 'Project archived' });
  await expect(toast).toBeVisible();
  const close = toast.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeVisible();
  const box = (await toast.boundingBox())!;
  const dismiss = (await close.boundingBox())!;
  expect(dismiss.x).toBeGreaterThanOrEqual(box.x);
  expect(dismiss.x + dismiss.width).toBeLessThanOrEqual(box.x + box.width);
  await accessible(page, '[data-sonner-toaster]');
  await page.screenshot({ path: info.outputPath('toast.png') });
  await toast.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Project restored', { exact: true })).toBeVisible();
});
