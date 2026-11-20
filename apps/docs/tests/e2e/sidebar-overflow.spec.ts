import { expect, test, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

async function contained(nav: Locator) {
  await expect
    .poll(() => nav.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
  expect(
    await nav.evaluate((node) => {
      const css = getComputedStyle(node);
      return (
        node.getBoundingClientRect().height -
        node.clientHeight -
        parseFloat(css.borderTopWidth) -
        parseFloat(css.borderBottomWidth)
      );
    }),
  ).toBeLessThan(1);
  await expect(nav).toHaveCSS('overflow-x', 'hidden');
  await expect(nav).toHaveCSS('overflow-y', 'auto');
}
async function iconsFit(nav: Locator) {
  const excess = await nav.evaluate((node) => {
    const frame = node.getBoundingClientRect(),
      left = frame.left + node.clientLeft,
      right = left + node.clientWidth;
    const icons = [
      ...node.querySelectorAll<HTMLElement>('.ui-sidebar-item-icon, .ui-navigation-rail-icon'),
    ].filter((icon) => icon.getClientRects().length && getComputedStyle(icon).opacity !== '0');
    return Math.max(
      0,
      ...icons.map((icon) => {
        const box = icon.getBoundingClientRect();
        return Math.max(left - box.left, box.right - right);
      }),
    );
  });
  expect(excess).toBeLessThanOrEqual(1);
}

for (const slug of ['sidebar', 'navigation-rail']) {
  for (const dir of ['ltr', 'rtl']) {
    test(`assembled ${slug} keeps collapsed navigation within its width in ${dir}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript((dir) => {
        localStorage.setItem('plainui-direction', dir);
        localStorage.setItem(
          'plainui-theme',
          JSON.stringify({ mode: dir === 'rtl' ? 'dark' : 'light', motion: 'system' }),
        );
      }, dir);
      await page.goto(`/components/${slug}`);
      const preview = page.locator('.component-preview'),
        sidebar = preview.locator('.ui-sidebar-desktop'),
        nav = sidebar.locator('.ui-sidebar-content');
      await expect(sidebar).toHaveAttribute('data-state', 'expanded');
      const expandedWidth = (await sidebar.boundingBox())!.width;
      await preview.locator('.ui-sidebar-trigger').click();
      await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeCloseTo(64, 0);
      await contained(nav);
      await iconsFit(nav);
      await nav
        .getByRole('button', { name: slug === 'sidebar' ? 'Inbox' : 'Activity', exact: true })
        .click();
      await contained(nav);
      await preview.screenshot({ path: info.outputPath(`${slug}-${dir}-collapsed.png`) });
      const { violations } = await new AxeBuilder({ page })
        .include('.component-preview')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        violations.map((value) => ({
          id: value.id,
          targets: value.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
      await preview.locator('.ui-sidebar-trigger').click();
      await expect(sidebar).toHaveAttribute('data-state', 'expanded');
      await expect
        .poll(async () => (await sidebar.boundingBox())!.width)
        .toBeCloseTo(expandedWidth, 0);
      await contained(nav);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
}

for (const [dir, compact, variant, side] of [
  ['ltr', '64', 'sidebar', 'start'],
  ['rtl', '64', 'inset', 'end'],
  ['ltr', '48', 'floating', 'end'],
  ['rtl', '48', 'sidebar', 'start'],
] as const) {
  test(`long menus preserve vertical scroll and compact icons at ${compact}px ${dir} ${variant}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto(
      `/tests/fixtures/sidebar-overflow.html?long&dir=${dir}&compact=${compact}&variant=${variant}&side=${side}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
    );
    const sidebar = page.getByRole('complementary', { name: 'Fixture navigation' }),
      nav = sidebar.getByRole('navigation', { name: 'Sidebar navigation' });
    const trigger = page.locator('.ui-sidebar-trigger');
    const input = sidebar.getByRole('textbox', { name: 'Workspace name' });
    await input.fill('Saved workspace name');
    await trigger.click();
    await expect
      .poll(async () => (await sidebar.boundingBox())!.width)
      .toBeCloseTo(Number(compact), 0);
    await contained(nav);
    await iconsFit(nav);
    const account = sidebar.getByRole('button', { name: 'Compact account', exact: true });
    const accountBox = (await account.boundingBox())!,
      sideBox = (await sidebar.boundingBox())!;
    expect(accountBox.x).toBeGreaterThanOrEqual(sideBox.x);
    expect(accountBox.x + accountBox.width).toBeLessThanOrEqual(sideBox.x + sideBox.width + 1);
    await page.getByRole('button', { name: 'Scroll to last item', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Native scroll' })).not.toHaveText('0');
    const last = nav.getByRole('button', { name: 'Last destination', exact: true });
    await expect(last).toBeInViewport();
    await last.focus();
    await expect(last).toBeFocused();
    await contained(nav);
    await iconsFit(nav);
    await account.click();
    await expect(page.getByRole('status', { name: 'Account calls' })).toHaveText('1');
    const rail = page.getByRole('navigation', { name: 'Workspaces', exact: true });
    const railItems = rail.locator('.ui-navigation-rail-items');
    await contained(railItems);
    await iconsFit(railItems);
    const finalWorkspace = rail.getByRole('button', { name: 'Last workspace', exact: true });
    await finalWorkspace.focus();
    await expect(finalWorkspace).toBeInViewport();
    await contained(railItems);
    await page.screenshot({ path: info.outputPath(`long-${compact}-${dir}-${variant}.png`) });
    await trigger.click();
    await expect(input).toHaveValue('Saved workspace name');
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeCloseTo(248, 0);
    await contained(nav);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}

for (const width of [320, 390]) {
  test(`mobile sidebar keeps long navigation scrollable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(
      `/tests/fixtures/sidebar-overflow.html?long&motion=none&dir=${width === 390 ? 'rtl' : 'ltr'}`,
    );
    const trigger = page.locator('.ui-sidebar-trigger');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Fixture navigation', exact: true }),
      nav = panel.getByRole('navigation', { name: 'Sidebar navigation' });
    await expect(panel).toBeVisible();
    await contained(nav);
    await nav.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const last = nav.getByRole('button', { name: 'Last destination', exact: true });
    await expect(last).toBeInViewport();
    await last.click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
