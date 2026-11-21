import { test, expect, type Locator } from '@playwright/test';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const value = 'https://github.com/ayhamDev/Plain';
async function decode(code: Locator) {
  await code.evaluate(
    async (node) => await Promise.all(node.getAnimations({ subtree: true }).map((a) => a.finished)),
  );
  const image = PNG.sync.read(await code.screenshot());
  return jsQR(new Uint8ClampedArray(image.data), image.width, image.height)?.data;
}
test('square and circular codes decode across module and finder shapes', async ({ page }) => {
  for (const shape of ['square', 'circle'])
    for (const modules of ['square', 'rounded', 'dots', 'diamond'])
      for (const finders of ['square', 'rounded', 'circle', 'dots']) {
        await page.goto(
          `/tests/fixtures/qr-code.html?shape=${shape}&modules=${modules}&finders=${finders}&static&size=240`,
        );
        const code = page.getByRole('img', { name: 'Project QR code' });
        await expect(code).toHaveAttribute('data-state', 'ready');
        expect(await decode(code), `${shape} ${modules} ${finders}`).toBe(value);
      }
});
for (const query of [
  'shape=circle&size=192',
  'gradient=linear&logo',
  'gradient=radial&logo&version=7',
  'shape=circle&gradient=linear&logo&size=192',
  'logo&version=7&mask=3',
  'modules=rounded&scale=0.85',
  'shape=circle&noPattern',
  'customRender&logo&version=7',
]) {
  test(`custom code decodes: ${query}`, async ({ page }, info) => {
    await page.goto(`/tests/fixtures/qr-code.html?${query}&static`);
    const code = page.getByRole('img', { name: 'Project QR code' });
    expect(await decode(code)).toBe(value);
    await code.screenshot({ path: info.outputPath('custom-qr.png') });
  });
}
test('default assembly replays on value changes and follows live motion preferences', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tests/fixtures/qr-code.html?duration=1000');
  const code = page.getByRole('img', { name: 'Project QR code' });
  await expect(code).toHaveAttribute('data-animation', 'assemble');
  expect(
    await code.evaluate((node) =>
      node.getAnimations({ subtree: true }).some((a) => a.effect?.getTiming().iterations === 1),
    ),
  ).toBe(true);
  expect(await decode(code)).toBe(value);
  await page.getByRole('textbox', { name: 'Encoded content' }).fill('Animated update');
  expect(
    await code.evaluate((node) =>
      node.getAnimations({ subtree: true }).some((a) => a.playState === 'running'),
    ),
  ).toBe(true);
  expect(await decode(code)).toBe('Animated update');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(code).toHaveAttribute('data-animation', 'none');
  expect(await decode(code)).toBe('Animated update');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(code).toHaveAttribute('data-animation', 'assemble');
});
test('fade, opt-out and provider policies keep a complete static code', async ({ page }) => {
  for (const query of ['animation=fade&duration=100', 'static', 'motion=none', 'motion=reduced']) {
    await page.goto(`/tests/fixtures/qr-code.html?${query}`);
    const code = page.getByRole('img', { name: 'Project QR code' });
    await expect(code).toHaveAttribute(
      'data-animation',
      query.startsWith('animation') ? 'fade' : 'none',
    );
    expect(await decode(code)).toBe(value);
  }
});

for (const preset of ['assemble', 'scan', 'reveal']) {
  for (const shape of ['square', 'circle']) {
    test(`${preset} ${shape} settles to a decodable code with bounded animation geometry`, async ({
      page,
    }, info) => {
      await page.goto(
        `/tests/fixtures/qr-code.html?animation=${preset}&shape=${shape}&gradient=linear&logo&duration=1000`,
      );
      const code = page.getByRole('img', { name: 'Project QR code' });
      await expect(code).toHaveAttribute('data-animation', preset);
      expect(await code.locator('rect').count()).toBeLessThanOrEqual(70);
      const running = await code.evaluate((node) => {
        const animations = node.getAnimations({ subtree: true });
        animations.forEach((animation) => {
          animation.pause();
          animation.currentTime = 300;
        });
        return animations.length;
      });
      expect(running).toBeGreaterThan(0);
      const geometry = await code.locator('[data-slot="foreground"]').getAttribute('d');
      await code.screenshot({ path: info.outputPath('mid-animation.png'), animations: 'allow' });
      await code.evaluate((node) =>
        node.getAnimations({ subtree: true }).forEach((animation) => animation.finish()),
      );
      expect(await decode(code)).toBe(value);
      expect(await code.locator('[data-slot="foreground"]').getAttribute('d')).toBe(geometry);
      await code.screenshot({ path: info.outputPath('settled.png') });
    });
  }
}

test('dense matrices keep a bounded mask and downloads are complete during a scan', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/qr-code.html?animation=assemble&version=40');
  const dense = page.getByRole('img', { name: 'Project QR code' });
  expect(await dense.locator('rect').count()).toBeLessThanOrEqual(70);
  await page.goto('/components/qr-code');
  const preview = page.locator('.component-preview');
  await preview.getByRole('combobox', { name: 'Animation style', exact: true }).click();
  await page.getByRole('option', { name: 'Soft scan', exact: true }).click();
  const code = preview.getByRole('img', { name: 'QR code for the entered content' });
  await code.evaluate((node) =>
    node.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = 50;
    }),
  );
  const download = page.waitForEvent('download');
  await preview.getByRole('button', { name: 'Download SVG', exact: true }).click();
  const { readFile } = await import('node:fs/promises');
  const svg = await readFile((await (await download).path())!, 'utf8');
  const result = await page.evaluate(async (svg) => {
    const image = new Image();
    image.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return {
        width: canvas.width,
        height: canvas.height,
        data: [...context.getImageData(0, 0, canvas.width, canvas.height).data],
      };
    } finally {
      URL.revokeObjectURL(image.src);
    }
  }, svg);
  expect(jsQR(new Uint8ClampedArray(result.data), result.width, result.height)?.data).toBe(value);
});
test('documented circular gradient logo downloads as a self-contained decodable SVG', async ({
  page,
}) => {
  await page.goto('/components/qr-code');
  const preview = page.locator('.component-preview');
  await preview.getByRole('combobox', { name: 'QR style' }).click();
  await page.getByRole('option', { name: 'Circular', exact: true }).click();
  await preview.getByRole('switch', { name: 'Center logo' }).click();
  await preview.getByRole('switch', { name: 'Gradient', exact: true }).click();
  const code = preview.getByRole('img', { name: 'QR code for the entered content', exact: true });
  expect(await decode(code)).toBe(value);
  const download = page.waitForEvent('download');
  await preview.getByRole('button', { name: 'Download SVG' }).click();
  const file = await download;
  const { readFile } = await import('node:fs/promises');
  const svg = await readFile((await file.path())!, 'utf8');
  const pixels = await page.evaluate(async (svg) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const c = canvas.getContext('2d')!;
      c.drawImage(image, 0, 0);
      return {
        w: canvas.width,
        h: canvas.height,
        data: [...c.getImageData(0, 0, canvas.width, canvas.height).data],
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, svg);
  expect(jsQR(new Uint8ClampedArray(pixels.data), pixels.w, pixels.h)?.data).toBe(value);
});
