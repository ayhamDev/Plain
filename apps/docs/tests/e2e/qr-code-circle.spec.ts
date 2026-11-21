import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

async function decoded(code: Locator) {
  const png = PNG.sync.read(await code.screenshot());
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}
const repository = 'https://github.com/ayhamDev/Plain';

for (const size of [192, 240]) {
  for (const level of ['L', 'M', 'Q', 'H']) {
    test(`integrated circular codes decode at ${size}px with correction ${level}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 390, height: 800 });
      for (const value of [repository, 'https://nothing.tech', 'مرحبا بكم في P.UI 👋', 'A']) {
        await page.goto(
          `/tests/fixtures/qr-code.html?shape=circle&size=${size}&level=${level}&static&value=${encodeURIComponent(value)}`,
        );
        const code = page.getByRole('img', { name: 'Project QR code' });
        await expect(code).toHaveAttribute('data-finder-shape', 'dots');
        await expect(code).toHaveAttribute('data-circle-pattern', 'integrated');
        expect(await decoded(code), value).toBe(value);
        if (value === repository) await code.screenshot({ path: info.outputPath('circular.png') });
        await code.evaluate((node) => {
          node.style.transform = 'translate(0.5px, 0.5px)';
        });
        expect(await decoded(code), `${value} at a fractional position`).toBe(value);
      }
    });
  }
}

test('circular fill aligns with the matrix without a blank square band or clipped edge dots', async ({
  page,
}) => {
  for (const version of [2, 3, 7]) {
    await page.goto(
      `/tests/fixtures/qr-code.html?shape=circle&version=${version}&static&value=Version${version}`,
    );
    const code = page.getByRole('img', { name: 'Project QR code' });
    const geometry = await code.evaluate((node) => {
      const extent = (node as SVGSVGElement).viewBox.baseVal.width;
      const origin = Number(
        node
          .querySelector('[data-slot="foreground"]')!
          .getAttribute('transform')!
          .match(/[\d.]+/)![0],
      );
      const matrix = extent - origin * 2;
      const points = [
        ...node
          .querySelector('[data-slot="circle"]')!
          .getAttribute('d')!
          .matchAll(/M(-?[\d.]+) (-?[\d.]+)/g),
      ].map((match) => ({ x: Number(match[1]) + 0.45, y: Number(match[2]) }));
      return { extent, origin, matrix, points };
    });
    expect(geometry.matrix / geometry.extent).toBeGreaterThan(0.55);
    let joined = false;
    for (const point of geometry.points) {
      const x = point.x - geometry.origin - 0.5,
        y = point.y - geometry.origin - 0.5;
      expect(x).toBeCloseTo(Math.round(x), 3);
      expect(y).toBeCloseTo(Math.round(y), 3);
      expect(
        Math.hypot(point.x - geometry.extent / 2, point.y - geometry.extent / 2) + 0.45,
      ).toBeLessThanOrEqual(geometry.extent / 2 - 4 + 0.001);
      if (x >= -3 && x <= geometry.matrix + 2 && y >= -3 && y <= geometry.matrix + 2) joined = true;
      expect(
        (x >= -1 && x <= 7 && y >= -1 && y <= 7) ||
          (x >= geometry.matrix - 8 && x <= geometry.matrix && y >= -1 && y <= 7) ||
          (x >= -1 && x <= 7 && y >= geometry.matrix - 8 && y <= geometry.matrix),
      ).toBe(false);
    }
    expect(joined).toBe(true);
    expect(await decoded(code)).toBe(`Version${version}`);
  }
});

test('separated and plain circular layouts retain a full square margin', async ({ page }) => {
  for (const query of ['pattern=separated', 'noPattern']) {
    await page.goto(`/tests/fixtures/qr-code.html?shape=circle&${query}&static`);
    const code = page.getByRole('img', { name: 'Project QR code' });
    expect(await decoded(code)).toBe(repository);
    if (query === 'noPattern') await expect(code.locator('[data-slot="circle"]')).toHaveCount(0);
    else {
      const clear = await code.evaluate((node) => {
        const extent = (node as SVGSVGElement).viewBox.baseVal.width;
        const origin = Number(
          node
            .querySelector('[data-slot="foreground"]')!
            .getAttribute('transform')!
            .match(/[\d.]+/)![0],
        );
        const matrix = extent - origin * 2;
        return [
          ...node
            .querySelector('[data-slot="circle"]')!
            .getAttribute('d')!
            .matchAll(/M(-?[\d.]+) (-?[\d.]+)/g),
        ].every((point) => {
          const x = Number(point[1]) + 0.45 - origin - 0.5;
          const y = Number(point[2]) - origin - 0.5;
          return x < -4 || x >= matrix + 4 || y < -4 || y >= matrix + 4;
        });
      });
      expect(clear).toBe(true);
    }
  }
});

test('the integrated circular example decodes in dark RTL and keeps its native accessible surface', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tests/fixtures/qr-code.html?shape=circle&size=192&theme=dark&dir=rtl&static');
  const code = page.getByRole('img', { name: 'Project QR code' });
  expect(await decoded(code)).toBe(repository);
  const audit = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations.map((violation) => violation.id)).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  await code.screenshot({ path: info.outputPath('circular-dark-rtl.png') });
});

test('dotted finder rings remain readable when the circular code is rotated', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto('/tests/fixtures/qr-code.html?shape=circle&static');
  const code = page.getByRole('img', { name: 'Project QR code' });
  // Keep the rotated bounding box inside the viewport so its capture stays complete.
  await code.evaluate((node) => {
    node.style.marginInlineStart = '100px';
  });
  for (const angle of [-25, 25, 90]) {
    await code.evaluate((node, angle) => {
      node.style.transform = `rotate(${angle}deg)`;
    }, angle);
    expect(await decoded(code), `rotation ${angle}`).toBe(repository);
  }
});

test.describe('high density circular rendering', () => {
  test.use({ deviceScaleFactor: 2 });
  test('default circular dots retain their spacing and scan on high density phone screens', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    for (const value of [repository, 'مرحبا بكم في P.UI 👋', 'A']) {
      await page.goto(
        `/tests/fixtures/qr-code.html?shape=circle&size=192&static&value=${encodeURIComponent(value)}`,
      );
      expect(await decoded(page.getByRole('img', { name: 'Project QR code' }))).toBe(value);
    }
  });
});
