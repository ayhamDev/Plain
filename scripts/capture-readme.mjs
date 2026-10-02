import { chromium } from '@playwright/test';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:5173');
if (!['http:', 'https:'].includes(origin.protocol)) {
  throw new Error('Supply the HTTP origin of a running P.UI documentation server.');
}
const output = fileURLToPath(new URL('../docs/assets/readme/', import.meta.url));
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' });
try {
  for (const mode of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1540, height: 1100 },
      deviceScaleFactor: 2,
      colorScheme: mode,
      reducedMotion: 'reduce',
      locale: 'en-US',
      timezoneId: 'Africa/Cairo',
    });
    try {
      // Use the components' initials fallback instead of third-party photo assets.
      await context.route('https://images.unsplash.com/**', (route) => route.abort());
      await context.addInitScript((mode) => {
        localStorage.setItem(
          'plainui-theme',
          JSON.stringify({
            mode,
            accent: 'neutral',
            color: null,
            radius: 6,
            borders: 'subtle',
            motion: 'none',
          }),
        );
      }, mode);
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date('2026-10-02T12:00:00Z'));
      await page.goto(new URL('/', origin).href, { waitUntil: 'domcontentloaded' });
      await page.locator(`html[data-theme="${mode}"]`).waitFor();
      await page.locator('.calendar-demo [data-ui="calendar"]').waitFor();
      await page.evaluate(() => document.fonts.ready);

      const gallery = page.locator('.showcase-grid');
      await gallery.scrollIntoViewIfNeeded();
      const previewPath = path.join(output, `preview-${mode}.png`);
      await gallery.screenshot({ path: previewPath, animations: 'disabled', scale: 'css' });

      // Export the real header wordmark with its existing font, glyph, and brand pip.
      await page.locator('.brand .pui-logo').evaluate((logo) => {
        const host = document.createElement('div');
        host.id = 'readme-logo-export';
        host.className = 'brand';
        Object.assign(host.style, {
          position: 'fixed',
          inset: '24px auto auto 24px',
          width: 'max-content',
          padding: '12px',
          background: 'transparent',
          border: '0',
          zIndex: '10000',
        });
        const wordmark = logo.cloneNode(true);
        wordmark.style.fontSize = '96px';
        host.append(wordmark);
        document.body.append(host);
      });
      await page.addStyleTag({
        content: `
          body > :not(#readme-logo-export),
          body > :not(#readme-logo-export) * { visibility: hidden !important; }
          html, body { background: transparent !important; }
        `,
      });
      const logoPath = path.join(output, `logo-${mode}.png`);
      await page.locator('#readme-logo-export').screenshot({
        path: logoPath,
        animations: 'disabled',
        omitBackground: true,
        scale: 'device',
      });
      for (const asset of [logoPath, previewPath]) {
        console.log(`${path.relative(process.cwd(), asset)} (${(await stat(asset)).size} bytes)`);
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
