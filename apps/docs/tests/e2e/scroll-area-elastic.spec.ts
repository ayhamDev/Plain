import { test, expect, devices, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, query = '', width = 1000) {
  await page.setViewportSize({ width, height: 800 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/tests/fixtures/scroll-area.html?${query}&fade=off&elastic`);
  const viewport = page.getByRole('region', { name: 'Projects', exact: true });
  await expect(viewport).toBeVisible();
  return viewport;
}
function body(viewport: Locator) {
  return viewport.locator('.ui-scroll-content').first();
}
async function offset(viewport: Locator) {
  return body(viewport).evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
}
async function dimensions(viewport: Locator) {
  return viewport.evaluate((node) => ({
    width: node.clientWidth,
    height: node.clientHeight,
    scrollWidth: node.scrollWidth,
    scrollHeight: node.scrollHeight,
  }));
}
async function sample(viewport: Locator, frames = 48) {
  // Arm before dispatching input, so protocol/locator latency cannot miss the peak.
  await body(viewport).evaluate((node, frames) => {
    const ready = new Promise<void>((resolve) =>
      node
        .closest('[data-radix-scroll-area-viewport]')!
        .addEventListener('wheel', () => resolve(), { once: true, passive: true }),
    );
    (
      window as typeof window & { __elasticSample?: Promise<{ x: number; y: number }[]> }
    ).__elasticSample = ready.then(async () => {
      const values: { x: number; y: number }[] = [];
      for (let i = 0; i < frames; i++) {
        await new Promise(requestAnimationFrame);
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
        values.push({ x: matrix.m41, y: matrix.m42 });
      }
      return values;
    });
  }, frames);
  return () =>
    viewport.evaluate(
      () =>
        (window as typeof window & { __elasticSample: Promise<{ x: number; y: number }[]> })
          .__elasticSample,
    );
}
async function settled(viewport: Locator) {
  await expect
    .poll(async () => {
      const value = await offset(viewport);
      return Math.abs(value.x) + Math.abs(value.y);
    })
    .toBeLessThan(0.1);
  await expect(viewport).not.toHaveAttribute('data-elastic-active');
}

for (const dir of ['ltr', 'rtl']) {
  for (const edge of ['top', 'bottom', 'left', 'right']) {
    test(`wheel resistance returns smoothly at ${dir} ${edge} without changing native dimensions`, async ({
      page,
    }, info) => {
      const vertical = edge === 'top' || edge === 'bottom';
      const viewport = await open(
        page,
        `dir=${dir}&axis=${vertical ? 'vertical' : 'horizontal'}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
      );
      await expect(viewport).toHaveAttribute('data-elastic');
      await viewport.evaluate(
        (node, { dir, edge }) => {
          node.scrollTop = edge === 'bottom' ? node.scrollHeight : 0;
          if (edge === 'left' || edge === 'right')
            node.scrollLeft =
              dir === 'rtl'
                ? edge === 'left'
                  ? -node.scrollWidth
                  : 0
                : edge === 'right'
                  ? node.scrollWidth
                  : 0;
        },
        { dir, edge },
      );
      const before = await dimensions(viewport);
      const position = await viewport.evaluate((node) => [node.scrollLeft, node.scrollTop]);
      await viewport.hover();
      const samples = await sample(viewport);
      await page.mouse.wheel(
        vertical ? 0 : edge === 'left' ? -120 : 120,
        vertical ? (edge === 'top' ? -120 : 120) : 0,
      );
      await expect(viewport).toHaveAttribute('data-elastic-active');
      expect(await dimensions(viewport)).toEqual(before);
      await page.screenshot({ path: info.outputPath(`${dir}-${edge}.png`) });
      const values = await samples();
      const signed = values.map(
        (value) => (vertical ? value.y : value.x) * (edge === 'top' || edge === 'left' ? 1 : -1),
      );
      const peak = Math.max(...signed);
      expect(peak).toBeGreaterThan(5);
      expect(peak).toBeLessThanOrEqual(64);
      expect(signed.some((value) => value > 0.2 && value < peak * 0.75)).toBe(true);
      expect(values.every((value) => Math.abs(vertical ? value.x : value.y) < 0.1)).toBe(true);
      await settled(viewport);
      expect(await dimensions(viewport)).toEqual(before);
      expect(await viewport.evaluate((node) => [node.scrollLeft, node.scrollTop])).toEqual(
        position,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
}

test('small trackpad deltas and momentum tails remain bounded and settle, and reversal scrolls immediately', async ({
  page,
}) => {
  const viewport = await open(page, 'axis=vertical&refresh');
  await viewport.hover();
  const samples = await sample(viewport, 100);
  for (const dy of [-8, -8, -8, -7, -6, -5, -4, -3, -2, -1, -0.5, -0.2]) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(16);
  }
  const values = (await samples()).map((value) => value.y);
  expect(Math.max(...values)).toBeGreaterThan(2);
  expect(Math.max(...values)).toBeLessThanOrEqual(64);
  await settled(viewport);
  await page.mouse.wheel(0, -120);
  await expect(viewport).toHaveAttribute('data-elastic-active');
  await page.mouse.wheel(0, 100);
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await settled(viewport);
  await expect(page.getByRole('status', { name: 'Refresh calls' })).toHaveText('0');
});

test('middle-of-content wheel scrolling and keyboard scrolling remain native', async ({ page }) => {
  const viewport = await open(page, 'axis=vertical');
  await viewport.evaluate((node) => {
    node.scrollTop = 256;
  });
  await viewport.hover();
  const samples = await sample(viewport, 20);
  await page.mouse.wheel(0, 80);
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(256);
  expect((await samples()).every((value) => value.x === 0 && value.y === 0)).toBe(true);
  await viewport.focus();
  await page.keyboard.press('End');
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop))
    .toBeLessThan(2);
  await expect(viewport).not.toHaveAttribute('data-elastic-active');
  await page.keyboard.press('Home');
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeLessThan(2);
  await expect(viewport).toBeFocused();
});

