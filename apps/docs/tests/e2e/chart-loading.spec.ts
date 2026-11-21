import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const skeleton = '[data-ui="chart-skeleton"][data-slot="root"]';
const families = [
  'area',
  'bar',
  'line',
  'composed',
  'donut',
  'pie',
  'radar',
  'scatter',
  'heatmap',
  'gantt',
];

for (const appearance of [
  { width: 1440, theme: 'light', dir: 'ltr' },
  { width: 390, theme: 'dark', dir: 'ltr' },
  { width: 320, theme: 'dark', dir: 'rtl' },
])
  test(`chart skeletons fit ${appearance.width}px ${appearance.theme} ${appearance.dir}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: appearance.width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(
      `/tests/fixtures/chart-loading.html?theme=${appearance.theme}&dir=${appearance.dir}`,
    );
    for (const family of families) {
      const section = page.getByTestId(family);
      const placeholder = section.locator(skeleton);
      await expect(placeholder).toHaveAttribute('data-variant', family);
      await expect(section.locator('figure')).toHaveAttribute('aria-busy', 'true');
      const svg = placeholder.locator('svg');
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
      const bounds = await svg.boundingBox();
      expect(bounds!.width).toBeGreaterThan(200);
      expect(bounds!.height).toBeGreaterThan(60);
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(appearance.width);
      await expect(section.locator('.recharts-wrapper, table, button')).toHaveCount(0);
      expect(await svg.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const loadingText = page.locator(`${skeleton} > span`).first();
    expect(await loadingText.evaluate((n) => n.getBoundingClientRect().width)).toBe(1);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('loading.png'), fullPage: true });
  });

test('keeps the plot height stable when loading resolves and preserves the separate empty state', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/chart-loading.html?variant=bar&motion=none');
  const chart = page.getByTestId('bar');
  const viewport = chart.locator('[data-ui="chart"][data-slot="viewport"]');
  const before = await viewport.boundingBox();
  expect((await chart.locator(`${skeleton} svg`).boundingBox())!.height).toBe(240);
  await page.getByRole('button', { name: 'ready', exact: true }).click();
  await expect(chart.getByRole('application')).toBeVisible();
  await expect(chart.locator('.recharts-bar-rectangle')).toHaveCount(3);
  await expect(chart.locator(skeleton)).toHaveCount(0);
  expect((await viewport.boundingBox())!.height).toBe(before!.height);
  await chart.getByRole('application').focus();
  await page.keyboard.press('ArrowRight');
  await expect(chart.locator('.recharts-tooltip-wrapper')).toBeVisible();
  await page.getByRole('button', { name: 'empty', exact: true }).click();
  await expect(chart.getByRole('status')).toHaveText('No data');
  await expect(chart.locator('svg')).toHaveCount(0);
});

test('follows live reduced-motion changes, explicit policy and scoped skeleton tokens', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tests/fixtures/chart-loading.html?variant=line');
  const visual = page.getByTestId('line').locator(`${skeleton} svg`);
  await expect
    .poll(() => visual.evaluate((n) => getComputedStyle(n).animationName))
    .toBe('ui-skeleton-pulse');
  const scoped = page.getByRole('region', { name: 'Scoped fallback' }).locator(skeleton);
  await expect(scoped).toHaveCSS('color', 'rgb(137, 168, 187)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => visual.evaluate((n) => getComputedStyle(n).animationName)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const policy of ['none', 'reduced']) {
    await page.goto(`/tests/fixtures/chart-loading.html?variant=line&motion=${policy}`);
    await expect(page.getByTestId('line').locator(skeleton)).toHaveAttribute(
      'data-motion',
      'disabled',
    );
    await expect(visual).toHaveCSS('animation-name', 'none');
  }
});

test('uses the same accessible skeleton while a documentation chart module downloads', async ({
  page,
}) => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /\/(src\/docs\/examples\/ChartExample\.tsx|assets\/ChartExample[^/]*\.js)(\?.*)?$/,
    async (route) => {
      await wait;
      await route.continue();
    },
  );
  try {
    await page.goto('/components/area-chart', { waitUntil: 'domcontentloaded' });
    const preview = page.locator('.component-preview');
    await expect(preview.locator(skeleton)).toHaveAttribute('data-variant', 'area');
    await expect(preview.locator('.recharts-wrapper')).toHaveCount(0);
    release();
    await expect(preview.locator('.recharts-area').first()).toBeVisible();
    await expect(preview.locator(skeleton)).toHaveCount(0);
  } finally {
    release();
  }
});
