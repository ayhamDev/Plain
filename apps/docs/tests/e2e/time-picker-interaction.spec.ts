import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ hasTouch: true });
const minute = (panel: Locator) => panel.getByRole('spinbutton', { name: 'Minute', exact: true });
async function settled(wheel: Locator) {
  await expect
    .poll(() =>
      wheel.locator('[data-slot="wheel-viewport"]').evaluate((node) => {
        const row = node.firstElementChild!.getBoundingClientRect().height;
        const selected = [...node.children].findIndex((item) => item.hasAttribute('data-selected'));
        return Math.abs(node.scrollTop - selected * row);
      }),
    )
    .toBeLessThan(1);
}

for (const width of [1100, 390]) {
  test(`mouse wheel and trackpad deltas remain stable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/tests/fixtures/picker-popovers.html?mode=wheel&value=09%3A10');
    const input = page.getByLabel('Start time', { exact: true });
    await input.click();
    const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    const column = minute(panel);
    await settled(column);
    await column.hover();
    for (let index = 0; index < 24; index++) await page.mouse.wheel(0, 2);
    await expect(input).toHaveValue('09:10');
    await expect(input).toHaveValue('09:11');
    await settled(column);
    await expect(page.getByTestId('time-changes')).toHaveText('["09:11"]');
    await page.mouse.wheel(0, 120);
    await expect(input).toHaveValue('09:12');
    await settled(column);
    await page.mouse.wheel(0, -120);
    await expect(input).toHaveValue('09:11');
    await settled(column);
    await column
      .locator('[data-slot="wheel-viewport"]')
      .dispatchEvent('wheel', { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true });
    await expect(input).toHaveValue('09:12');
    await settled(column);
    const position = await column
      .locator('[data-slot="wheel-viewport"]')
      .evaluate((node) => node.scrollTop);
    await page.waitForTimeout(450);
    expect(
      await column.locator('[data-slot="wheel-viewport"]').evaluate((node) => node.scrollTop),
    ).toBe(position);
    await expect(page.getByTestId('time-changes')).toHaveText('["09:11","09:12","09:11","09:12"]');
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(input).toBeFocused();
  });
}

test('a held native touch gesture never snaps back, scrolls the sheet or fires a release click', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/tests/fixtures/picker-popovers.html?value=09%3A10&theme=dark&motion=system');
  const input = page.getByLabel('Start time', { exact: true });
  await input.tap();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await expect(panel).toBeVisible();
  await panel.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  const column = minute(panel);
  await settled(column);
  const box = (await column.boundingBox())!;
  const originalSheet = (await panel.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2 + 64;
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let index = 1; index <= 12; index++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - index * 7 }],
    });
    await page.waitForTimeout(20);
  }
  const held = await column
    .locator('[data-slot="wheel-viewport"]')
    .evaluate((node) => node.scrollTop);
  await page.waitForTimeout(350);
  expect(
    Math.abs(
      (await column.locator('[data-slot="wheel-viewport"]').evaluate((node) => node.scrollTop)) -
        held,
    ),
  ).toBeLessThan(1);
  await expect(input).toHaveValue('09:10');
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
  await expect
    .poll(async () => Number(await column.getAttribute('aria-valuenow')))
    .toBeGreaterThan(10);
  await settled(column);
  const selected = await input.inputValue();
  await page.waitForTimeout(450);
  await expect(input).toHaveValue(selected);
  expect(Math.abs((await panel.boundingBox())!.y - originalSheet.y)).toBeLessThan(1);
  await expect(page.getByTestId('time-changes')).toHaveText(JSON.stringify([selected]));
  await panel.screenshot({ path: info.outputPath('stable-held-touch.png') });
});

for (const [width, format] of [
  [1100, 'true'],
  [320, 'false'],
] as const) {
  test(`field formatting and whole-field anchoring agree in ${format === 'true' ? '12h' : '24h'} mode at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(
      `/tests/fixtures/picker-popovers.html?hour12=${format}&value=16%3A07&corner=top-start`,
    );
    const input = page.getByLabel('Start time', { exact: true });
    const field = page.locator('.ui-temporal');
    const display = field.locator('[data-slot="display"]');
    await expect(display).toHaveText(format === 'true' ? /0?4:07.*PM/ : '16:07');
    const fieldScan = await new AxeBuilder({ page }).include('main').analyze();
    expect(fieldScan.violations.map(({ id }) => id)).toEqual([]);
    await input.click();
    const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    await expect(panel).toBeVisible();
    if (width > 767) {
      const fieldBox = (await field.boundingBox())!,
        popup = (await panel.boundingBox())!;
      expect(Math.abs(popup.x - fieldBox.x)).toBeLessThan(1);
      expect(popup.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height);
      await expect(panel.getByRole('combobox', { name: 'Hour', exact: true })).toContainText('04');
      await expect(panel.getByRole('combobox', { name: 'Period', exact: true })).toContainText(
        'PM',
      );
    } else {
      await expect(panel.getByRole('spinbutton', { name: 'Hour', exact: true })).toHaveAttribute(
        'aria-valuenow',
        '16',
      );
      await expect(panel.getByRole('spinbutton', { name: 'Period', exact: true })).toHaveCount(0);
    }
    const { violations } = await new AxeBuilder({ page })
      .include('.ui-temporal-sheet, .ui-temporal-content')
      .analyze();
    expect(violations.map(({ id }) => id)).toEqual([]);
    await expect(input).toHaveValue('16:07');
    await panel.screenshot({ path: info.outputPath(`format-${width}.png`) });
  });
}

test('quick Done combines pending columns without a late value change', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto('/tests/fixtures/picker-popovers.html?mode=wheel&value=09%3A10');
  const input = page.getByLabel('Start time', { exact: true });
  await input.click();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await panel.evaluate((node) => {
    const columns = node.querySelectorAll('[data-slot="wheel-viewport"]');
    for (const column of columns)
      column.dispatchEvent(
        new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }),
      );
    node.querySelector<HTMLButtonElement>('.ui-temporal-done button')!.click();
  });
  await expect(input).toHaveValue('10:11');
  await page.waitForTimeout(400);
  await expect(page.getByTestId('time-changes')).toHaveText('["10:11"]');
});
