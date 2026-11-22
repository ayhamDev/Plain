import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function bounded(node: Locator, width: number, height: number) {
  const box = (await node.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
}
for (const [width, height, dir, mode] of [
  [320, 568, 'rtl', 'light'],
  [390, 844, 'ltr', 'dark'],
  [1440, 900, 'ltr', 'light'],
] as const) {
  test(`country surfaces: one scroll region, localization, focus and bounded geometry at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/tests/fixtures/selection-surfaces.html?dir=${dir}&mode=${mode}`);
    const trigger = page
      .getByRole('form')
      .getByRole('combobox', { name: dir === 'rtl' ? /الدولة:/ : /Country:/ });
    await trigger.click();
    const panel = page.getByRole('dialog', {
      name: dir === 'rtl' ? 'الدولة' : 'Country',
      exact: true,
    });
    await expect(panel).toHaveAttribute('data-presentation', width < 768 ? 'sheet' : 'popover');
    await expect(panel).toHaveAttribute('dir', dir);
    await bounded(panel, width, height);
    const geometry = await panel.evaluate((node) => {
      const list = node.querySelector('[cmdk-list]')!;
      return {
        panelOverflow: node.scrollHeight - node.clientHeight,
        listOverflow: list.scrollHeight - list.clientHeight,
        horizontal: node.scrollWidth - node.clientWidth,
      };
    });
    expect(geometry.panelOverflow).toBeLessThanOrEqual(1);
    expect(geometry.listOverflow).toBeGreaterThan(200);
    expect(geometry.horizontal).toBeLessThanOrEqual(1);
    if (width < 768) {
      expect(
        await panel
          .locator('[data-slot="header"]')
          .evaluate((node) => getComputedStyle(node).marginBottom),
      ).toBe('0px');
      expect(
        (await panel.getByRole('option').first().boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
    }
    const search = panel.getByRole('combobox');
    if (width < 768) await expect(search).not.toBeFocused();
    await search.fill('United Kingdom');
    await expect(panel.getByRole('option')).toHaveCount(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath('country-surface.png'), fullPage: true });
    await panel.getByRole('option').click();
    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page.getByTestId('local-scope').getByRole('combobox').click();
    const scoped = page.getByTestId('local-scope').getByRole('dialog');
    await expect(scoped).toBeVisible();
    await expect(scoped).toHaveAttribute('dir', 'rtl');
    await bounded(scoped, width, height);
    await page.keyboard.press('Escape');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('native Select sheet retains scrolling, touch-size targets, keyboard selection and submitted values', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/tests/fixtures/selection-surfaces.html');
  const trigger = page.getByRole('combobox', { name: 'Team', exact: true });
  await trigger.click();
  const list = page.getByRole('listbox', { name: 'Choose team', exact: true });
  const sheet = page.getByRole('dialog', { name: 'Choose team', exact: true });
  await expect(sheet).toHaveClass(/ui-select-sheet/);
  await bounded(sheet, 320, 568);
  const first = list.getByRole('option').first();
  expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('End');
  await expect(list.getByRole('option').last()).toBeFocused();
  await expect(list.getByRole('option').last()).toBeInViewport();
  await page.screenshot({ path: info.outputPath('select-sheet.png'), fullPage: false });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('Team 36');
  expect(
    await page
      .getByRole('form')
      .evaluate((node) => new FormData(node as HTMLFormElement).get('team')),
  ).toBe('team-36');
});

test('Combobox and MultiSelect adapt to sheets, retain limits and close without reopening', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html?mode=dark');
  const project = page.getByRole('combobox', { name: 'Project', exact: true });
  await project.click();
  const panel = page.getByRole('dialog', { name: 'Project', exact: true });
  await panel.getByRole('combobox').fill('Team 15');
  await panel.getByRole('option').click();
  await expect(project).toContainText('Team 15');
  await expect(project).toBeFocused();
  const departments = page.getByRole('combobox', { name: 'Departments', exact: true });
  expect(await departments.evaluate((node) => (node as HTMLInputElement).checkValidity())).toBe(
    false,
  );
  await departments.click();
  const multi = page.getByRole('dialog', { name: 'Departments', exact: true });
  await bounded(multi, 390, 844);
  await multi.getByRole('option').nth(0).click();
  await multi.getByRole('option').nth(1).click();
  await expect(multi.getByRole('option').nth(3)).toHaveAttribute('aria-disabled', 'true');
  await expect(multi).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('multi-select-sheet.png'), fullPage: true });
  await multi.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(multi).not.toBeVisible();
  await expect(departments).toBeFocused();
  expect(await departments.evaluate((node) => (node as HTMLInputElement).checkValidity())).toBe(
    true,
  );
  expect(
    await page
      .getByRole('form')
      .evaluate((node) => new FormData(node as HTMLFormElement).getAll('departments')),
  ).toEqual(['team-1', 'team-2']);
});

