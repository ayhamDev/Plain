import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { blockRegistry, getBlock } from '../../src/docs/compositions/registry';
import { templateRegistry, getTemplate } from '../../src/docs/compositions/template-registry';
import { blockCategories, templateCategories } from '../../src/docs/compositions/types';

const previewSelector = '.composition-preview';

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function accessible(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const result = await new AxeBuilder({ page })
    .include('.composition-page')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
}

async function contained(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  const preview = page.locator(previewSelector);
  await expect(preview.locator('main')).toHaveCount(0);
  await expect(preview.locator('button button, button a, a button, a a')).toHaveCount(0);
}

async function realPanels(page: Page, count: number) {
  const panels = page.locator(`${previewSelector} [data-block]`);
  await expect(panels).toHaveCount(count);
  await expect
    .poll(async () =>
      panels.evaluateAll((elements) =>
        elements.every((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 && rect.height > 0 && (element.textContent?.trim().length ?? 0) > 20
          );
        }),
      ),
    )
    .toBe(true);
  await contained(page);
}

async function chartIsDrawn(preview: Locator) {
  const surface = preview.locator('.recharts-surface');
  await expect(surface).toBeVisible();
  await expect
    .poll(() =>
      surface.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          element.querySelectorAll('path, rect, circle').length > 2
        );
      }),
    )
    .toBe(true);
}

for (const category of blockCategories) {
  test(`${category}: all ten real block selections render without runtime errors or overflow`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors = watchErrors(page);
    await page.goto(`/blocks?category=${category}`);
    const items = blockRegistry.filter((item) => item.category === category);
    await expect(page.getByRole('button', { name: /^Preview / })).toHaveCount(10);
    for (const item of items) {
      await test.step(item.name, async () => {
        const choice = page.getByRole('button', { name: `Preview ${item.name}`, exact: true });
        await choice.click();
        await expect(choice).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.composition-detail-context')).toContainText(item.id);
        await realPanels(page, 1);
        await expect(page.locator(`${previewSelector} [data-block]`)).toHaveAttribute(
          'data-block',
          category,
        );
        if (category === 'charts') await chartIsDrawn(page.locator(previewSelector));
        expect(errors).toEqual([]);
      });
    }
    await accessible(page);
  });
}

for (const category of templateCategories) {
  test(`${category}: all twelve templates and their destinations render real panels`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors = watchErrors(page);
    await page.goto(`/templates?category=${category}`);
    const items = templateRegistry.filter((item) => item.category === category);
    await expect(page.getByRole('button', { name: /^Preview / })).toHaveCount(12);
    for (const item of items) {
      await test.step(item.name, async () => {
        const choice = page.getByRole('button', { name: `Preview ${item.name}`, exact: true });
        await choice.click();
        await expect(choice).toHaveAttribute('aria-pressed', 'true');
        const application = page.getByRole('region', {
          name: `${item.config.brand} application`,
          exact: true,
        });
        await expect(application).toBeVisible();
        await expect(page.locator(`${previewSelector} [data-template]`)).toHaveCount(1);
        for (const route of item.config.routes) {
          const navigation = application
            .getByRole('navigation', { name: `${item.config.brand} destinations`, exact: true })
            .first();
          if ((await navigation.count()) === 0)
            await application.getByRole('button', { name: 'Open navigation', exact: true }).click();
          const destination = navigation.getByRole('button', { name: route.label, exact: true });
          await destination.click();
          await expect(destination).toHaveAttribute('aria-current', 'page');
          await realPanels(page, route.blockIds.length);
          for (const id of route.blockIds) {
            const config = route.blockOverrides?.[id] ?? getBlock(id)!.config;
            await expect(
              application.locator(`[data-block="${config.family}"]`).first(),
            ).toBeVisible();
          }
        }
        expect(errors).toEqual([]);
      });
    }
    await accessible(page);
  });
}

const representatives = [
  ...blockCategories.map((category) => ({
    kind: 'blocks',
    category,
    item: blockRegistry.find((item) => item.category === category)!,
  })),
  ...templateCategories.map((category) => ({
    kind: 'templates',
    category,
    item: templateRegistry.find((item) => item.category === category)!,
  })),
];

for (const { kind, category, item } of representatives) {
  test(`${category}: representative preview is accessible at 390px in dark seeded RTL`, async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('plainui-theme', JSON.stringify({ mode: 'dark', accent: 'rose' }));
      localStorage.setItem('plainui-direction', 'rtl');
    });
    await page.goto(`/${kind}?category=${category}&item=${item.id}&width=mobile`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const count = 'family' in item.config ? 1 : item.config.routes[0].blockIds.length;
    await realPanels(page, count);
    await accessible(page);
    expect(errors).toEqual([]);
  });
}

