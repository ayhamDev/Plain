import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function paint(card: Locator) {
  return card.evaluate(async (node) => {
    const css = getComputedStyle(node);
    // Touch release and React selection can replace an in-flight color transition.
    for (let i = 0; i < 5; i++) {
      const active = node.getAnimations().filter((animation) => animation.playState === 'running');
      if (!active.length) break;
      await Promise.allSettled(active.map((animation) => animation.finished));
    }
    return {
      background: css.backgroundColor,
      border: css.borderColor,
      shadow: css.boxShadow,
      outline: css.outlineStyle,
      transform: css.transform,
      translate: css.translate,
      scale: css.scale,
    };
  });
}

for (const [theme, dir, width] of [
  ['light', 'ltr', 1440],
  ['dark', 'rtl', 320],
] as const) {
  for (const variant of ['ghost', 'filled', 'outlined', 'elevated']) {
    test(`${variant} uses distinct flat surface states in ${theme} ${dir}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/tests/fixtures/card-states.html?theme=${theme}&dir=${dir}`);
      const card = page.getByTestId(variant);
      await page.mouse.move(1, 1);
      const idle = await paint(card);
      const bounds = await card.boundingBox();
      await card.hover();
      const hover = await paint(card);
      expect(hover.background).not.toBe(idle.background);
      await page.mouse.down();
      const press = await paint(card);
      expect(press.background).not.toBe(hover.background);
      await page.mouse.up();
      await expect(card).toHaveAttribute('aria-pressed', 'true');
      await page.mouse.move(1, 1);
      const selected = await paint(card);
      expect(selected.background).not.toBe(idle.background);
      expect(selected.background).not.toBe(hover.background);
      await card.screenshot({ path: info.outputPath(`${variant}-${theme}-selected.png`) });
      await card.hover();
      const selectedHover = await paint(card);
      expect(selectedHover.background).not.toBe(selected.background);
      await card.screenshot({ path: info.outputPath(`${variant}-${theme}-hover.png`) });
      for (const state of [hover, press, selected, selectedHover]) {
        expect(state.border).toBe(idle.border);
        expect(state.shadow).toBe(idle.shadow);
        expect(state.outline).toBe('none');
        expect(state.transform).toBe('none');
        expect(state.translate).toBe('none');
        expect(state.scale).toBe('none');
      }
      expect(await card.boundingBox()).toEqual(bounds);
      if (variant === 'ghost') {
        expect(idle.border).toBe('rgba(0, 0, 0, 0)');
        expect(idle.shadow).toBe('none');
      }
      const audit = await new AxeBuilder({ page })
        .include(`[data-testid="${variant}"]`)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations.map(({ id }) => id)).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
}

for (const theme of ['light', 'dark']) {
  test(`descriptions keep their contrast across selected and pressed surfaces in ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/tests/fixtures/card-states.html?theme=${theme}`);
    await page.getByTestId('ghost').click();
    for (const variant of ['ghost', 'filled', 'outlined', 'elevated']) {
      const card = page.getByTestId(`details-${variant}`);
      await card.hover();
      await paint(card);
      await page.mouse.down();
      await paint(card);
      const audit = await new AxeBuilder({ page })
        .include(`[data-testid="details-${variant}"]`)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      await page.mouse.up();
      expect(audit.violations.map(({ id }) => id)).toEqual([]);
    }
  });
}

test('keyboard focus remains visible and Space toggles the native card button', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/card-states.html');
  const card = page.getByTestId('ghost');
  await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await expect(card).toHaveCSS('outline-style', 'solid');
  await expect(card).toHaveCSS('outline-width', '2px');
  await page.keyboard.press('Space');
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toBeFocused();
  await page.keyboard.press('Space');
  await expect(card).toHaveAttribute('aria-pressed', 'false');
});

test('disabled cards, custom colors, inner controls and unstyled links retain their contracts', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/card-states.html');
  const disabled = page.getByTestId('disabled');
  const idle = await paint(disabled);
  await disabled.hover();
  expect(await paint(disabled)).toEqual(idle);
  await expect(disabled).toBeDisabled();
  const custom = page.getByTestId('nested');
  await page.mouse.move(1, 1);
  const base = await paint(custom);
  expect(
    await custom.evaluate((node) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.fillStyle = getComputedStyle(node).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }),
  ).toEqual([23, 58, 85, 255]);
  await custom.hover();
  expect((await paint(custom)).background).not.toBe(base.background);
  await custom.getByRole('button', { name: 'Open project' }).click();
  await expect(custom.getByRole('status')).toHaveText('Project opened');
  await custom.getByRole('button').focus();
  await expect(custom.getByRole('button')).toBeFocused();
  const unstyled = page.getByTestId('unstyled');
  await expect(unstyled).not.toHaveClass(/ui-card/);
  await unstyled.click();
  await expect(page).toHaveURL(/#project-details$/);
});

for (const policy of ['none', 'system-reduced']) {
  test(`${policy} removes the transition but keeps state feedback`, async ({ page }) => {
    if (policy === 'system-reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(
      `/tests/fixtures/card-states.html?motion=${policy === 'none' ? 'none' : 'system'}`,
    );
    const card = page.getByTestId('ghost');
    const idle = await paint(card);
    await card.hover();
    expect((await paint(card)).background).not.toBe(idle.background);
    expect(
      await card.evaluate((node) =>
        getComputedStyle(node)
          .transitionDuration.split(',')
          .every((value) => parseFloat(value) <= 0.001),
      ),
    ).toBe(true);
    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });
}

test('touch selection has no sticky hover state', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto('/tests/fixtures/card-states.html?theme=dark');
    const card = page.getByTestId('ghost');
    await card.tap();
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    const selected = await paint(card);
    await page.touchscreen.tap(4, 4);
    expect((await paint(card)).background).toBe(selected.background);
    expect(selected.border).toBe('rgba(0, 0, 0, 0)');
    expect(selected.outline).toBe('none');
  } finally {
    await context.close();
  }
});
