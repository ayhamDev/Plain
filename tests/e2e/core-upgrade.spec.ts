import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({
  channel: process.env.CI ? undefined : 'chrome',
  viewport: { width: 1280, height: 960 },
  reducedMotion: 'no-preference',
});

const slot = (component: string, part = 'root') => `[data-ui="${component}"][data-slot="${part}"]`;
const panelSelector = '[data-vaul-drawer][data-state="open"]';
const closeName = /^close(?: dialog| panel)?$/i;

async function initialize(page: Page, mode: 'light' | 'dark' = 'light', dir = 'ltr') {
  await page.addInitScript(
    ({ mode, dir }) => {
      // Seed each fresh context once, without overwriting subsequent editor changes on navigation.
      if (!sessionStorage.getItem('core-upgrade-initialized')) {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'system' }));
        localStorage.setItem('plainui-direction', dir);
        localStorage.removeItem('plainui-token-overrides');
        sessionStorage.setItem('core-upgrade-initialized', 'true');
      }
    },
    { mode, dir },
  );
}

async function component(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`);
  expect(response?.ok(), `Documentation route /components/${slug} must load`).toBe(true);
  await expect(
    page.locator('vite-error-overlay'),
    'The assembled dev site must compile',
  ).toHaveCount(0);
  const preview = page.locator('.component-preview');
  await expect(preview, `Missing rendered ${slug} ComponentExample`).toBeVisible();
  return preview;
}

async function themeEditor(page: Page) {
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  const editor = page.getByRole('dialog').filter({
    has: page.getByRole('textbox', { name: 'Source color', exact: true }),
  });
  await expect(editor).toBeVisible();
  return editor;
}

async function closeEditor(page: Page, editor: Locator) {
  await editor.getByRole('button', { name: closeName }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator(panelSelector)).toHaveCount(0);
}

async function selectOption(page: Page, editor: Locator, label: string, option: string) {
  await editor.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
  await expect(editor.getByRole('combobox', { name: label, exact: true })).toContainText(option);
}

async function setOverride(page: Page, editor: Locator, token: string, value: string) {
  const advanced = editor.getByRole('button', { name: 'Advanced', exact: true });
  if ((await advanced.getAttribute('aria-expanded')) !== 'true') await advanced.click();
  await editor.getByRole('combobox', { name: 'Token', exact: true }).click();
  await page.getByRole('combobox', { name: 'Find a token...', exact: true }).fill(token);
  await page.getByRole('option', { name: token, exact: true }).click();
  await editor.getByRole('textbox', { name: 'CSS value', exact: true }).fill(value);
  await editor.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem('plainui-token-overrides') ?? '{}')[key],
        token,
      ),
    )
    .toBe(value);
}

async function resolvedColors(element: Locator) {
  return element.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const channels = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const style = getComputedStyle(node);
    return { background: channels(style.backgroundColor), foreground: channels(style.color) };
  });
}

function luminance(color: number[]) {
  const [r, g, b] = color.slice(0, 3).map((value) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: number[], second: number[]) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function centerPixel(page: Page, element: Locator) {
  const png = await element.screenshot({ animations: 'allow' });
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext('2d')!;
    context.drawImage(
      bitmap,
      Math.floor(bitmap.width / 2),
      Math.floor(bitmap.height / 2),
      1,
      1,
      0,
      0,
      1,
      1,
    );
    bitmap.close();
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  }, png.toString('base64'));
}

async function rootPalette(page: Page) {
  return page.locator('html').evaluate((node) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(
      ['background', 'surface', 'surface-container', 'border', 'primary'].map((name) => [
        name,
        style.getPropertyValue(`--ui-${name}`).trim(),
      ]),
    );
  });
}

async function maximumDuration(
  element: Locator,
  property: 'animationDuration' | 'transitionDuration',
) {
  return element.evaluate(
    (node, key) => Math.max(...getComputedStyle(node)[key].split(',').map(parseFloat)),
    property,
  );
}

async function finishPanelMotion(panel: Locator) {
  await panel.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.allSettled(node.getAnimations().map((animation) => animation.finished));
  });
}

async function expectThumbInsideTrack(track: Locator) {
  await expect
    .poll(
      () =>
        track.evaluate((node) => {
          const outer = node.getBoundingClientRect();
          const thumb = node
            .querySelector('[data-ui="switch"][data-slot="thumb"]')!
            .getBoundingClientRect();
          return [
            thumb.left < outer.left - 0.5 && 'left',
            thumb.right > outer.right + 0.5 && 'right',
            thumb.top < outer.top - 0.5 && 'top',
            thumb.bottom > outer.bottom + 0.5 && 'bottom',
            thumb.width <= 0 && 'empty',
          ].filter(Boolean);
        }),
      { message: 'The switch thumb must stay inside its track on every edge' },
    )
    .toEqual([]);
}

async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const session = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 0, radiusX: 4, radiusY: 4, force: 1 }];
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: point(from.x, from.y),
    });
    // A slow release tests snap selection rather than Vaul's high-velocity dismissal path.
    for (let step = 1; step <= 18; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: point(
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

async function openPreviewPanel(
  page: Page,
  preview: Locator,
  match: (panel: Locator) => Promise<boolean>,
) {
  const triggers = preview.locator('button[aria-haspopup="dialog"]');
  await expect(
    triggers.first(),
    'The lazy-loaded Sheet example must render its native triggers',
  ).toBeVisible();
  const names = await triggers.allTextContents();
  for (let index = 0; index < names.length; index++) {
    await triggers.nth(index).click();
    const panel = page.locator(panelSelector);
    await expect(panel).toBeVisible();
    if (await match(panel)) return { panel, trigger: triggers.nth(index) };
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  }
  throw new Error(
    `The assembled Sheet preview is missing the required interaction example. Available triggers: ${names.join(', ')}`,
  );
}

for (const mode of ['light', 'dark'] as const) {
  test(`toast is inverse and has no default close button in ${mode} mode`, async ({ page }) => {
    await initialize(page, mode);
    const preview = await component(page, 'toast');
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    await preview.getByRole('button', { name: /success/i }).click();
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast.locator('[data-close-button]')).toHaveCount(0);
    const colors = await resolvedColors(toast);
    const body = await resolvedColors(page.locator('body'));
    expect(colors.background[3]).toBe(255);
    expect(contrast(colors.background, colors.foreground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.background, body.background)).toBeGreaterThan(4.5);
    if (mode === 'light') expect(luminance(colors.background)).toBeLessThan(0.1);
    else expect(luminance(colors.background)).toBeGreaterThan(0.7);
    const description = await resolvedColors(toast.locator('[data-description]'));
    expect(contrast(colors.background, description.foreground)).toBeGreaterThanOrEqual(4.5);
    await preview.getByRole('button', { name: /action/i }).click();
    const actionable = page
      .locator('[data-sonner-toast]')
      .filter({ has: page.locator('[data-action]') });
    await expect(actionable).toBeVisible();
    await actionable.locator('[data-action]').click();
    await expect(actionable).toHaveCount(0);
  });
}

test('skeleton has visible dimensions and its rendered pixels pulse', async ({ page }) => {
  await initialize(page);
  const preview = await component(page, 'skeleton');
  const skeletons = preview.locator(slot('skeleton'));
  await expect(skeletons).toHaveCount(4);
  const dimensions = await skeletons.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  for (const dimension of dimensions) {
    expect(dimension.width).toBeGreaterThan(20);
    expect(dimension.height).toBeGreaterThanOrEqual(12);
  }
  const skeleton = skeletons.last();
  await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  await expect(preview.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  await expect
    .poll(() => skeleton.evaluate((node) => Number(getComputedStyle(node).opacity)), {
      intervals: [25, 50],
    })
    .toBeGreaterThan(0.95);
  const bright = await centerPixel(page, skeleton);
  await expect
    .poll(() => skeleton.evaluate((node) => Number(getComputedStyle(node).opacity)), {
      intervals: [25, 50],
    })
    .toBeLessThan(0.65);
  const dim = await centerPixel(page, skeleton);
  expect(bright[3]).toBe(255);
  expect(dim[3]).toBe(255);
  expect(bright.slice(0, 3).some((channel, index) => Math.abs(channel - dim[index]) > 2)).toBe(
    true,
  );
  expect(await skeleton.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
});

test('zero theme radius reaches the switch track and thumb without breaking keyboard toggling', async ({
  page,
}) => {
  await initialize(page);
  const preview = await component(page, 'switch');
  const editor = await themeEditor(page);
  const radius = editor.getByRole('slider', { name: 'Corner radius', exact: true });
  await radius.focus();
  await radius.press('Home');
  await expect(radius).toHaveAttribute('aria-valuenow', '0');
  await closeEditor(page, editor);
  const control = preview.locator('[role="switch"]:not([disabled])').first();
  const thumb = control.locator(slot('switch', 'thumb'));
  for (const element of [control, thumb]) {
    await expect
      .poll(() => element.evaluate((node) => getComputedStyle(node).borderRadius))
      .toBe('0px');
  }
  await expect(control).toBeChecked();
  await expectThumbInsideTrack(control);
  const checked = await thumb.boundingBox();
  await control.focus();
  await control.press('Space');
  await expect(control).not.toBeChecked();
  await expectThumbInsideTrack(control);
  await expect
    .poll(async () => Math.abs((await thumb.boundingBox())!.x - checked!.x))
    .toBeGreaterThan(15);
  await control.press('Space');
  await expect(control).toBeChecked();
  await expectThumbInsideTrack(control);
  await expect(preview.getByRole('switch').last()).toBeDisabled();
});

for (const route of ['/', '/components/switch']) {
  for (const dir of ['ltr', 'rtl']) {
    test(`checked Switch thumbs fit their tracks on ${route} in ${dir} at desktop and mobile widths`, async ({
      page,
    }) => {
      await initialize(page, 'light', dir);
      await page.goto(route);
      const tracks = page.locator('[data-ui="switch"][data-slot="root"]:not([disabled])');
      await expect(tracks.first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('dir', dir);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
        for (let index = 0; index < (await tracks.count()); index++) {
          const track = tracks.nth(index);
          await track.scrollIntoViewIfNeeded();
          if ((await track.getAttribute('aria-checked')) !== 'true') await track.click();
          await expect(track).toBeChecked();
          await expectThumbInsideTrack(track);
        }
      }
    });
  }
}

test('ScrollArea scrolls its own viewport with wheel and keyboard input', async ({ page }) => {
  await initialize(page);
  const preview = await component(page, 'scroll-area');
  const viewport = preview.locator(slot('scroll-area', 'viewport'));
  await expect(viewport).toHaveAttribute('tabindex', '0');
  await expect(viewport).toHaveAttribute('role', 'region');
  const size = await viewport.evaluate((node) => ({
    height: node.clientHeight,
    width: node.clientWidth,
    scrollHeight: node.scrollHeight,
    scrollWidth: node.scrollWidth,
  }));
  expect(size.height).toBeGreaterThan(120);
  expect(size.height).toBeLessThan(350);
  expect(size.width).toBeGreaterThan(200);
  expect(size.scrollHeight).toBeGreaterThan(size.height * 2);
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width + 1);
  await viewport.scrollIntoViewIfNeeded();
  await viewport.focus();
  const documentTop = await page.evaluate(() => scrollY);
  await viewport.press('PageDown');
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(80);
  expect(await page.evaluate(() => scrollY)).toBe(documentTop);
  await viewport.press('End');
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop))
    .toBeLessThan(2);
  await viewport.press('Home');
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
  await viewport.hover();
  await page.mouse.wheel(0, 240);
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
  expect(await page.evaluate(() => scrollY)).toBe(documentTop);
});

for (const viewport of [
  { width: 1280, height: 960 },
  { width: 390, height: 844 },
]) {
  test(`Dialog keeps centered framing during subtle enter and exit motion at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await initialize(page);
    const preview = await component(page, 'dialog');
    const trigger = preview.locator('button[aria-haspopup="dialog"]').first();
    await trigger.scrollIntoViewIfNeeded();
    // Observe the real mounted content before Playwright's visibility/stability wait can miss its first frames.
    const record = () =>
      page.evaluate(
        () =>
          new Promise<Array<{ x: number; y: number; time: number; opacity: number }>>((resolve) => {
            const frames: Array<{ x: number; y: number; time: number; opacity: number }> = [];
            const deadline = performance.now() + 3000;
            let start: number | undefined;
            const sample = () => {
              const node = document.querySelector('[data-ui="dialog"][data-slot="content"]');
              const now = performance.now();
              if (node) {
                start ??= now;
                const rect = node.getBoundingClientRect();
                frames.push({
                  x: rect.x + rect.width / 2,
                  y: rect.y + rect.height / 2,
                  time: now - start,
                  opacity: Number(getComputedStyle(node).opacity),
                });
              }
              if ((start !== undefined && now - start > 300) || now > deadline) resolve(frames);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );
    const entering = record();
    await trigger.click();
    const enterFrames = await entering;
    expect(enterFrames.length).toBeGreaterThan(8);
    expect(enterFrames.some((frame) => frame.time < 120 && frame.opacity < 0.99)).toBe(true);
    const dialog = page.locator(slot('dialog', 'content'));
    await expect(dialog).toHaveAccessibleName(/\S/);
    await expect(dialog.getByRole('button', { name: closeName })).toBeVisible();
    const exiting = record();
    await dialog.getByRole('button', { name: closeName }).click();
    const exitFrames = await exiting;
    expect(exitFrames.length).toBeGreaterThan(2);
    expect(exitFrames.some((frame) => frame.opacity < 0.95)).toBe(true);
    for (const frame of [...enterFrames, ...exitFrames]) {
      expect(
        Math.abs(frame.x - viewport.width / 2),
        `Horizontal jump at ${frame.time.toFixed(1)}ms`,
      ).toBeLessThan(1);
      expect(
        Math.abs(frame.y - viewport.height / 2),
        `Vertical jump at ${frame.time.toFixed(1)}ms`,
      ).toBeLessThanOrEqual(8.1);
    }
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test('theme-editor source color changes background, containers and borders as well as primary', async ({
  page,
}) => {
  await initialize(page);
  const preview = await component(page, 'input');
  const input = preview.getByRole('textbox').first();
  const before = await rootPalette(page);
  const beforeBody = await resolvedColors(page.locator('body'));
  const beforeInputBorder = await input.evaluate((node) => getComputedStyle(node).borderColor);
  const editor = await themeEditor(page);
  await editor.getByRole('textbox', { name: 'Source color', exact: true }).fill('#2563eb');
  await expect.poll(async () => (await rootPalette(page)).primary).not.toBe(before.primary);
  const after = await rootPalette(page);
  for (const role of ['background', 'surface-container', 'border', 'primary']) {
    expect(after[role], `${role} must respond to a source color`).not.toBe(before[role]);
  }
  await closeEditor(page, editor);
  await expect
    .poll(() => input.evaluate((node) => getComputedStyle(node).borderColor))
    .not.toBe(beforeInputBorder);
  const body = await resolvedColors(page.locator('body'));
  expect(body.background).not.toEqual(beforeBody.background);
  expect(contrast(body.background, body.foreground)).toBeGreaterThanOrEqual(4.5);
  await page.reload();
  await expect.poll(async () => (await rootPalette(page)).background).toBe(after.background);
  const reopened = await themeEditor(page);
  await expect(reopened.getByRole('textbox', { name: 'Source color', exact: true })).toHaveValue(
    '#2563eb',
  );
  await selectOption(page, reopened, 'Palette', 'Expressive');
  await expect.poll(async () => (await rootPalette(page)).primary).not.toBe(after.primary);
});

test('advanced component-token overrides survive palette changes and can be removed', async ({
  page,
}) => {
  await initialize(page);
  const preview = await component(page, 'input');
  const input = preview.getByRole('textbox').first();
  const editor = await themeEditor(page);
  await setOverride(page, editor, 'input.background', '#ffe4f1');
  await setOverride(page, editor, 'input.foreground', '#45152c');
  await setOverride(page, editor, 'input.radius', '2px');
  await setOverride(page, editor, 'layer-dropdown', '135');
  await editor.getByRole('combobox', { name: 'Palette', exact: true }).click();
  const palettePopup = page.locator(slot('select', 'content'));
  await expect(palettePopup).toHaveCSS('z-index', '135');
  const paletteOption = page.getByRole('option', { name: 'Vibrant', exact: true });
  await expect
    .poll(() =>
      paletteOption.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return node.contains(
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
        );
      }),
    )
    .toBe(true);
  await paletteOption.click();
  await editor.getByRole('textbox', { name: 'Source color', exact: true }).fill('#087f5b');
  await expect(editor.getByRole('combobox', { name: 'Palette', exact: true })).toContainText(
    'Vibrant',
  );
  await closeEditor(page, editor);
  await expect(input).toHaveCSS('background-color', 'rgb(255, 228, 241)');
  await expect(input).toHaveCSS('color', 'rgb(69, 21, 44)');
  await expect(input).toHaveCSS('border-radius', '2px');
  await page.reload();
  await expect(input).toHaveCSS('background-color', 'rgb(255, 228, 241)');
  const reopened = await themeEditor(page);
  await setOverride(page, reopened, 'input.background', '#ffe4f1');
  await reopened.getByRole('button', { name: 'Remove', exact: true }).click();
  await closeEditor(page, reopened);
  await expect(input).not.toHaveCSS('background-color', 'rgb(255, 228, 241)');
});

test('border-none and motion-none settings reach real controls, skeletons and Vaul panels', async ({
  page,
}) => {
  await initialize(page);
  const preview = await component(page, 'input');
  const editor = await themeEditor(page);
  await editor
    .getByRole('radiogroup', { name: 'Border treatment', exact: true })
    .getByRole('radio', { name: 'None', exact: true })
    .click();
  await selectOption(page, editor, 'Motion', 'None');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
  await expect.poll(() => maximumDuration(editor, 'transitionDuration')).toBeLessThanOrEqual(0.001);
  await closeEditor(page, editor);
  await expect(preview.getByRole('textbox').first()).toHaveCSS('border-width', '0px');
  await expect
    .poll(() => maximumDuration(preview.getByRole('textbox').first(), 'transitionDuration'))
    .toBeLessThanOrEqual(0.001);
  const skeletonPreview = await component(page, 'skeleton');
  const skeleton = skeletonPreview.locator(slot('skeleton')).last();
  await expect(skeleton).toHaveCSS('animation-name', 'none');
  const first = await centerPixel(page, skeleton);
  await page.waitForTimeout(350);
  expect(await centerPixel(page, skeleton)).toEqual(first);
  const sheetPreview = await component(page, 'sheet');
  const { panel } = await openPreviewPanel(page, sheetPreview, async () => true);
  await expect.poll(() => maximumDuration(panel, 'transitionDuration')).toBeLessThanOrEqual(0.001);
  await expect.poll(() => maximumDuration(panel, 'animationDuration')).toBeLessThanOrEqual(0.001);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});

test('theme-editor RTL reverses logical end and tab arrow navigation without overflow', async ({
  page,
}) => {
  await initialize(page);
  const preview = await component(page, 'tabs');
  const editor = await themeEditor(page);
  await editor
    .getByRole('radiogroup', { name: 'Layout direction', exact: true })
    .getByRole('radio', { name: 'Right to left', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(editor).toHaveAttribute('dir', 'rtl');
  await expect(editor).toHaveAttribute('data-vaul-drawer-direction', 'left');
  await expect.poll(async () => (await editor.boundingBox())!.x).toBeLessThan(1);
  await closeEditor(page, editor);
  const tabs = preview.getByRole('tablist').getByRole('tab');
  await tabs.first().focus();
  await tabs.first().press('ArrowLeft');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test.describe('mobile Vaul interactions on the assembled docs site', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const dir of ['ltr', 'rtl']) {
    test(`logical end Sheet can be touch-dismissed in ${dir}`, async ({ page }) => {
      await initialize(page, 'light', dir);
      const preview = await component(page, 'sheet');
      const side = dir === 'rtl' ? 'left' : 'right';
      const { panel, trigger } = await openPreviewPanel(
        page,
        preview,
        async (candidate) => (await candidate.getAttribute('data-vaul-drawer-direction')) === side,
      );
      await expect(panel).toHaveAttribute('dir', dir);
      await expect(panel).toHaveAttribute('data-side', side);
      await expect(panel).toHaveAccessibleName(/\S/);
      await expect(panel.getByRole('button', { name: closeName })).toBeVisible();
      await expect
        .poll(async () => {
          const rect = (await panel.boundingBox())!;
          return side === 'left' ? Math.abs(rect.x) : Math.abs(rect.x + rect.width - 390);
        })
        .toBeLessThan(1);
      const rect = (await panel.boundingBox())!;
      const x = side === 'left' ? rect.x + rect.width - 40 : rect.x + 40;
      const y = rect.y + 18;
      await touchDrag(page, { x, y }, { x: side === 'left' ? 5 : 385, y });
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }

  test('Drawer uses a bottom Vaul panel and closes with a touch swipe', async ({ page }) => {
    await initialize(page);
    const preview = await component(page, 'drawer');
    const trigger = preview.locator('button[aria-haspopup="dialog"]').first();
    await trigger.click();
    const panel = page.locator(panelSelector);
    await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    await expect(panel).toHaveAccessibleName(/\S/);
    await expect(panel.getByRole('button', { name: closeName })).toBeVisible();
    await expect
      .poll(async () => {
        const rect = (await panel.boundingBox())!;
        return Math.abs(rect.y + rect.height - 844);
      })
      .toBeLessThan(1);
    const rect = (await panel.boundingBox())!;
    expect(rect.width).toBe(390);
    expect(rect.height).toBeGreaterThan(120);
    await touchDrag(page, { x: 195, y: rect.y + 14 }, { x: 195, y: 839 });
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('Sheet touch drag and keyboard handle move between real snap points', async ({ page }) => {
    await initialize(page);
    const preview = await component(page, 'sheet');
    const { panel, trigger } = await openPreviewPanel(
      page,
      preview,
      async (candidate) => (await candidate.getAttribute('data-vaul-snap-points')) === 'true',
    );
    await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    await finishPanelMotion(panel);
    await expect
      .poll(async () => Math.abs((await panel.boundingBox())!.y - 844 * 0.6))
      .toBeLessThan(2);
    const before = (await panel.boundingBox())!;
    await touchDrag(
      page,
      { x: before.x + before.width / 2, y: before.y + 14 },
      { x: before.x + before.width / 2, y: before.y - 326 },
    );
    await expect.poll(async () => before.y - (await panel.boundingBox())!.y).toBeGreaterThan(200);
    await finishPanelMotion(panel);
    await expect
      .poll(async () => Math.abs((await panel.boundingBox())!.y - 844 * 0.15))
      .toBeLessThan(2);
    const snapped = (await panel.boundingBox())!;
    await page.waitForTimeout(400);
    expect(Math.abs((await panel.boundingBox())!.y - snapped.y)).toBeLessThan(2);
    const handle = panel.locator('[data-vaul-handle]');
    await expect(
      handle,
      'The snap-point example needs SheetHandle for keyboard snapping',
    ).toHaveCount(1);
    await expect(handle).toHaveAttribute('role', 'button');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await trigger.click();
    await finishPanelMotion(panel);
    await expect
      .poll(async () => Math.abs((await panel.boundingBox())!.y - before.y))
      .toBeLessThan(2);
    await handle.focus();
    await handle.press('Space');
    await expect
      .poll(async () => Math.abs((await panel.boundingBox())!.y - before.y))
      .toBeGreaterThan(100);
    await finishPanelMotion(panel);
    await expect
      .poll(async () => Math.abs((await panel.boundingBox())!.y - snapped.y))
      .toBeLessThan(2);
    await expect(panel).toBeVisible();
    await handle.press('Enter');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('local RTL Sheet portals remain inside their own theme scope', async ({ page }) => {
    await initialize(page, 'light', 'ltr');
    const preview = await component(page, 'sheet');
    const scope = preview.locator('[data-ui-theme-scope][dir="rtl"]').first();
    await expect(scope, 'The assembled Sheet example needs a local RTL ThemeScope').toBeVisible();
    await scope.locator('button[aria-haspopup="dialog"]').first().click();
    const panel = scope.locator(panelSelector);
    await expect(panel).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(panel).toHaveAttribute('dir', 'rtl');
    await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'left');
    await expect.poll(async () => (await panel.boundingBox())!.x).toBeLessThan(1);
    const scopeValues = await scope.evaluate((node) => ({
      background: getComputedStyle(node).getPropertyValue('--ui-sheet-background').trim(),
      globalBackground: getComputedStyle(document.documentElement)
        .getPropertyValue('--ui-sheet-background')
        .trim(),
    }));
    expect(scopeValues.background).not.toBe(scopeValues.globalBackground);
    const portalValues = await panel.evaluate((node) => ({
      background: getComputedStyle(node).getPropertyValue('--ui-sheet-background').trim(),
      container: node.closest('[data-ui-theme-scope]') !== null,
    }));
    expect(portalValues).toEqual({ background: scopeValues.background, container: true });
    const colors = await resolvedColors(panel);
    expect(colors.background[3]).toBe(255);
    expect(contrast(colors.background, colors.foreground)).toBeGreaterThanOrEqual(4.5);
    await panel.getByRole('button', { name: closeName }).click();
    await expect(panel).toHaveCount(0);
  });
});
