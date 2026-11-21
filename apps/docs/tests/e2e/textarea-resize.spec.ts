import { expect, test, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function resize(page: Page, field: Locator, dx: number, dy: number, rtl: boolean) {
  await field.scrollIntoViewIfNeeded();
  const box = (await field.boundingBox())!;
  const x = rtl ? box.x + 3 : box.x + box.width - 3,
    y = box.y + box.height - 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (rtl ? -dx : dx), y + dy, { steps: 8 });
  await page.mouse.up();
  return box;
}

for (const [width, theme, dir] of [
  [1000, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'light', 'rtl'],
] as const) {
  test(`native resize modes and bounds at ${width}px ${theme} ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tests/fixtures/textarea-resize.html?theme=${theme}&dir=${dir}`);
    for (const mode of ['none', 'vertical', 'horizontal', 'both']) {
      const field = page.getByRole('textbox', { name: mode, exact: true });
      await expect(field).toHaveCSS('resize', mode);
      const before = await resize(page, field, 40, 48, dir === 'rtl');
      const after = (await field.boundingBox())!;
      if (mode === 'none' || mode === 'horizontal')
        expect(Math.abs(after.height - before.height)).toBeLessThan(1);
      else expect(after.height - before.height).toBeGreaterThan(30);
      if (mode === 'none' || mode === 'vertical')
        expect(Math.abs(after.width - before.width)).toBeLessThan(1);
      else {
        expect(after.width - before.width).toBeGreaterThan(20);
        await resize(page, field, 600, 0, dir === 'rtl');
        expect(
          await field.evaluate(
            (node) => node.getBoundingClientRect().width <= node.parentElement!.clientWidth + 1,
          ),
        ).toBe(true);
      }
      await expect(field).toHaveValue('A few notes for your team');
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath('resize-modes.png'), fullPage: true });
  });
}

test('changing resize mode preserves editing, the native ref and form submission', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/textarea-resize.html');
  const field = page.getByRole('textbox', { name: 'Editable notes', exact: true });
  await field.fill('The same native textarea');
  await page.getByRole('button', { name: 'Disable resizing', exact: true }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveCSS('resize', 'none');
  await expect(field).toHaveValue('The same native textarea');
  await page.getByRole('button', { name: 'Enable both directions', exact: true }).click();
  await expect(field).toHaveCSS('resize', 'both');
  await page.getByRole('button', { name: 'Save notes', exact: true }).click();
  expect(
    JSON.parse(await page.getByRole('status', { name: 'Saved notes' }).innerText()),
  ).toMatchObject({
    editable: 'The same native textarea',
    none: 'A few notes for your team',
    both: 'A few notes for your team',
  });
  expect(await field.getAttribute('resize')).toBeNull();
});
