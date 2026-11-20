import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [width, mode, direction] of [
  [1440, 'light', 'ltr'],
  [800, 'dark', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`provider localization updates controls and scoped portals at ${width}px ${mode} ${direction}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ mode, direction }) => {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'none' }));
        localStorage.setItem('plainui-direction', direction);
      },
      { mode, direction },
    );
    await page.goto('/docs/localization');
    const example = page.getByRole('region', { name: 'Localization example', exact: true });
    const scope = example.locator('[data-ui-theme-scope]');
    const language = example.getByRole('combobox', { name: 'Preview language' });
    await expect(example).toBeVisible();
    await example.getByRole('searchbox').fill('Design');
    await example.getByRole('button', { name: 'Select', exact: true }).click();
    await example.getByRole('checkbox', { name: 'Select row design', exact: true }).check();
    await language.click();
    await page.getByRole('option', { name: 'العربية (مصر)', exact: true }).click();
    await expect(scope).toHaveAttribute('lang', 'ar-EG');
    await expect(scope).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
    await expect(example.getByRole('searchbox')).toHaveValue('Design');
    await expect(example.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'البحث في السجلات...',
    );
    await expect(example.getByRole('checkbox', { name: 'اختيار الصف design' })).toBeChecked();
    await expect(example.locator('.ui-table-status')).toContainText('١ محدد');
    await example.getByRole('button', { name: 'التاريخ', exact: true }).click();
    const calendar = scope.locator('.ui-calendar');
    await expect(calendar).toBeVisible();
    await expect(calendar.getByRole('grid')).toHaveAttribute('aria-label', /نوفمبر.*٢٠٢٦/);
    await calendar.getByRole('combobox', { name: 'اختر السنة' }).selectOption('2027');
    await calendar.getByRole('combobox', { name: 'اختر الشهر' }).selectOption('1');
    await calendar.getByRole('button', { name: /١٥ فبراير ٢٠٢٧/ }).click();
    await expect(example.locator('input[name="preview-date"]')).toHaveValue('2027-02-15');
    await example.getByRole('button', { name: 'اختيار الوقت', exact: true }).click();
    if (width < 768) {
      await expect(scope.getByRole('dialog')).toBeVisible();
      await expect(scope.getByRole('spinbutton', { name: 'الساعة', exact: true })).toBeVisible();
      await expect(scope.getByRole('spinbutton', { name: 'الدقيقة', exact: true })).toBeVisible();
    } else {
      await expect(scope.getByRole('combobox', { name: 'الساعة', exact: true })).toBeVisible();
      await expect(scope.getByRole('combobox', { name: 'الدقيقة', exact: true })).toBeVisible();
    }
    await scope.getByRole('dialog').getByRole('button', { name: 'تم', exact: true }).click();
    await expect(example.locator('input[name="preview-time"]')).toHaveValue('09:15');
    await example.screenshot({ path: info.outputPath(`localized-ar-${width}-${mode}.png`) });
    await language.click();
    await page.getByRole('option', { name: 'Français', exact: true }).click();
    await expect(scope).toHaveAttribute('lang', 'fr-FR');
    await expect(scope).toHaveAttribute('dir', 'ltr');
    await expect(example.getByRole('searchbox')).toHaveValue('Design');
    await expect(example.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Rechercher des éléments…',
    );
    await expect(
      example.getByRole('checkbox', { name: 'Sélectionner la ligne design' }),
    ).toBeChecked();
    await expect(example.locator('input[name="preview-date"]')).toHaveValue('2027-02-15');
    await expect(example.getByRole('button', { name: 'Date', exact: true })).toContainText(/2027/);
    await example.getByRole('button', { name: 'Filtres', exact: true }).click();
    const filters = scope.locator('.ui-table-filter-panel');
    await expect(filters).toBeVisible();
    await filters.getByRole('button', { name: 'Ajouter un filtre', exact: true }).click();
    await expect(filters.getByRole('combobox', { name: 'Champ du filtre' })).toContainText(
      'Estimation',
    );
    await filters.getByRole('spinbutton', { name: 'Valeur pour Estimation' }).fill('1200');
    const surface = width <= 640 ? scope.locator('.ui-table-mobile-panel') : filters;
    const bounds = (await surface.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    const openScan = await new AxeBuilder({ page })
      .include(width <= 640 ? '.ui-table-mobile-panel' : '.ui-table-filter-panel')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(openScan.violations.map(({ id }) => id)).toEqual([]);
    if (width <= 640) await surface.getByRole('button', { name: 'Terminé', exact: true }).click();
    else await page.keyboard.press('Escape');
    await expect(example.locator('.ui-table-active-filters')).toContainText('1 200');
    const scan = await new AxeBuilder({ page })
      .include('.localization-example')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(scan.violations.map(({ id }) => id)).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      await example.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await example.screenshot({ path: info.outputPath(`localized-fr-${width}-${mode}.png`) });
  });
}
