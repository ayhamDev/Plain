import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const kind of ['sidebar', 'rail'] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`${kind} hover overlay reserves compact space in ${dir} and dismisses without click-through`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.goto(
        `/tests/fixtures/sidebar-overflow.html?hover=${kind}&mode=overlay&dir=${dir}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
      );
      const panel =
        kind === 'sidebar'
          ? page.getByRole('complementary', { name: 'Fixture navigation' })
          : page.getByRole('navigation', { name: 'Workspaces', exact: true });
      const shade = page.locator(
        `[data-ui="${kind === 'sidebar' ? 'sidebar' : 'navigation-rail'}"][data-slot="backdrop"]`,
      );
      const content = page.getByRole('region', { name: 'Workspace content' });
      const before = (await content.boundingBox())!;
      await expect(panel).toHaveAttribute('data-state', 'collapsed');
      await panel.hover();
      await expect(panel).toHaveAttribute('data-hover-expanded', 'true');
      await expect
        .poll(async () => (await panel.boundingBox())!.width)
        .toBeCloseTo(kind === 'sidebar' ? 248 : 264, 0);
      await expect(shade).toHaveCSS('opacity', '1');
      const after = (await content.boundingBox())!;
      expect(after.x).toBeCloseTo(before.x, 0);
      expect(after.width).toBeCloseTo(before.width, 0);
      const item = panel.getByRole('button', {
        name: kind === 'sidebar' ? 'Inbox' : 'Workspace 2',
        exact: true,
      });
      await item.click();
      expect(
        (
          await new AxeBuilder({ page })
            .include('[data-ui="sidebar"][data-slot="provider"]')
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({ path: info.outputPath(`${kind}-${dir}-overlay.png`) });
      // The backdrop covers content, while the expanded navigation remains clickable.
      await page.mouse.click(dir === 'ltr' ? 740 : 160, before.y + 180);
      await expect(panel).toHaveAttribute('data-state', 'collapsed');
      await expect(page.getByRole('status', { name: 'Account calls' })).toHaveText('0');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    });
  }

  test(`${kind} inline hover reflows and keyboard focus keeps the preview until Escape`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(`/tests/fixtures/sidebar-overflow.html?hover=${kind}`);
    const panel =
      kind === 'sidebar'
        ? page.getByRole('complementary')
        : page.getByRole('navigation', { name: 'Workspaces', exact: true });
    const content = page.getByRole('region', { name: 'Workspace content' });
    const before = (await content.boundingBox())!.x;
    await panel.hover();
    await expect(panel).toHaveAttribute('data-state', 'expanded');
    await expect.poll(async () => (await content.boundingBox())!.x - before).toBeGreaterThan(150);
    await page.mouse.move(1050, 700);
    await expect(panel).toHaveAttribute('data-state', 'collapsed');
    const item = panel.getByRole('button', {
      name: kind === 'sidebar' ? 'Overview' : 'Workspace 1',
      exact: true,
    });
    await page.keyboard.press('Tab');
    await item.focus();
    await expect(panel).toHaveAttribute('data-state', 'expanded');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveAttribute('data-state', 'collapsed');
  });
}

test('end-side floating overlay stays anchored in RTL with reduced motion and a long menu', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 900, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(
    '/tests/fixtures/sidebar-overflow.html?hover=sidebar&mode=overlay&dir=rtl&side=end&variant=floating&long&compact=48',
  );
  const panel = page.getByRole('complementary');
  const start = (await panel.boundingBox())!;
  await panel.hover();
  await expect(panel).toHaveAttribute('data-state', 'expanded');
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeCloseTo(start.x, 0);
  expect(
    parseFloat(await panel.evaluate((node) => getComputedStyle(node).transitionDuration)),
  ).toBeLessThan(0.001);
  await panel.locator('.ui-sidebar-content').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(
    panel.getByRole('button', { name: 'Last destination', exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: info.outputPath('floating-end-rtl.png') });
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-state', 'collapsed');
});

test('the portaled backdrop honors component-local paint and manual rail state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto('/tests/fixtures/sidebar-overflow.html?hover=rail&mode=overlay&local-paint');
  const panel = page.getByRole('navigation', { name: 'Workspaces', exact: true });
  const trigger = page.getByRole('button', { name: 'Toggle rail expansion' });
  await trigger.click();
  const shade = page.locator('[data-ui="navigation-rail"][data-slot="backdrop"]');
  await expect(panel).toHaveAttribute('data-state', 'expanded');
  await expect(panel).not.toHaveAttribute('data-hover-expanded');
  await expect(shade).toHaveCSS('background-color', 'rgba(40, 80, 160, 0.25)');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-state', 'collapsed');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('touch and mobile keep the rail compact and the sidebar uses its Sheet', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/tests/fixtures/sidebar-overflow.html?hover=sidebar&mode=overlay');
    const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
    await trigger.tap();
    const sheet = page.getByRole('dialog', { name: 'Fixture navigation', exact: true });
    await expect(sheet).toHaveAttribute('data-vaul-drawer', '');
    await sheet.getByRole('button', { name: 'Inbox', exact: true }).tap();
    await expect(sheet).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.locator('.ui-navigation-expansion-backdrop[data-active]').count()).toBe(0);
  } finally {
    await context.close();
  }
});

for (const modal of [false, true]) {
  test(`a portaled ${modal ? 'modal' : 'nonmodal'} navigation menu remains usable during a hover preview`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(
      `/tests/fixtures/sidebar-overflow.html?hover=sidebar&mode=overlay&popup${modal ? '&modal-popup' : ''}`,
    );
    const panel = page.getByRole('complementary', { includeHidden: true });
    await panel.hover();
    await expect(panel).toHaveAttribute('data-state', 'expanded');
    await panel.getByRole('button', { name: 'Navigation tools' }).click();
    const menu = page.getByRole('menu');
    await menu.hover();
    await page.waitForTimeout(350);
    await expect(panel).toHaveAttribute('data-state', 'expanded');
    await menu.getByRole('menuitem', { name: 'Workspace action' }).click();
    await expect(page.getByRole('status', { name: 'Account calls' })).toHaveText('1');
  });
}

test('Escape restores a visible navigation item when there is no external trigger', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto(
    '/tests/fixtures/sidebar-overflow.html?hover=sidebar&mode=overlay&no-trigger&popup',
  );
  const panel = page.getByRole('complementary');
  await panel.hover();
  await panel.getByRole('textbox', { name: 'Workspace name' }).fill('Draft workspace');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-state', 'collapsed');
  await expect(panel.getByRole('button', { name: 'Overview', exact: true })).toBeFocused();
});

test('an oversized standalone rail stays inside a narrow shell and recomputes on resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 880, height: 740 });
  await page.goto(
    '/tests/fixtures/sidebar-overflow.html?hover=rail&mode=overlay&wide=1200&dir=rtl',
  );
  const panel = page.getByRole('navigation', { name: 'Workspaces', exact: true });
  const shell = page.locator('[data-ui="sidebar"][data-slot="provider"]');
  await panel.hover();
  await expect(panel).toHaveAttribute('data-state', 'expanded');
  await expect
    .poll(async () => {
      const frame = (await shell.boundingBox())!,
        box = (await panel.boundingBox())!;
      return Math.max(0, frame.x - box.x, box.x + box.width - frame.x - frame.width);
    })
    .toBeLessThanOrEqual(1);
  await page.keyboard.press('Tab');
  await page.setViewportSize({ width: 800, height: 740 });
  await expect(panel).toHaveAttribute('data-state', 'expanded');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
});
