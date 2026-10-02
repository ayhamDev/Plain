import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const slot = (component: string, part = 'root') =>
  `[data-ui="${component === 'split-pane' ? 'resizable' : component}"][data-slot="${part}"]`;
const profiles = [
  { name: 'desktop light', mode: 'light', dir: 'ltr', width: 1280, height: 960, mobile: false },
  { name: 'mobile dark RTL', mode: 'dark', dir: 'rtl', width: 390, height: 844, mobile: true },
] as const;
const previews = [
  'box',
  'flex',
  'stack',
  'inline',
  'grid',
  'container',
  'center',
  'spacer',
  'masonry',
  'split-pane',
  'virtual-list',
  'virtual-grid',
  'virtual-masonry',
  'sidebar',
  'bottom-navigation',
  'stepper',
  'segmented-control',
  'tree-view',
  'number-input',
  'search-input',
  'password-input',
  'pin-input',
  'file-upload',
  'color-picker',
  'rating',
  'tags-input',
  'multi-select',
  'menubar',
  'context-menu',
  'hover-card',
  'timeline',
  'banner',
  'loading-overlay',
];

async function initialize(page: Page, mode: 'light' | 'dark', dir: 'ltr' | 'rtl') {
  await page.addInitScript(
    ({ mode, dir }) => {
      localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'system' }));
      localStorage.setItem('plainui-direction', dir);
      localStorage.removeItem('plainui-token-overrides');
    },
    { mode, dir },
  );
}

