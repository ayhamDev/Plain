import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The runner otherwise hides native scrollbars, masking real drag/paint regressions.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

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
  await expect(details).toHaveCSS('outline-style', 'solid');
  await expect(details).toHaveCSS('outline-width', '2px');
});

for (const animated of [true, false]) {
  test(`mouse selection paints only a thin underline with animation ${animated ? 'on' : 'off'}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(`/tests/fixtures/section-tabs.html?animated=${animated ? 'on' : 'off'}`);
    const list = page.getByRole('tablist', { name: 'Record sections' });
    const tab = list.getByRole('tab', { name: 'UOM', exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(tab).toHaveCSS('outline-style', 'none');
    if (animated) {
      const indicator = list.locator('.ui-selection-indicator');
      await expect(indicator).toHaveCSS('height', '1px');
      await expect(indicator).toHaveCSS('box-shadow', 'none');
    } else {
      const height = await tab.evaluate((node) => getComputedStyle(node, '::after').height);
      expect(height).toBe('1px');
      await expect(tab).toHaveCSS('box-shadow', 'none');
    }
    const png = (await list.screenshot({ animations: 'disabled' })).toString('base64');
    const range = await page.evaluate(async (png) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = context.getImageData(1, 2, canvas.width - 2, 4).data;
      const min = [255, 255, 255],
        max = [0, 0, 0];
      for (let i = 0; i < pixels.length; i += 4)
        for (let channel = 0; channel < 3; channel++) {
          min[channel] = Math.min(min[channel], pixels[i + channel]);
          max[channel] = Math.max(max[channel], pixels[i + channel]);
        }
      return Math.max(...max.map((value, index) => value - min[index]));
    }, png);
    expect(
      range,
      'Space above the tab labels must stay clear of vertical side strokes',
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`clean-underline-${animated}.png`) });
  });
}

for (const dir of ['ltr', 'rtl']) {
  test(`overflowing tabs have a visible draggable scrollbar in ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(
      `/tests/fixtures/section-tabs.html?dir=${dir}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
    );
    const list = page.getByRole('tablist', { name: 'Record sections' });
    const bar = await list.evaluate((node) => {
      const css = getComputedStyle(node),
        rect = node.getBoundingClientRect();
      const size =
        rect.height -
        node.clientHeight -
        parseFloat(css.borderTopWidth) -
        parseFloat(css.borderBottomWidth);
      const thumb = (node.clientWidth * node.clientWidth) / node.scrollWidth;
      return {
        size,
        thumb,
        x: rect.x + node.clientLeft,
        y: rect.y + parseFloat(css.borderTopWidth) + node.clientHeight + size / 2,
        width: node.clientWidth,
      };
    });
    expect(bar.size).toBe(12);
    const x = bar.x + (dir === 'rtl' ? bar.width - bar.thumb / 2 : bar.thumb / 2);
    await page.mouse.move(x, bar.y);
    await page.mouse.down();
    await page.mouse.move(x + (dir === 'rtl' ? -100 : 100), bar.y, { steps: 12 });
    await page.mouse.up();
    await expect.poll(() => list.evaluate((node) => Math.abs(node.scrollLeft))).toBeGreaterThan(80);
    await expect(list.getByRole('tab', { name: 'Details', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.mouse.move(1, 1);
    const contrast = await list.evaluate((node) => {
      const rgb = (value: string) =>
        value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
      const luminance = (color: number[]) =>
        color
          .map((value) => {
            const s = value / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const thumb = luminance(
        rgb(getComputedStyle(node, '::-webkit-scrollbar-thumb').backgroundColor),
      );
      const track = luminance(
        rgb(getComputedStyle(node, '::-webkit-scrollbar-track').backgroundColor),
      );
      return (Math.max(thumb, track) + 0.05) / (Math.min(thumb, track) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(3);
    await list.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await list.hover();
    await page.mouse.wheel(dir === 'rtl' ? -100 : 100, 0);
    await expect.poll(() => list.evaluate((node) => Math.abs(node.scrollLeft))).toBeGreaterThan(20);
    await list.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, dir === 'rtl' ? -100 : 100);
    await page.keyboard.up('Shift');
    await expect.poll(() => list.evaluate((node) => Math.abs(node.scrollLeft))).toBeGreaterThan(20);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`visible-scrollbar-${dir}.png`) });
  });
}

test('scrollbar token overrides and forced colors retain visible feedback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/tests/fixtures/section-tabs.html?barSize=20&motion=none');
  const list = page.getByRole('tablist');
  const size = await list.evaluate(
    (node) =>
      node.getBoundingClientRect().height -
      node.clientHeight -
      parseFloat(getComputedStyle(node).borderBottomWidth),
  );
  expect(size).toBe(20);
  expect(
    await list.evaluate(
      (node) => getComputedStyle(node, '::-webkit-scrollbar-thumb').backgroundColor,
    ),
  ).toBe('rgb(49, 94, 158)');
  await page.emulateMedia({ forcedColors: 'active' });
  const indicator = list.locator('.ui-selection-indicator');
  await expect(indicator).toHaveCSS('height', '1px');
  await expect(indicator).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await list.getByRole('tab', { name: 'Details', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(list.getByRole('tab', { name: 'Accounting', exact: true })).toHaveCSS(
    'outline-style',
    'solid',
  );
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