test('line/page delta modes and Shift-wheel horizontal intent are supported', async ({ page }) => {
  const viewport = await open(page, 'axis=both&dir=rtl');
  for (const [mode, delta] of [
    [1, -3],
    [2, -1],
  ]) {
    await viewport.dispatchEvent('wheel', { deltaY: delta, deltaX: 0, deltaMode: mode });
    await expect.poll(async () => (await offset(viewport)).y).toBeGreaterThan(5);
    await settled(viewport);
  }
  await viewport.evaluate((node) => {
    node.scrollLeft = -node.scrollWidth;
  });
  await viewport.dispatchEvent('wheel', { deltaY: -80, deltaX: 0, shiftKey: true });
  await expect.poll(async () => (await offset(viewport)).x).toBeGreaterThan(5);
  expect(Math.abs((await offset(viewport)).y)).toBeLessThan(0.1);
  await settled(viewport);
});

test('canceled consumer events, zoom and short content do not bounce', async ({ page }) => {
  for (const query of ['cancel=root', 'cancel=viewport', '']) {
    const viewport = await open(page, `axis=vertical&${query}`);
    const samples = await sample(viewport, 12);
    await viewport.dispatchEvent('wheel', { deltaY: -120, ctrlKey: !query });
    expect((await samples()).every((value) => value.x === 0 && value.y === 0)).toBe(true);
  }
  const viewport = await open(page, 'axis=vertical');
  await page.getByRole('button', { name: 'Remove projects', exact: true }).click();
  const samples = await sample(viewport, 12);
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  expect((await samples()).every((value) => value.x === 0 && value.y === 0)).toBe(true);
});

test('nested ScrollAreas and native textarea scrolling own their wheel gestures', async ({
  page,
}) => {
  let viewport = await open(page, 'axis=vertical&nested');
  const inner = page.getByRole('region', { name: 'Nested projects', exact: true });
  const outerBox = (await viewport.boundingBox())!;
  await page.mouse.move(outerBox.x + outerBox.width - 24, outerBox.y + outerBox.height - 20);
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => (await offset(viewport)).y).toBeGreaterThan(5);
  expect(await offset(inner)).toEqual({ x: 0, y: 0 });
  await settled(viewport);
  await inner.hover();
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => (await offset(inner)).y).toBeGreaterThan(5);
  expect(await offset(viewport)).toEqual({ x: 0, y: 0 });
  await settled(inner);
  viewport = await open(page, 'axis=vertical&controls');
  const notes = page.getByRole('textbox', { name: 'Project notes' });
  await notes.hover();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => notes.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(await offset(viewport)).toEqual({ x: 0, y: 0 });
});

