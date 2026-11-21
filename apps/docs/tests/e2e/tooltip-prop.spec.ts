import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function focusHint(page: Page, target: Locator, text: string) {
  await target.scrollIntoViewIfNeeded();
  await target.focus();
  await expect(page.getByRole('tooltip', { name: text, exact: true })).toBeVisible();
  await expect(target).toHaveAccessibleDescription(new RegExp(text));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(target).toBeFocused();
}

test('preserves native values, refs, handler cancellation and dynamic hint state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  await focusHint(page, save, 'Save project');
  await save.press('Enter');
  await expect(page.getByRole('status', { name: 'Activation count' })).toHaveText('1');
  const input = page.getByRole('textbox', { name: 'Project name', exact: true });
  await page.getByRole('button', { name: 'Focus project name' }).click();
  await expect(input).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText('Choose a recognizable project name');
  await expect(input).toHaveAccessibleDescription(
    'Visible to your team. Choose a recognizable project name',
  );
  await input.fill('Library update');
  await page.getByRole('button', { name: 'Save form', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Saved value' })).toHaveText('Library update');
  await focusHint(
    page,
    page.getByRole('button', { name: 'Live hint', exact: true }),
    'Live project context',
  );
  await page.getByRole('button', { name: 'Toggle hint', exact: true }).click();
  await page.getByTestId('live').focus();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  const prevented = page.getByRole('button', { name: 'Prevent hint', exact: true });
  await prevented.focus();
  await prevented.hover();
  await page.waitForTimeout(150);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(await page.locator('[tooltip]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('keeps hints hoverable and dismisses on pointer press, leave and ancestor scroll', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  await save.hover();
  const tip = page.locator('[data-ui="tooltip"][data-slot="content"]');
  await expect(tip).toBeVisible();
  await tip.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await save.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await save.click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('heading', { level: 1 }).click();
  await save.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.mouse.wheel(0, 200);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('explains disabled actions without making them operable', async ({ page }) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const button = page.getByRole('button', { name: 'Delete', exact: true });
  const group = button.locator('..');
  await expect(button).toBeDisabled();
  await expect(group).toHaveAttribute('tabindex', '0');
  await focusHint(page, group, 'Choose a file before deleting');
  await group.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Choose a file before deleting');
  await group.press('Enter');
  await expect(page.getByRole('status', { name: 'Activation count' })).toHaveText('0');
});

test('opens a focus hint after the browser scrolls its control into view', async ({ page }) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const trigger = page.getByRole('button', { name: 'Project information', exact: true });
  await trigger.focus();
  await expect(page.getByRole('tooltip', { name: 'Open project information' })).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription('Open project information');
  await expect(trigger).toBeInViewport();
});

test('retains primitive state, composite focus and overlay trigger composition', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const workspace = page.getByRole('combobox', { name: 'Workspace', exact: true });
  await focusHint(page, workspace, 'Switch your workspace');
  await workspace.press('Enter');
  await page.getByRole('option', { name: 'Beta', exact: true }).click();
  await expect(workspace).toHaveText('Beta');
  await expect(workspace).toBeFocused();
  const overview = page.getByRole('tab', { name: 'Overview', exact: true });
  await focusHint(page, overview, 'Project summary');
  await overview.press('ArrowRight');
  const activity = page.getByRole('tab', { name: 'Activity', exact: true });
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute('data-state', 'active');
  await expect(page.getByRole('tabpanel')).toHaveText('Activity content');
  const slider = page.getByRole('slider', { name: 'Volume', exact: true });
  await focusHint(page, slider, 'Adjust the project volume');
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '41');
  const trigger = page.getByRole('button', { name: 'Project information', exact: true });
  await focusHint(page, trigger, 'Open project information');
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Project information', exact: true });
  await expect(dialog).toBeVisible();
  await focusHint(page, dialog.getByRole('textbox'), 'Context inside the dialog');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const options = page.getByRole('button', { name: 'Project options', exact: true });
  await focusHint(page, options, 'Open project options');
  await options.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Project options' })).toBeVisible();
});

test('supports layout and breadcrumb surfaces without losing their native dimensions', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  await focusHint(page, page.getByTestId('presence-hint'), 'Layout context');
  const ratio = page.getByTestId('ratio-hint');
  await focusHint(page, ratio, 'Media context');
  const size = (await ratio.boundingBox())!;
  expect(Math.abs(size.width / size.height - 16 / 9)).toBeLessThan(0.01);
  await focusHint(
    page,
    page.getByLabel('More navigation levels', { exact: true }),
    'Hidden navigation levels',
  );
});