test('gallery category, search, sort, pagination, and empty states select actual metadata', async ({
  page,
}) => {
  await page.goto('/blocks');
  await realPanels(page, 1);
  await expect(page.getByRole('button', { name: /^Preview / })).toHaveCount(12);
  const pagination = page.locator('.composition-pagination');
  await pagination.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(pagination).toContainText('Page 2 of 10');
  await expect(page.locator('.composition-detail-context')).toContainText(blockRegistry[12].id);
  await realPanels(page, 1);
  await pagination.getByRole('button', { name: 'Previous', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Search blocks', exact: true });
  await search.fill('invoice tax');
  await expect(page.getByRole('button', { name: /^Preview / })).toHaveCount(1);
  await expect(page.locator('.composition-detail-context')).toContainText('finance-invoice');
  await search.fill('unfindable-workflow');
  await expect(page.getByRole('heading', { name: 'No blocks found', exact: true })).toBeVisible();
  await expect(page.locator(`${previewSelector} [data-block]`)).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Blocks category', exact: true })
    .selectOption('settings');
  await page
    .getByRole('combobox', { name: 'Sort blocks', exact: true })
    .selectOption('alphabetical');
  const expected = blockRegistry
    .filter((item) => item.category === 'settings')
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b));
  await expect(page.locator('.composition-item-info h3')).toHaveText(expected);
  await realPanels(page, 1);
});

test('preview widths, reset, code, clipboard, open source, and download use the actual runnable module', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const item = getBlock('forms-onboarding')!;
  await page.goto(`/blocks?category=forms&item=${item.id}&width=tablet`);
  const source = await (await page.request.get(item.sourceURL)).text();
  await realPanels(page, 1);
  await expect(page.locator(previewSelector)).toHaveAttribute('data-width', 'tablet');
  await page.getByRole('radio', { name: 'Mobile preview', exact: true }).click();
  await expect(page.locator(previewSelector)).toHaveAttribute('data-width', 'mobile');
  await page.getByRole('textbox', { name: 'Team name', exact: true }).fill('Temporary team');
  await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Team name', exact: true })).toHaveValue('');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.locator('[data-block]')).toHaveCount(0);
  await expect(page.getByLabel(`${item.name} source`, { exact: true })).toHaveText(source);
  const tools = page.locator('.composition-code-content .composition-code-heading');
  await tools.getByRole('button', { name: 'Copy source', exact: true }).click();
  await expect
    .poll(async () =>
      (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'),
    )
    .toBe(source);
  const downloaded = page.waitForEvent('download');
  await tools.getByRole('button', { name: 'Download source', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe(`${item.id}.tsx`);
  expect(await readFile((await download.path())!, 'utf8')).toBe(source);
  const openSource = page.getByRole('button', { name: 'Open source', exact: true });
  await openSource.click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: item.name })).toBeFocused();
  await expect(
    page.getByRole('dialog').getByLabel(`${item.name} full source`, { exact: true }),
  ).toHaveText(source);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(openSource).toBeFocused();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await realPanels(page, 1);
});

test('sign-in validates fields, changes password visibility, and clears the local session', async ({
  page,
}) => {
  await page.goto('/blocks?category=authentication&item=auth-password');
  const preview = page.locator(previewSelector);
  await preview.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(preview.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
  await preview
    .getByRole('textbox', { name: 'Email address', exact: true })
    .fill('avery@example.com');
  await preview.getByLabel(/^Password/).fill('prototype-password');
  await preview.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(preview.getByRole('textbox', { name: 'Password', exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await preview.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Your account', exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(preview.getByLabel(/^Password/)).toHaveValue('');
});

test('kanban status selection moves the actual card between lanes', async ({ page }) => {
  await page.goto('/blocks?category=collaboration&item=collaboration-board');
  const preview = page.locator(previewSelector);
  await preview.getByRole('combobox', { name: 'Move Empty state copy', exact: true }).click();
  await page.getByRole('option', { name: 'Done', exact: true }).click();
  const done = preview
    .locator('.pb-board-column')
    .filter({ has: page.getByRole('heading', { name: 'Done', exact: true }) });
  await expect(done.getByText('Empty state copy', { exact: true })).toBeVisible();
});

test('chart data, series selection, comparison, and palette tokens remain connected', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('plainui-theme', JSON.stringify({ mode: 'dark', accent: 'blue' })),
  );
  await page.goto('/blocks?category=charts&item=charts-revenue');
  const preview = page.locator(previewSelector);
  await chartIsDrawn(preview);
  await expect
    .poll(() =>
      preview.locator('[data-block]').evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          style.getPropertyValue('--pb-chart-1').trim() ===
          style.getPropertyValue('--ui-chart-1').trim()
        );
      }),
    )
    .toBe(true);
  await preview.getByRole('checkbox', { name: 'Costs', exact: true }).uncheck();
  await expect(preview.getByRole('checkbox', { name: 'Costs', exact: true })).not.toBeChecked();
  await preview.getByRole('tab', { name: 'Data', exact: true }).click();
  const row = preview
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: 'Apr', exact: true }) });
  const current = await row.textContent();
  await preview.getByRole('combobox', { name: 'Chart period', exact: true }).click();
  await page.getByRole('option', { name: 'Previous period', exact: true }).click();
  await expect.poll(() => row.textContent()).not.toBe(current);
  await accessible(page);
});

