import { test, expect } from '@playwright/test';

for (const view of [
  'calendar',
  'date-picker',
  'date-range-picker',
  'date-time-picker',
  'date-time-range-picker',
]) {
  for (const [width, dir, locale, large] of [
    [1000, 'ltr', 'en-US', false],
    [320, 'ltr', 'en-US', false],
    [320, 'ltr', 'pl-PL', true],
    [390, 'rtl', 'ar-EG', true],
  ] as const) {
    test(`${view} shows full month/year labels at ${width}px ${locale}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(
        `/tests/fixtures/calendar-toasts.html?view=${view}&dir=${dir}&locale=${locale}&inter${large ? '&largeLabels' : ''}`,
      );
      if (view === 'date-picker')
        await page.getByRole('button', { name: 'Appointment date', exact: true }).click();
      if (view === 'date-range-picker')
        await page.getByRole('button', { name: 'Travel dates', exact: true }).click();
      if (view.includes('date-time'))
        await page.locator('[data-slot="calendar-trigger"]').first().click();
      const calendar = page.locator('.ui-calendar');
      await expect(calendar).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() =>
          [...document.fonts].some(
            (font) => font.family.includes('Inter Variable') && font.status === 'loaded',
          ),
        ),
      ).toBe(true);
      await expect
        .poll(async () =>
          calendar.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const header = node.querySelector('.rdp-month_caption')!.getBoundingClientRect();
            const grid = node.querySelector('.rdp-month_grid')!.getBoundingClientRect();
            const nav = node.querySelector('.rdp-nav')?.getBoundingClientRect();
            const controls = [...node.querySelectorAll<HTMLElement>('[role="combobox"]')];
            return (
              controls.length === 2 &&
              controls.every((control) => {
                const text = control.querySelector<HTMLElement>('span')!;
                const rect = control.getBoundingClientRect();
                return (
                  text.scrollWidth <= text.clientWidth + 1 &&
                  getComputedStyle(text).textOverflow !== 'ellipsis' &&
                  rect.left >= bounds.left - 1 &&
                  rect.right <= bounds.right + 1 &&
                  (!nav ||
                    rect.right <= nav.left ||
                    rect.left >= nav.right ||
                    rect.bottom <= nav.top ||
                    rect.top >= nav.bottom)
                );
              }) &&
              Math.abs(header.width - grid.width) <= 1 &&
              Math.abs(grid.width - bounds.width) <= 1 &&
              grid.top >= header.bottom - 1 &&
              node.scrollWidth <= node.clientWidth + 1
            );
          }),
        )
        .toBe(true);
      const controls = calendar.getByRole('combobox');
      await expect(controls.first()).toContainText(
        new Intl.DateTimeFormat(locale, { month: 'long', calendar: 'gregory' }).format(
          new Date(2026, 9, 5),
        ),
      );
      await expect(controls.last()).toContainText(
        new Intl.DateTimeFormat(locale, { year: 'numeric', calendar: 'gregory' }).format(
          new Date(2026, 9, 5),
        ),
      );
      if (width < 768 && view.includes('date-time')) {
        const widths = await calendar.evaluate((node) => [
          node.getBoundingClientRect().width,
          node.parentElement!.querySelector('.ui-time-choices')!.getBoundingClientRect().width,
        ]);
        expect(Math.abs(widths[0] - widths[1])).toBeLessThanOrEqual(1);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      await calendar.screenshot({ path: info.outputPath(`labels-${view}-${width}-${locale}.png`) });
    });
  }
}
