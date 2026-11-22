import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function dragHeading(page: Page, sheet: Locator, fromPadding = false) {
  // Vaul reserves the first 500ms after opening for entry motion and scrolling.
  await page.waitForTimeout(550);
  const surface = fromPadding
    ? sheet.locator('[data-ui="selection"][data-slot="body"]')
    : sheet.getByRole('heading');
  const heading = (await surface.boundingBox())!;
  const x = heading.x + (fromPadding ? 8 : heading.width / 2);
  const y = heading.y + heading.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, page.viewportSize()!.height - 4, { steps: 12 });
  expect(
    await sheet.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42),
  ).toBeGreaterThan(40);
  await page.mouse.up();
  await expect(sheet).not.toBeVisible();
}

test('shared sheets drag from unused body padding for Combobox, MultiSelect and country search', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/fixtures/selection-surfaces.html?presentation=sheet');
  const cases = [
    [page.getByRole('combobox', { name: 'Project', exact: true }), 'Project'],
    [page.getByRole('combobox', { name: 'Departments', exact: true }), 'Departments'],
    [page.getByRole('form').getByRole('combobox', { name: /Country:/ }), 'Country'],
  ] as const;
  for (const [trigger, title] of cases) {
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: title, exact: true });
    await expect(sheet).toBeVisible();
    await dragHeading(page, sheet, true);
    await expect(trigger).toBeFocused();
  }
});

