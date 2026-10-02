import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { chartSampleData } from '../../src/docs/chart-samples';
import type { DocsVersionManifest } from '../../src/docs/versioning';

test.use({ viewport: { width: 1440, height: 1000 } });

async function appearance(
  page: Page,
  mode: 'light' | 'dark' = 'light',
  dir: 'ltr' | 'rtl' = 'ltr',
  color: string | null = null,
  motion = 'system',
) {
  await page.addInitScript(
    ({ mode, dir, color, motion }) => {
      localStorage.setItem('plainui-theme', JSON.stringify({ mode, color, motion }));
      localStorage.setItem('plainui-direction', dir);
      localStorage.removeItem('plainui-token-overrides');
    },
    { mode, dir, color, motion },
  );
}
async function choose(page: Page, control: Locator, value: string) {
  await control.click();
  const name = /^\d+\.\d+\.\d+$/.test(value)
    ? new RegExp(`^${value.replaceAll('.', '\\.')}($|\\s)`)
    : value;
  await page.getByRole('option', { name, exact: typeof name === 'string' }).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

test('version switching preserves a page, query, fragment, reload, search and package identity', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await appearance(page, 'dark', 'rtl', '#2563eb');
  await page.goto('/v/0.2.0/components/select?demo=position#api');
  await expect(page.getByRole('heading', { name: 'Select', exact: true, level: 1 })).toBeVisible();
  await choose(page, page.getByRole('combobox', { name: 'Library version', exact: true }), '0.1.0');
  await expect(page).toHaveURL(/\/v\/0\.1\.0\/components\/select\?demo=position#api$/);
  await expect(page.getByRole('heading', { name: 'Select', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('main')).toContainText('@plainui/react');
  await expect(page.locator('#props-preview')).toHaveCount(0);
  expect(
    await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Select', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Search documentation', exact: true }).click();
  const search = page.getByRole('combobox', { name: 'Search documentation', exact: true });
  await search.fill('Button');
  await page
    .getByRole('option', { name: /Button/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/v\/0\.1\.0\/components\/button$/);
  await expect(page.getByRole('heading', { name: 'Button', exact: true, level: 1 })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('archive-desktop.png') });
  await choose(
    page,
    page.getByRole('combobox', { name: 'Documentation version', exact: true }),
    '0.2.0',
  );
  await expect(page).toHaveURL(/\/v\/0\.2\.0\/components\/button$/);
  await expect(page.locator('#props-preview')).toBeVisible();
  await expect(page.locator('main')).toContainText('@plain/ui');
  await page.goto('/docs/versions');
  await expect(page.locator('main h1').first()).toHaveText('Documentation versions');
  await page.goto('http://127.0.0.1:5173/docs/versions');
  await expect(page.locator('main h1').first()).toHaveText('Documentation versions');
  expect(errors).toEqual([]);
});

test('archives have an exact route inventory and unavailable new pages fall back intentionally', async ({
  page,
  request,
}) => {
  const response = await request.get('/docs-versions.json');
  const manifest = (await response.json()) as DocsVersionManifest;
  const old = manifest.versions.find((entry) => entry.version === '0.1.0')!;
  expect(old.ref).toMatch(/^[a-f\d]{40}$/);
  expect(old.routes).toContain('/docs/rtl');
  expect(old.routes).toContain('/docs/customization');
  expect(old.routes).not.toContain('/components/bar-chart');
  expect(old.routes).not.toContain('/blocks');
  await page.goto('/components/bar-chart');
  await choose(page, page.getByRole('combobox', { name: 'Library version', exact: true }), '0.1.0');
  await expect(page).toHaveURL(/\/v\/0\.1\.0\/components$/);
  await expect(page).toHaveTitle(/^Components/);
  expect((await request.get('/v/9.9.9/components/select')).status()).toBe(404);
  const redirect = await request.get('/v/0.1.0?demo=retained', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('/v/0.1.0/?demo=retained');
  const download = await request.get('/v/0.1.0/plainui-react-0.1.0.tgz');
  expect(download.ok()).toBe(true);
  expect(download.headers()['content-type']).not.toContain('text/html');
});

test('every archived page is a real historical page with independent assets', async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const manifest = (await (await request.get('/docs-versions.json')).json()) as DocsVersionManifest;
  const archive = manifest.versions.find((entry) => entry.version === '0.1.0')!;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of archive.routes) {
    const response = await page.goto(`${archive.base.replace(/\/$/, '')}${route}`);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('main h1').first(), route).toBeVisible();
    await expect(page.locator('main h1').first()).not.toHaveText(/Page not found|A little off/);
    await expect(page.locator('script[type="module"]').first()).toHaveAttribute(
      'src',
      /\/v\/0\.1\.0\/assets\//,
    );
  }
  expect(errors).toEqual([]);
});

