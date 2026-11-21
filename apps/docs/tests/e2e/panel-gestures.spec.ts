import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, query = '') {
  await page.goto(`/tests/fixtures/panel-gestures.html?${query}`);
  const trigger = page.getByRole('button', { name: 'Open panel', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Project settings', exact: true });
  await expect(panel).toBeVisible();
  await panel.evaluate(
    async (node) =>
      await Promise.allSettled(node.getAnimations().map((animation) => animation.finished)),
  );
  await page.waitForTimeout(550);
  return { panel, trigger };
}
async function swipe(
  page: Page,
  target: Locator,
  dx: number,
  dy: number,
  touch = false,
  held?: () => Promise<void>,
) {
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  if (touch) {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      for (let i = 1; i <= 12; i++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x + (dx * i) / 12, y: y + (dy * i) / 12 }],
        });
        await page.waitForTimeout(16);
      }
      await held?.();
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await session.detach();
    }
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 12 });
    await held?.();
    await page.mouse.up();
  }
}
function movement(before: { x: number; y: number }, after: { x: number; y: number }) {
  return Math.hypot(after.x - before.x, after.y - before.y);
}
for (const kind of ['sheet', 'drawer'])
  for (const side of ['bottom', 'top', 'left', 'right'])
    for (const touch of [false, true]) {
      test(`${kind} ${side} drags from its body with ${touch ? 'touch' : 'mouse'}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1000, height: 1000 });
        const { panel, trigger } = await open(page, `kind=${kind}&side=${side}`);
        const surface = panel.getByTestId('surface'),
          box = (await surface.boundingBox())!;
        const before = (await panel.boundingBox())!;
        const dx =
          side === 'left'
            ? 4 - (box.x + box.width / 2)
            : side === 'right'
              ? 996 - (box.x + box.width / 2)
              : 0;
        const dy =
          side === 'top'
            ? 4 - (box.y + box.height / 2)
            : side === 'bottom'
              ? 996 - (box.y + box.height / 2)
              : 0;
        await swipe(page, surface, dx, dy, touch, async () =>
          expect(movement(before, (await panel.boundingBox())!)).toBeGreaterThan(20),
        );
        await expect(panel).toHaveCount(0);
        await expect(trigger).toBeFocused();
      });
    }
for (const touch of [false, true]) {
  test(`sliders and custom regions retain their ${touch ? 'touch' : 'mouse'} gestures`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { panel } = await open(page, 'detached');
    const before = (await panel.boundingBox())!;
    const slider = panel.getByRole('slider', { name: 'Volume', exact: true });
    const prior = await slider.getAttribute('aria-valuenow');
    await swipe(page, slider, 70, 65, touch, async () =>
      expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1),
    );
    await expect(slider).not.toHaveAttribute('aria-valuenow', prior!);
    // Track presses must not give pointer capture back to the sheet either.
    const track = panel.locator('[data-ui="slider"][data-slot="track"]');
    await swipe(page, track, -45, 55, touch, async () =>
      expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1),
    );
    await swipe(page, panel.getByTestId('custom'), 0, 80, touch, async () =>
      expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1),
    );
    const input = panel.getByRole('textbox', { name: 'Project name' });
    await input.fill('Updated workspace');
    await expect(input).toHaveValue('Updated workspace');
    await panel.getByRole('button', { name: 'Custom action' }).click();
    await expect(panel.getByRole('status', { name: 'Action count' })).toHaveText('1');
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
  });
}
test('mouse text selection is retained in a horizontal sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  const { panel } = await open(page, 'side=right');
  const before = (await panel.boundingBox())!;
  const prose = panel.getByTestId('prose');
  const box = await prose.evaluate((node) => {
    const range = document.createRange();
    range.setStart(node.firstChild!, 0);
    range.setEnd(node.firstChild!, 12);
    const b = range.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection()?.toString().length)).toBeGreaterThan(3);
  expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1);
});
test('vertical sliders and textareas retain native touch gestures', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  const { panel } = await open(page, 'form');
  const vertical = panel.getByRole('slider', { name: 'Value', exact: true });
  await vertical.scrollIntoViewIfNeeded();
  const before = (await panel.boundingBox())!;
  await swipe(page, vertical, 0, -45, true, async () =>
    expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1),
  );
  await expect(vertical).not.toHaveAttribute('aria-valuenow', '30');
  const textarea = panel.getByRole('textbox', { name: 'Description' });
  await textarea.scrollIntoViewIfNeeded();
  await swipe(page, textarea, 0, -35, true);
  await expect.poll(() => textarea.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1);
});
for (const touch of [false, true])
  test(`handleOnly retains explicit handle ${touch ? 'touch' : 'mouse'} dragging`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 1100 });
    const { panel } = await open(page, 'handleOnly');
    const before = (await panel.boundingBox())!;
    await swipe(page, panel.locator('[data-vaul-handle]'), 0, 230, touch, async () =>
      expect(movement(before, (await panel.boundingBox())!)).toBeGreaterThan(80),
    );
    await expect(panel).toHaveCount(0);
  });
for (const side of ['bottom', 'top'])
  test(`native touch and wheel scrolling stay inside the ${side} panel`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { panel } = await open(page, `long&side=${side}`);
    const before = (await panel.boundingBox())!;
    await swipe(page, panel.getByTestId('prose'), 0, -150, true);
    await expect.poll(() => panel.evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
    expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1);
    await page.waitForTimeout(250);
    await page.mouse.move(before.x + 8, before.y + before.height / 2);
    await page.mouse.wheel(0, 180);
    await expect.poll(() => panel.evaluate((node) => node.scrollTop)).toBeGreaterThan(180);
    expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1);
  });
test('nested touch scrollers keep both axes without moving the sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const { panel } = await open(page, 'nested');
  const before = (await panel.boundingBox())!;
  const nested = panel.getByTestId('nested');
  await swipe(page, nested, 0, -60, true);
  await expect.poll(() => nested.evaluate((node) => node.scrollTop)).toBeGreaterThan(10);
  await swipe(page, nested, -90, 0, true);
  await expect.poll(() => nested.evaluate((node) => node.scrollLeft)).toBeGreaterThan(10);
  expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1);
});
for (const query of ['handleOnly', 'prevent', 'locked']) {
  test(`${query} retains an explicit restriction on body dragging`, async ({ page }) => {
    const { panel } = await open(page, query);
    const before = (await panel.boundingBox())!;
    await swipe(page, panel.getByTestId('surface'), 0, 70, false, async () =>
      expect(movement(before, (await panel.boundingBox())!)).toBeLessThan(1),
    );
    await expect(panel).toBeVisible();
  });
}
test('heading swipes, native refs, Escape and focus work with reduced motion in RTL', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 850 });
  const { panel, trigger } = await open(page, 'dark&dir=rtl&detached');
  const before = (await panel.boundingBox())!;
  await swipe(
    page,
    panel.getByRole('heading', { name: 'Project settings' }),
    0,
    25,
    false,
    async () => expect(movement(before, (await panel.boundingBox())!)).toBeGreaterThan(8),
  );
  if ((await panel.count()) === 0) {
    await trigger.click();
    await expect(panel).toBeVisible();
  }
  const { violations } = await new AxeBuilder({ page })
    .include('[data-vaul-drawer]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath('mobile-sheet.png') });
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
