import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { readFile } from 'node:fs/promises';

const repository = 'https://github.com/ayhamDev/Plain';
async function decoded(code: Locator) {
  await code.evaluate(async (node) => {
    await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  const png = PNG.sync.read(await code.screenshot());
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
}
async function decodedSVG(page: Page, svg: string) {
  const pixels = await page.evaluate(async (svg) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return {
        width: canvas.width,
        height: canvas.height,
        rgba: [...context.getImageData(0, 0, canvas.width, canvas.height).data],
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, svg);
  return jsQR(new Uint8ClampedArray(pixels.rgba), pixels.width, pixels.height)?.data ?? null;
}
async function accessible(page: Page, selector: string) {
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

for (const [width, mode, dir] of [
  [1440, 'light', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`documented QR code decodes, updates and downloads at ${width}px ${mode} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(
      ({ mode, dir }) => {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'system' }));
        localStorage.setItem('plainui-direction', dir);
      },
      { mode, dir },
    );
    await page.goto('/components/qr-code');
    const preview = page.locator('.component-preview'),
      code = preview.getByRole('img', { name: 'QR code for the entered content', exact: true }),
      input = preview.getByRole('textbox', { name: 'Content to encode', exact: true });
    await expect(code).toHaveAttribute('data-state', 'ready');
    expect(await decoded(code)).toBe(repository);
    const value =
      dir === 'rtl' ? 'مرحبا بكم في P.UI 👋' : 'WIFI:T:WPA;S:P.UI Guest;P:plain-demo-2026;;';
    await input.fill(value);
    expect(await decoded(code)).toBe(value);
    const download = page.waitForEvent('download');
    await preview.getByRole('button', { name: 'Download SVG', exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('qr-code.svg');
    const svg = await readFile((await file.path())!, 'utf8');
    expect(await decodedSVG(page, svg)).toBe(value);
    await accessible(page, '.component-preview');
    await preview.screenshot({ path: info.outputPath(`qr-code-${width}-${mode}-${dir}.png`) });
    await input.fill('');
    await expect(code).toHaveAttribute('data-state', 'empty');
    await expect(code.locator('path')).toHaveCount(0);
    await expect(preview.getByRole('button', { name: 'Download SVG', exact: true })).toBeDisabled();
    await input.fill('content'.repeat(1000));
    await expect(code).toHaveAttribute('data-state', 'error');
    await expect(code.locator('path')).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(preview.getByRole('button', { name: 'Download SVG', exact: true })).toBeDisabled();
    await input.fill(repository);
    await expect(code).toHaveAttribute('data-state', 'ready');
    expect(await decoded(code)).toBe(repository);
  });
}

test('all correction levels decode and keep a four-module minimum quiet zone', async ({ page }) => {
  for (const level of ['L', 'M', 'Q', 'H']) {
    const value = 'مرحبا بالعالم 🌍 — P.UI';
    await page.goto(
      `/tests/fixtures/qr-code.html?level=${level}&margin=0&value=${encodeURIComponent(value)}`,
    );
    const code = page.getByRole('img', { name: 'Project QR code', exact: true });
    await expect(code).toHaveAttribute('data-level', level);
    await expect(code.locator('[data-slot="foreground"]')).toHaveAttribute(
      'transform',
      'translate(4 4)',
    );
    expect(await decoded(code)).toBe(value);
    const png = PNG.sync.read(await code.screenshot());
    for (let x = 0; x < png.width; x++) {
      expect(png.data[x * 4]).toBe(255);
      expect(png.data[((png.height - 1) * png.width + x) * 4]).toBe(255);
    }
  }
});

test('tokens and explicit SVG colors keep a scannable code in a dark RTL scope', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto('/tests/fixtures/qr-code.html?custom&theme=dark&dir=rtl');
  const code = page.getByRole('img', { name: 'Project QR code', exact: true });
  await expect(code.locator('[data-slot="foreground"]')).toHaveCSS('fill', 'rgb(18, 52, 86)');
  await expect(code.locator('[data-slot="background"]')).toHaveCSS('fill', 'rgb(255, 255, 255)');
  expect(await decoded(code)).toBe(repository);
  await accessible(page, 'main');
  await page.screenshot({ path: info.outputPath('qr-code-custom-rtl.png') });
});

test('large responsive SVGs and unstyled SVGs decode without overflowing a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/fixtures/qr-code.html?size=512');
  let code = page.getByRole('img', { name: 'Project QR code', exact: true });
  expect((await code.boundingBox())!.width).toBeLessThanOrEqual(272);
  expect(await decoded(code)).toBe(repository);
  await accessible(page, 'main');
  await page.goto('/tests/fixtures/qr-code.html?unstyled');
  code = page.getByRole('img', { name: 'Project QR code', exact: true });
  await expect(code).not.toHaveClass(/ui-qr-code/);
  expect(await decoded(code)).toBe(repository);
});

test('forced colors retain the machine-readable black and white surface', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/qr-code.html?theme=dark&dir=rtl');
  const code = page.getByRole('img', { name: 'Project QR code', exact: true });
  expect(await decoded(code)).toBe(repository);
  await expect(code).toHaveCSS('forced-color-adjust', 'none');
  // Audit the graphic; forced-color painting of the surrounding themed text is UA-owned.
  await accessible(page, '[data-ui="qr-code"][data-slot="root"]');
});
