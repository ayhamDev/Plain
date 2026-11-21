import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

declare global {
  interface Window {
    __presenceCalls: { phase: string | null; target: string | null }[];
  }
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__presenceCalls = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      window.__presenceCalls.push({
        phase: this.getAttribute('data-ui-presence'),
        target: this.getAttribute('data-testid'),
      });
      return animate.call(this, keyframes, options);
    };
  });
});

for (const [width, theme, dir] of [
  [1440, 'light', 'ltr'],
  [800, 'dark', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`initial, add, remove and reentry preserve forms and focus at ${width}px ${theme} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `/tests/fixtures/layout-presence.html?theme=${theme}&dir=${dir}&duration=1000&layout`,
    );
    const scope = page.getByTestId('presence-scope');
    const field = page.getByLabel('Project 1', { exact: true });
    await expect(scope).toBeVisible();
    await expect(field).toBeVisible();
    expect(
      (await page.evaluate(() => window.__presenceCalls)).filter((call) => call.phase === 'enter'),
    ).toHaveLength(3);
    await expect(scope.locator('[data-ui-presence]')).toHaveCount(0);
    await field.fill('Local draft');
    const retained = await field.elementHandle();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByTestId('item-3')).toBeVisible();
    await expect(field).toHaveValue('Local draft');
    await page.getByRole('button', { name: 'Remove chosen', exact: true }).click();
    await expect(page.getByTestId('item-1')).toHaveAttribute('aria-hidden', 'true');
    await expect(field).toBeDisabled();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    expect(JSON.parse(await page.getByTestId('submitted').innerText())).not.toHaveProperty(
      'project-1',
    );
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(field).toBeEnabled();
    await expect(field).toHaveValue('Local draft');
    expect(await retained!.evaluate((node) => node.isConnected)).toBe(true);
    await page.getByRole('button', { name: 'Reverse', exact: true }).click();
    await expect(scope.locator('[data-ui-presence]')).toHaveCount(0);
    expect(
      (await page.evaluate(() => window.__presenceCalls)).some((call) => call.phase === 'layout'),
    ).toBe(true);
    await page.getByRole('button', { name: 'Remove 0', exact: true }).click();
    await expect(scope).toBeFocused();
    await expect(page.getByTestId('item-0')).toHaveCount(0);
    await expect(scope.locator('[data-ui-presence]')).toHaveCount(0);
    const scan = await new AxeBuilder({ page })
      .include('[data-testid="presence-scope"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(scan.violations.map((violation) => violation.id)).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath(`presence-${width}-${theme}-${dir}.png`) });
  });
}

for (const type of [
  'stack',
  'inline',
  'masonry',
  'card',
  'scroll',
  'list',
  'sidebar',
  'resizable',
  'table',
  'shell',
]) {
  test(`keyed removals retain the real child and native structure in ${type}`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 850 });
    await page.goto(`/tests/fixtures/layout-presence.html?container=${type}&duration=600`);
    const scope = page.getByTestId('presence-scope');
    const field = page.getByLabel('Project 1', { exact: true });
    await expect(scope).toBeVisible();
    await expect(field).toBeVisible();
    await expect(scope.locator('[data-ui-presence]')).toHaveCount(0);
    const retained = await field.elementHandle();
    await page.getByRole('button', { name: 'Remove chosen', exact: true }).click();
    await expect(scope.locator('[data-ui-presence="exit"]')).toHaveCount(1);
    expect(await retained!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(page.getByTestId('item-1')).toHaveCount(0);
    if (type === 'table') await expect(scope.locator(':scope > tr')).toHaveCount(2);
    if (type === 'list' || type === 'sidebar')
      await expect(scope.locator(':scope > li')).toHaveCount(2);
    expect(await scope.getAttribute('presence')).toBeNull();
  });
}

test('large batches bound native animation and retained DOM counts', async ({ page }) => {
  await page.goto('/tests/fixtures/layout-presence.html?count=80&max=6&duration=3000');
  const scope = page.getByTestId('presence-scope');
  await expect(scope.locator('article')).toHaveCount(80);
  expect(
    (await page.evaluate(() => window.__presenceCalls)).filter((call) => call.phase === 'enter'),
  ).toHaveLength(6);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(scope.locator('article')).toHaveCount(81);
  expect(
    (await page.evaluate(() => window.__presenceCalls)).filter((call) => call.phase === 'enter'),
  ).toHaveLength(6);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(scope.locator('article')).toHaveCount(6);
  await expect(scope.locator('article')).toHaveCount(0);
  expect(
    (await page.evaluate(() => window.__presenceCalls)).filter((call) => call.phase === 'exit'),
  ).toHaveLength(6);
});

for (const policy of ['provider', 'system', 'unsupported'] as const) {
  test(`pending exits finish immediately with ${policy} motion disabled`, async ({ page }) => {
    if (policy === 'unsupported')
      await page.addInitScript(() => {
        Reflect.deleteProperty(Element.prototype, 'animate');
      });
    await page.goto('/tests/fixtures/layout-presence.html?duration=3000&initial=false');
    await expect(page.getByTestId('item-1')).toBeVisible();
    await page.getByRole('button', { name: 'Remove chosen', exact: true }).click();
    if (policy === 'provider')
      await page.getByRole('button', { name: 'Disable motion', exact: true }).click();
    if (policy === 'system') await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('item-1')).toHaveCount(0);
    await expect(page.getByTestId('presence-scope').locator('[data-ui-presence]')).toHaveCount(0);
  });
}
