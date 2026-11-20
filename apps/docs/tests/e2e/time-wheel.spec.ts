import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ hasTouch: true });
async function settled(wheel: Locator) {
  const viewport = wheel.locator('[data-slot="wheel-viewport"]');
  await expect
    .poll(async () =>
      viewport.evaluate((node) => {
        const row = node.firstElementChild!.getBoundingClientRect().height;
        const values = [...node.children];
        const index = values.findIndex((item) => item.hasAttribute('data-selected'));
        return Math.abs(node.scrollTop - index * row);
      }),
    )
    .toBeLessThan(1);
}
async function accessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('.ui-temporal-sheet, .ui-temporal-content')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function swipeUp(page: Page, wheel: Locator) {
  const box = (await wheel.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2 + 48;
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let index = 1; index <= 8; index++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - index * 12 }],
    });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

for (const [width, theme, dir] of [
  [320, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`native touch and wheel scrolling select time without dragging the sheet at ${width}px ${theme} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 850 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/tests/fixtures/picker-popovers.html?theme=${theme}&dir=${dir}&motion=system`);
    await page.getByRole('button', { name: 'Choose time', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    const hour = panel.getByRole('spinbutton', { name: 'Hour', exact: true });
    await expect(hour).toBeFocused();
    await settled(hour);
    await panel.evaluate(async (node) => {
      await Promise.all(node.getAnimations().map((animation) => animation.finished));
    });
    const original = (await panel.boundingBox())!;
    await swipeUp(page, hour);
    await expect
      .poll(async () => Number(await hour.getAttribute('aria-valuenow')))
      .toBeGreaterThan(9);
    await settled(hour);
    await expect(panel).toBeVisible();
    const after = (await panel.boundingBox())!;
    expect(Math.abs(original.y - after.y)).toBeLessThan(1);
    const minute = panel.getByRole('spinbutton', { name: 'Minute', exact: true });
    await minute.hover();
    await page.mouse.wheel(0, 100);
    await expect
      .poll(async () => Number(await minute.getAttribute('aria-valuenow')))
      .toBeGreaterThan(15);
    await settled(minute);
    const selected = [
      await hour.getAttribute('aria-valuenow'),
      await minute.getAttribute('aria-valuenow'),
    ]
      .map((value) => value!.padStart(2, '0'))
      .join(':');
    await expect(page.locator('input[type="time"]')).toHaveValue(selected);
    await accessible(page);
    await panel.screenshot({ path: info.outputPath(`wheel-${width}-${theme}-${dir}.png`) });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('input[type="time"]')).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('four columns preserve precision, AM/PM and an off-step minute on a narrow phone', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(
    '/tests/fixtures/picker-popovers.html?twelve&value=21%3A12%3A30.125&minuteStep=7',
  );
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await expect(panel.getByRole('spinbutton')).toHaveCount(4);
  const minute = panel.getByRole('spinbutton', { name: 'Minute' });
  await minute.press('ArrowUp');
  await panel.getByRole('spinbutton', { name: 'Second' }).press('End');
  await panel.getByRole('spinbutton', { name: 'Period' }).press('Home');
  await expect(page.locator('input[type="time"]')).toHaveValue('09:14:59.125');
  await settled(minute);
  await expect(
    minute.locator('[data-ui="temporal"][data-slot="wheel-option"][data-selected]'),
  ).toHaveText('14');
  await accessible(page);
  await panel.screenshot({ path: info.outputPath('wheel-four-columns.png') });
});

test('wheel mode works in a desktop popover with scoped tokens and native bounds', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.goto('/tests/fixtures/picker-popovers.html?mode=wheel&custom&min=08%3A00&max=10%3A15');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await expect(panel).toHaveClass(/ui-temporal-content/);
  const hour = panel.getByRole('spinbutton', { name: 'Hour' });
  await expect(hour.locator('[data-slot="wheel-option"]').first()).toHaveCSS('height', '56px');
  await expect(hour.locator('[data-slot="wheel-selection"]')).toHaveCSS(
    'background-color',
    'rgb(219, 234, 254)',
  );
  await hour.press('End');
  await expect(page.locator('input[type="time"]')).toHaveValue('10:15');
  await settled(hour);
  await hour.press('Home');
  await expect(page.locator('input[type="time"]')).toHaveValue('08:00');
  await settled(hour);
  await expect(hour.locator('[data-slot="wheel-selection"]')).toHaveCSS('outline-width', '2px');
  await accessible(page);
  await panel.screenshot({ path: info.outputPath('wheel-desktop-custom.png') });
});

test('select mode remains available on mobile and resizing preserves the edited time', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/tests/fixtures/picker-popovers.html?mode=select');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  let panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await expect(panel.getByRole('combobox', { name: 'Hour' })).toBeVisible();
  await expect(panel.getByRole('spinbutton')).toHaveCount(0);
  await accessible(page);
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await page.goto('/tests/fixtures/picker-popovers.html');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await panel.getByRole('spinbutton', { name: 'Hour' }).press('ArrowUp');
  await page.setViewportSize({ width: 1000, height: 850 });
  await expect(panel).toHaveAttribute('data-side', 'bottom');
  await expect(panel.getByRole('spinbutton', { name: 'Hour' })).toHaveAttribute(
    'aria-valuenow',
    '10',
  );
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  await expect(panel).toHaveClass(/ui-temporal-content/);
  await expect(panel.getByRole('combobox', { name: 'Hour' })).toHaveText('10');
  await expect(page.locator('input[type="time"]')).toHaveValue('10:15');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page.locator('input[type="time"]')).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('pointer-events', 'none');
});

test('opening an animated desktop wheel preserves a value near the end of its range', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 850 });
  await page.goto('/tests/fixtures/picker-popovers.html?mode=wheel&motion=system&value=23%3A55');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  await panel.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  const hour = panel.getByRole('spinbutton', { name: 'Hour' });
  await settled(hour);
  await settled(panel.getByRole('spinbutton', { name: 'Minute' }));
  await expect(hour).toHaveAttribute('aria-valuenow', '23');
  await expect(page.locator('input[type="time"]')).toHaveValue('23:55');
});

test('reduced motion and forced colors keep keyboard wheels usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/tests/fixtures/picker-popovers.html?motion=system');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Choose time', exact: true });
  const hour = panel.getByRole('spinbutton', { name: 'Hour' });
  await expect(hour).toHaveAttribute('data-ui-motion', 'reduced');
  await expect(hour.locator('[data-slot="wheel-text"]').first()).toHaveCSS('transform', 'none');
  await expect(hour.locator('[data-slot="wheel-viewport"]')).toHaveCSS('mask-image', 'none');
  await hour.press('ArrowUp');
  await expect(page.locator('input[type="time"]')).toHaveValue('10:15');
  await settled(hour);
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('input[type="time"]')).toBeFocused();
});
