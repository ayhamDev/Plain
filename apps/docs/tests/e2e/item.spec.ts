import { expect, test, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function surface(item: Locator, token: string) {
  return item.evaluate((node, variable) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = `var(${variable})`;
    node.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);
}
for (const [width, theme, dir] of [
  [1200, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'light', 'rtl'],
] as const) {
  test(`Item surfaces and layout at ${width}px ${theme} ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/tests/fixtures/item.html?theme=${theme}&dir=${dir}`);
    const files = page.getByRole('region', { name: 'Files', exact: true });
    const selected = files.getByRole('button', { name: 'index.ts', exact: true });
    const item = files.getByRole('button', { name: 'button.tsx', exact: true });
    await expect(selected).toHaveCSS(
      'background-color',
      await surface(selected, '--ui-item-selected'),
    );
    await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const before = (await item.boundingBox())!;
    await item.hover();
    await expect(item).toHaveCSS('background-color', await surface(item, '--ui-item-hover'));
    await item.evaluate((node) => {
      if (node instanceof HTMLElement) node.focus();
    });
    await page.mouse.down();
    await expect(item).toHaveCSS('background-color', await surface(item, '--ui-item-active'));
    const held = (await item.boundingBox())!;
    expect([held.x, held.y, held.width, held.height]).toEqual([
      before.x,
      before.y,
      before.width,
      before.height,
    ]);
    await expect(item).toHaveCSS('transform', 'none');
    await expect(item).toHaveCSS('border-top-width', '0px');
    await page.mouse.up();
    await expect(item).toHaveAttribute('aria-pressed', 'true');
    await expect(selected).toHaveAttribute('aria-pressed', 'false');
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await item.focus();
    await expect(item).toHaveCSS('outline-width', '2px');
    await expect(item).toHaveCSS('outline-style', 'solid');
    const disabled = page.getByRole('button', { name: 'Unavailable file', exact: true });
    expect((await disabled.boundingBox())!.width).toBe(before.width);
    await disabled.hover({ force: true });
    await expect(disabled).toHaveCSS(
      'background-color',
      await surface(disabled, '--ui-item-selected'),
    );
    const scoped = page.getByTestId('scoped-item');
    await expect(scoped).toHaveCSS('background-color', 'rgb(220, 235, 217)');
    await expect(scoped).toHaveCSS('border-radius', '12px');
    for (const row of [page.getByTestId('long-item'), page.getByTestId('independent-row')])
      expect(await row.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
        1,
      );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await files.screenshot({ path: info.outputPath('file-items.png') });
  });
}
test('keyboard selection, native links, disabled guards, independent controls and tooltips', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/item.html?reduced');
  const toggle = page.getByRole('button', { name: 'Toggle favorite', exact: true });
  await toggle.focus();
  await toggle.press(' ');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status', { name: 'Selection changes' })).toHaveText('2');
  const disabledLink = page.getByText('Project details', { exact: true });
  await expect(disabledLink).not.toHaveAttribute('href');
  await disabledLink.click({ force: true });
  await expect(page.getByRole('status', { name: 'Link activations' })).toHaveText('0');
  await page.getByRole('button', { name: 'Enable link', exact: true }).click();
  const link = page.getByRole('link', { name: 'Project details', exact: true });
  await expect(link).toHaveAttribute('href', '#details');
  await page.getByRole('button', { name: 'Focus link', exact: true }).click();
  await expect(link).toBeFocused();
  await link.press('Enter');
  await expect(page).toHaveURL(/#details$/);
  await expect(page.getByRole('status', { name: 'Link activations' })).toHaveText('1');
  await page.getByRole('checkbox', { name: 'Keep file offline', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Keep file offline', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Open files', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Action count' })).toHaveText('1');
  await expect(page.getByTestId('independent-row').getByRole('button')).toHaveCount(1);
  const tools = page.getByRole('button', { name: 'File tools', exact: true });
  await tools.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Open file tools');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(
    await toggle.evaluate((node) =>
      getComputedStyle(node)
        .transitionDuration.split(',')
        .every((duration) => Number.parseFloat(duration) < 0.001),
    ),
  ).toBe(true);
});
test('Item composes with windowing and keeps externally owned selection through unmounts', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/item.html?reduced');
  const list = page.getByRole('list', { name: 'Large file collection', exact: true });
  await list.focus();
  await page.keyboard.press('End');
  const last = list.getByRole('button', { name: 'Virtual file 10000', exact: true });
  await expect(last).toBeInViewport();
  await last.click();
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  expect(await list.getByRole('listitem').count()).toBeLessThan(40);
  await list.focus();
  await page.keyboard.press('Home');
  await expect(list.getByRole('button', { name: 'Virtual file 1', exact: true })).toBeVisible();
  await list.focus();
  await page.keyboard.press('End');
  await expect(last).toHaveAttribute('aria-pressed', 'true');
});
test('the Item docs expose composition and selected states in the playground', async ({ page }) => {
  await page.goto('/components/item');
  await expect(page.getByRole('heading', { name: 'Item', exact: true }).first()).toBeVisible();
  const preview = page.locator('#props-preview');
  await preview.getByRole('button', { name: 'Preview properties' }).click();
  await expect(preview.getByRole('switch', { name: 'selected', exact: true })).toBeChecked();
  await preview.getByRole('switch', { name: 'selected', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'index.ts', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await preview.getByRole('button', { name: 'index.ts', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'index.ts', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await preview.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(preview.getByRole('tabpanel')).toContainText('defaultSelected={false}');
});

test('selected items keep a distinct keyboard focus in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/item.html');
  const selected = page
    .getByRole('region', { name: 'Files', exact: true })
    .getByRole('button', { name: 'index.ts', exact: true });
  await page.keyboard.press('Tab');
  await selected.focus();
  const colors = await selected.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      focus: style.outlineColor,
      width: style.outlineWidth,
    };
  });
  expect(colors.width).toBe('2px');
  expect(colors.focus).not.toBe(colors.background);
});
