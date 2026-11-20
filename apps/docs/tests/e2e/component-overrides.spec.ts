import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function radii(control: Locator, track: string, thumb: string) {
  await expect(control).toHaveCSS('border-top-left-radius', track);
  await expect(control.locator('[data-slot="thumb"]')).toHaveCSS('border-top-left-radius', thumb);
}

for (const [width, dir, mode] of [
  [1440, 'ltr', 'light'],
  [320, 'ltr', 'light'],
  [390, 'rtl', 'dark'],
] as const) {
  test(`instance overrides stay local at ${width}px ${dir} ${mode}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(`/tests/fixtures/component-overrides.html?dir=${dir}&theme=${mode}`);
    const theme = page.getByRole('switch', { name: 'Follow the theme', exact: true });
    const round = page.getByRole('switch', { name: 'Always round', exact: true });
    const square = page.getByRole('switch', { name: 'Always square', exact: true });
    const custom = page.getByRole('switch', { name: 'Independent thumb shape', exact: true });
    const reusable = page.getByRole('switch', { name: 'Reusable round switch', exact: true });
    const input = page.getByRole('textbox', { name: 'Project name', exact: true });
    await radii(theme, '6px', '4px');
    await radii(round, '999px', '997px');
    await radii(square, '0px', '0px');
    await radii(custom, '8px', '2px');
    await radii(reusable, '999px', '997px');
    await expect(input).toHaveCSS('border-top-left-radius', '12px');
    await expect(input).toHaveCSS('height', '48px');
    await radii(
      page.getByRole('switch', { name: 'Inherited thumb override', exact: true }),
      '6px',
      '3px',
    );
    await radii(
      page.getByRole('switch', { name: 'Automatic thumb override', exact: true }),
      '999px',
      '997px',
    );

    for (const [action, radius, thumb] of [
      ['Round theme', '24px', '22px'],
      ['Square theme', '0px', '0px'],
    ] as const) {
      await page.getByRole('button', { name: action, exact: true }).click();
      await radii(theme, radius, thumb);
      await radii(round, '999px', '997px');
      await radii(square, '0px', '0px');
      await radii(custom, '8px', '2px');
      await radii(reusable, '999px', '997px');
      await expect(input).toHaveCSS('height', '48px');
      await expect(input).toHaveCSS('border-top-left-radius', '12px');
    }

    const formControl = page.getByRole('switch', { name: 'Form alerts', exact: true });
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Saved settings', exact: true })).toHaveText(
      'Alerts on',
    );
    await page.getByRole('button', { name: 'Focus local switch', exact: true }).click();
    await expect(formControl).toBeFocused();
    await page.keyboard.press('Space');
    await expect(formControl).not.toBeChecked();
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Saved settings', exact: true })).toHaveText(
      'Alerts off',
    );
    await expect(page.getByRole('switch', { name: 'Unavailable setting' })).toBeDisabled();

    const trigger = page.getByRole('button', { name: 'Local settings', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Local appearance', exact: true });
    await expect(panel).toHaveCSS('border-top-left-radius', '16px');
    expect(await panel.evaluate((node) => !!node.closest('[data-ui-theme-scope]'))).toBe(true);
    await expect(panel.getByRole('button', { name: 'Done', exact: true })).toHaveCSS(
      'border-top-left-radius',
      '999px',
    );
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(7);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 7);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`component-overrides-${width}-${dir}-${mode}.png`),
      fullPage: true,
    });
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test('customization guide demonstrates instance tokens and scoped popup overrides', async ({
  page,
}) => {
  await page.goto('/docs/customization');
  const group = page.getByRole('group', { name: 'Individual component overrides' });
  await expect(group).toBeVisible();
  await radii(group.getByRole('switch', { name: 'Always round', exact: true }), '999px', '997px');
  await radii(group.getByRole('switch', { name: 'Always square', exact: true }), '0px', '0px');
  await expect(page.getByText('style={tokensToStyle', { exact: false }).first()).toBeAttached();
  await page.getByRole('button', { name: 'Local settings', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Local appearance', exact: true });
  await expect(panel).toHaveCSS('border-top-left-radius', '16px');
  await panel.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(panel).toHaveCount(0);
});
