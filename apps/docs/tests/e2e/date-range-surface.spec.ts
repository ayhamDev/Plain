import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function singleSurface(frame: Locator, trigger: Locator) {
  await expect(frame).toHaveCSS('border-top-width', '1px');
  await expect(trigger).toHaveCSS('border-top-width', '0px');
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await frame.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
}

for (const [width, mode, dir] of [
  [1280, 'light', 'ltr'],
  [1000, 'dark', 'rtl'],
  [320, 'light', 'ltr'],
] as const) {
  test(`range fields use one surface and retain selection until dismissal at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      ({ mode, dir }) => {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'none' }));
        localStorage.setItem('plainui-direction', dir);
      },
      { mode, dir },
    );
    await page.goto('/components/date-range-picker');
    const preview = page.locator('.component-preview');
    const frame = preview.locator('[data-ui="date-range-picker"][data-slot="root"]');
    const trigger = frame.locator('[data-slot="trigger"]');
    const clear = frame.locator('[data-slot="clear"]');
    const endpoints = frame.locator('input[type="date"]');
    await expect(trigger).toHaveAccessibleName('Project dates');
    await clear.click();
    await expect(trigger).toHaveText('Pick a date range');
    await singleSurface(frame, trigger);
    await trigger.focus();
    await expect(frame).toHaveCSS('outline-width', '2px');
    await expect(trigger).toHaveCSS('outline-style', 'none');
    await frame.screenshot({ path: info.outputPath('empty-field.png') });
    await trigger.press('Enter');
    const panel = page.getByRole('dialog');
    const day = (value: number) =>
      panel
        .locator('.rdp-month')
        .first()
        .locator('.rdp-day:not(.rdp-outside) .rdp-day_button')
        .filter({ hasText: new RegExp(`^${value}$`) });
    await day(5).click();
    await expect(panel).toBeVisible();
    await day(8).click();
    await expect(panel).toBeVisible();
    await expect(day(8)).toBeFocused();
    if (width >= 768) {
      await expect(endpoints.first()).toHaveValue('2026-10-05');
      await expect(endpoints.last()).toHaveValue('2026-10-08');
    } else await expect(endpoints.first()).toHaveValue('');
    await singleSurface(frame, trigger);
    const audit = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations.map((violation) => violation.id)).toEqual([]);
    await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
    await panel.screenshot({ path: info.outputPath('selected-range.png') });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(endpoints.first()).toHaveValue('2026-10-05');
    await expect(endpoints.last()).toHaveValue('2026-10-08');
    await singleSurface(frame, trigger);
    await expect(frame).toHaveCSS('outline-width', '2px');
    await expect(trigger).toHaveCSS('outline-style', 'none');
    await frame.screenshot({ path: info.outputPath('selected-field.png') });
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(panel).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(panel).toHaveCount(0);
    await expect(endpoints.last()).toHaveValue('2026-10-08');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