test('cart quantity and billing mode update totals and selection', async ({ page }) => {
  await page.goto('/blocks?category=commerce&item=commerce-cart');
  const preview = page.locator(previewSelector);
  const before = await preview.locator('.pb-order-summary').textContent();
  await preview
    .getByRole('button', { name: 'Increase Studio headphones quantity', exact: true })
    .click();
  await expect.poll(() => preview.locator('.pb-order-summary').textContent()).not.toBe(before);
  await page.goto('/blocks?category=commerce&item=commerce-plans');
  await preview.getByRole('radio', { name: 'Annual', exact: true }).click();
  await expect(preview.getByRole('radio', { name: 'Annual', exact: true })).toBeChecked();
  await preview.getByRole('button', { name: 'Choose plan', exact: true }).first().click();
  await expect(preview.locator('.pb-plans article').first()).toHaveAttribute(
    'data-selected',
    'true',
  );
  await accessible(page);
});

test('table search and batch selection update the actual matching row', async ({ page }) => {
  await page.goto('/blocks?category=tables&item=tables-tickets');
  const preview = page.locator(previewSelector);
  await preview
    .getByRole('textbox', { name: 'Search support tickets', exact: true })
    .fill('Keyboard navigation');
  await preview
    .getByRole('checkbox', { name: 'Select Keyboard navigation issue', exact: true })
    .check();
  await preview.getByRole('button', { name: 'Resolve', exact: true }).click();
  await expect(preview.getByText('1 record updated', { exact: true })).toBeVisible();
  await expect(preview.getByText('Resolved', { exact: true })).toBeVisible();
});

test('agenda date navigation creates an event on the selected empty day', async ({ page }) => {
  await page.goto('/blocks?category=scheduling&item=scheduling-agenda');
  const preview = page.locator(previewSelector);
  await preview.getByRole('button', { name: 'Next day', exact: true }).click();
  await expect(
    preview.getByRole('heading', { name: 'No events scheduled', exact: true }),
  ).toBeVisible();
  await preview.getByRole('button', { name: 'Add event', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Event title', exact: true }).fill('Prototype review');
  await dialog.getByLabel(/^Start time/).fill('11:00');
  await dialog.getByRole('button', { name: 'Add event', exact: true }).click();
  await expect(preview.getByText('Prototype review', { exact: true })).toBeVisible();
  await expect(preview.getByText('11:00', { exact: true })).toBeVisible();
});

test('settings validate and discard edits with usable appearance panels', async ({ page }) => {
  await page.goto('/blocks?category=settings&item=settings-profile');
  const preview = page.locator(previewSelector);
  await preview.getByRole('textbox', { name: 'Email', exact: true }).fill('invalid');
  await preview.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(preview.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(preview.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(
    'avery@northstar.example',
  );
  await page.goto('/blocks?category=settings&item=settings-appearance');
  await preview.getByRole('tab', { name: 'Files', exact: true }).click();
  await expect(preview.getByRole('tabpanel', { name: 'Files', exact: true })).toContainText(
    'Navigation specification',
  );
  await accessible(page);
});

test('template creation survives navigation, is searchable, and can be archived', async ({
  page,
}) => {
  const item = getTemplate('web-apps-project-space')!;
  await page.goto(`/templates?category=web-apps&item=${item.id}`);
  const application = page.getByRole('region', { name: 'Atlas application', exact: true });
  await application.getByRole('button', { name: 'New project', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Project name', exact: true }).fill('October launch');
  await dialog.getByRole('textbox', { name: 'Owner', exact: true }).fill('Avery');
  await dialog.getByLabel(/^Target date/).fill('2026-10-15');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(application.locator('.pt-created-records')).toContainText('October launch');
  await application
    .locator('nav:visible')
    .first()
    .getByRole('button', { name: 'Files', exact: true })
    .click();
  await realPanels(page, 2);
  await application.getByRole('button', { name: 'Search workspace', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: 'Search workspace', exact: true })
    .fill('October launch');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /October launch/ })
    .click();
  await expect(page.getByRole('dialog', { name: 'October launch', exact: true })).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Archive record', exact: true })
    .click();
  await expect(application.locator('.pt-created-records')).toHaveCount(0);
  await expect(application.getByRole('status').filter({ hasText: 'Record archived' })).toHaveText(
    'Record archived',
  );
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.getByLabel(`${item.name} source`, { exact: true })).toHaveText(
    await (await page.request.get(item.sourceURL)).text(),
  );
});
