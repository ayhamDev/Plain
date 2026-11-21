import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, query = '', width = 1000) {
  await page.setViewportSize({ width, height: 800 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/tests/fixtures/scroll-area.html?${query}`);
  const viewport = page.getByRole('region', { name: 'Projects', exact: true });
  await expect(viewport).toBeVisible();
  return viewport;
}
async function paintWidth(thumb: Locator, axis = 'vertical') {
  return thumb.evaluate((node, axis) => {
    const css = getComputedStyle(node);
    return axis === 'vertical'
      ? parseFloat(css.maskSize)
      : Number(css.maskSize.match(/\)\s+([\d.]+)px/)?.[1]);
  }, axis);
}
async function pixel(page: Page, viewport: Locator, x: number, y: number) {
  const png = (await viewport.screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(
    async ({ png, x, y }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3);
    },
    { png, x, y },
  );
}
async function accessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

for (const dir of ['ltr', 'rtl']) {
  for (const axis of ['vertical', 'horizontal']) {
    test(`thumb widens smoothly without changing layout in ${dir} ${axis}`, async ({
      page,
    }, info) => {
      const viewport = await open(page, `dir=${dir}&axis=${axis}&fade=off`);
      const bar = page.locator(`.ui-scrollbar[data-orientation="${axis}"]`),
        thumb = bar.locator('.ui-scrollbar-thumb');
      await expect(thumb).toBeVisible();
      await page.mouse.move(1, 1);
      const before = (await viewport.boundingBox())!,
        rail = (await bar.boundingBox())!;
      await expect.poll(() => paintWidth(thumb, axis)).toBeCloseTo(6, 0);
      const samplesPromise = thumb.evaluate(async (node, axis) => {
        const samples: number[] = [];
        for (let i = 0; i < 24; i++) {
          await new Promise(requestAnimationFrame);
          const css = getComputedStyle(node);
          samples.push(
            axis === 'vertical'
              ? parseFloat(css.maskSize)
              : Number(css.maskSize.match(/\)\s+([\d.]+)px/)?.[1]),
          );
        }
        return samples;
      }, axis);
      await bar.hover();
      const samples = await samplesPromise;
      expect(samples.some((value) => value > 6.2 && value < 11.8)).toBe(true);
      await expect.poll(() => paintWidth(thumb, axis)).toBeCloseTo(12, 0);
      expect(await viewport.boundingBox()).toEqual(before);
      expect(await bar.boundingBox()).toEqual(rail);
      await page.screenshot({ path: info.outputPath(`hover-${dir}-${axis}.png`) });
    });
  }
  test(`scroll-aware fades follow both axes and resize/content changes in ${dir}`, async ({
    page,
  }, info) => {
    const viewport = await open(page, `dir=${dir}`, dir === 'rtl' ? 320 : 1000);
    await expect(viewport).toHaveAttribute('data-fade-bottom');
    await expect(viewport).toHaveAttribute('data-fade-end');
    await expect(viewport).not.toHaveAttribute('data-fade-top');
    await expect(viewport).not.toHaveAttribute('data-fade-start');
    await viewport.evaluate((node, dir) => {
      node.scrollTop = 128;
      node.scrollLeft = dir === 'rtl' ? -128 : 128;
    }, dir);
    for (const edge of ['top', 'bottom', 'start', 'end'])
      await expect(viewport).toHaveAttribute(`data-fade-${edge}`);
    await viewport.evaluate((node, dir) => {
      node.scrollTop = node.scrollHeight;
      node.scrollLeft = dir === 'rtl' ? -node.scrollWidth : node.scrollWidth;
    }, dir);
    await expect(viewport).not.toHaveAttribute('data-fade-bottom');
    await expect(viewport).not.toHaveAttribute('data-fade-end');
    await page.getByRole('button', { name: 'Remove projects', exact: true }).click();
    await expect(viewport).not.toHaveAttribute('data-fade-top');
    await expect(viewport).not.toHaveAttribute('data-fade-bottom');
    await page.getByRole('button', { name: 'Resize content', exact: true }).click();
    await expect(viewport).not.toHaveAttribute('data-fade-start');
    await expect(viewport).not.toHaveAttribute('data-fade-end');
    await page.getByRole('button', { name: 'Add projects', exact: true }).click();
    await expect(viewport).toHaveAttribute('data-fade-bottom');
    await accessible(page);
    await page.screenshot({ path: info.outputPath(`fades-${dir}.png`) });
  });
}

test('fades use actual transparency, with adjustable intensity and logical edge selection', async ({
  page,
}, info) => {
  let viewport = await open(page, 'axis=vertical&fade=always&edges=top&intensity=1');
  const box = (await viewport.boundingBox())!,
    center = Math.floor(box.width / 2);
  const faded = await pixel(page, viewport, center, 1);
  const opaque = await pixel(page, viewport, center, 60);
  expect(faded[0] - opaque[0]).toBeGreaterThan(150);
  await expect(viewport).not.toHaveAttribute('data-fade-bottom');
  viewport = await open(page, 'axis=vertical&fade=always&edges=top&intensity=0.5');
  const half = await pixel(page, viewport, center, 1);
  expect(half[0]).toBeGreaterThan(opaque[0] + 50);
  expect(half[0]).toBeLessThan(faded[0] - 50);
  viewport = await open(page, 'axis=vertical&fade=always&edges=top&intensity=0');
  expect((await pixel(page, viewport, center, 1))[0]).toBeCloseTo(opaque[0], -1);
  viewport = await open(page, 'dir=rtl&axis=horizontal&fade=always&edges=start&theme=dark', 320);
  await expect(viewport).toHaveAttribute('data-fade-start');
  await expect(viewport).not.toHaveAttribute('data-fade-end');
  const rect = (await viewport.boundingBox())!;
  const left = await pixel(page, viewport, 16, 5),
    right = await pixel(page, viewport, Math.floor(rect.width) - 2, 5);
  expect(left[0] - right[0]).toBeGreaterThan(120);
  await page.screenshot({ path: info.outputPath('custom-fade-rtl.png') });
});

test('keyboard focus and forced colors keep content and focus rings fully visible', async ({
  page,
}) => {
  const viewport = await open(page, 'fade=always');
  await expect(viewport).not.toHaveCSS('mask-image', 'none');
  await viewport.focus();
  await expect(viewport).toHaveCSS('mask-image', 'none');
  await page.getByRole('button', { name: 'Project details', exact: true }).focus();
  await expect(viewport).toHaveCSS('mask-image', 'none');
  await page.getByRole('button', { name: 'Resize content', exact: true }).click();
  await expect(viewport).not.toHaveCSS('mask-image', 'none');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(viewport).toHaveCSS('mask-image', 'none');
  const thumb = page.locator('.ui-scrollbar[data-orientation="vertical"] .ui-scrollbar-thumb');
  const background = await viewport.evaluate(
    (node) => getComputedStyle(node.closest('.ui-scroll-root')!).backgroundColor,
  );
  await expect(thumb).not.toHaveCSS('background-color', background);
});

test('thumb opt-out, custom sizes and dragging preserve native scrolling', async ({ page }) => {
  let viewport = await open(page, 'axis=vertical&expand=off&size=8&hoverSize=18&fade=off');
  let bar = page.locator('.ui-scrollbar'),
    thumb = bar.locator('.ui-scrollbar-thumb');
  await expect.poll(() => paintWidth(thumb)).toBeCloseTo(8, 0);
  await bar.hover();
  await expect.poll(() => paintWidth(thumb)).toBeCloseTo(8, 0);
  viewport = await open(page, 'axis=vertical&size=8&hoverSize=18&fade=off');
  bar = page.locator('.ui-scrollbar');
  thumb = bar.locator('.ui-scrollbar-thumb');
  await bar.hover();
  await expect.poll(() => paintWidth(thumb)).toBeCloseTo(18, 0);
  const before = (await viewport.boundingBox())!,
    grip = (await thumb.boundingBox())!;
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 120, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
  expect(await viewport.boundingBox()).toEqual(before);
});

test('reduced motion disables thumb and edge transitions without hiding feedback', async ({
  page,
}) => {
  const viewport = await open(page, 'fade=always');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const bar = page.locator('.ui-scrollbar[data-orientation="vertical"]'),
    thumb = bar.locator('.ui-scrollbar-thumb');
  await bar.hover();
  await expect.poll(() => paintWidth(thumb)).toBeCloseTo(12, 0);
  expect(
    await thumb.evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
  ).toBeLessThanOrEqual(0.001);
  expect(
    await viewport.evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
  ).toBeLessThanOrEqual(0.001);
  await expect(viewport).not.toHaveCSS('mask-image', 'none');
});

test('the docs expose matching copyable fade and hover controls', async ({ page }) => {
  await page.goto('/components/scroll-area');
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await page.getByRole('switch', { name: 'fadeEdges', exact: true }).click();
  const viewport = page.locator('.component-preview .ui-scroll-viewport');
  await expect(viewport).toHaveAttribute('data-fade-bottom');
  await page.getByRole('spinbutton', { name: 'fadeIntensityPercent', exact: true }).fill('65');
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
  await expect(page.locator('.code-block').first()).toContainText('"intensity":0.65');
});
