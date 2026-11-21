import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [width, dir] of [
  [320, 'ltr'],
  [1000, 'rtl'],
] as const) {
  test(`docs calendar year text stays visible with Inter at ${width}px ${dir}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.addInitScript((dir) => {
      localStorage.setItem('plainui-direction', dir);
      localStorage.setItem('plainui-theme', JSON.stringify({ mode: 'light', motion: 'none' }));
    }, dir);
    await page.goto('/components/date-picker');
    await page.locator('.component-preview [data-ui="date-picker"][data-slot="trigger"]').click();
    await page.evaluate(() => document.fonts.ready);
    const year = page.getByRole('combobox', { name: 'Choose year' });
    const text = year.locator(':scope > span').first();
    await expect(text).toHaveText('2026');
    expect(await text.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
      1,
    );
  });
}

async function contained(page: Page, panel: Locator) {
  const box = (await panel.boundingBox())!;
  const viewport = page.viewportSize()!;
  const edge = (await panel.getAttribute('data-side')) === 'bottom' ? 0 : 7;
  expect(box.x).toBeGreaterThanOrEqual(edge);
  expect(box.y).toBeGreaterThanOrEqual(edge);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - edge);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - edge);
  expect(await panel.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
}

for (const [width, height, dir, theme] of [
  [1366, 700, 'ltr', 'light'],
  [1000, 600, 'rtl', 'dark'],
  [320, 700, 'ltr', 'light'],
] as const) {
  test(`range editing uses two clicks and styled navigation at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/tests/fixtures/calendar-toasts.html?view=date-range-picker&existing&dir=${dir}&theme=${theme}`,
    );
    const trigger = page.getByRole('button', { name: 'Travel dates', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Travel dates', exact: true });
    await contained(page, panel);
    expect(
      await panel.evaluate((node) => node.scrollHeight - node.clientHeight),
    ).toBeLessThanOrEqual(1);
    const month = panel
      .getByRole('combobox', {
        name: dir === 'rtl' ? 'اختر الشهر' : 'Choose month',
      })
      .first();
    expect(await month.evaluate((node) => node.tagName)).toBe('BUTTON');
    await month.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await contained(page, list);
    await page.keyboard.press('Escape');
    await expect(month).toBeFocused();
    await expect(panel).toBeVisible();
    const digit = (day: number) => new Intl.NumberFormat(dir === 'rtl' ? 'ar' : 'en').format(day);
    const day = (value: number) =>
      panel
        .locator('.rdp-month')
        .first()
        .locator('.rdp-day:not(.rdp-outside) .rdp-day_button')
        .filter({ hasText: new RegExp(`^${digit(value)}$`) });
    await day(5).click();
    await expect(panel).toBeVisible();
    await expect(page.locator('input[name="travel[from]"]')).toHaveValue(
      width < 768 ? '2026-10-04' : '2026-10-05',
    );
    await expect(page.locator('input[name="travel[to]"]')).toHaveValue(
      width < 768 ? '2026-10-29' : '',
    );
    await day(8).click();
    if (width < 768) {
      await expect(panel).toBeVisible();
      await panel.getByRole('button', { name: dir === 'rtl' ? 'تم' : 'Done', exact: true }).click();
    }
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('input[name="travel[to]"]')).toHaveValue('2026-10-08');
    await trigger.click();
    await month.click();
    await page
      .getByRole('option', { name: dir === 'rtl' ? 'نوفمبر' : 'November', exact: true })
      .click();
    await expect(panel.getByRole('grid').first()).toHaveAttribute('aria-label', /November|نوفمبر/);
    await expect(panel).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await panel.screenshot({ path: info.outputPath(`range-${width}-${dir}.png`) });
  });
}

for (const [width, height] of [
  [1366, 700],
  [1000, 600],
  [800, 450],
] as const) {
  test(`complete date-time popup fits without scrolling at ${width}x${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto('/tests/fixtures/calendar-toasts.html?view=date-time-picker');
    await page.locator('form').evaluate(
      (node, values) => {
        Object.assign(node.style, {
          position: 'fixed',
          top: `${values.height / 2 - 10}px`,
          left: '240px',
          width: '280px',
        });
      },
      { height },
    );
    await page.locator('[data-slot="calendar-trigger"]').first().click();
    const panel = page.getByRole('dialog', { name: 'Open calendar', exact: true });
    await expect(panel).toBeVisible();
    await expect
      .poll(() => panel.evaluate((node) => node.scrollHeight - node.clientHeight))
      .toBeLessThanOrEqual(1);
    await contained(page, panel);
    await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
    await panel.getByRole('combobox', { name: 'Choose month' }).click();
    await page.getByRole('option', { name: 'August', exact: true }).click();
    await expect(panel.getByRole('grid')).toHaveAttribute('aria-label', 'August 2026');
    await expect
      .poll(() => panel.evaluate((node) => node.scrollHeight - node.clientHeight))
      .toBeLessThanOrEqual(1);
    await contained(page, panel);
    await panel.getByRole('button', { name: 'Next period', exact: true }).click();
    await panel.getByRole('button', { name: 'Previous period', exact: true }).click();
    await expect(panel.getByRole('grid')).toHaveAttribute('aria-label', 'August 2026');
    await expect
      .poll(() => panel.evaluate((node) => node.scrollHeight - node.clientHeight))
      .toBeLessThanOrEqual(1);
    await panel.screenshot({ path: info.outputPath(`datetime-${width}-${height}.png`) });
    await panel.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('.ui-temporal-input')).toBeFocused();
  });
}
