import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const profile of [
  { width: 1440, height: 1000, mode: 'light', dir: 'ltr' },
  { width: 390, height: 844, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`manual neutral defaults and restored hero at ${profile.width}px`, async ({ page }) => {
    await page.setViewportSize(profile);
    await page.addInitScript(({ mode, dir }) => {
      localStorage.setItem(
        'plainui-theme',
        JSON.stringify({ mode, color: null, accent: 'neutral' }),
      );
      localStorage.setItem('plainui-direction', dir);
    }, profile);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'PlainUI.', level: 1 })).toBeVisible();
    await expect(page.getByRole('img', { name: 'P.UI', exact: true }).first()).toBeVisible();
    const colors = await page.locator('html').evaluate((node) => {
      const css = getComputedStyle(node);
      return Object.fromEntries(
        [
          'background',
          'foreground',
          'muted',
          'muted-foreground',
          'border',
          'primary',
          'primary-container',
        ].map((key) => [
          key,
          css
            .getPropertyValue(`--ui-${key}`)
            .trim()
            .replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3'),
        ]),
      );
    });
    expect(colors).toEqual(
      profile.mode === 'light'
        ? {
            background: '#ffffff',
            foreground: '#202321',
            muted: '#f5f6f5',
            'muted-foreground': '#666b68',
            border: '#e5e7e6',
            primary: '#252826',
            'primary-container': '#f2f3f2',
          }
        : {
            background: '#141615',
            foreground: '#edeff0',
            muted: '#242825',
            'muted-foreground': '#a2aaa5',
            border: '#333a35',
            primary: '#e6ebe7',
            'primary-container': '#292e2b',
          },
    );
    await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
    const panel = page.locator('.theme-editor');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('overflow-x', 'hidden');
    expect(
      await panel.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return [...node.querySelectorAll('input, button, .code-block')]
          .filter((child) => {
            const box = child.getBoundingClientRect();
            return box.width > 0 && (box.left < bounds.left - 1 || box.right > bounds.right + 1);
          })
          .map((child) => child.outerHTML);
      }),
    ).toEqual([]);
    const preset = page.getByRole('button', { name: 'Blue', exact: true });
    await preset.click();
    await expect
      .poll(() =>
        page.locator('html').evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--ui-background')
            .trim()
            .replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3'),
        ),
      )
      .not.toBe(colors.background);
    await page.getByRole('button', { name: 'Neutral', exact: true }).click();
    await expect
      .poll(() =>
        page.locator('html').evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--ui-background')
            .trim()
            .replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3'),
        ),
      )
      .toBe(colors.background);
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.goto('/components/typography');
    const preview = page.locator('.component-preview');
    await expect(preview.locator('h2[data-ui="typography"]')).toBeVisible();
    await expect(preview.locator('p[data-ui="typography"]').first()).toBeVisible();
    await expect(preview.locator('a[data-ui="typography"]')).toHaveAttribute('href');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test(`submenu is portalled without parent overflow at ${profile.width}px`, async ({ page }) => {
    await page.setViewportSize(profile);
    await page.addInitScript((dir) => localStorage.setItem('plainui-direction', dir), profile.dir);
    await page.goto('/components/dropdown-menu');
    const trigger = page.getByRole('button', { name: 'Project actions', exact: true });
    await trigger.click();
    const parent = page.getByRole('menu').first();
    const width = await parent.evaluate((node) => node.clientWidth);
    const subTrigger = page.getByRole('menuitem', { name: 'Move to', exact: true });
    await subTrigger.focus();
    await subTrigger.press(profile.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.getByRole('menu')).toHaveCount(2);
    const submenu = page.getByRole('menu').last();
    expect(await parent.evaluate((node) => node.querySelector('[role="menu"]'))).toBe(null);
    expect(await parent.evaluate((node) => node.clientWidth)).toBe(width);
    expect(await parent.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    const box = (await submenu.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(profile.width);
    await submenu.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