test('open sessions do not change traps on resize; explicit presentation overrides work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html');
  const trigger = page.getByRole('combobox', { name: 'Project', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Project', exact: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(panel).toHaveAttribute('data-presentation', 'sheet');
  await page.keyboard.press('Escape');
  await trigger.click();
  await expect(panel).toHaveAttribute('data-presentation', 'popover');
  await page.goto('/tests/fixtures/selection-surfaces.html?presentation=sheet');
  await trigger.click();
  await expect(panel).toHaveAttribute('data-presentation', 'sheet');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/tests/fixtures/selection-surfaces.html?presentation=popover');
  await trigger.click();
  await expect(panel).toHaveAttribute('data-presentation', 'popover');
  await bounded(panel, 320, 568);
});

test('sheets fit a keyboard-reduced visual viewport and preserve nested dialog focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html');
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const parent = page.getByRole('dialog', { name: 'Project settings' });
  const trigger = parent.getByRole('combobox', { name: 'Nested project' });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Nested project', exact: true });
  await expect(sheet).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(visualViewport, 'height', { configurable: true, get: () => 420 });
    visualViewport?.dispatchEvent(new Event('resize'));
  });
  const box = (await sheet.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(421);
  await sheet.getByRole('combobox').fill('Team 5');
  await sheet.getByRole('option', { name: /^Team 5 —/ }).click();
  await expect(trigger).toBeFocused();
  await expect(parent).toBeVisible();
});

test('touch scrolling stays in the country list and native Select supports RTL touch selection', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/tests/fixtures/selection-surfaces.html?dir=rtl');
    await page
      .getByRole('form')
      .getByRole('combobox', { name: /الدولة:/ })
      .tap();
    const sheet = page.getByRole('dialog', { name: 'الدولة', exact: true });
    const list = sheet.locator('[cmdk-list]');
    const bounds = (await list.boundingBox())!;
    const panelY = (await sheet.boundingBox())!.y;
    const start = await list.evaluate((node) => node.scrollTop);
    const session = await context.newCDPSession(page);
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height - 30;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y - step * 20 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(start + 100);
    await expect
      .poll(async () => {
        const before = await list.evaluate((node) => node.scrollTop);
        await page.waitForTimeout(120);
        return Math.abs((await list.evaluate((node) => node.scrollTop)) - before);
      })
      .toBeLessThan(1);
    expect(Math.abs((await sheet.boundingBox())!.y - panelY)).toBeLessThanOrEqual(1);
    await sheet.getByRole('button', { name: 'إغلاق اللوحة', exact: true }).tap();
    await expect(sheet).not.toBeVisible();
    await page.getByRole('combobox', { name: 'Team', exact: true }).tap();
    const native = page.getByRole('listbox', { name: 'اختر الفريق', exact: true });
    const nativeSheet = page.getByRole('dialog', { name: 'اختر الفريق', exact: true });
    await expect(nativeSheet).toHaveAttribute('dir', 'rtl');
    await bounded(nativeSheet, 390, 844);
    expect((await native.getByRole('option').first().boundingBox())!.height).toBeGreaterThanOrEqual(
      44,
    );
    await page.screenshot({ path: info.outputPath('rtl-select-touch.png') });
    const option = native.getByRole('option').nth(1);
    await option.tap();
    await expect(native).not.toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Team', exact: true })).toContainText(
      'الفريق 2',
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  } finally {
    await context.close();
  }
});