async function component(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`);
  expect(response?.ok()).toBe(true);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  const preview = page.locator('.component-preview');
  await expect(preview).toBeVisible();
  const part =
    slug === 'sidebar'
      ? 'provider'
      : slug === 'context-menu' || slug === 'hover-card'
        ? 'trigger'
        : 'root';
  // Spacer and Flex deliberately share a toolbar example; the rest have their own primary slot.
  await expect(preview.locator(slot(slug === 'spacer' ? 'flex' : slug, part))).toBeVisible();
  return preview;
}

async function accessible(page: Page, ...selectors: string[]) {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ]);
  for (const selector of selectors) builder = builder.include(selector);
  const result = await builder.analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  ).toEqual([]);
}

async function noOverflow(page: Page, preview: Locator) {
  expect(await preview.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

async function paste(input: Locator, text: string) {
  await input.evaluate((node, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    node.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  }, text);
}

async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const session = await page.context().newCDPSession(page);
  const points = (x: number, y: number) => [{ x, y, id: 0, radiusX: 4, radiusY: 4, force: 1 }];
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: points(from.x, from.y),
    });
    for (let step = 1; step <= 18; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: points(
          from.x + ((to.x - from.x) * step) / 18,
          from.y + ((to.y - from.y) * step) / 18,
        ),
      });
      await page.waitForTimeout(24);
    }
    await page.waitForTimeout(100);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({
      viewport: { width: profile.width, height: profile.height },
      hasTouch: profile.mobile,
      isMobile: profile.mobile,
    });
    test.beforeEach(async ({ page }) => initialize(page, profile.mode, profile.dir));

    for (const slug of previews) {
      test(`${slug} docs preview is accessible and fits`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const preview = await component(page, slug);
        await expect(page.locator('html')).toHaveAttribute('dir', profile.dir);
        await noOverflow(page, preview);
        await accessible(page, '.component-preview');
        await preview.screenshot({ path: testInfo.outputPath(`${slug}.png`) });
        expect(errors).toEqual([]);
      });
    }

    test('PIN paste and Field label operate the single native input', async ({ page }) => {
      const preview = await component(page, 'pin-input');
      const input = preview.getByRole('textbox', { name: 'Verification code' });
      await preview.locator('label').click();
      await expect(input).toBeFocused();
      expect(await input.evaluate((node) => node instanceof HTMLInputElement)).toBe(true);
      await paste(input, '12 34-56');
      await expect(input).toHaveValue('123456');
      await expect(preview.locator(slot('pin-input', 'slot'))).toHaveText([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 4));
      await paste(input, '90');
      await expect(input).toHaveValue('129056');
      await input.press('Backspace');
      await expect(input).toHaveValue('12956');
    });

    test('borderless advanced inputs keep a 2px focus ring and honor custom rounding', async ({
      page,
    }, testInfo) => {
      test.setTimeout(90000);
      for (const { slug, label } of [
        { slug: 'number-input', label: 'Seats' },
        { slug: 'search-input', label: 'Search projects' },
        { slug: 'password-input', label: 'Password' },
        { slug: 'tags-input', label: 'Project tags' },
        { slug: 'multi-select', label: 'Team' },
      ]) {
        const preview = await component(page, slug);
        await page.evaluate(() => {
          document.documentElement.style.setProperty('--ui-border-width', '0px');
          document.documentElement.style.setProperty('--ui-radius', '24px');
          document.documentElement.style.setProperty('--ui-input-radius', '24px');
        });
        const root = preview.locator(slot(slug));
        const before = (await root.boundingBox())!;
        await preview.getByLabel(label, { exact: true }).focus();
        const geometry = await root.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            border: style.borderTopWidth,
            radius: style.borderTopLeftRadius,
            outlineWidth: style.outlineWidth,
            outlineStyle: style.outlineStyle,
            outlineColor: style.outlineColor,
          };
        });
        expect(geometry).toMatchObject({
          border: '0px',
          radius: '24px',
          outlineWidth: '2px',
          outlineStyle: 'solid',
        });
        expect(geometry.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
        const after = (await root.boundingBox())!;
        expect(Math.abs(before.width - after.width)).toBeLessThan(0.1);
        expect(Math.abs(before.height - after.height)).toBeLessThan(0.1);
        await preview.screenshot({ path: testInfo.outputPath(`borderless-${slug}.png`) });
      }
      const pinPreview = await component(page, 'pin-input');
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--ui-border-width', '0px'),
      );
      await pinPreview.getByLabel('Verification code', { exact: true }).focus();
      await expect(pinPreview.locator(slot('pin-input', 'slot') + '[data-active]')).toHaveCSS(
        'outline-width',
        '2px',
      );
      const treePreview = await component(page, 'tree-view');
      await page.evaluate(() =>
        document.documentElement.style.setProperty('--ui-border-width', '0px'),
      );
      await page.keyboard.press('Tab');
      await treePreview.getByRole('treeitem', { name: 'Website', exact: true }).focus();
      await expect(treePreview.locator(slot('tree-view', 'row')).first()).toHaveCSS(
        'outline-width',
        '2px',
      );
    });

    test('MultiSelect label, native input, active descendant and keyboard selection', async ({
      page,
    }) => {
      const preview = await component(page, 'multi-select');
      const input = preview.getByRole('combobox', { name: 'Team', exact: true });
      await preview.locator('label').click();
      await expect(input).toBeFocused();
      expect(await input.evaluate((node) => node instanceof HTMLInputElement)).toBe(true);
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await input.press('ArrowDown');
      const engineering = page.getByRole('option', { name: 'Engineering', exact: true });
      await expect(input).toHaveAttribute(
        'aria-activedescendant',
        (await engineering.getAttribute('id'))!,
      );
      await input.press('Enter');
      await expect(engineering).toHaveAttribute('aria-selected', 'true');
      await expect(preview.getByRole('button', { name: 'Remove Engineering' })).toBeVisible();
      await expect(input).toBeFocused();
      await accessible(page, '.component-preview', slot('multi-select', 'content'));
      await input.fill('rese');
      await expect(page.getByRole('option')).toHaveCount(1);
      await input.press('Enter');
      await expect(preview.getByRole('button', { name: 'Remove Research' })).toBeVisible();
      await input.press('Escape');
      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(input).toBeFocused();
      await input.fill('');
      await input.press('Backspace');
      await expect(preview.getByRole('button', { name: 'Remove Research' })).toHaveCount(0);
      await input.press('Tab');
      await expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    test('Tree expansion, parent focus, selection and typeahead follow direction', async ({
      page,
    }) => {
      const preview = await component(page, 'tree-view');
      const tree = preview.getByRole('tree', { name: 'Project files' });
      const root = tree.getByRole('treeitem', { name: 'Website', exact: true });
      const source = tree.getByRole('treeitem', { name: 'Source code', exact: true });
      const expand = profile.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const collapse = profile.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      await expect(tree).toHaveAttribute('dir', profile.dir);
      await root.focus();
      await root.press('End');
      await expect(source).toBeFocused();
      await source.press(expand);
      await expect(source).toHaveAttribute('aria-expanded', 'true');
      await source.press(expand);
      const file = tree.getByRole('treeitem', { name: 'index.tsx', exact: true });
      await expect(file).toBeFocused();
      await file.press('Enter');
      await expect(file).toHaveAttribute('aria-selected', 'true');
      await file.press(collapse);
      await expect(source).toBeFocused();
      await source.press(collapse);
      await expect(source).toHaveAttribute('aria-expanded', 'false');
      await source.press('Home');
      await expect(root).toBeFocused();
      await root.press('d');
      await expect(tree.getByRole('treeitem', { name: 'Design files' })).toBeFocused();
      await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
    });

    for (const kind of ['list', 'grid', 'masonry']) {
      test(`1k virtual ${kind} bounds DOM, scrolls with keys and retains focused content`, async ({
        page,
      }) => {
        const preview = await component(page, `virtual-${kind}`);
        const viewport = preview.getByRole('list', { name: 'Project records' });
        await expect.poll(() => viewport.getByRole('listitem').count()).toBeLessThan(80);
        await expect(viewport.getByRole('listitem').first()).toHaveAttribute(
          'aria-setsize',
          '1000',
        );
        await viewport.focus();
        await viewport.press('End');
        await expect
          .poll(() =>
            viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop),
          )
          .toBeLessThan(1);
        const last = viewport.getByText('Project 1000', { exact: true });
        await expect(last).toBeAttached();
        // A masonry's final source record need not be in its longest lane.
        if (kind !== 'masonry') await expect(last).toBeInViewport();
        await expect.poll(() => viewport.getByRole('listitem').count()).toBeLessThan(80);
        await viewport.press('Home');
        await expect(viewport.getByText('Project 1', { exact: true })).toBeInViewport();
        await viewport.press('PageDown');
        await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
        await viewport.press('Home');
        const first = viewport.getByText('Project 1', { exact: true });
        // The public demo renders text; making that native element focusable exercises retention.
        await first.evaluate((node) => node.setAttribute('tabindex', '0'));
        await first.focus();
        await viewport.evaluate((node) => {
          node.scrollTop = node.scrollHeight;
        });
        await expect(last).toBeAttached();
        if (kind !== 'masonry') await expect(last).toBeInViewport();
        await expect(first).toBeFocused();
        await expect(first).toBeAttached();
        await expect.poll(() => viewport.getByRole('listitem').count()).toBeLessThan(80);
        await viewport.focus();
        await expect(first).toHaveCount(0);
      });
    }

    test('split panels resize with their accessible keyboard handle', async ({ page }) => {
      const preview = await component(page, 'split-pane');
      if (profile.mobile) {
        await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
        await page.getByRole('switch', { name: 'responsive', exact: true }).click();
        await page.getByRole('combobox', { name: 'orientation', exact: true }).click();
        await page.getByRole('option', { name: 'vertical', exact: true }).click();
      }
      const handle = preview.getByRole('separator', { name: 'Resize explorer' });
      const firstPanel = preview.locator(slot('split-pane', 'panel')).first();
      await handle.focus();
      const width = (await firstPanel.boundingBox())![profile.mobile ? 'height' : 'width'];
      await handle.press(profile.mobile ? 'ArrowDown' : 'ArrowRight');
      await expect
        .poll(async () =>
          Math.abs((await firstPanel.boundingBox())![profile.mobile ? 'height' : 'width'] - width),
        )
        .toBeGreaterThan(1);
      await expect(handle).toBeFocused();
      await expect(handle).toHaveAttribute('aria-valuenow', /\d/);
    });

    test('AppShell iframe has one main, functioning skip link and accessible landmarks', async ({
      page,
    }, testInfo) => {
      await page.goto('/components/app-shell');
      const iframe = page.locator('iframe[title="App shell preview"]');
      const frame = page.frameLocator('iframe[title="App shell preview"]');
      await expect(frame.getByRole('heading', { name: 'Project overview' })).toBeVisible();
      await expect(frame.getByRole('main')).toHaveCount(1);
      await expect(frame.getByRole('banner')).toHaveCount(1);
      await expect(frame.getByRole('contentinfo')).toHaveCount(1);
      const skip = frame.getByRole('link', { name: 'Skip to content' });
      await skip.focus();
      await expect(skip).toBeVisible();
      await skip.press('Enter');
      await expect(frame.getByRole('main')).toBeFocused();
      await accessible(page, '.component-preview');
      await iframe.screenshot({ path: testInfo.outputPath('app-shell-iframe.png') });
    });
  });
}

test.describe('responsive sidebar navigation', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`VirtualGrid ${dir} preserves a focused native draft when columns change`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 960 });
      await initialize(page, dir === 'rtl' ? 'dark' : 'light', dir);
      const preview = await component(page, 'virtual-grid');
      const viewport = preview.getByRole('list', { name: 'Project records' });
      const record = viewport.getByText('Project 3', { exact: true });
      // The docs render text. A native draft added inside it detects cell remounts and state loss.
      await record.evaluate((node) => {
        const input = document.createElement('input');
        input.setAttribute('aria-label', 'Edit Project 3');
        input.value = 'Unsaved edit';
        input.dataset.retention = 'project-3-original';
        node.append(input);
      });
      const input = viewport.getByRole('textbox', { name: 'Edit Project 3' });
      await input.focus();
      await viewport.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(viewport.getByText('Project 1000', { exact: true })).toBeAttached();
      await expect(input).toBeFocused();
      const cell = input.locator('xpath=ancestor::*[@role="listitem"]');
      const desktopWidth = (await cell.boundingBox())!.width;
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(async () => (await cell.boundingBox())!.width)
        .toBeGreaterThan(desktopWidth);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('Unsaved edit');
      await expect(input).toHaveAttribute('data-retention', 'project-3-original');
      await expect.poll(() => viewport.getByRole('listitem').count()).toBeLessThan(80);
      await page.setViewportSize({ width: 1280, height: 960 });
      await expect.poll(async () => (await cell.boundingBox())!.width).toBeCloseTo(desktopWidth, 0);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('Unsaved edit');
      await noOverflow(page, preview);
    });

    test(`desktop ${dir} collapses to a usable rail and responds to viewport changes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 960 });
      await initialize(page, 'light', dir);
      const preview = await component(page, 'sidebar');
      const sidebar = preview.locator(slot('sidebar'));
      const trigger = preview.locator(slot('sidebar', 'trigger'));
      const expandedWidth = await sidebar.evaluate((node) =>
        parseFloat(getComputedStyle(node).getPropertyValue('--ui-sidebar-width')),
      );
      const collapsedWidth = await sidebar.evaluate((node) =>
        parseFloat(getComputedStyle(node).getPropertyValue('--ui-sidebar-collapsed-width')),
      );
      await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(expandedWidth);
      const search = sidebar.getByRole('textbox', { name: 'Search workspace' });
      await search.fill('in');
      await trigger.click();
      await expect(trigger).toHaveAccessibleName('Expand navigation');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(collapsedWidth);
      await expect(search).toBeHidden();
      await expect(sidebar.locator(slot('sidebar', 'header'))).toHaveText('p.');
      await expect(sidebar.locator(slot('sidebar', 'footer'))).toHaveText('AM');
      expect((await sidebar.locator(slot('sidebar', 'header')).boundingBox())!.height).toBeLessThan(
        80,
      );
      await expect(sidebar.getByRole('button', { name: 'Projects', exact: true })).toBeVisible();
      await sidebar.getByRole('button', { name: 'Inbox', exact: true }).click();
      await expect(sidebar.getByRole('button', { name: 'Inbox', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await trigger.click();
      await expect(search).toBeVisible();
      await expect(search).toHaveValue('in');
      await expect(sidebar.locator(slot('sidebar', 'header'))).toContainText('Workspace');
      await trigger.click();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(preview.locator('aside' + slot('sidebar'))).toHaveCount(0);
      await preview.getByRole('button', { name: 'Open navigation' }).click();
      const dialog = page.getByRole('dialog', { name: 'Workspace navigation' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(preview.getByRole('button', { name: 'Open navigation' })).toBeFocused();
      await page.setViewportSize({ width: 1280, height: 960 });
      await expect.poll(async () => (await sidebar.boundingBox())!.width).toBe(collapsedWidth);
      await noOverflow(page, preview);
    });
  }

  test.describe('mobile touch', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    for (const dir of ['ltr', 'rtl'] as const) {
      test(`${dir} swipeable Sidebar traps focus, restores focus and dismisses on selection`, async ({
        page,
      }, testInfo) => {
        await initialize(page, 'dark', dir);
        const preview = await component(page, 'sidebar');
        const trigger = preview.getByRole('button', { name: 'Open navigation' });
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Workspace navigation' });
        await expect(dialog).toHaveAttribute(
          'data-vaul-drawer-direction',
          dir === 'rtl' ? 'right' : 'left',
        );
        await expect
          .poll(async () => {
            const rect = (await dialog.boundingBox())!;
            return dir === 'rtl' ? Math.abs(rect.x + rect.width - 390) : Math.abs(rect.x);
          })
          .toBeLessThan(1);
        const close = dialog.getByRole('button', { name: 'Close navigation' });
        const closeRect = (await close.boundingBox())!;
        expect(closeRect.width).toBeGreaterThanOrEqual(44);
        expect(closeRect.height).toBeGreaterThanOrEqual(44);
        await close.focus();
        await close.press('Shift+Tab');
        expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        await accessible(page, slot('sidebar'));
        await page.screenshot({ path: testInfo.outputPath(`sidebar-${dir}.png`) });
        const rect = (await dialog.boundingBox())!;
        const x = dir === 'rtl' ? rect.x + 32 : rect.x + rect.width - 32;
        const y = rect.y + 24;
        await touchDrag(page, { x, y }, { x: dir === 'rtl' ? 385 : 5, y });
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
        await dialog.getByRole('button', { name: 'Inbox', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await noOverflow(page, preview);
      });
    }
    test('BottomNavigation keeps visible labels and native touch targets', async ({ page }) => {
      await initialize(page, 'light', 'ltr');
      const preview = await component(page, 'bottom-navigation');
      for (const button of await preview.getByRole('button').all()) {
        const rect = (await button.boundingBox())!;
        expect(rect.width).toBeGreaterThanOrEqual(48);
        expect(rect.height).toBeGreaterThanOrEqual(48);
        await expect(button).toHaveAccessibleName(/\S/);
      }
      await preview.getByRole('button', { name: 'Projects', exact: true }).tap();
      await expect(preview.getByRole('button', { name: 'Projects', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });
});
