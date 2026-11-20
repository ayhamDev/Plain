import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function border(control: Locator) {
  return control.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      colors: [
        css.borderTopColor,
        css.borderRightColor,
        css.borderBottomColor,
        css.borderLeftColor,
      ],
      widths: [
        css.borderTopWidth,
        css.borderRightWidth,
        css.borderBottomWidth,
        css.borderLeftWidth,
      ],
      shadow: css.boxShadow,
    };
  });
}

async function focusWithoutBorderChange(page: Page, control: Locator, frame = control) {
  await control.evaluate((node) => (node as HTMLElement).blur());
  const resting = await border(frame);
  // Establish keyboard modality for non-text controls as well as text inputs.
  await page.keyboard.press('Tab');
  await control.focus();
  await expect(control).toBeFocused();
  expect(await border(frame)).toEqual(resting);
  await expect(frame).toHaveCSS('outline-style', 'solid');
  await expect(frame).toHaveCSS('outline-width', '2px');
  await expect(frame).toHaveCSS('outline-offset', '2px');
  expect(await frame.evaluate((node) => getComputedStyle(node).outlineColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
}

for (const [width, theme, dir] of [
  [1440, 'light', 'ltr'],
  [320, 'light', 'ltr'],
  [390, 'dark', 'rtl'],
] as const) {
  test(`field focus preserves borders, outlines and editing at ${width}px ${theme} ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tests/fixtures/input-focus.html?theme=${theme}&dir=${dir}`);
    const form = page.getByRole('form', { name: 'Focus examples' });
    await form.getByRole('button', { name: 'Start keyboard navigation' }).press('Tab');
    await expect(form.getByRole('textbox', { name: 'Input outlined', exact: true })).toBeFocused();
    for (const type of ['Input', 'Textarea']) {
      for (const variant of ['outlined', 'filled', 'ghost', 'contrast']) {
        const control = form.getByRole('textbox', { name: `${type} ${variant}`, exact: true });
        await focusWithoutBorderChange(page, control);
        await control.fill(`${type} ${variant} updated`);
      }
    }
    const select = form.getByRole('combobox', { name: 'Plan', exact: true });
    await focusWithoutBorderChange(page, select);
    await select.press('Space');
    await page.getByRole('option', { name: 'Team', exact: true }).click();
    await expect(select).toBeFocused();
    const number = form.getByRole('spinbutton', { name: 'Seats', exact: true });
    await focusWithoutBorderChange(page, number, form.locator('.ui-number-input'));
    await number.fill('7');
    await number.press('ArrowUp');
    await expect(number).toHaveValue('8');
    const invalid = form.getByRole('textbox', { name: 'Invalid field', exact: true });
    await focusWithoutBorderChange(page, invalid);
    expect(
      await invalid.evaluate((node) => {
        const css = getComputedStyle(node);
        return css.borderTopColor === css.outlineColor;
      }),
    ).toBe(true);
    await focusWithoutBorderChange(page, form.getByRole('textbox', { name: 'Read only field' }));
    await expect(form.getByRole('textbox', { name: 'Disabled field' })).toBeDisabled();
    const local = form.getByRole('textbox', { name: 'Local input', exact: true });
    await focusWithoutBorderChange(page, local);
    await expect(local).toHaveCSS('border-top-color', 'rgb(153, 115, 76)');
    await expect(local).toHaveCSS('outline-color', 'rgb(0, 126, 128)');
    const localSelect = form.getByRole('combobox', { name: 'Local select', exact: true });
    await focusWithoutBorderChange(page, localSelect);
    await expect(localSelect).toHaveCSS('border-top-color', 'rgb(129, 92, 177)');
    await expect(localSelect).toHaveCSS('outline-color', 'rgb(0, 126, 128)');
    await form.getByRole('button', { name: 'Save fields' }).click();
    const saved = JSON.parse(
      (await form.getByRole('status', { name: 'Saved fields' }).textContent())!,
    );
    expect(saved['input-outlined']).toBe('Input outlined updated');
    expect(saved['notes-outlined']).toBe('Textarea outlined updated');
    expect(saved.plan).toBe('team');
    expect(saved.seats).toBe('8');
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((value) => value.id)).toEqual([]);
    await focusWithoutBorderChange(
      page,
      form.getByRole('textbox', { name: 'Input outlined', exact: true }),
    );
    await page.screenshot({ path: info.outputPath(`input-focus-${width}-${theme}-${dir}.png`) });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}

for (const theme of ['light', 'dark']) {
  test(`borderless focus keeps the outline without introducing a border in ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/tests/fixtures/input-focus.html?borderless&theme=${theme}`);
    for (const [role, name] of [
      ['textbox', 'Input outlined'],
      ['textbox', 'Textarea outlined'],
      ['combobox', 'Plan'],
    ] as const) {
      const control = page.getByRole(role, { name, exact: true });
      await focusWithoutBorderChange(page, control);
      await expect(control).toHaveCSS('border-top-width', '0px');
    }
  });
}

test('forced colors retain the native field boundary and visible keyboard outline', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/tests/fixtures/input-focus.html');
  for (const [role, name] of [
    ['textbox', 'Input outlined'],
    ['textbox', 'Textarea outlined'],
    ['combobox', 'Plan'],
  ] as const) {
    const control = page.getByRole(role, { name, exact: true });
    await focusWithoutBorderChange(page, control);
    await expect(control).toHaveCSS('border-top-width', '1px');
  }
});