test('anchors specialized input hints to visible controls and preserves external table links', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const date = page.getByRole('button', { name: 'Project date', exact: true });
  await focusHint(page, date, 'Choose the project date');
  await date.press('Enter');
  await expect(page.getByRole('grid')).toBeVisible();
  await page.keyboard.press('Escape');
  const time = page.getByRole('textbox', { name: 'Start time', exact: true });
  await focusHint(page, time, 'Choose the start time');
  await page.getByRole('button', { name: 'Choose time', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  const pin = page.getByRole('textbox', { name: 'Security code', exact: true });
  await focusHint(page, pin, 'Enter the verification code');
  await pin.fill('123456');
  await expect(pin).toHaveValue('123456');
  const file = page.locator('input[name="files"]');
  await focusHint(
    page,
    page.getByRole('button', { name: 'Upload files', exact: true }),
    'Drop or select your project files',
  );
  await file.setInputFiles({
    name: 'project.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Project content'),
  });
  await expect(page.getByText('project.txt', { exact: true })).toBeVisible();
  const qr = page.getByRole('img', { name: 'QR code', exact: true });
  await focusHint(page, qr, 'Scan to open the project repository');
  const controls = page.getByRole('region', { name: 'External table controls' });
  const search = controls.getByRole('searchbox');
  await focusHint(page, search, 'Search project records');
  await search.fill('Beta');
  await expect(controls.getByRole('cell', { name: 'Alpha', exact: true })).toHaveCount(0);
  await expect(controls.getByRole('cell', { name: 'Beta', exact: true })).toBeVisible();
  const sort = controls.getByRole('button', { name: 'Sort', exact: true });
  await focusHint(page, sort, 'Reorder the records');
  await sort.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

for (const [width, theme, dir, motion, zoom] of [
  [1440, 'light', 'ltr', 'system', 1],
  [1280, 'dark', 'rtl', 'reduced', 1],
  [390, 'dark', 'rtl', 'none', 1],
  [320, 'light', 'ltr', 'none', 1],
  [640, 'light', 'ltr', 'none', 2],
] as const) {
  test(`keeps scoped hints within the viewport at ${width}px ${theme} ${dir} ${zoom}x`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(
      `/tests/fixtures/tooltip-prop.html?theme=${theme}&dir=${dir}&motion=${motion}&brand=1`,
    );
    if (zoom === 2)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    const edge = page.getByRole('button', { name: 'Edge hint', exact: true });
    await edge.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await edge.focus();
    const tip = page.locator('[data-ui="tooltip"][data-slot="content"]');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveCSS('background-color', 'rgb(25, 60, 48)');
    expect(await tip.evaluate((node) => !!node.closest('[data-testid="local-scope"]'))).toBe(true);
    await expect.poll(async () => (await tip.boundingBox())?.x ?? -1).toBeGreaterThanOrEqual(7);
    await expect
      .poll(async () => {
        const box = (await tip.boundingBox())!;
        return box.x + box.width;
      })
      .toBeLessThanOrEqual(width - 7);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    const audit = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      audit.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath('scoped-tooltip.png') });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('uses inherited defaults without a TooltipProvider and honors unstyled tooltips', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip-prop.html?fallback=1');
  await focusHint(
    page,
    page.getByRole('button', { name: 'Save project', exact: true }),
    'Save project',
  );
  const custom = page.getByRole('button', { name: 'Unstyled control' });
  await custom.scrollIntoViewIfNeeded();
  await custom.focus();
  const tip = page.locator('[data-ui="tooltip"][data-slot="content"]');
  await expect(page.getByRole('tooltip')).toHaveText('Custom hint');
  await expect(tip).not.toHaveClass(/ui-popup/);
  await expect(tip).toHaveCSS('background-color', 'rgb(32, 37, 34)');
});

test('does not open hover hints from touch taps', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/tests/fixtures/tooltip-prop.html?fallback=1');
  await page.getByRole('button', { name: 'Save project', exact: true }).tap();
  await expect(page.getByRole('status', { name: 'Activation count' })).toHaveText('1');
  await page.waitForTimeout(250);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await context.close();
});

test('documents the shared tooltip prop on working preview controls', async ({ page }) => {
  await page.goto('/components/tooltip');
  const preview = page.locator('.component-preview');
  await focusHint(
    page,
    preview.getByRole('button', { name: 'Project settings', exact: true }),
    'Project settings',
  );
  await preview.getByRole('button', { name: 'Project settings', exact: true }).click();
  await expect(preview.getByRole('textbox', { name: 'Project name' })).toBeFocused();
});

test('keeps native controls usable when the optional tooltip module cannot load', async ({
  page,
}) => {
  let blocked = 0;
  await page.route('**/tooltip-runtime*', (route) => {
    blocked++;
    return route.abort();
  });
  await page.goto('/tests/fixtures/tooltip-prop.html');
  const button = page.getByRole('button', { name: 'Save project', exact: true });
  await button.click();
  await expect(page.getByRole('status', { name: 'Activation count' })).toHaveText('1');
  const input = page.getByRole('textbox', { name: 'Project name' });
  await input.fill('Kept working');
  await page.getByRole('button', { name: 'Save form', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Saved value' })).toHaveText('Kept working');
  await expect.poll(() => blocked).toBeGreaterThan(0);
});
