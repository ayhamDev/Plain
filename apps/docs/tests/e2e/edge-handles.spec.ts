import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const opacity = (handle: Locator) =>
  handle.evaluate((node) => parseFloat(getComputedStyle(node, '::before').opacity));
async function frames(handle: Locator, action: () => Promise<unknown>) {
  const pending = handle.evaluate(async (node) => {
    const values: number[] = [];
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      values.push(parseFloat(getComputedStyle(node, '::before').opacity));
    }
    return values;
  });
  await action();
  return pending;
}
for (const dir of ['ltr', 'rtl']) {
  for (const side of ['start', 'end']) {
    test(`sidebar edge fades in and out without layout changes in ${dir} ${side}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(
        `/tests/fixtures/edge-handles.html?dir=${dir}&side=${side}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
      );
      await page.mouse.move(1, 1);
      const rail = page.getByRole('button', { name: 'Toggle navigation edge' });
      const sidebar = page.getByRole('complementary', { name: 'App navigation' });
      await expect.poll(() => opacity(rail)).toBe(0);
      const before = await sidebar.boundingBox(),
        target = await rail.boundingBox();
      expect(
        (await frames(rail, () => rail.hover())).some((value) => value > 0.02 && value < 0.98),
      ).toBe(true);
      await expect.poll(() => opacity(rail)).toBe(1);
      expect(await sidebar.boundingBox()).toEqual(before);
      expect(await rail.boundingBox()).toEqual(target);
      await expect(rail).toHaveCSS('box-shadow', 'none');
      const edge =
        side === 'start' ? (dir === 'rtl' ? 'left' : 'right') : dir === 'rtl' ? 'right' : 'left';
      expect(
        await rail.evaluate(
          (node, edge) => getComputedStyle(node, '::before').getPropertyValue(edge),
          edge,
        ),
      ).toBe('0px');
      const resize = page.getByRole('separator', { name: 'Resize files' });
      expect(
        await rail.evaluate((node) => getComputedStyle(node, '::before').backgroundColor),
      ).toBe(await resize.evaluate((node) => getComputedStyle(node, '::before').backgroundColor));
      await page.screenshot({ path: info.outputPath(`edge-${dir}-${side}.png`) });
      expect(
        (await frames(rail, () => page.mouse.move(1, 1))).some(
          (value) => value > 0.02 && value < 0.98,
        ),
      ).toBe(true);
      await expect.poll(() => opacity(rail)).toBe(0);
      await rail.focus();
      await expect.poll(() => opacity(rail)).toBe(1);
      await rail.press('Space');
      await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });
  }
}
for (const [width, dir, axis] of [
  [1000, 'ltr', 'horizontal'],
  [390, 'rtl', 'vertical'],
] as const) {
  test(`resizable edge animates and retains drag and keyboard sizing in ${axis}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/tests/fixtures/edge-handles.html?dir=${dir}&axis=${axis}`);
    await page.mouse.move(1, 1);
    const handle = page.getByRole('separator', { name: 'Resize files' });
    const panel = page.locator('[data-ui="resizable"][data-slot="panel"]').first();
    await expect.poll(() => opacity(handle)).toBe(0);
    const box = (await handle.boundingBox())!,
      original = await panel.boundingBox();
    expect(
      (await frames(handle, () => handle.hover())).some((value) => value > 0.02 && value < 0.98),
    ).toBe(true);
    expect(await panel.boundingBox()).toEqual(original);
    expect(await handle.boundingBox()).toEqual(box);
    await handle.focus();
    const before = await handle.getAttribute('aria-valuenow');
    await handle.press(axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown');
    await expect(handle).not.toHaveAttribute('aria-valuenow', before!);
    const grip = (await handle.boundingBox())!;
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      grip.x + grip.width / 2 + (axis === 'horizontal' ? 80 : 0),
      grip.y + grip.height / 2 + (axis === 'vertical' ? 60 : 0),
      { steps: 8 },
    );
    await expect(handle).toHaveAttribute('data-separator', 'active');
    await expect.poll(() => opacity(handle)).toBe(1);
    await page.mouse.up();
    expect(await panel.boundingBox()).not.toEqual(original);
    await page.screenshot({ path: info.outputPath(`resize-${axis}.png`) });
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual(
      [],
    );
  });
}
test('reduced motion, forced colors and disabled handles keep clear feedback', async ({ page }) => {
  await page.goto('/tests/fixtures/edge-handles.html?motion=none');
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const rail = page.getByRole('button', { name: 'Toggle navigation edge' });
  const handle = page.getByRole('separator', { name: 'Resize files' });
  for (const control of [rail, handle]) {
    await control.focus();
    await expect.poll(() => opacity(control)).toBe(1);
    expect(
      await control.evaluate((node) =>
        Math.max(
          ...getComputedStyle(node, '::before').transitionDuration.split(',').map(parseFloat),
        ),
      ),
    ).toBeLessThanOrEqual(0.001);
    expect(
      await control.evaluate((node) => getComputedStyle(node, '::before').forcedColorAdjust),
    ).toBe('none');
  }
  await page.goto('/tests/fixtures/edge-handles.html?disabled');
  await handle.hover();
  await expect(handle).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => opacity(handle)).toBe(0);
});
test('grip opt-in and documentation source remain available', async ({ page }) => {
  await page.goto('/components/resizable');
  const preview = page.locator('.component-preview');
  await expect(preview.locator('[data-slot="icon"][data-ui="resizable"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await page.getByRole('switch', { name: 'withHandle', exact: true }).click();
  await expect(preview.locator('[data-slot="icon"][data-ui="resizable"]')).toBeVisible();
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
  await expect(page.locator('.code-block').first()).toContainText('withHandle={true}');
});

test.describe('touch feedback', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 850 } });
  test('no-hover devices retain a visible edge affordance', async ({ page }) => {
    await page.goto('/tests/fixtures/edge-handles.html?axis=vertical');
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    const handle = page.getByRole('separator', { name: 'Resize files' });
    const rail = page.getByRole('button', { name: 'Toggle navigation edge' });
    await expect.poll(() => opacity(handle)).toBe(0.5);
    await expect.poll(() => opacity(rail)).toBe(0.5);
    await handle.focus();
    await expect.poll(() => opacity(handle)).toBe(1);
  });
});

test('built previews show matching animated edge treatments', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/components/resizable');
  const preview = page.locator('.component-preview');
  const handle = preview.getByRole('separator', { name: 'Resize explorer' });
  await expect(handle).toBeVisible();
  await handle.hover();
  await expect.poll(() => opacity(handle)).toBe(1);
  const color = await handle.evaluate((node) => getComputedStyle(node, '::before').backgroundColor);
  await preview.screenshot({ path: info.outputPath('resizable-edge.png') });
  await page.goto('/components/sidebar');
  const rail = preview.locator('[data-ui="sidebar"][data-slot="rail"]');
  await rail.hover();
  await expect.poll(() => opacity(rail)).toBe(1);
  expect(await rail.evaluate((node) => getComputedStyle(node, '::before').backgroundColor)).toBe(
    color,
  );
  await preview.screenshot({ path: info.outputPath('sidebar-edge.png') });
});
