import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function contained(page: Page, root: Locator) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  expect(await root.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const box = (await root.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function accessible(page: Page, selector: string) {
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
}
for (const view of [
  'calendar',
  'date-picker',
  'date-range-picker',
  'date-time-picker',
  'date-time-range-picker',
]) {
  for (const [width, dir, mode] of [
    [1000, 'ltr', 'light'],
    [320, 'rtl', 'dark'],
  ] as const) {
    test(`${view} jumps across years at ${width}px ${dir} ${mode}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/tests/fixtures/calendar-toasts.html?view=${view}&dir=${dir}&theme=${mode}`);
      let trigger: Locator | undefined;
      if (view === 'date-picker')
        trigger = page.getByRole('button', { name: 'Appointment date', exact: true });
      if (view === 'date-range-picker')
        trigger = page.getByRole('button', { name: 'Travel dates', exact: true });
      if (view.includes('date-time'))
        trigger = page.locator('[data-ui="temporal"][data-slot="calendar-trigger"]').first();
      if (trigger) await trigger.click();
      const calendar = page.locator('[data-ui="calendar"]');
      const month = calendar.getByRole('combobox', {
        name: dir === 'rtl' ? 'اختر الشهر' : 'Choose month',
      });
      const year = calendar.getByRole('combobox', {
        name: dir === 'rtl' ? 'اختر السنة' : 'Choose year',
      });
      await expect(year.locator('option')).toHaveCount(view === 'date-time-range-picker' ? 47 : 56);
      await year.selectOption('1985');
      await month.selectOption('8');
      const septemberWidth = (await calendar.locator('.rdp-month').boundingBox())!.width;
      await contained(page, calendar);
      const bounds = await year.boundingBox();
      const nextBounds = await calendar.locator('.rdp-button_previous').boundingBox();
      expect(bounds!.width).toBeGreaterThan(24);
      expect(
        dir === 'rtl'
          ? bounds!.x >= nextBounds!.x + nextBounds!.width
          : bounds!.x + bounds!.width <= nextBounds!.x,
      ).toBe(true);
      await month.focus();
      await page.keyboard.press('Tab');
      await expect(year).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(year).toHaveValue('1986');
      await year.selectOption('1985');
      await month.selectOption('1');
      expect(
        Math.abs((await calendar.locator('.rdp-month').boundingBox())!.width - septemberWidth),
      ).toBeLessThanOrEqual(1);
      const digits = new Intl.NumberFormat(dir === 'rtl' ? 'ar' : 'en');
      const day = (value: number) =>
        calendar
          .getByRole('button', { name: new RegExp('.*') })
          .filter({ hasText: new RegExp(`^${digits.format(value)}$`) });
      await expect(day(15)).toBeDisabled();
      await accessible(page, view === 'calendar' ? 'main' : '[role="dialog"]');
      await calendar.screenshot({ path: info.outputPath(`${view}-${width}-${dir}.png`) });
      await day(view === 'date-range-picker' ? 18 : 14).click();
      if (view === 'date-range-picker') await day(20).click();
      if (view.includes('date-time'))
        await page
          .getByRole('dialog')
          .getByRole('button', { name: dir === 'rtl' ? 'تم' : 'Done', exact: true })
          .click();
      if (view.includes('date-time'))
        await expect(page.locator('.ui-temporal-input').first()).toBeFocused();
      else if (trigger) await expect(trigger).toBeFocused();
      await page.getByRole('button', { name: 'Submit schedule', exact: true }).click();
      await expect(page.getByRole('status', { name: 'Submitted values' })).toContainText(
        view === 'date-range-picker' ? '1985-02-18' : '1985-02-14',
      );
      if (view.includes('date-time'))
        await expect(page.getByRole('status', { name: 'Submitted values' })).toContainText('09:15');
      if (view === 'date-range-picker')
        await expect(page.getByRole('status', { name: 'Submitted values' })).toContainText(
          '1985-02-20',
        );
    });
  }
}

for (const [mode, dir, width] of [
  ['light', 'ltr', 1000],
  ['dark', 'rtl', 320],
] as const) {
  test(`default toast contrast in ${mode} mode and ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tests/fixtures/calendar-toasts.html?theme=${mode}&dir=${dir}`);
    await page.getByRole('button', { name: 'Success toast', exact: true }).click();
    const notification = page.locator('[data-sonner-toast]').filter({ hasText: 'Changes saved' });
    await expect(notification).toHaveAttribute('data-invert', 'true');
    await expect(notification).toHaveCSS(
      'background-color',
      mode === 'light' ? 'rgb(32, 35, 33)' : 'rgb(237, 239, 240)',
    );
    const initial = await notification.evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
    await expect(notification).not.toHaveCSS('background-color', initial);
    await page.getByRole('button', { name: 'Toast with action', exact: true }).click();
    const action = page.locator('[data-sonner-toast]').filter({ hasText: 'Project archived' });
    await contained(page, action);
    await accessible(page, '[data-sonner-toaster]');
    await page.screenshot({
      path: info.outputPath(`inverse-toast-${mode}-${dir}.png`),
      fullPage: true,
    });
    await action.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Toast action' })).toHaveText('Project restored');
    await notification
      .getByRole('button', { name: dir === 'rtl' ? 'إغلاق' : 'Close', exact: true })
      .click();
    await expect(notification).toHaveCount(0);
  });
}

test('explicit surface toasts and per-toast inverse overrides keep their own contrast', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/calendar-toasts.html?surface');
  await page.getByRole('button', { name: 'Success toast', exact: true }).click();
  const surface = page.locator('[data-sonner-toast]').filter({ hasText: 'Changes saved' });
  await expect(surface).toHaveAttribute('data-invert', 'false');
  await expect(surface).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Inverse override', exact: true }).click();
  const inverse = page.locator('[data-sonner-toast]').filter({ hasText: 'Inverse override' });
  await expect(inverse).toHaveAttribute('data-invert', 'true');
  await expect(inverse).toHaveCSS('background-color', 'rgb(32, 35, 33)');
  await accessible(page, '[data-sonner-toaster]');
});
