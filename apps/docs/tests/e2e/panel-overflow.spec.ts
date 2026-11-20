import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, query: string) {
  await page.goto(`/tests/fixtures/panel-overflow.html?${query}`);
  const trigger = page.getByRole('button', { name: 'Open panel', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Overflow panel', exact: true });
  await expect(panel).toBeVisible();
  await panel.evaluate(async (node) => {
    await Promise.allSettled(node.getAnimations().map((animation) => animation.finished));
  });
  // Vaul also gates drag initiation briefly after opening, independently of CSS motion.
  await page.waitForTimeout(550);
  return { panel, trigger };
}
async function overdrag(page: Page, panel: Locator, side: string) {
  const handle = (await panel.locator('[data-vaul-handle]').boundingBox())!;
  const from = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  // Vaul authorizes a vertical gesture in the dismissal direction first.
  // Reverse that same gesture to reproduce elastic overdrag beyond the resting edge.
  await page.mouse.move(
    from.x + (side === 'left' ? -12 : side === 'right' ? 12 : 0),
    from.y + (side === 'top' ? -12 : side === 'bottom' ? 12 : 0),
    { steps: 3 },
  );
  const size = page.viewportSize()!;
  const distance = Math.min(
    180,
    side === 'bottom'
      ? from.y - 4
      : side === 'top'
        ? size.height - from.y - 4
        : side === 'right'
          ? from.x - 4
          : size.width - from.x - 4,
  );
  await page.mouse.move(
    from.x + (side === 'left' ? distance : side === 'right' ? -distance : 0),
    from.y + (side === 'top' ? distance : side === 'bottom' ? -distance : 0),
    { steps: 12 },
  );
  await expect
    .poll(async () => {
      const box = (await panel.boundingBox())!;
      const size = page.viewportSize()!;
      return side === 'bottom'
        ? size.height - box.y - box.height
        : side === 'top'
          ? box.y
          : side === 'right'
            ? size.width - box.x - box.width
            : box.x;
    })
    .toBeGreaterThan(8);
}
async function sameSurface(page: Page, panel: Locator, side: string) {
  const box = (await panel.boundingBox())!;
  const size = page.viewportSize()!;
  const inside = {
    x: side === 'right' ? box.x + box.width - 12 : box.x + 8,
    y:
      side === 'bottom'
        ? box.y + box.height - 12
        : side === 'top'
          ? box.y + 8
          : box.y + box.height / 2,
  };
  const gap = {
    x:
      side === 'right'
        ? (box.x + box.width + size.width) / 2
        : side === 'left'
          ? box.x / 2
          : inside.x,
    y:
      side === 'bottom'
        ? (box.y + box.height + size.height) / 2
        : side === 'top'
          ? box.y / 2
          : inside.y,
  };
  const sample = (point: { x: number; y: number }) =>
    page.screenshot({
      clip: { x: Math.floor(point.x), y: Math.floor(point.y), width: 4, height: 4 },
      animations: 'allow',
    });
  expect(
    (await sample(gap)).equals(await sample(inside)),
    'The exposed edge must paint exactly the panel background',
  ).toBe(true);
  const join = {
    x: side === 'right' ? box.x + box.width - 2 : side === 'left' ? box.x - 2 : inside.x,
    y: side === 'bottom' ? box.y + box.height - 2 : side === 'top' ? box.y - 2 : inside.y,
  };
  const joinDelta = await page.evaluate(
    async (images) => {
      const pixels = await Promise.all(
        images.map(async (source) => {
          const image = new Image();
          image.src = `data:image/png;base64,${source}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 4;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, 4, 4).data;
        }),
      );
      return Math.max(...pixels[0].map((value, index) => Math.abs(value - pixels[1][index])));
    },
    [(await sample(join)).toString('base64'), (await sample(inside)).toString('base64')],
  );
  // Fractional GPU compositing may round a channel by one; a visible border differs more.
  expect(joinDelta, 'The attachment border must not leave a visible seam').toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
for (const kind of ['sheet', 'drawer']) {
  for (const side of ['bottom', 'top', 'left', 'right']) {
    test(`${kind} ${side} overdrag retains a continuous background`, async ({ page }, info) => {
      await page.setViewportSize({ width: 1000, height: 800 });
      const { panel, trigger } = await open(
        page,
        `kind=${kind}&side=${side}&theme=${kind === 'sheet' ? 'dark' : 'light'}`,
      );
      await expect(panel).toHaveJSProperty(
        'scrollHeight',
        await panel.evaluate((node) => node.clientHeight),
      );
      await overdrag(page, panel, side);
      await sameSurface(page, panel, side);
      await page.screenshot({ path: info.outputPath(`${kind}-${side}-overdrag.png`) });
      await page.mouse.up();
      await expect
        .poll(() => panel.evaluate((node) => getComputedStyle(node).transform))
        .toBe('matrix(1, 0, 0, 1, 0, 0)');
      await panel.getByRole('button', { name: 'Focus panel', exact: true }).click();
      await expect(panel).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
      await expect(page.locator('.ui-panel-overflow-clip')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
}

for (const [kind, query] of [
  ['sheet', 'bounded&scoped&dir=rtl'],
  ['drawer', 'bounded&inline&reduced'],
] as const) {
  test(`${kind} keeps bounded custom surfaces and native scrolling`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const { panel } = await open(page, `kind=${kind}&side=bottom&${query}`);
    await overdrag(page, panel, 'bottom');
    await sameSurface(page, panel, 'bottom');
    await page.screenshot({ path: info.outputPath(`${kind}-custom.png`) });
    await page.mouse.up();
    await panel.getByRole('button', { name: 'Change theme', exact: true }).click();
    await overdrag(page, panel, 'bottom');
    await sameSurface(page, panel, 'bottom');
    await page.mouse.up();
  });
}
for (const variant of ['detached', 'floating']) {
  test(`${variant} panels retain intentional gaps and no extra scroll tail`, async ({ page }) => {
    const { panel } = await open(page, `variant=${variant}&bounded`);
    await expect(page.locator('.ui-panel-overflow-clip')).toHaveCount(0);
    expect(
      await panel.evaluate((node) => node.scrollHeight - node.clientHeight),
    ).toBeLessThanOrEqual(1);
    const box = (await panel.boundingBox())!;
    expect(page.viewportSize()!.height - box.y - box.height).toBeGreaterThanOrEqual(11);
    await panel.getByRole('button', { name: 'Last action', exact: true }).click();
    await expect(panel).toHaveCount(0);
  });
}
test('long panels preserve native scroll events, final actions and nested sliders', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { panel, trigger } = await open(page, 'kind=sheet&side=bottom&long&dir=rtl&theme=dark');
  const before = (await panel.boundingBox())!;
  const slider = panel.getByRole('slider', { name: 'Volume' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('status', { name: 'Volume value' })).not.toHaveText('40');
  expect(Math.abs((await panel.boundingBox())!.y - before.y)).toBeLessThan(1);
  await panel.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(panel.getByRole('status', { name: 'Native scroll' })).not.toHaveText('0');
  await expect(panel.getByRole('button', { name: 'Last action', exact: true })).toBeInViewport();
  const { violations } = await new AxeBuilder({ page })
    .include('[data-vaul-drawer]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  await page.screenshot({ path: info.outputPath('long-panel.png') });
  await panel.getByRole('button', { name: 'Last action', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('snap handles retain keyboard cycling and normal dismissal', async ({ page }) => {
  const { panel, trigger } = await open(page, 'snap&kind=drawer&side=bottom');
  const handle = panel.getByRole('button', { name: 'Resize panel' });
  expect((await panel.boundingBox())!.y).toBeGreaterThan(100);
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(panel.getByRole('status', { name: 'Snap value' })).toHaveText('1');
  await expect.poll(async () => Math.abs((await panel.boundingBox())!.y)).toBeLessThan(1);
  await page.keyboard.press('Space');
  // Cycling at the last dismissible snap point closes the panel.
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('.ui-panel-overflow-clip')).toHaveCount(0);
});

test('transform-only drag updates do not remeasure the background layer', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  const { panel } = await open(page, 'kind=sheet&side=right');
  await panel.evaluate((node) => {
    const original = window.getComputedStyle;
    const scope = window as typeof window & { __fillReads: number };
    scope.__fillReads = 0;
    window.getComputedStyle = (...args) => {
      if (args[0] === node && new Error().stack?.includes('/ui/panel-overflow.tsx'))
        scope.__fillReads++;
      return original.apply(window, args);
    };
  });
  const handle = (await panel.locator('[data-vaul-handle]').boundingBox())!;
  const x = handle.x + handle.width / 2,
    y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y, { steps: 3 });
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    (window as typeof window & { __fillReads: number }).__fillReads = 0;
  });
  await page.mouse.move(x - 160, y, { steps: 16 });
  const reads = await page.evaluate(
    () => (window as typeof window & { __fillReads: number }).__fillReads,
  );
  expect(reads).toBeLessThanOrEqual(1);
  await sameSurface(page, panel, 'right');
  await page.mouse.up();
});

test('touch overdrag also keeps the drawer surface connected', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { panel } = await open(page, 'kind=drawer&side=bottom&theme=dark');
  const handle = (await panel.locator('[data-vaul-handle]').boundingBox())!;
  const x = handle.x + handle.width / 2,
    y = handle.y + handle.height / 2;
  const session = await page.context().newCDPSession(page);
  const points = (atY: number) => [{ x, y: atY, id: 0, radiusX: 4, radiusY: 4, force: 1 }];
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(y) });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: points(y + 20),
    });
    for (let step = 1; step <= 12; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: points(y + 20 - (180 * step) / 12),
      });
      await page.waitForTimeout(20);
    }
    await sameSurface(page, panel, 'bottom');
    const box = (await panel.boundingBox())!;
    expect(844 - box.y - box.height).toBeGreaterThan(8);
    await page.screenshot({ path: info.outputPath('touch-overdrag.png') });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
});
