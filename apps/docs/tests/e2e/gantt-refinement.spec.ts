import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function fits(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function accessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
  ).toEqual([]);
}
async function dragBy(page: Page, target: Locator, days: number, dir: string, cancel = false) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + days * 40 * (dir === 'rtl' ? -1 : 1),
    box.y + box.height / 2,
    { steps: 8 },
  );
  if (cancel) await page.keyboard.press('Escape');
  await page.mouse.up();
}
for (const dir of ['ltr', 'rtl']) {
  test(`Gantt pointer moves and both resize edges commit once in ${dir}`, async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(`/tests/fixtures/gantt-refinement.html?dir=${dir}`);
    await expect(page.locator('.ui-gantt')).toHaveAttribute('dir', dir);
    const task = page.getByRole('button', { name: /^Design system,/ });
    await dragBy(page, task, 2, dir);
    await expect(page.getByLabel('Commits')).toHaveText('1');
    await expect(page.getByLabel('Result')).toContainText(
      '"start":"2026-11-18","end":"2026-11-23"',
    );
    await expect(page.getByLabel('Activation')).toHaveText('');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const end = page.getByRole('button', { name: 'Resize end of Design system', exact: true });
    await dragBy(page, end, 1, dir);
    await expect(page.getByLabel('Commits')).toHaveText('2');
    await expect(page.getByLabel('Result')).toContainText('"end":"2026-11-24"');
    const start = page.getByRole('button', { name: 'Resize start of Design system', exact: true });
    await dragBy(page, start, -1, dir);
    await expect(page.getByLabel('Commits')).toHaveText('3');
    await expect(page.getByLabel('Result')).toContainText(
      '"start":"2026-11-17","end":"2026-11-24"',
    );
    await dragBy(page, task, 2, dir, true);
    await expect(page.getByLabel('Commits')).toHaveText('3');
    await expect(page.getByRole('button', { name: /^Locked task,/ })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Resize end of Locked task', exact: true }),
    ).toHaveCount(0);
    await start.focus();
    await start.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.getByLabel('Commits')).toHaveText('4');
    await expect(page.getByLabel('Result')).toContainText('"start":"2026-11-18"');
    await fits(page);
  });
  test(`Gantt grouped dates, today, zoom and task details work in ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto(
      `/tests/fixtures/gantt-refinement.html?dir=${dir}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
    );
    const chart = page.getByRole('figure', { name: 'Delivery timeline' });
    await expect(chart.locator('.ui-gantt-period').first()).toContainText('November');
    await expect(chart.locator('.ui-gantt-tick[data-today]')).toContainText('20');
    await expect(chart.locator('.ui-gantt-tick[data-weekend]')).not.toHaveCount(0);
    const paths = chart.locator('.ui-gantt-dependencies g > path');
    await expect(paths).toHaveCount(3);
    await expect(paths.first()).toHaveAttribute('d', /Q/);
    await expect(paths.first()).toHaveAttribute('marker-end', /url\(#/);
    await chart.getByRole('button', { name: 'Today', exact: true }).click();
    const scroll = chart.locator('.ui-gantt-scroll');
    const marker = (await chart.locator('.ui-gantt-today').boundingBox())!;
    const area = (await scroll.boundingBox())!;
    expect(marker.x).toBeGreaterThanOrEqual(area.x);
    expect(marker.x).toBeLessThan(area.x + area.width);
    await chart.getByRole('combobox', { name: 'Timeline view', exact: true }).click();
    await page.getByRole('option', { name: 'Week', exact: true }).click();
    await expect(chart.getByRole('combobox', { name: 'Timeline view', exact: true })).toContainText(
      'Week',
    );
    await chart.getByRole('combobox', { name: 'Timeline view', exact: true }).click();
    await page.getByRole('option', { name: 'Month', exact: true }).click();
    await expect(chart.locator('.ui-gantt-period').first()).toContainText('2026');
    const task = page.getByRole('button', { name: /^Design system,/ });
    await task.click();
    const popup = page.getByRole('dialog', { name: 'Design system', exact: true });
    await expect(popup).toContainText('60%');
    await expect(popup).toContainText('Customer research');
    await page.keyboard.press('Escape');
    await expect(task).toBeFocused();
    await accessible(page);
    await chart.screenshot({ path: info.outputPath(`gantt-${dir}.png`) });
    await fits(page);
  });
}
test('compact mobile timeline, details and disabled pointer editing fit 320px', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/tests/fixtures/gantt-refinement.html?compact&no-drag&no-resize');
  await expect(page.locator('.ui-gantt-label')).toHaveCount(0);
  await expect(page.locator('.ui-gantt-resize')).toHaveCount(0);
  const task = page.getByRole('button', { name: /^Customer research,/ });
  await dragBy(page, task, 1, 'ltr');
  await expect(page.getByLabel('Commits')).toHaveText('0');
  await page.keyboard.press('Escape');
  await task.click();
  const popup = page.getByRole('dialog', { name: 'Customer research', exact: true });
  const box = (await popup.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(7);
  expect(box.x + box.width).toBeLessThanOrEqual(313);
  await page.keyboard.press('Escape');
  await accessible(page);
  await page.locator('.ui-gantt').screenshot({ path: info.outputPath('gantt-compact.png') });
  await fits(page);
});
test('Arabic timeline controls and task details retain RTL and localized strings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/tests/fixtures/gantt-refinement.html?dir=rtl&arabic&theme=dark');
  await expect(page.locator('.ui-gantt')).toHaveAttribute('dir', 'rtl');
  const view = page.getByRole('combobox', { name: 'عرض المخطط الزمني', exact: true });
  await view.click();
  await page.getByRole('option', { name: 'أسبوع', exact: true }).click();
  await expect(view).toContainText('أسبوع');
  await page.getByRole('button', { name: /^Design system,/ }).click();
  const popup = page.getByRole('dialog', { name: 'Design system', exact: true });
  await expect(popup).toContainText('المدة');
  await expect(popup).toContainText('النهاية (غير مشمولة)');
  await page.keyboard.press('Escape');
  await accessible(page);
  await fits(page);
});

