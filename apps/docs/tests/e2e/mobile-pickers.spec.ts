import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function accessible(page: Page, panel: Locator) {
  const audit = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) })),
  ).toEqual([]);
  expect(await panel.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  const bounds = (await panel.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
}

for (const [width, height, dir, theme] of [
  [390, 844, 'ltr', 'light'],
  [320, 700, 'rtl', 'dark'],
  [720, 900, 'ltr', 'dark'],
  [568, 360, 'ltr', 'light'],
] as const) {
  const rtl = dir === 'rtl';
  const labels = {
    done: rtl ? 'تم' : 'Done',
    next: rtl ? 'التالي' : 'Next',
    back: rtl ? 'رجوع' : 'Back',
    cancel: rtl ? 'إلغاء' : 'Cancel',
  };
  const day = (panel: Locator, number: number) =>
    panel
      .locator('.rdp-month')
      .first()
      .locator('.rdp-day:not(.rdp-outside) .rdp-day_button')
      .filter({
        hasText: new RegExp(`^${new Intl.NumberFormat(rtl ? 'ar' : 'en').format(number)}$`),
      });
  test(`mobile date confirmation and cancellation fit ${width}x${height} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/tests/fixtures/calendar-toasts.html?view=date-picker&dir=${dir}&theme=${theme}`,
    );
    const trigger = page.getByRole('button', { name: 'Appointment date', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog');
    await expect(panel).toHaveClass(/ui-picker-sheet/);
    await day(panel, 7).click();
    await expect(page.locator('input[name="value"]')).toHaveValue('');
    await accessible(page, panel);
    await expect(panel.getByRole('button', { name: labels.done, exact: true })).toBeInViewport();
    await panel.screenshot({ path: info.outputPath('date.png') });
    await panel.getByRole('button', { name: labels.cancel, exact: true }).click();
    await expect(trigger).toBeFocused();
    await expect(page.locator('input[name="value"]')).toHaveValue('');
    await trigger.click();
    await day(panel, 8).click();
    await panel.getByRole('button', { name: labels.done, exact: true }).click();
    await expect(page.locator('input[name="value"]')).toHaveValue('2026-10-08');
  });
  test(`mobile date/time uses two transactional steps at ${width}x${height} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/tests/fixtures/calendar-toasts.html?view=date-time-picker&dir=${dir}&theme=${theme}`,
    );
    const field = page.locator('input[type="datetime-local"]');
    await field.click();
    const panel = page.getByRole('dialog');
    await expect(panel.getByRole('spinbutton')).toHaveCount(0);
    await day(panel, 7).click();
    await expect(field).toHaveValue('2026-10-05T09:15');
    await panel.getByRole('button', { name: labels.next, exact: true }).click();
    await expect(panel.getByRole('grid')).toHaveCount(0);
    const hour = panel.getByRole('spinbutton', { name: rtl ? 'الساعة' : 'Hour', exact: true });
    await expect(hour).toBeFocused();
    await expect(hour.locator('.ui-time-wheel-selection')).toBeInViewport();
    await hour.press('ArrowUp');
    await expect(field).toHaveValue('2026-10-05T09:15');
    await accessible(page, panel);
    await expect(panel.getByRole('button', { name: labels.done, exact: true })).toBeInViewport();
    await panel.screenshot({ path: info.outputPath('time.png') });
    await panel.getByRole('button', { name: labels.back, exact: true }).click();
    await expect(panel.getByRole('grid')).toBeVisible();
    await panel.getByRole('button', { name: labels.next, exact: true }).click();
    await panel.getByRole('button', { name: labels.done, exact: true }).click();
    await expect(field).toHaveValue('2026-10-07T10:15');
    await expect(field).toBeFocused();
    await field.click();
    await day(panel, 8).click();
    await page.keyboard.press('Escape');
    await expect(field).toHaveValue('2026-10-07T10:15');
  });
  test(`mobile ranges keep both endpoints pending at ${width}x${height} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/tests/fixtures/calendar-toasts.html?view=date-range-picker&existing&dir=${dir}&theme=${theme}`,
    );
    await page.getByRole('button', { name: 'Travel dates', exact: true }).click();
    const panel = page.getByRole('dialog');
    await day(panel, 6).click();
    await expect(panel.getByRole('button', { name: labels.done, exact: true })).toBeDisabled();
    await day(panel, 8).click();
    await expect(page.locator('input[name="travel[from]"]')).toHaveValue('2026-10-04');
    await accessible(page, panel);
    await expect(panel.getByRole('button', { name: labels.done, exact: true })).toBeInViewport();
    await panel.screenshot({ path: info.outputPath('range.png') });
    await panel.getByRole('button', { name: labels.done, exact: true }).click();
    await expect(page.locator('input[name="travel[from]"]')).toHaveValue('2026-10-06');
    await expect(page.locator('input[name="travel[to]"]')).toHaveValue('2026-10-08');
  });
}

test('rotation preserves the active step and cancellation discards a pending wheel gesture', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/calendar-toasts.html?view=date-time-picker');
  const field = page.locator('input[type="datetime-local"]');
  await field.click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await page.setViewportSize({ width: 900, height: 600 });
  await expect(panel).toHaveClass(/ui-picker-sheet/);
  const minute = panel.getByRole('spinbutton', { name: 'Minute' });
  await minute.hover();
  await page.mouse.wheel(0, 120);
  await page.keyboard.press('Escape');
  await expect(field).toHaveValue('2026-10-05T09:15');
  await page.waitForTimeout(500);
  await expect(field).toHaveValue('2026-10-05T09:15');
  await field.click();
  await expect(page.getByRole('dialog')).not.toHaveClass(/ui-picker-sheet/);
});

test('Back preserves the viewed month as well as the draft date and time', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/calendar-toasts.html?view=date-time-picker');
  const field = page.locator('input[type="datetime-local"]');
  await field.click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('combobox', { name: 'Choose month' }).click();
  await page.getByRole('option', { name: 'November', exact: true }).click();
  await panel.getByRole('button', { name: /November 12/ }).click();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await panel.getByRole('spinbutton', { name: 'Hour' }).press('ArrowUp');
  await panel.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(panel.getByRole('grid')).toHaveAttribute('aria-label', 'November 2026');
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(panel.getByRole('spinbutton', { name: 'Hour' })).toHaveAttribute(
    'aria-valuetext',
    '10',
  );
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(field).toHaveValue('2026-11-12T10:15');
});