test('resizing, opt-out, focus and motion preferences reset active feedback', async ({ page }) => {
  let viewport = await open(page, 'axis=vertical');
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  await expect(viewport).toHaveAttribute('data-elastic-active');
  await page.setViewportSize({ width: 640, height: 800 });
  await expect(viewport).not.toHaveAttribute('data-elastic');
  await settled(viewport);
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(viewport).toHaveAttribute('data-elastic');
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  await expect(viewport).toHaveAttribute('data-elastic-active');
  await viewport.focus();
  await settled(viewport);
  await page.getByRole('button', { name: 'Resize content', exact: true }).focus();
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(viewport).not.toHaveAttribute('data-elastic');
  await settled(viewport);
  viewport = await open(page, 'axis=vertical&motion=none');
  await expect(viewport).not.toHaveAttribute('data-elastic');
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  await settled(viewport);
  viewport = await open(page, 'axis=vertical');
  await viewport.hover();
  await page.mouse.wheel(0, -120);
  await expect(viewport).toHaveAttribute('data-elastic-active');
  await page.getByRole('button', { name: 'Toggle elasticity', exact: true }).click();
  await expect(viewport).not.toHaveAttribute('data-elastic');
  await settled(viewport);
});

test('phones and coarse-pointer tablets keep native touch behavior with elasticity requested', async ({
  browser,
  baseURL,
}) => {
  for (const width of [320, 390, 1000]) {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width, height: 844 },
      baseURL,
    });
    try {
      const page = await context.newPage();
      const viewport = await open(page, 'axis=vertical', width);
      await expect(viewport).not.toHaveAttribute('data-elastic');
      await viewport.hover();
      await page.mouse.wheel(0, -120);
      const rect = (await viewport.boundingBox())!;
      const session = await context.newCDPSession(page);
      const points = (y: number) => [
        { x: rect.x + rect.width / 2, y, id: 0, radiusX: 4, radiusY: 4, force: 1 },
      ];
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: points(rect.y + 24),
      });
      for (let i = 1; i <= 8; i++)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: points(rect.y + 24 + i * 16),
        });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
      expect(await offset(viewport)).toEqual({ x: 0, y: 0 });
      expect((await body(viewport).getAttribute('style')) ?? '').not.toContain(
        '--ui-elastic-offset',
      );
    } finally {
      await context.close();
    }
  }
});

test('explicit mobile pull-to-refresh remains separate and keyboard accessible', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], baseURL });
  try {
    const page = await context.newPage();
    const viewport = await open(page, 'axis=vertical&refresh', 390);
    await expect(viewport).not.toHaveAttribute('data-elastic');
    const rect = (await viewport.boundingBox())!;
    const session = await context.newCDPSession(page);
    const points = (y: number) => [
      { x: rect.x + rect.width / 2, y, id: 0, radiusX: 4, radiusY: 4, force: 1 },
    ];
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      // Start below the floating refresh command, on the actual viewport content.
      touchPoints: points(rect.y + 64),
    });
    for (let step = 1; step <= 12; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: points(rect.y + 64 + step * 20),
      });
      await page.waitForTimeout(16);
    }
    await expect(
      page.getByRole('button', { name: 'Release to refresh', exact: true }),
    ).toBeVisible();
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
    const calls = page.getByRole('status', { name: 'Refresh calls' });
    await expect(calls).toHaveText('1');
    const command = page.getByRole('button', { name: 'Pull to refresh', exact: true });
    await command.focus();
    await page.keyboard.press('Enter');
    await expect(calls).toHaveText('2');
  } finally {
    await context.close();
  }
});

test('docs expose the opt-in and elastic focus states remain accessible', async ({ page }) => {
  await page.goto('/components/scroll-area');
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await page.getByRole('switch', { name: 'elastic', exact: true }).click();
  const viewport = page.locator('.component-preview .ui-scroll-viewport');
  await expect(viewport).toHaveAttribute('data-elastic');
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
  await expect(page.locator('.code-block').first()).toContainText('elastic={true}');
  const fixture = await open(page, 'axis=vertical&dir=rtl&theme=dark&fade=always');
  await fixture.focus();
  const { violations } = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((value) => value.id)).toEqual([]);
});
