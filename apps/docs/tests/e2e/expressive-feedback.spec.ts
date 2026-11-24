import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [width, theme, dir] of [
  [1440, 'light', 'ltr'],
  [390, 'dark', 'ltr'],
  [320, 'dark', 'rtl'],
] as const) {
  test(`progress and shapes fit ${width}px ${theme} ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(
      `/tests/fixtures/expressive-feedback.html?theme=${theme}&dir=${dir}&motion=none`,
    );
    const bar = page.getByTestId('linear-standard');
    await expect(bar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(bar).toHaveAttribute('aria-valuenow', '64');
    await expect(bar).toHaveAttribute(
      'aria-valuetext',
      new Intl.NumberFormat(dir === 'rtl' ? 'ar-EG' : 'en', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(0.64),
    );
    const gap = await bar.evaluate((node) => {
      const value = node.querySelector('[data-slot="indicator"]')!.getBoundingClientRect();
      const track = node.querySelector('[data-slot="track"]')!.getBoundingClientRect();
      return node.getAttribute('dir') === 'rtl'
        ? value.left - track.right
        : track.left - value.right;
    });
    expect(gap).toBeCloseTo(6, 0);
    const ringGap = await page
      .getByTestId('ring-standard')
      .locator('circle')
      .first()
      .evaluate((circle) => {
        const radius = Number(circle.getAttribute('r'));
        const start = -Number(circle.getAttribute('stroke-dashoffset'));
        return (
          2 * radius * Math.sin(((start - 64) / 100) * Math.PI) -
          Number(circle.getAttribute('stroke-width'))
        );
      });
    expect(ringGap).toBeCloseTo(6, 0);
    const wave = page.getByTestId('linear-wavy');
    await expect(wave).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect
      .poll(async () =>
        wave.locator('svg').evaluate((svg: SVGSVGElement) => {
          const matrix = svg.getCTM()!;
          return Math.max(
            Math.abs(matrix.a) - 1,
            Math.abs(matrix.d) - 1,
            1 - Math.abs(matrix.a),
            1 - Math.abs(matrix.d),
          );
        }),
      )
      .toBeLessThan(0.02);
    const wavePaint = await wave
      .locator('.ui-progress-wave-value')
      .evaluate((node: SVGPathElement) => {
        const box = node.getBBox(),
          svg = node.ownerSVGElement!;
        return {
          x: box.x,
          y: box.y,
          right: box.x + box.width,
          bottom: box.y + box.height,
          width: svg.viewBox.baseVal.width,
          height: svg.viewBox.baseVal.height,
          stroke: Number(getComputedStyle(node).strokeWidth.replace('px', '')),
        };
      });
    expect(wavePaint.stroke).toBe(4);
    expect(wavePaint.x).toBeGreaterThanOrEqual(wavePaint.stroke / 2 - 0.1);
    expect(wavePaint.y).toBeGreaterThanOrEqual(wavePaint.stroke / 2);
    expect(wavePaint.right).toBeLessThanOrEqual(wavePaint.width - wavePaint.stroke / 2 + 0.1);
    expect(wavePaint.bottom).toBeLessThanOrEqual(wavePaint.height - wavePaint.stroke / 2);
    await expect(page.getByTestId('loader')).toHaveText(
      dir === 'rtl' ? 'نجهز مساحة العمل' : 'Preparing workspace',
    );
    await expect(page.getByTestId('scoped-ring').locator('.ui-circular-progress-value')).toHaveCSS(
      'stroke',
      'rgb(49, 90, 134)',
    );
    await expect(page.getByTestId('scoped-loader')).toHaveCSS('color', 'rgb(49, 90, 134)');
    await page.getByTestId('shaped-button').focus();
    await expect(page.getByTestId('shaped-button')).toBeFocused();
    expect(
      await page.getByTestId('shaped-button').evaluate((n) => getComputedStyle(n).outlineStyle),
    ).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status', { name: 'Project count' })).toHaveText('1');
    await page.getByRole('button', { name: 'Change shape', exact: true }).click();
    await expect(page.getByTestId('shape')).toHaveAttribute('data-shape', 'flower');
    await expect(page.getByTestId('image')).toHaveAttribute('data-shape', 'flower');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.mouse.move(width - 1, 899);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('progress-and-shapes.png'), fullPage: true });
  });
}

test('wave geometry follows live resizing and 200% zoom in logical pixels', async ({
  page,
}, info) => {
  await page.goto('/tests/fixtures/expressive-feedback.html?motion=none');
  const svg = page.getByTestId('linear-wavy').locator('svg');
  for (const width of [900, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(async () =>
        svg.evaluate((node: SVGSVGElement) =>
          Math.abs(node.viewBox.baseVal.width - node.clientWidth),
        ),
      )
      .toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 640, height: 1200 });
  await page.evaluate(() => (document.documentElement.style.zoom = '2'));
  await expect
    .poll(async () =>
      svg.evaluate((node: SVGSVGElement) =>
        Math.abs(node.viewBox.baseVal.width - node.clientWidth),
      ),
    )
    .toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('zoom-reflow.png'), fullPage: true });
});

test('empty and complete progress leave no detached cap or residual track', async ({ page }) => {
  await page.goto('/tests/fixtures/expressive-feedback.html?motion=none');
  await page.getByRole('button', { name: 'Empty', exact: true }).click();
  await expect(page.getByTestId('linear-wavy').locator('.ui-progress-wave-value')).toHaveCount(0);
  await expect(
    page.getByTestId('ring-standard').locator('.ui-circular-progress-value'),
  ).toHaveAttribute('visibility', 'hidden');
  await expect(
    page.getByTestId('ring-standard').locator('.ui-circular-progress-track'),
  ).toHaveAttribute('stroke-dasharray', '100 100');
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await expect(page.getByTestId('linear-standard').locator('.ui-progress-track')).toHaveCount(0);
  await expect(page.getByTestId('linear-wavy').locator('.ui-progress-wave-track')).toHaveCount(0);
  await expect(
    page.getByTestId('ring-standard').locator('.ui-circular-progress-track'),
  ).toHaveAttribute('visibility', 'hidden');
  expect(
    await page
      .getByTestId('linear-wavy')
      .locator('.ui-progress-wave-value')
      .evaluate((n: SVGPathElement) => n.getBBox().height),
  ).toBe(0);
});

test('the native loading timeline morphs, pauses and resumes without React frame updates', async ({
  page,
}, info) => {
  await page.goto('/tests/fixtures/expressive-feedback.html');
  const loader = page.getByTestId('loader');
  await expect(loader.locator('animate')).toHaveCount(1);
  await expect(loader.locator('animateTransform')).toHaveCount(1);
  const lengths = await loader.locator('svg').evaluate((svg: SVGSVGElement) => {
    svg.pauseAnimations();
    return [0, 0.35, 0.7, 1.4].map((time) => {
      svg.setCurrentTime(time);
      return svg.querySelector('path')!.getTotalLength();
    });
  });
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeGreaterThan(5);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const before = await loader.locator('svg').evaluate((svg: SVGSVGElement) => svg.getCurrentTime());
  await page.waitForTimeout(150);
  expect(
    await loader.locator('svg').evaluate((svg: SVGSVGElement) => svg.getCurrentTime()),
  ).toBeCloseTo(before, 2);
  await loader.screenshot({ path: info.outputPath('native-morph.png') });
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(async () => loader.locator('svg').evaluate((svg: SVGSVGElement) => svg.getCurrentTime()))
    .toBeGreaterThan(before + 0.05);
});

test('system and provider reduced motion keep a static visible indicator and disable morph transitions', async ({
  page,
}) => {
  for (const policy of ['system', 'none', 'reduced']) {
    await page.emulateMedia({ reducedMotion: policy === 'system' ? 'reduce' : 'no-preference' });
    await page.goto(`/tests/fixtures/expressive-feedback.html?motion=${policy}`);
    await expect(page.getByTestId('loader').locator('animate, animateTransform')).toHaveCount(0);
    await expect(page.getByTestId('loader').locator('path')).toBeVisible();
    await expect(page.getByTestId('wave-ongoing').locator('.ui-progress-wave-travel')).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(page.getByTestId('shape')).not.toHaveAttribute('data-morph');
    await expect(page.getByTestId('image')).not.toHaveAttribute('data-morph');
    await page.getByRole('button', { name: 'Change shape', exact: true }).click();
    // The global motion reset uses a 0.01ms duration to retain transition events.
    expect(
      await page
        .getByTestId('shape')
        .locator('path')
        .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
    ).toBeLessThanOrEqual(0.00001);
  }
});

test('the documentation exposes usable progress, shape and loading examples', async ({
  page,
}, info) => {
  for (const slug of [
    'progress',
    'circular-progress',
    'loading-indicator',
    'shape',
    'shaped-components',
  ]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/v/0.3.0/components/${slug}`);
    await expect(page.locator('.component-preview')).toBeVisible();
    await expect(page.locator('.component-preview [data-ui]').first()).toBeVisible();
    await page
      .locator('.component-preview')
      .screenshot({ path: info.outputPath(`${slug}-mobile.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
