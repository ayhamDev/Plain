import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function drag(
  page: Page,
  area: Locator,
  files: { name: string; body?: string; type?: string }[],
  event = 'drop',
) {
  const data = await page.evaluateHandle((files) => {
    const transfer = new DataTransfer();
    for (const file of files)
      transfer.items.add(
        new File([file.body ?? 'text'], file.name, { type: file.type ?? 'text/plain' }),
      );
    return transfer;
  }, files);
  await area.dispatchEvent(event, { dataTransfer: data });
  await data.dispose();
}
const names = (input: Locator) =>
  input.evaluate((node) =>
    Array.from((node as HTMLInputElement).files ?? []).map((file) => file.name),
  );
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

for (const [width, theme, dir] of [
  [1440, 'light', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`documented Dropzone handles keyboard browsing, dragging and rejection at ${width}px ${theme} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      ({ theme, dir }) => {
        localStorage.setItem('plainui-theme', JSON.stringify({ mode: theme, motion: 'system' }));
        localStorage.setItem('plainui-direction', dir);
      },
      { theme, dir },
    );
    await page.goto('/components/dropzone');
    const preview = page.locator('.component-preview'),
      area = preview.locator('.ui-dropzone-area'),
      input = preview.getByLabel('Upload project documents', { exact: true });
    await expect(area).toBeVisible();
    const chooser = page.waitForEvent('filechooser');
    await input.press('Space');
    await (
      await chooser
    ).setFiles({ name: 'review.txt', mimeType: 'text/plain', buffer: Buffer.from('review') });
    await expect(preview.getByRole('list', { name: 'Selected files' })).toHaveText(
      'review.txt1 KB',
    );
    await expect(area).toHaveCSS('outline-width', '2px');
    await input.setInputFiles({
      name: 'wrong.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('x'),
    });
    await expect(preview.getByRole('alert')).toContainText('This file type is not accepted.');
    expect(await names(input)).toEqual(['review.txt']);
    await accessible(page, '.component-preview');
    const long = `${'Project-review-'.repeat(14)}.txt`;
    await drag(page, area, [{ name: long }], 'dragenter');
    await expect(preview.locator('.ui-dropzone')).toHaveAttribute('data-dragging', 'true');
    await preview.screenshot({ path: info.outputPath(`dropzone-drag-${width}-${dir}.png`) });
    await drag(page, area, [{ name: long }]);
    await expect(preview.getByRole('alert')).toHaveCount(0);
    expect(await names(input)).toEqual([long]);
    await expect(preview.locator('.ui-dropzone')).not.toHaveAttribute('data-dragging');
    expect(
      await preview.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
    await accessible(page, '.component-preview');
    await preview.screenshot({ path: info.outputPath(`dropzone-files-${width}-${dir}.png`) });
    await preview.getByRole('button', { name: `Remove ${long}`, exact: true }).click();
    await expect(input).toBeFocused();
    expect(await names(input)).toEqual([]);
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await page.getByRole('switch', { name: 'disabled', exact: true }).click();
    await expect(preview.getByLabel('Upload project documents', { exact: true })).toBeDisabled();
  });
}

test('native form data, refs, required validation and removal work for dropped files', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/dropzone.html');
  const input = page.getByLabel(/^Attachments/),
    area = page.locator('.ui-dropzone-area');
  expect(await input.evaluate((node) => (node as HTMLInputElement).validity.valueMissing)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Focus attachments', exact: true }).click();
  await expect(input).toBeFocused();
  await drag(page, area, [{ name: 'one.txt' }, { name: 'two.txt' }]);
  expect(await names(input)).toEqual(['one.txt', 'two.txt']);
  await page.getByRole('button', { name: 'Save attachments', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Submitted filenames' })).toHaveText(
    '["one.txt","two.txt"]',
  );
  await expect(page.getByRole('status', { name: 'Native picker changes' })).toHaveText('0');
  await page.getByRole('button', { name: 'Remove one.txt', exact: true }).click();
  await expect(input).toBeFocused();
  expect(await names(input)).toEqual(['two.txt']);
  await page.getByRole('button', { name: 'Remove two.txt', exact: true }).click();
  expect(await input.evaluate((node) => (node as HTMLInputElement).validity.valueMissing)).toBe(
    true,
  );
});

for (const mode of ['controlled', 'uncontrolled']) {
  test(`native reset restores ${mode} files and clears rejected batches`, async ({ page }) => {
    await page.goto(
      `/tests/fixtures/dropzone.html?default&${mode === 'controlled' ? 'controlled' : ''}`,
    );
    const input = page.getByLabel(/^Attachments/),
      area = page.locator('.ui-dropzone-area');
    expect(await names(input)).toEqual(['saved.txt']);
    await drag(page, area, [{ name: 'wrong.pdf', type: 'application/pdf' }]);
    expect(await names(input)).toEqual(['saved.txt']);
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: 'Reset attachments', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect.poll(() => names(input)).toEqual(['saved.txt']);
    await page.getByRole('button', { name: 'Save attachments', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Submitted filenames' })).toHaveText(
      '["saved.txt"]',
    );
  });
}

for (const mode of ['controlled', 'uncontrolled']) {
  test(`FileUpload native reset restores ${mode} files after the default browser action`, async ({
    page,
  }) => {
    await page.goto(
      `/tests/fixtures/dropzone.html?default&fileupload&${mode === 'controlled' ? 'controlled' : ''}`,
    );
    const input = page.getByLabel(/^Attachments/);
    await expect.poll(() => names(input)).toEqual(['saved.txt']);
    await page.getByRole('button', { name: 'Reset attachments', exact: true }).click();
    await expect.poll(() => names(input)).toEqual(['saved.txt']);
    await page.getByRole('button', { name: 'Save attachments', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Submitted filenames' })).toHaveText(
      '["saved.txt"]',
    );
  });
}

test('controlled proposals stay pending until committed and canceled resets preserve the selection', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/dropzone.html?default&controlled&hold');
  const input = page.getByLabel(/^Attachments/);
  await input.setInputFiles({
    name: 'next.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('next'),
  });
  await expect(page.getByRole('status', { name: 'Proposed filenames' })).toHaveText('["next.txt"]');
  expect(await names(input)).toEqual(['saved.txt']);
  await page.getByRole('button', { name: 'Commit proposed files' }).click();
  await expect.poll(() => names(input)).toEqual(['next.txt']);
  await page.getByRole('checkbox', { name: 'Cancel reset' }).check();
  await page.getByRole('button', { name: 'Reset attachments' }).click();
  expect(await names(input)).toEqual(['next.txt']);
  await page.getByRole('button', { name: 'Remove next.txt' }).click();
  expect(await names(input)).toEqual(['next.txt']);
  await page.getByRole('button', { name: 'Commit proposed files' }).click();
  await expect.poll(() => names(input)).toEqual([]);
});

test('size/count validation rejects atomically and disabled drops cannot replace files', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/dropzone.html?default');
  const input = page.getByLabel(/^Attachments/),
    area = page.locator('.ui-dropzone-area');
  await drag(page, area, [{ name: 'large.txt', body: 'x'.repeat(11) }]);
  await expect(page.getByRole('alert')).toContainText('too large');
  expect(await names(input)).toEqual(['saved.txt']);
  await drag(page, area, [{ name: 'one.txt' }, { name: 'two.txt' }, { name: 'three.txt' }]);
  await expect(page.getByRole('alert')).toContainText('Too many files');
  expect(await names(input)).toEqual(['saved.txt']);
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await drag(page, area, [{ name: 'next.txt' }]);
  expect(await names(input)).toEqual(['saved.txt']);
  await expect(page.getByRole('status', { name: 'File changes' })).toHaveText('0');
});

test('local tokens, render content and reduced motion retain keyboard focus', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/dropzone.html?custom&dir=rtl&theme=dark');
  const input = page.getByLabel(/^Attachments/),
    area = page.locator('.ui-dropzone-area');
  await expect(area).toHaveCSS('border-top-left-radius', '12px');
  await expect(area).toHaveCSS('min-height', '160px');
  await page.getByRole('button', { name: 'Focus attachments' }).click();
  await expect(input).toBeFocused();
  await expect(area).toHaveCSS('outline-color', 'rgb(0, 126, 128)');
  expect(
    await area.evaluate((node) =>
      getComputedStyle(node)
        .transitionDuration.split(',')
        .every((duration) => parseFloat(duration) <= 0.001),
    ),
  ).toBe(true);
  await drag(page, area, [{ name: 'review.txt' }], 'dragenter');
  await expect(page.getByText('Release documents')).toBeVisible();
  await drag(page, area, [{ name: 'review.txt' }]);
  await expect(page.getByText('Add files (1 selected)')).toBeVisible();
  await accessible(page, 'main');
  await page.screenshot({ path: info.outputPath('dropzone-custom-rtl.png') });
});

test('unstyled and forced-color native pickers remain usable', async ({ page }) => {
  await page.goto('/tests/fixtures/dropzone.html?unstyled&motion=none');
  const input = page.getByLabel(/^Attachments/);
  await expect(input).not.toHaveClass(/ui-dropzone-input/);
  const chooser = page.waitForEvent('filechooser');
  await input.press('Space');
  await (
    await chooser
  ).setFiles({ name: 'plain.txt', mimeType: 'text/plain', buffer: Buffer.from('plain') });
  expect(await names(input)).toEqual(['plain.txt']);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/fixtures/dropzone.html?motion=none');
  await page.getByRole('button', { name: 'Focus attachments' }).click();
  await expect(page.locator('.ui-dropzone-area')).toHaveCSS('outline-width', '2px');
  await accessible(page, 'main');
});