test('large row sets and a thirty-year daily axis stay virtualized while scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto('/tests/fixtures/gantt-refinement.html?large');
  await expect(page.locator('.ui-gantt-row').first()).toBeVisible();
  expect(await page.locator('.ui-gantt-row').count()).toBeLessThan(30);
  expect(await page.locator('.ui-gantt-tick').count()).toBeLessThan(50);
  const viewport = page.locator('.ui-gantt-scroll');
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
    node.scrollLeft = node.scrollWidth / 2;
  });
  await expect(page.locator('.ui-gantt-label').filter({ hasText: 'Task 1999' })).toBeVisible();
  expect(await page.locator('.ui-gantt-row').count()).toBeLessThan(30);
  expect(await page.locator('.ui-gantt-tick').count()).toBeLessThan(50);
  await fits(page);
});
for (const [width, dir] of [
  [1440, 'ltr'],
  [390, 'rtl'],
] as const) {
  test(`built Gantt preview exposes working views and customization at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(
      ({ width, dir }) => {
        localStorage.setItem(
          'plainui-theme',
          JSON.stringify({ mode: width < 640 ? 'dark' : 'light', motion: 'none' }),
        );
        localStorage.setItem('plainui-direction', dir);
      },
      { width, dir },
    );
    await page.goto('/components/gantt-chart');
    const preview = page.locator('.component-preview');
    await expect(preview.locator('.ui-gantt-period').first()).toContainText('November');
    await preview.screenshot({ path: info.outputPath('gantt-day-preview.png') });
    await preview.getByRole('combobox', { name: 'Timeline view', exact: true }).click();
    await page.getByRole('option', { name: 'Week', exact: true }).click();
    await expect(
      preview.getByRole('combobox', { name: 'Timeline view', exact: true }),
    ).toContainText('Week');
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await page.getByRole('switch', { name: 'showTaskList', exact: true }).click();
    await expect(preview.locator('.ui-gantt-label')).not.toHaveCount(0);
    await preview.screenshot({ path: info.outputPath('built-gantt.png') });
    await fits(page);
  });
}
