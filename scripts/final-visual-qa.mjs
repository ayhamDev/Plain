import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const engine = process.env.BROWSER_ENGINE ?? 'chromium';
const browserType = { chromium, firefox, webkit }[engine];
assert(browserType, `Unknown browser engine: ${engine}`);
const outputDirectory = `.preview/final/${engine}`;
await mkdir(outputDirectory, { recursive: true });
const browser = await browserType.launch({
  ...(engine === 'chromium' ? { channel: 'chrome' } : {}),
  headless: true,
});
const scenarios = [
  { name: 'desktop-light', width: 1440, height: 1000, mode: 'light', dir: 'ltr', path: '/' },
  { name: 'mobile-light', width: 390, height: 844, mode: 'light', dir: 'ltr', path: '/' },
  { name: 'desktop-dark', width: 1440, height: 1000, mode: 'dark', dir: 'ltr', path: '/' },
  { name: 'mobile-rtl-dark', width: 390, height: 844, mode: 'dark', dir: 'rtl', path: '/' },
  {
    name: 'dashboard-wide',
    width: 1920,
    height: 1080,
    mode: 'light',
    dir: 'ltr',
    path: '/examples',
  },
  {
    name: 'input-mobile-rtl',
    width: 390,
    height: 844,
    mode: 'dark',
    dir: 'rtl',
    path: '/components/input',
  },
];
const report = [];
scenarios.push({
  name: 'dialog-mobile-rtl',
  width: 390,
  height: 844,
  mode: 'dark',
  dir: 'rtl',
  path: '/components/dialog',
  openDialog: true,
});
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
    });
    await context.addInitScript(({ mode, dir }) => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode, accent: 'neutral', radius: 6, density: 'comfortable' }),
      );
      localStorage.setItem('plainui-direction', dir);
    }, scenario);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}${scenario.path}`, { waitUntil: 'networkidle' });
    await page.locator('h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (scenario.path === '/') {
      await page.locator('.calendar-demo [data-ui="calendar"]').waitFor({ state: 'attached' });
    }
    if (scenario.openDialog) {
      await page.getByRole('button', { name: 'Edit profile' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await page.waitForTimeout(250);
      const bounds = await dialog.boundingBox();
      assert(
        bounds &&
          bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= scenario.width &&
          bounds.y + bounds.height <= scenario.height,
        'Dialog must fit entirely in the RTL mobile viewport.',
      );
    }
    await page.screenshot({ path: `${outputDirectory}/${scenario.name}.png` });
    await page.screenshot({ path: `${outputDirectory}/${scenario.name}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    assert.equal(overflow, false, `${scenario.name}: horizontal overflow`);
    assert.deepEqual(errors, [], `${scenario.name}: runtime errors`);
    assert.deepEqual(
      accessibility.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
      [],
      `${scenario.name}: accessibility violations`,
    );
    report.push({
      ...scenario,
      title: await page.title(),
      overflow,
      errors,
      accessibilityViolations: 0,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${outputDirectory}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
