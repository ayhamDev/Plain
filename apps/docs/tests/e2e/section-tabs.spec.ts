import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function revealed(list: Locator, selected: Locator) {
  await expect
    .poll(async () => {
      const frame = (await list.boundingBox())!,
        box = (await selected.boundingBox())!;
      return Math.max(
        frame.x - box.x,
        box.x + box.width - frame.x - frame.width,
        frame.y - box.y,
        box.y + box.height - frame.y - frame.height,
      );
    })
    .toBeLessThanOrEqual(1);
}
for (const [width, dir, theme] of [
  [1000, 'ltr', 'light'],
  [320, 'ltr', 'light'],
  [390, 'rtl', 'dark'],
  [800, 'rtl', 'dark'],
] as const) {
  test(`section tabs keep selection, scroll and indicator aligned at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/tests/fixtures/section-tabs.html?dir=${dir}&theme=${theme}`);
    const list = page.getByRole('tablist', { name: 'Record sections' });
    const first = list.getByRole('tab', { name: 'Details', exact: true });
    await first.focus();
    await first.press('End');
    const quality = list.getByRole('tab', { name: 'Quality', exact: true });
    await expect(quality).toHaveAttribute('aria-selected', 'true');
    if (await list.evaluate((node) => node.scrollWidth > node.clientWidth))
      await expect
        .poll(() => list.evaluate((node) => Math.abs(node.scrollLeft)))
        .toBeGreaterThan(0);
    await revealed(list, quality);
    const indicator = list.locator('.ui-selection-indicator');
    await expect
      .poll(async () =>
        Math.abs((await indicator.boundingBox())!.x - (await quality.boundingBox())!.x),
      )
      .toBeLessThan(1);
    expect((await indicator.boundingBox())!.width).toBeCloseTo(
      (await quality.boundingBox())!.width,
      0,
    );
    await expect(list).toHaveCSS('--ui-tabs-indicator-thickness', '1px');
    await page.getByRole('button', { name: 'Resize container' }).click();
    await revealed(list, quality);
    await quality.focus();
    await quality.press(dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    await expect(list.getByRole('tab', { name: 'Manufacturing', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await first.focus();
    await first.press('Home');
    for (let i = 0; i < 3; i++)
      await page.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    await expect(list.getByRole('tab', { name: 'Inventory', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual(
      [],
    );
    await page.screenshot({ path: info.outputPath(`section-tabs-${width}-${dir}.png`) });
  });
}
test('controlled overflow reveal leaves the page still, also with animation disabled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tests/fixtures/section-tabs.html?offscreen&animated=off');
  const before = await page.evaluate(() => scrollY);
  await page.getByRole('button', { name: 'Select quality' }).click();
  const list = page.getByRole('tablist');
  await expect.poll(() => list.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(list).not.toHaveAttribute('data-has-indicator');
  await expect(list.getByRole('tab', { name: 'Quality', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await list.evaluate((node) => {
    node.scrollLeft = 0;
  });
  await page.waitForTimeout(100);
  expect(await list.evaluate((node) => node.scrollLeft)).toBe(0);
});
test('manual activation and vertical overflow retain keyboard focus visibility', async ({
  page,
}) => {
  await page.goto(
    '/tests/fixtures/section-tabs.html?orientation=vertical&manual=true&motion=none&initial=Quality',
  );
  const list = page.getByRole('tablist');
  const quality = list.getByRole('tab', { name: 'Quality', exact: true });
  await revealed(list, quality);
  await quality.focus();
  await quality.press('Home');
  const details = list.getByRole('tab', { name: 'Details', exact: true });
  await expect(details).toBeFocused();
  await expect(quality).toHaveAttribute('aria-selected', 'true');
  await details.press('Enter');
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await revealed(list, details);
  await expect(details).toHaveCSS('outline-offset', '-3px');
});

test('docs expose the reference section bar and matching configuration source', async ({
  page,
}, info) => {
  await page.goto('/components/tabs');
  const preview = page.locator('.component-preview');
  const list = preview.getByRole('tablist', { name: 'Record sections' });
  await expect(list).toHaveAttribute('data-full-width');
  await expect(list).toHaveCSS('--ui-tabs-indicator-thickness', '1px');
  await expect(list.getByRole('tab')).toHaveCount(9);
  await expect(list.locator('.ui-selection-indicator')).toHaveAttribute('data-ready');
  await preview.screenshot({ path: info.outputPath('section-tab-reference.png') });
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await page.getByRole('combobox', { name: 'size', exact: true }).click();
  await page.getByRole('option', { name: 'lg', exact: true }).click();
  const configured = preview.getByRole('tablist', { name: 'Project views' });
  await expect(configured).toHaveAttribute('data-size', 'lg');
  await page.getByRole('switch', { name: 'animated', exact: true }).click();
  await expect(configured).not.toHaveAttribute('data-has-indicator');
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
  const code = page.locator('.code-block').first();
  await expect(code).toContainText('fullWidth={true}');
  await expect(code).toContainText('scrollable={true}');
  await expect(code).toContainText('indicatorThickness={1}');
  await expect(code).toContainText('size="lg"');
});
