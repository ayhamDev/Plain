import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function fits(page: Page, root: Locator) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  expect(await root.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const bounds = (await root.boundingBox())!;
  for (const action of await root.locator('.ui-empty-state-actions > *').all()) {
    const box = (await action.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(bounds.x);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
  }
}
async function accessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
}
for (const [width, dir, theme, orientation, layout] of [
  [1440, 'ltr', 'light', 'horizontal', 'row'],
  [320, 'ltr', 'light', 'horizontal', 'row'],
  [390, 'rtl', 'dark', 'vertical', 'column'],
  [768, 'rtl', 'dark', 'horizontal', 'row'],
] as const) {
  test(`custom empty state content and actions work at ${width}px ${dir} ${layout}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(
      `/tests/fixtures/empty-state.html?dir=${dir}&theme=${theme}&orientation=${orientation}&layout=${layout}`,
    );
    const root = page.getByRole('region', {
      name: "Room for your next idea and your team's shared work",
    });
    await expect(root).toBeVisible();
    await expect(root.locator('.ui-empty-state-actions > *')).toHaveCount(5);
    await fits(page, root);
    const content = (await root.locator('.ui-empty-state-content').boundingBox())!;
    const actions = (await root.locator('.ui-empty-state-actions').boundingBox())!;
    expect(
      dir === 'rtl'
        ? Math.abs(content.x + content.width - actions.x - actions.width)
        : Math.abs(content.x - actions.x),
    ).toBeLessThan(1);
    const name = root.getByRole('textbox', { name: 'Project name' });
    await name.focus();
    await page.keyboard.type('Launch');
    await page.keyboard.press('Enter');
    await expect(root.getByRole('status')).toHaveText('Launch created.');
    await root.getByRole('button', { name: 'Import existing projects and shared files' }).click();
    await expect(root.getByRole('status')).toHaveText('Import selected.');
    await expect(root.getByRole('button', { name: 'Unavailable action' })).toBeDisabled();
    await accessible(page);
    await root.screenshot({ path: info.outputPath(`empty-${width}-${dir}.png`) });
    await root.getByRole('link', { name: 'Documentation for your workspace' }).click();
    await expect(page).toHaveURL(/#guide$/);
  });
}

test('docs demonstrate multiple actions, optional forms and matching copyable source', async ({
  page,
}, info) => {
  await page.goto('/components/empty-state');
  const preview = page.locator('.component-preview');
  await expect(preview.getByRole('button', { name: 'Create project', exact: true })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Import projects', exact: true })).toBeVisible();
  await expect(preview.getByRole('link', { name: 'Documentation', exact: true })).toHaveAttribute(
    'href',
    '/docs/introduction',
  );
  await preview.screenshot({ path: info.outputPath('empty-state-default.png') });
  await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'actionCount', exact: true }).fill('5');
  await expect(preview.locator('.ui-empty-state-actions > *')).toHaveCount(5);
  await page.getByRole('switch', { name: 'showForm', exact: true }).click();
  await preview.getByRole('textbox', { name: 'Project name' }).fill('Roadmap');
  await preview.getByRole('button', { name: 'Create named project' }).click();
  await expect(preview.getByRole('status')).toHaveText('Roadmap created in this demo.');
  await page.getByRole('switch', { name: 'showMedia', exact: true }).click();
  await expect(preview.locator('.ui-empty-state-media')).toHaveCount(0);
  await preview.screenshot({ path: info.outputPath('empty-state-custom-form.png') });
  await page.getByRole('tab', { name: 'Code', exact: true }).first().click();
  await expect(page.locator('.code-block').first()).toContainText('<form');
  await expect(page.locator('.code-block').first()).toContainText('Contact support');
  await expect(page.locator('.code-block').first()).not.toContainText('<EmptyStateMedia');
});