for (const width of [320, 1440]) {
  test(`Select sheet keeps Home, End and typeahead targets visible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/tests/fixtures/selection-surfaces.html?presentation=sheet');
    const trigger = page.getByRole('combobox', { name: 'Team', exact: true });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: 'Choose team', exact: true });
    const list = sheet.getByRole('listbox');
    await expect(list.getByRole('option').first()).toBeFocused();
    const top = (await sheet.boundingBox())!.y;
    await list.hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
    expect(Math.abs((await sheet.boundingBox())!.y - top)).toBeLessThanOrEqual(1);
    for (const [key, target] of [
      ['End', list.getByRole('option').last()],
      ['Home', list.getByRole('option').first()],
    ] as const) {
      await page.keyboard.press(key);
      await expect(target).toBeFocused();
      await expect(target).toBeInViewport({ ratio: 1 });
    }
    await page.keyboard.type('Team 30');
    const typed = list.getByRole('option', { name: /^Team 30 —/ });
    await expect(typed).toBeFocused();
    await expect(typed).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Enter');
    await expect(sheet).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText('Team 30');
  });
}

for (const [width, height, dir, mode] of [
  [1440, 900, 'ltr', 'light'],
  [390, 844, 'ltr', 'dark'],
  [320, 568, 'rtl', 'light'],
] as const) {
  test(`selection sheets fit short content and drag from headings at ${width}px ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/tests/fixtures/selection-surfaces.html?presentation=sheet&short&dir=${dir}&mode=${mode}`,
    );
    const select = page.getByRole('combobox', { name: 'Team', exact: true });
    await select.click();
    const native = page.getByRole('dialog', {
      name: dir === 'rtl' ? 'اختر الفريق' : 'Choose team',
      exact: true,
    });
    await expect(native).toBeVisible();
    await dragHeading(page, native);
    await expect(select).toBeFocused();

    const departments = page.getByRole('combobox', { name: 'Departments', exact: true });
    await departments.click();
    const sheet = page.getByRole('dialog', { name: 'Departments', exact: true });
    await expect(sheet).toBeVisible();
    const search = sheet.getByRole('combobox');
    await search.focus();
    const geometry = await sheet.evaluate((node) => {
      const list = node.querySelector('[data-slot="list"]')!;
      const search = node.querySelector('[data-selection-search]')!;
      const body = node.querySelector('[data-slot="body"]')!;
      const inputBox = search.getBoundingClientRect(),
        bodyBox = body.getBoundingClientRect();
      const css = getComputedStyle(search);
      const ring = parseFloat(css.outlineWidth) + parseFloat(css.outlineOffset);
      return {
        panel: {
          x: node.getBoundingClientRect().x,
          y: node.getBoundingClientRect().y,
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        },
        listHeight: list.clientHeight,
        contentHeight: list.scrollHeight,
        ring,
        topRoom: inputBox.top - bodyBox.top,
        sideRoom: Math.min(inputBox.left - bodyBox.left, bodyBox.right - inputBox.right),
        horizontal: node.scrollWidth - node.clientWidth,
      };
    });
    expect(geometry.panel.x).toBeGreaterThanOrEqual(0);
    expect(geometry.panel.y).toBeGreaterThanOrEqual(0);
    expect(geometry.panel.x + geometry.panel.width).toBeLessThanOrEqual(width + 1);
    expect(geometry.panel.y + geometry.panel.height).toBeLessThanOrEqual(height + 1);
    expect(geometry.horizontal).toBeLessThanOrEqual(1);
    expect(geometry.listHeight).toBeLessThanOrEqual(geometry.contentHeight + 1);
    expect(geometry.panel.height).toBeLessThan(Math.min(500, height * 0.9));
    expect(geometry.ring).toBeGreaterThanOrEqual(4);
    expect(geometry.topRoom).toBeGreaterThanOrEqual(geometry.ring);
    expect(geometry.sideRoom).toBeGreaterThanOrEqual(geometry.ring);
    await page.screenshot({ path: info.outputPath('compact-selection.png') });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    // The input remains an ordinary editable control, even though its surrounding sheet drags.
    await search.fill('2');
    await expect(sheet.getByRole('option')).toHaveCount(1);
    await search.press('Enter');
    await expect(sheet.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    await expect(sheet).toBeVisible();
    await dragHeading(page, sheet);
    await expect(departments).toBeFocused();
  });
}

test('long selection sheets scroll one list, retain the footer and shrink after filtering', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixtures/selection-surfaces.html');
  await page.getByRole('combobox', { name: 'Departments', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Departments', exact: true });
  const list = sheet.getByRole('listbox');
  const search = sheet.getByRole('combobox');
  await expect(list).toBeVisible();
  const initial = (await sheet.boundingBox())!;
  const start = await list.evaluate((node) => node.scrollTop);
  await list.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(start + 200);
  expect(Math.abs((await sheet.boundingBox())!.y - initial.y)).toBeLessThan(1);
  await expect(sheet.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
  expect(await sheet.evaluate((node) => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(
    1,
  );
  await search.fill('Team 15');
  await expect(sheet.getByRole('option')).toHaveCount(1);
  await expect
    .poll(async () => (await sheet.boundingBox())!.height)
    .toBeLessThan(initial.height - 200);
  await sheet.getByRole('option').click();
  await expect(sheet.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  await search.fill('No matching department');
  await expect(sheet.getByRole('option')).toHaveCount(0);
  await expect(sheet.getByText('No results found', { exact: true })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Done', exact: true })).toBeInViewport();
  await sheet.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(sheet).not.toBeVisible();
});

test('the documented Select and MultiSelect sheet previews stay compact and draggable', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [slug, field] of [
    ['select', 'Team'],
    ['multi-select', 'Departments'],
  ]) {
    await page.goto(`/v/0.3.0/components/${slug}`);
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await page.getByRole('combobox', { name: 'presentation', exact: true }).click();
    await page.getByRole('option', { name: 'sheet', exact: true }).click();
    const trigger = page.getByRole('combobox', { name: field, exact: true });
    await trigger.click();
    const sheet = page.getByRole('dialog', {
      name: slug === 'select' ? 'Choose team' : 'Select options',
      exact: true,
    });
    await expect(sheet).toBeVisible();
    await sheet.evaluate(async (node) => {
      await Promise.allSettled(node.getAnimations().map((animation) => animation.finished));
    });
    await expect(sheet.getByRole('option')).toHaveCount(4);
    const bounds = (await sheet.boundingBox())!;
    expect(bounds.height).toBeLessThan(480);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(1001);
    await expect(sheet.getByRole('option').last()).toBeInViewport();
    if (slug === 'multi-select') await sheet.getByRole('combobox').focus();
    await page.screenshot({ path: info.outputPath(`${slug}-docs-sheet.png`) });
    await dragHeading(page, sheet);
    await expect(trigger).toBeFocused();
  }
});

test('touch drags the Select and MultiSelect titles without stealing list scrolling or taps', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await page.goto('/tests/fixtures/selection-surfaces.html?presentation=sheet');
    for (const [triggerName, title] of [
      ['Team', 'Choose team'],
      ['Departments', 'Departments'],
    ]) {
      const trigger = page.getByRole('combobox', { name: triggerName, exact: true });
      await trigger.tap();
      const sheet = page.getByRole('dialog', { name: title, exact: true });
      await expect(sheet).toBeVisible();
      await page.waitForTimeout(550);
      const list = sheet.getByRole('listbox');
      const box = (await list.boundingBox())!;
      const top = (await sheet.boundingBox())!.y;
      const before = await list.evaluate((node) => node.scrollTop);
      const x = box.x + box.width / 2,
        y = box.y + box.height - 30;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      for (let step = 1; step <= 10; step++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y - step * 18 }],
        });
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect
        .poll(() => list.evaluate((node) => node.scrollTop))
        .toBeGreaterThan(before + 100);
      expect(Math.abs((await sheet.boundingBox())!.y - top)).toBeLessThanOrEqual(1);
      const heading = (await sheet.getByRole('heading').boundingBox())!;
      const hx = heading.x + heading.width / 2,
        hy = heading.y + heading.height / 2;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: hx, y: hy }],
      });
      for (let step = 1; step <= 12; step++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: hx, y: hy + ((838 - hy) * step) / 12 }],
        });
      }
      expect(
        await sheet.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m42),
      ).toBeGreaterThan(40);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(sheet).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
  } finally {
    await context.close();
  }
});
