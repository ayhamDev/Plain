import { expect, test } from '@playwright/test';
test('retired collections expose no stale downloads or combined guide', async ({
  page,
  request,
}) => {
  const manifest = await (await request.get('/compositions/manifest.json')).json();
  expect(manifest).toEqual({ blocks: [], templates: [] });
  for (const collection of ['blocks', 'templates']) {
    await page.goto('/' + collection);
    await expect(page.locator('main h1')).toHaveText(
      collection === 'blocks' ? 'Blocks' : 'Templates',
    );
    await expect(page.getByRole('heading', { name: 'No ' + collection + ' yet' })).toBeVisible();
    await expect(page.locator('[data-block], [data-template]')).toHaveCount(0);
    await expect(page.locator('a[href="/docs/blocks-templates"]')).toHaveCount(0);
  }
  await page.goto('/docs/blocks-templates');
  await expect(page.locator('main h1')).not.toHaveText('Blocks and templates');
});
