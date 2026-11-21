import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function colors(list: Locator) {
  return list
    .locator(':scope > li')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-color')));
}
async function expectRoleColors(list: Locator) {
  const actual = await list.evaluate((node) => {
    const probe = document.createElement('span');
    probe.style.transition = 'none';
    probe.style.animation = 'none';
    node.append(probe);
    const expected = Array.from({ length: 8 }, (_, index) => {
      probe.style.color = `var(--ui-chart-${index + 1})`;
      return getComputedStyle(probe).color;
    });
    probe.remove();
    return {
      expected,
      actual: [...node.querySelectorAll(':scope > li > span:first-child')]
        .slice(0, 8)
        .map((swatch) => getComputedStyle(swatch).backgroundColor),
    };
  });
  expect(actual.actual).toEqual(actual.expected);
}

for (const [width, mode, dir, seed] of [
  [1440, 'light', 'ltr', ''],
  [390, 'dark', 'ltr', '#2563eb'],
  [320, 'light', 'rtl', '#be185d'],
] as const)
  test(`theme palettes match CSS and charts at ${width}px ${mode} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `/tests/fixtures/color-palette.html?mode=${mode}&dir=${dir}&seed=${encodeURIComponent(seed)}`,
    );
    for (const name of ['Root colors', 'Scoped colors', 'Dark colors']) {
      const list = page.getByRole('list', { name, exact: true });
      await expectRoleColors(list);
      expect((await colors(list)).every((value) => /^#[a-f\d]{6}$/.test(value!))).toBe(true);
    }
    const chart = page.getByRole('figure', { name: 'Generated palette chart' });
    await expect(chart.locator('.recharts-bar path.recharts-rectangle')).toHaveCount(32);
    const painted = await chart
      .locator('.recharts-bar path.recharts-rectangle')
      .evaluateAll((nodes) => [...new Set(nodes.map((node) => getComputedStyle(node).fill))]);
    const swatches = await page
      .getByRole('list', { name: 'Root colors', exact: true })
      .locator(':scope > li > span:first-child')
      .evaluateAll((nodes) =>
        nodes.slice(0, 16).map((node) => getComputedStyle(node).backgroundColor),
      );
    expect(new Set(painted)).toEqual(new Set(swatches));
    await expect(chart.getByRole('table')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('theme-palette.png'), fullPage: true });
  });

test('palette expansion, stable keys, live mode changes and scoped independence', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/color-palette.html');
  const root = page.getByRole('list', { name: 'Root colors', exact: true });
  const scoped = page.getByRole('list', { name: 'Scoped colors', exact: true });
  const original = await colors(root);
  const local = await colors(scoped);
  const keyed = () =>
    page
      .getByRole('list', { name: 'Keyed items' })
      .locator('li')
      .evaluateAll((nodes) =>
        Object.fromEntries(
          nodes.map((node) => [node.getAttribute('data-key'), node.getAttribute('data-color')]),
        ),
      );
  const originalKeys = await keyed();
  await page.getByRole('button', { name: 'More colors', exact: true }).click();
  await expect(root.locator('li')).toHaveCount(48);
  expect((await colors(root)).slice(0, 24)).toEqual(original);
  await page.getByRole('button', { name: 'Reverse items', exact: true }).click();
  expect(await keyed()).toEqual(originalKeys);
  await page.getByRole('button', { name: 'Blue theme', exact: true }).click();
  expect((await colors(root)).slice(0, 24)).not.toEqual(original);
  expect(await colors(scoped)).toEqual(local);
  await expectRoleColors(root);
  await page.getByRole('button', { name: 'Toggle mode', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectRoleColors(root);
  expect(await colors(scoped)).toEqual(local);
});

test('palette follows a changed system preference without a remount', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/tests/fixtures/color-palette.html?mode=system');
  const root = page.getByRole('list', { name: 'Root colors', exact: true });
  const light = await colors(root);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await colors(root)).not.toEqual(light);
  await expectRoleColors(root);
});

test('the theming guide exposes a working palette demo and copyable utility examples', async ({
  page,
}) => {
  await page.goto('/docs/theming#theme-matched-color-palettes');
  const section = page.locator('#theme-matched-color-palettes');
  await expect(
    section.getByRole('heading', { name: 'Theme-matched color palettes' }),
  ).toBeVisible();
  const list = section.getByRole('list', { name: 'Generated theme colors' });
  await expect(list.getByRole('listitem')).toHaveCount(24);
  const original = await list.getByRole('listitem').allTextContents();
  await section.getByRole('button', { name: 'Add 8 colors' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(32);
  expect((await list.getByRole('listitem').allTextContents()).slice(0, 24)).toEqual(original);
  await expect(section).toContainText('@plain/ui/color-palette');
  await expect(section).toContainText('palette.forKey');
});