for (const profile of [
  { width: 320, mode: 'light', dir: 'ltr' },
  { width: 390, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`version menus and historical deep links fit at ${profile.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: profile.width, height: 844 });
    await appearance(page, profile.mode, profile.dir);
    await page.goto('/components/select');
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await choose(
      page,
      page.getByRole('dialog').getByRole('combobox', { name: 'Documentation version' }),
      '0.1.0',
    );
    await expect(page).toHaveURL(/\/v\/0\.1\.0\/components\/select$/);
    await expect(page.locator('main h1').first()).toHaveText('Select');
    await expect(page.getByRole('combobox', { name: 'Documentation version' })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`archive-${profile.width}.png`) });
    await choose(page, page.getByRole('combobox', { name: 'Documentation version' }), '0.2.0');
    await expect(page).toHaveURL(/\/v\/0\.2\.0\/components\/select$/);
    await expect(page.locator('#props-preview')).toBeVisible();
    await noOverflow(page);
  });
}

for (const profile of [
  { width: 1440, mode: 'light', dir: 'ltr' },
  { width: 320, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`Select positioning modes and source match at ${profile.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: profile.width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await appearance(page, profile.mode, profile.dir);
    await page.goto('/components/select');
    const playground = page.locator('#props-preview');
    await playground.getByRole('button', { name: 'Preview properties' }).click();
    await choose(
      page,
      playground.getByRole('combobox', { name: 'position', exact: true }),
      'item-aligned',
    );
    await choose(
      page,
      playground.getByRole('combobox', { name: 'position', exact: true }),
      'popper',
    );
    const team = playground.locator('.component-preview button[role="combobox"]');
    await team.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await team.click();
    const popper = page.getByRole('listbox');
    await expect(popper).toBeVisible();
    const trigger = (await team.boundingBox())!;
    const popup = (await popper.boundingBox())!;
    expect(popup.y - trigger.y - trigger.height).toBeCloseTo(6, 0);
    expect(popup.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
    await expect(page.getByRole('option', { name: 'Finance', exact: true })).toHaveAttribute(
      'data-disabled',
      '',
    );
    await page.screenshot({ path: testInfo.outputPath(`select-popper-${profile.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(team).toBeFocused();
    await choose(
      page,
      playground.getByRole('combobox', { name: 'position', exact: true }),
      'item-aligned',
    );
    await expect(playground.getByRole('combobox', { name: 'side', exact: true })).toBeDisabled();
    await team.click();
    const selected = (await page
      .getByRole('option', { name: 'Engineering', exact: true })
      .boundingBox())!;
    const currentTrigger = (await team.boundingBox())!;
    expect(
      Math.abs(selected.y + selected.height / 2 - currentTrigger.y - currentTrigger.height / 2),
    ).toBeLessThan(4);
    await page.screenshot({ path: testInfo.outputPath(`select-aligned-${profile.width}.png`) });
    await page.keyboard.press('Escape');
    await playground.getByRole('tab', { name: 'Code', exact: true }).click();
    await expect(playground.locator('pre')).toContainText('position="item-aligned"');
    await playground.getByRole('button', { name: 'Reset preview props' }).click();
    await expect(playground.locator('pre')).toContainText('SelectContent');
    await noOverflow(page);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(scan.violations).toEqual([]);
  });
}

for (const setting of [
  { width: 1440, mode: 'light', dir: 'ltr', color: null },
  { width: 390, mode: 'dark', dir: 'rtl', color: '#2563eb' },
  { width: 320, mode: 'dark', dir: 'ltr', color: null },
] as const) {
  test(`chart tooltip values and prop controls remain readable at ${setting.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: setting.width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await appearance(page, setting.mode, setting.dir, setting.color);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/components/bar-chart');
    const chart = page.locator('.component-preview').getByRole('figure');
    const svg = chart.getByRole('application');
    await svg.focus();
    await svg.press('ArrowRight');
    const tooltip = chart.locator('.ui-chart-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('.ui-chart-tooltip-value')).toHaveCount(2);
    const month = await tooltip.locator('.ui-chart-tooltip-label').innerText();
    const record = chartSampleData.find((row) => row.month === month)!;
    expect(record).toBeDefined();
    for (const [name, value] of [
      ['Revenue', record.revenue],
      ['Costs', record.costs],
    ] as const)
      await expect(
        tooltip.locator('.ui-chart-tooltip-item').filter({ hasText: name }),
      ).toContainText(String(value));
    const contrast = await tooltip.evaluate((node) => {
      const channels = (color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!;
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      };
      const luminance = (color: number[]) =>
        color
          .map((value) => value / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
          .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      const background = channels(getComputedStyle(node).backgroundColor);
      const foreground = channels(
        getComputedStyle(node.querySelector('.ui-chart-tooltip-value')!).color,
      );
      const a = luminance(background),
        b = luminance(foreground);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await chart.screenshot({ path: testInfo.outputPath(`bar-tooltip-${setting.width}.png`) });
    const playground = page.locator('#props-preview');
    const preview = playground.getByRole('figure');
    await playground.getByRole('button', { name: 'Preview properties' }).click();
    await playground.getByRole('switch', { name: 'stacked', exact: true }).click();
    await playground.getByRole('switch', { name: 'yAxis', exact: true }).click();
    await expect(preview.locator('.recharts-yAxis')).toHaveCount(0);
    await choose(
      page,
      playground.getByRole('combobox', { name: 'dataTable', exact: true }),
      'visible',
    );
    await expect(preview.getByRole('table')).toBeVisible();
    const height = (await preview.locator('.ui-chart-viewport').boundingBox())!.height;
    await playground.getByRole('switch', { name: 'loading', exact: true }).click();
    await expect(preview.getByRole('status')).toHaveText('Loading chart');
    expect((await preview.locator('.ui-chart-viewport').boundingBox())!.height).toBe(height);
    await playground.getByRole('button', { name: 'Reset preview props' }).click();
    await expect(preview.locator('.recharts-bar-rectangle')).toHaveCount(12);
    await playground.getByRole('tab', { name: 'Code', exact: true }).click();
    await expect(playground.locator('pre')).toContainText('<BarChart');
    await playground.getByRole('tab', { name: 'Preview', exact: true }).click();
    await noOverflow(page);
    const scan = await new AxeBuilder({ page })
      .include('.component-preview')
      .include('#props-preview')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(scan.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const policy of ['system', 'reduced', 'none'] as const) {
  test(`dialog motion is centered and dismissible under ${policy} policy`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: policy === 'reduced' ? 'reduce' : 'no-preference' });
    await appearance(page, 'dark', 'rtl', null, policy);
    await page.goto('/components/dialog');
    await page.getByRole('button', { name: 'Preview properties' }).click();
    await page.getByRole('switch', { name: 'showClose', exact: true }).click();
    await page.getByRole('switch', { name: 'showClose', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Open preview dialog', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Project settings', exact: true });
    await expect(dialog).toBeVisible();
    const motion = await dialog.evaluate((node) => {
      const style = getComputedStyle(node);
      const animation = node.getAnimations()[0];
      return {
        duration: parseFloat(style.animationDuration) * 1000,
        keyframes: (animation?.effect as KeyframeEffect | null)?.getKeyframes(),
      };
    });
    if (policy === 'system') {
      expect(motion.duration).toBe(320);
      expect(motion.keyframes?.[0].transform).toContain('translateY(8px)');
    } else expect(motion.duration).toBeLessThanOrEqual(1);
    await expect(dialog.getByRole('textbox', { name: 'Project name' })).toBeFocused();
    await expect
      .poll(async () => {
        const rect = (await dialog.boundingBox())!;
        return Math.abs(rect.x + rect.width / 2 - 720) + Math.abs(rect.y + rect.height / 2 - 500);
      })
      .toBeLessThan(1);
    await dialog.screenshot({ path: testInfo.outputPath(`dialog-${policy}.png`) });
    await dialog.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

const previewSlugs = [
  'button',
  'select',
  'input',
  'textarea',
  'checkbox',
  'switch',
  'slider',
  'combobox',
  'badge',
  'alert',
  'avatar',
  'progress',
  'separator',
  'dialog',
  'popover',
  'tooltip',
  'calendar',
  'date-picker',
  'number-input',
  'rating',
  'tabs',
  'accordion',
  'radio-group',
  'scroll-area',
  'dropdown-menu',
  'password-input',
  'search-input',
  'tags-input',
  'multi-select',
  'pin-input',
  'color-picker',
  'toggle',
  'toggle-group',
  'skeleton',
  'collapsible',
  'grid',
  'flex',
  'masonry',
  'stack',
  'inline',
  'virtual-list',
  'virtual-grid',
  'virtual-masonry',
  'sheet',
  'drawer',
  'area-chart',
  'bar-chart',
  'line-chart',
  'donut-chart',
  'time-picker',
  'date-time-picker',
  'time-range-picker',
  'date-time-range-picker',
  'date-range-picker',
];
for (const profile of [
  { width: 1440, mode: 'light', dir: 'ltr' },
  { width: 320, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`all prop playgrounds render and expose source at ${profile.width}px`, async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width: profile.width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await appearance(page, profile.mode, profile.dir);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const slug of previewSlugs) {
      await page.goto(`/components/${slug}`);
      const playground = page.locator('#props-preview');
      await expect(playground, slug).toBeVisible();
      await expect(playground.locator('.component-preview > *').first(), slug).toBeVisible();
      await playground.getByRole('button', { name: 'Preview properties' }).click();
      const controls = playground.locator('.preview-properties');
      const options = controls.getByRole('combobox');
      if (await options.count()) {
        await options.first().click();
        await page.getByRole('option').last().click();
      } else if (await controls.getByRole('spinbutton').count()) {
        await controls.getByRole('spinbutton').first().press('ArrowDown');
      } else await controls.getByRole('switch').first().click();
      await playground.getByRole('tab', { name: 'Code', exact: true }).click();
      await expect(playground.locator('pre')).toContainText('export function Example()');
      await noOverflow(page);
    }
    expect(errors).toEqual([]);
  });
}
