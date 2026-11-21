import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

for (const dir of ['ltr', 'rtl'])
  for (const axis of ['vertical', 'horizontal']) {
    test(`thumb has complete rounded caps and a stable drag target in ${dir} ${axis}`, async ({
      page,
    }, info) => {
      await page.goto(
        `/tests/fixtures/scroll-area.html?dir=${dir}&axis=${axis}&fade=off&motion=none&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
      );
      // A larger root font must not enlarge the gutter and clip the configured pixel widths.
      if (dir === 'rtl')
        await page.evaluate(() => (document.documentElement.style.fontSize = '20px'));
      const bar = page.locator('.ui-scrollbar'),
        thumb = bar.locator('.ui-scrollbar-thumb');
      await expect(thumb).toBeVisible();
      // A caller's background color still paints the full pill; use a distinct ink for pixel checks.
      await thumb.evaluate((node) => (node.style.backgroundColor = '#ff00ff'));
      await page.mouse.move(1, 1);
      const before = (await thumb.boundingBox())!,
        rail = (await bar.boundingBox())!;
      expect(
        await thumb.evaluate((node, axis) => {
          const b = node.getBoundingClientRect();
          const rtl = getComputedStyle(node).direction === 'rtl';
          const x = axis === 'vertical' ? (rtl ? b.right - 1 : b.left + 1) : b.left + b.width / 2;
          const y = axis === 'horizontal' ? b.top + 1 : b.top + b.height / 2;
          return document.elementFromPoint(x, y) === node;
        }, axis),
      ).toBe(true);
      for (const hover of [false, true]) {
        if (hover) await bar.hover();
        const png = PNG.sync.read(
          await thumb.screenshot({ path: info.outputPath(`${hover ? 'hover' : 'idle'}.png`) }),
        );
        const cross = axis === 'vertical' ? png.width : png.height;
        const length = axis === 'vertical' ? png.height : png.width;
        const painted = (c: number, l: number) => {
          const x = axis === 'vertical' ? c : l,
            y = axis === 'vertical' ? l : c,
            i = (y * png.width + x) * 4;
          return png.data[i] > 160 && png.data[i + 1] < 80 && png.data[i + 2] > 160;
        };
        const middle = Array.from({ length: cross }, (_, c) => c).filter((c) =>
          painted(c, Math.floor(length / 2)),
        );
        const width = hover ? 12 : 6;
        expect(middle).toHaveLength(width);
        // Fractional Radix lengths can leave a transparent raster column at an edge.
        const paintedLength = Array.from({ length }, (_, l) => l).filter((l) =>
          middle.some((c) => painted(c, l)),
        );
        for (const end of [paintedLength[0], paintedLength.at(-1)!]) {
          const cap = middle.filter((c) => painted(c, end));
          expect(cap.length).toBeGreaterThan(0);
          expect(cap.length).toBeLessThan(width);
          expect(painted(middle[0], end)).toBe(false);
          expect(painted(middle.at(-1)!, end)).toBe(false);
        }
        // The outside edge stays anchored while the pill grows toward the content.
        if (axis === 'vertical' && dir === 'rtl') expect(middle[0]).toBe(0);
        else expect(middle.at(-1)).toBe(cross - 1);
        expect(await thumb.boundingBox()).toEqual(before);
        expect(await bar.boundingBox()).toEqual(rail);
      }
    });
  }

test('forced colors keep a visible painted thumb', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/scroll-area.html?axis=vertical&fade=off');
  const thumb = page.locator('.ui-scrollbar-thumb');
  await expect(thumb).toBeVisible();
  const rgb = await thumb.evaluate((node) =>
    getComputedStyle(node).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number),
  );
  const png = PNG.sync.read(await thumb.screenshot());
  const y = Math.floor(png.height / 2);
  let painted = 0;
  for (let x = 0; x < png.width; x++)
    if (
      rgb.every(
        (color, channel) => Math.abs(png.data[(y * png.width + x) * 4 + channel] - color) < 20,
      )
    )
      painted++;
  expect(painted).toBeGreaterThanOrEqual(6);
});
