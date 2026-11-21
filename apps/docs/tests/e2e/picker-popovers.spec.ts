import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function contained(page: Page, panel: Locator) {
  await expect(panel).toBeVisible();
  await panel.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  const viewport = page.viewportSize()!;
  const edge = (await panel.getAttribute('data-side')) === 'bottom' ? 0 : 7;
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return (
        !!box &&
        box.x >= edge &&
        box.y >= edge &&
        box.x + box.width <= viewport.width - edge &&
        box.y + box.height <= viewport.height - edge
      );
    })
    .toBe(true);
  expect(await panel.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
}
async function inlineTimes(panel: Locator, count: number) {
  const controls = panel.locator(
    '.ui-time-choice [role="combobox"], .ui-time-choice [role="spinbutton"]',
  );
  await expect(controls).toHaveCount(count);
  const boxes = await controls.evaluateAll((nodes) =>
    nodes.map((node) => ({
      y: node.getBoundingClientRect().y,
      width: node.getBoundingClientRect().width,
    })),
  );
  for (const box of boxes) {
    expect(Math.abs(box.y - boxes[0].y)).toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
}
async function setMinute(page: Page, panel: Locator) {
  const wheel = panel.getByRole('spinbutton', { name: 'Minute', exact: true });
  if (await wheel.count()) {
    await wheel.press('Home');
    for (let index = 0; index < 30; index++) await wheel.press('ArrowUp');
    return;
  }
  await panel.getByRole('combobox', { name: 'Minute', exact: true }).click();
  await contained(page, page.getByRole('listbox'));
  await page.getByRole('option', { name: '30', exact: true }).click();
}
for (const [width, dir, corner, extra] of [
  [1000, 'ltr', 'bottom-end', ''],
  [320, 'ltr', 'top-start', '&twelve&seconds'],
  [390, 'rtl', 'bottom-start', '&twelve'],
  [320, 'rtl', 'top-end', ''],
] as const) {
  test(`time choices stay inline and contained at ${width}px ${dir} ${corner}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 480 });
    await page.goto(`/tests/fixtures/picker-popovers.html?dir=${dir}&corner=${corner}${extra}`);
    await page.getByRole('button', { name: 'Choose time', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    await contained(page, panel);
    await inlineTimes(panel, extra.includes('seconds') ? 4 : extra.includes('twelve') ? 3 : 2);
    await setMinute(page, panel);
    await expect(page.locator('input[type="time"]')).toHaveValue(
      extra.includes('seconds') ? '09:30:30' : '09:30',
    );
    const { violations } = await new AxeBuilder({ page })
      .include('.ui-temporal-content, .ui-temporal-sheet')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
    await panel.screenshot({ path: info.outputPath(`time-${width}-${dir}-${corner}.png`) });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('input[type="time"]')).toBeFocused();
  });
}
for (const [corner, side] of [
  ['top-start', 'left'],
  ['top-end', 'right'],
  ['bottom-start', 'bottom'],
  ['bottom-end', 'top'],
] as const) {
  test(`oversized popovers scroll inside the viewport from ${corner} with ${side} placement`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 360 });
    await page.goto(
      `/tests/fixtures/picker-popovers.html?view=popover&corner=${corner}&side=${side}`,
    );
    const trigger = page.getByRole('button', { name: 'Options', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Long options', exact: true });
    await contained(page, panel);
    expect(await panel.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    if (corner === 'bottom-end') {
      await page.setViewportSize({ width: 320, height: 280 });
      await contained(page, panel);
    }
    await panel.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await panel.getByRole('button', { name: 'Last action', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
test('custom collision boundaries constrain popovers on both axes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto('/tests/fixtures/picker-popovers.html?view=popover&bounded');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Long options', exact: true });
  await contained(page, panel);
  const area = (await page.getByTestId('boundary').boundingBox())!;
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(area.x + 7);
  expect(box.y).toBeGreaterThanOrEqual(area.y + 7);
  expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width - 7);
  expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height - 7);
});
for (const width of [1000, 390]) {
  test(`built picker previews and nested event calendars fit a short ${width}px viewport`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 600 });
    await page.addInitScript((mobile) => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode: mobile ? 'dark' : 'light', motion: 'none' }),
      );
      localStorage.setItem('plainui-direction', mobile ? 'rtl' : 'ltr');
      localStorage.removeItem('plainui-token-overrides');
    }, width < 640);
    await page.goto('/components/time-range-picker');
    const preview = page.locator('.component-preview');
    await preview.getByRole('button', { name: 'Choose time', exact: true }).first().click();
    let panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    await contained(page, panel);
    await inlineTimes(panel, 2);
    await panel.screenshot({ path: info.outputPath(`built-time-${width}.png`) });
    await page.keyboard.press('Escape');
    await page.goto('/components/full-calendar');
    await preview.getByRole('button', { name: 'New event', exact: true }).first().click();
    const editor = page.getByRole('dialog', {
      name: 'New event',
      exact: true,
      includeHidden: true,
    });
    await editor.getByRole('button', { name: 'Open calendar', exact: true }).first().click();
    panel = page.getByRole('dialog', {
      name: width < 768 ? 'Pick a date' : 'Open calendar',
      exact: true,
    });
    await contained(page, panel);
    if (width < 768) {
      await expect(panel.locator('.rdp-month_caption')).toBeInViewport();
      await panel.getByRole('button', { name: 'Next', exact: true }).click();
      panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    }
    await inlineTimes(panel, 2);
    const scrollBody = panel.locator('.ui-picker-body');
    const scroller = (await scrollBody.count()) ? scrollBody : panel;
    await scroller.evaluate((node) => {
      node.scrollTop = 0;
    });
    if (width >= 768) await expect(panel.locator('.rdp-month_caption')).toBeInViewport();
    const hourWheel = panel.getByRole('spinbutton', { name: 'Hour', exact: true });
    if (await hourWheel.count()) {
      await hourWheel.press('Home');
      for (let index = 0; index < 11; index++) await hourWheel.press('ArrowUp');
    } else {
      await panel.getByRole('combobox', { name: 'Hour', exact: true }).click();
      await page.getByRole('option', { name: '11', exact: true }).click();
    }
    if (width >= 768)
      await expect(editor.locator('input[type="datetime-local"]').first()).toHaveValue(/T11:/);
    await scroller.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
    await panel.screenshot({ path: info.outputPath(`built-event-picker-${width}.png`) });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(editor.locator('input[type="datetime-local"]').first()).toHaveValue(/T11:/);
    await expect(panel).toHaveCount(0);
    await expect(editor).toBeVisible();
    await expect(editor.locator('input[type="datetime-local"]').first()).toBeFocused();
  });
}
