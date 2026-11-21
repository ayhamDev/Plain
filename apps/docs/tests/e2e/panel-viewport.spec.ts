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
  return { panel, trigger };
}

async function coversViewport(page: Page, panel: Locator) {
  await expect
    .poll(() =>
      panel.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return Math.max(
          Math.abs(box.x),
          Math.abs(box.y),
          Math.abs(box.right - innerWidth),
          Math.abs(box.bottom - innerHeight),
        );
      }),
    )
    .toBeLessThan(1);
  await expect(panel).toHaveAttribute('data-viewport-covered', 'true');
  const radii = await panel.evaluate((node) => {
    const style = getComputedStyle(node);
    return [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomLeftRadius,
      style.borderBottomRightRadius,
    ].map(parseFloat);
  });
  expect(Math.max(...radii)).toBeLessThan(0.1);
  expect(
    await panel.evaluate((node) =>
      [
        [1, 1],
        [innerWidth - 2, 1],
        [1, innerHeight - 2],
        [innerWidth - 2, innerHeight - 2],
      ].every(([x, y]) => node.contains(document.elementFromPoint(x, y))),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

for (const kind of ['sheet', 'drawer']) {
  for (const side of ['bottom', 'top', 'left', 'right']) {
    test(`${kind} full ${side} covers the entire viewport despite gaps and width limits`, async ({
      page,
    }, info) => {
      await page.setViewportSize(
        kind === 'sheet' ? { width: 1000, height: 800 } : { width: 320, height: 700 },
      );
      const { panel, trigger } = await open(
        page,
        `kind=${kind}&side=${side}&full&variant=${kind === 'sheet' ? 'floating' : 'detached'}&bounded&content-bounded&wide-gap&rounded&long&theme=${kind === 'sheet' ? 'light' : 'dark'}&dir=rtl`,
      );
      await coversViewport(page, panel);
      await page.screenshot({ path: info.outputPath('full.png') });
      await panel.getByRole('textbox', { name: 'Project name' }).fill('Viewport project');
      await panel.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(
        panel.getByRole('button', { name: 'Last action', exact: true }),
      ).toBeInViewport();
      await panel.getByRole('button', { name: 'Last action', exact: true }).click();
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
}

for (const side of ['bottom', 'top', 'left', 'right']) {
  test(`full ${side} snap progressively flattens corners and restores detached spacing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    const { panel } = await open(
      page,
      `kind=sheet&side=${side}&snap&variant=detached&bounded&rounded&wide-gap`,
    );
    const radius = () =>
      panel.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius));
    expect(await radius()).toBe(32);
    if (side === 'bottom' || side === 'top') expect((await panel.boundingBox())!.width).toBe(320);
    await panel.evaluate((node) => {
      const samples: number[] = [];
      (window as typeof window & { __cornerSamples: number[] }).__cornerSamples = samples;
      const started = performance.now();
      const sample = () => {
        samples.push(parseFloat(getComputedStyle(node).borderTopLeftRadius));
        if (performance.now() - started < 800) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // A top/left partial snap clips the beginning of its content. Exercise the
    // fixture's controlled-state setter without scrolling the panel to that button.
    await panel
      .getByRole('button', { name: 'Expand fully', exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await coversViewport(page, panel);
    const samples = await page.evaluate(
      () => (window as typeof window & { __cornerSamples: number[] }).__cornerSamples,
    );
    expect(
      samples.some((value) => value > 0.1 && value < 31.9),
      'Corners must interpolate during the real Vaul snap',
    ).toBe(true);
    await page.screenshot({ path: info.outputPath('full-snap.png') });
    await panel.getByRole('button', { name: 'Half height', exact: true }).click();
    await expect.poll(radius).toBe(32);
    if (side === 'bottom' || side === 'top')
      await expect.poll(async () => (await panel.boundingBox())!.width).toBe(320);
    const box = (await panel.boundingBox())!;
    expect(
      side === 'bottom' || side === 'top'
        ? Math.min(box.x, 1000 - box.x - box.width)
        : Math.min(box.y, 800 - box.y - box.height),
    ).toBeGreaterThanOrEqual(39);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });
}

test('full panels follow viewport resizing, reduced motion, scoped corners and accessible controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { panel } = await open(page, 'full&kind=drawer&side=bottom&rounded&scoped&reduced&dir=rtl');
  await coversViewport(page, panel);
  await page.setViewportSize({ width: 844, height: 390 });
  await coversViewport(page, panel);
  const { violations } = await new AxeBuilder({ page })
    .include('[data-vaul-drawer]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});

test('long attached mobile sheets use full height without clipping final actions', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const { panel } = await open(page, 'kind=sheet&side=bottom&rounded&long');
  await coversViewport(page, panel);
  await panel.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(panel.getByRole('button', { name: 'Last action', exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('natural-full-height.png') });
});

test('short landscape mobile date pickers fill the viewport and retain pending date steps', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 568, height: 360 });
  await page.goto('/tests/fixtures/calendar-toasts.html?view=date-time-picker');
  const field = page.locator('input[type="datetime-local"]');
  await field.click();
  const panel = page.getByRole('dialog');
  await expect(panel).toHaveClass(/ui-picker-sheet/);
  await coversViewport(page, panel);
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await panel.getByRole('spinbutton', { name: 'Hour', exact: true }).press('ArrowUp');
  await expect(field).toHaveValue('2026-10-05T09:15');
  await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('landscape-picker.png') });
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(field).toHaveValue('2026-10-05T10:15');
  await expect(field).toBeFocused();
});

for (const touch of [false, true]) {
  test(`full snaps follow ${touch ? 'touch' : 'mouse'} dragging before release`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { panel } = await open(page, 'kind=drawer&side=bottom&snap&variant=floating&rounded');
    await panel.getByRole('button', { name: 'Expand fully', exact: true }).click();
    await coversViewport(page, panel);
    await page.waitForTimeout(550);
    const handle = (await panel.locator('[data-vaul-handle]').boundingBox())!;
    const x = handle.x + handle.width / 2,
      y = handle.y + handle.height / 2;
    const session = touch ? await page.context().newCDPSession(page) : undefined;
    try {
      // Leave no mouse hover behind when switching to touchscreen input. Vaul
      // treats a mouse pointerout during its drag as a release of that drag.
      if (session) await page.mouse.move(-20, -20);
      if (session)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y }],
        });
      else {
        await page.mouse.move(x, y);
        await page.mouse.down();
      }
      for (let step = 1; step <= 8; step++) {
        if (session)
          await session.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y: y + 4 * step }],
          });
        else await page.mouse.move(x, y + 4 * step);
        if (session) await page.waitForTimeout(20);
      }
      await expect
        .poll(() =>
          panel.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius)),
        )
        .toBeGreaterThan(1);
      expect(
        await panel.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius)),
      ).toBeLessThan(31);
      if (session)
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
      await panel
        .getByRole('button', { name: 'Expand fully', exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
      await coversViewport(page, panel);
    } finally {
      await session?.detach();
    }
  });
}

test('full size stays inside a custom container', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  const { panel } = await open(
    page,
    'full&container&kind=sheet&side=bottom&variant=detached&rounded&bounded',
  );
  const container = (await page.getByTestId('panel-container').boundingBox())!;
  const box = (await panel.boundingBox())!;
  for (const dimension of ['x', 'y', 'width', 'height'] as const)
    expect(Math.abs(box[dimension] - container[dimension])).toBeLessThan(1);
  expect(await panel.evaluate((node) => getComputedStyle(node).borderTopLeftRadius)).toBe('0px');
  await expect(panel).toHaveAttribute('data-vaul-custom-container', 'true');
  await expect(panel).not.toHaveAttribute('data-viewport-covered', 'true');
});

for (const kind of ['sheet', 'drawer']) {
  test(`full detached ${kind} keeps the background continuous during overdrag`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { panel } = await open(
      page,
      `kind=${kind}&side=bottom&full&variant=detached&rounded&theme=dark`,
    );
    await coversViewport(page, panel);
    await page.waitForTimeout(550);
    await page.mouse.move(8, 422);
    await page.mouse.down();
    await page.mouse.move(8, 434, { steps: 3 });
    await page.mouse.move(8, 240, { steps: 12 });
    await expect
      .poll(async () => 844 - (await panel.boundingBox())!.y - (await panel.boundingBox())!.height)
      .toBeGreaterThan(8);
    const bounds = (await panel.boundingBox())!;
    const sample = (y: number) =>
      page.screenshot({
        clip: { x: 150, y: Math.floor(y), width: 4, height: 4 },
        animations: 'allow',
      });
    expect((await sample(bounds.y + bounds.height - 12)).equals(await sample(839))).toBe(true);
    await page.mouse.up();
    await coversViewport(page, panel);
  });
}
