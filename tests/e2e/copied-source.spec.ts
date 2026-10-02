import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, normalizePath } from 'vite';

interface SourceItem {
  id: string;
  category: string;
  path: string;
}
const manifest = JSON.parse(readFileSync('public/compositions/manifest.json', 'utf8')) as {
  blocks: SourceItem[];
  templates: SourceItem[];
};
const categories = [...new Set(manifest.blocks.map((item) => item.category))];
const examples = [
  ...categories.map((category) => manifest.blocks.find((item) => item.category === category)!),
  ...['web-apps-project-space', 'mobile-apps-routines'].map((id) =>
    manifest.templates.find((item) => item.id === id)!,
  ),
];
let fixture: Promise<{ code: string; styles: string }> | undefined;

async function copiedFixture() {
  fixture ??= (async () => {
    const entry = normalizePath(fileURLToPath(new URL('./__copied-source.js', import.meta.url)));
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [
        {
          name: 'copied-source-browser-fixture',
          enforce: 'pre',
          resolveId: (id) => (normalizePath(id) === entry ? `\0${entry}` : undefined),
          load: (id) =>
            id === `\0${entry}`
              ? [
                  'import * as React from "react"; export { React };',
                  'export { createRoot } from "react-dom/client";',
                  'export { PlainProvider } from "@plain/ui";',
                  ...examples.map(
                    (item, index) =>
                      `import Example${index} from ${JSON.stringify(normalizePath(fileURLToPath(new URL(`../../public/compositions/${item.path}`, import.meta.url))))};`,
                  ),
                  `export const examples = { ${examples.map((item, index) => `${JSON.stringify(item.id)}: Example${index}`).join(', ')} };`,
                ].join('\n')
              : undefined,
        },
      ],
      build: {
        write: false,
        minify: false,
        lib: { entry, formats: ['es'] },
        rolldownOptions: { output: { codeSplitting: false } },
      },
    });
    const output = Array.isArray(result) ? result[0] : result;
    if (!('output' in output)) throw new Error('Expected a browser bundle');
    const chunk = output.output.find((item) => item.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk') throw new Error('Missing copied source module');
    const styles = output.output
      .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
      .map((item) => (item.type === 'asset' ? String(item.source) : ''))
      .join('\n');
    return { code: chunk.code, styles };
  })();
  return fixture;
}

async function mountCopy(page: Page, id: string, profile: { mode: string; dir: string }) {
  const { code, styles } = await copiedFixture();
  await page.route('**/__copied-source.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: code }),
  );
  await page.goto('/');
  await page.evaluate(
    async ({ styles, id, profile }) => {
      const path = '/__copied-source.js';
      const { React, createRoot, PlainProvider, examples } = await import(/* @vite-ignore */ path);
      // Replace the docs with only the packed CSS and the downloaded application's source.
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => node.remove());
      document.body.replaceChildren();
      const css = document.createElement('style');
      css.textContent =
        styles + '\nbody { margin: 0; } #copy-host { padding: 16px; min-width: 0; }';
      document.head.append(css);
      const host = document.createElement('main');
      host.id = 'copy-host';
      document.body.append(host);
      createRoot(host).render(
        React.createElement(
          PlainProvider,
          {
            persist: false,
            dir: profile.dir,
            theme: { mode: profile.mode, color: null, accent: 'neutral' },
          },
          React.createElement(examples[id]),
        ),
      );
    },
    { styles, id, profile },
  );
  await expect(page.locator('#copy-host [data-block]').first()).toBeVisible();
}

for (const profile of [
  { width: 1200, height: 1000, mode: 'light', dir: 'ltr' },
  { width: 390, height: 844, mode: 'dark', dir: 'rtl' },
] as const) {
  test(`downloaded examples work independently with packed styles at ${profile.width}px`, async ({
    page,
  }) => {
    test.setTimeout(240000);
    await page.setViewportSize(profile);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const item of examples) {
      await test.step(item.id, async () => {
        const source = readFileSync(`public/compositions/${item.path}`, 'utf8');
        expect(source).not.toContain('@plain/ui/blocks');
        expect(source).not.toContain('src/docs');
        await mountCopy(page, item.id, profile);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const host = page.locator('#copy-host');
        await expect(host.locator('button button, a button, button a')).toHaveCount(0);
        if (item.category === 'charts')
          await expect(host.locator('svg.recharts-surface').first()).toBeVisible();
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map((item) => ({
            id: item.id,
            nodes: item.nodes.map((node) => node.target),
          })),
        ).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });

  test(`copied authentication and template workflows retain local behavior at ${profile.width}px`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(profile);
    await mountCopy(page, 'auth-password', profile);
    await page
      .getByRole('textbox', { name: 'Email address', exact: true })
      .fill('avery@example.com');
    await page.getByLabel(/^Password/, { exact: false }).fill('prototype-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your account', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByLabel(/^Password/)).toHaveValue('');
    await mountCopy(page, 'web-apps-project-space', profile);
    const app = page.getByRole('region', { name: 'Atlas application', exact: true });
    const initialScreen = await app
      .locator('nav [aria-current="page"]')
      .first()
      .getAttribute('aria-label');
    const navigate = async (name: string) => {
      const menu = app.getByRole('button', { name: 'Open navigation', exact: true });
      if (await menu.isVisible()) await menu.click();
      await app.locator('nav:visible').first().getByRole('button', { name, exact: true }).click();
    };
    await app.getByRole('button', { name: 'New project', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Project name', exact: true }).fill('October launch');
    await dialog.getByRole('textbox', { name: 'Owner', exact: true }).fill('Avery');
    await dialog.getByLabel(/^Target date/).fill('2026-10-15');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(app.locator('.pt-created-records')).toContainText('October launch');
    await navigate('Files');
    await expect(app.locator('.pt-created-records')).toHaveCount(0);
    await navigate(initialScreen!);
    await expect(app.locator('.pt-created-records')).toContainText('October launch');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
