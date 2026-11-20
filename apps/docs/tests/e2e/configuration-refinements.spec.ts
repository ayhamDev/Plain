import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, slug: string, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript((width) => {
    localStorage.setItem(
      'plainui-theme',
      JSON.stringify({ mode: width < 640 ? 'dark' : 'light', motion: 'system' }),
    );
    localStorage.setItem('plainui-direction', width < 640 ? 'rtl' : 'ltr');
    localStorage.removeItem('plainui-token-overrides');
  }, width);
  await page.goto(`/components/${slug}`);
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  return page.locator('.component-preview');
}
async function choose(page: Page, name: string, value: string) {
  await page.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .include('.component-preview')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
for (const width of [1440, 320]) {
  test(`bottom navigation variants retain a bounded moving highlight at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'bottom-navigation', width);
    for (const variant of ['floating', 'inset', 'attached']) {
      await choose(page, 'variant', variant);
      const nav = preview.locator('.ui-bottom-navigation');
      await expect(nav).toHaveAttribute('data-variant', variant);
      const box = (await nav.boundingBox())!;
      const frame = (await preview.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(480);
      expect(Math.abs(box.x + box.width / 2 - frame.x - frame.width / 2)).toBeLessThan(1);
      const inbox = nav.getByRole('button', { name: 'Inbox', exact: true });
      await inbox.click();
      await expect(inbox).toHaveAttribute('aria-current', 'page');
      const icon = inbox.locator('.ui-bottom-navigation-icon');
      const indicator = nav.locator('.ui-selection-indicator');
      await expect
        .poll(async () =>
          Math.abs((await indicator.boundingBox())!.x - (await icon.boundingBox())!.x),
        )
        .toBeLessThan(1);
      await accessible(page);
      await preview.screenshot({ path: info.outputPath(`bottom-${variant}-${width}.png`) });
    }
  });
  test(`Stepper layouts preserve retained panel state at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'stepper', width);
    await page.getByRole('switch', { name: 'keepMounted', exact: true }).click();
    const input = preview.getByRole('textbox', { name: 'Details notes', exact: true });
    await input.fill('Keep this draft');
    await preview.getByRole('button', { name: /^Team/ }).click();
    await expect(input).toHaveCount(0);
    await preview.getByRole('button', { name: /^Details/ }).click();
    await expect(input).toHaveValue('Keep this draft');
    for (const variant of ['compact', 'dots', 'default']) {
      await choose(page, 'variant', variant);
      await expect(preview.locator('.ui-stepper')).toHaveAttribute('data-variant', variant);
      await accessible(page);
    }
    await choose(page, 'orientation', 'vertical');
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`stepper-${width}.png`) });
  });
  test(`Card variants and density retain semantic actions at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'card', width);
    await choose(page, 'size', 'sm');
    await expect(preview.locator('.ui-card-header')).toHaveCSS('padding-top', '16px');
    for (const variant of ['filled', 'elevated', 'ghost', 'outlined']) {
      await choose(page, 'variant', variant);
      await expect(preview.locator('.ui-card')).toHaveAttribute('data-variant', variant);
      await expect(
        preview.getByRole('button', { name: 'Open project', exact: true }),
      ).toBeVisible();
    }
    await page.getByRole('switch', { name: 'selected', exact: true }).click();
    await expect(preview.locator('.ui-card')).toHaveAttribute('data-selected');
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`card-${width}.png`) });
  });
  test(`contrast inputs retain native editing with hidden number controls at ${width}px`, async ({
    page,
  }, info) => {
    const preview = await open(page, 'number-input', width);
    await choose(page, 'variant', 'contrast');
    await page.getByRole('switch', { name: 'showControls', exact: true }).click();
    const number = preview.getByRole('spinbutton');
    await number.fill('8');
    await number.press('ArrowUp');
    await expect(number).toHaveValue('9');
    await expect(preview.locator('button')).toHaveCount(0);
    await expect(preview.locator('.ui-number-input')).toHaveAttribute('data-variant', 'contrast');
    await accessible(page);
    await preview.screenshot({ path: info.outputPath(`number-${width}.png`) });
  });
}
