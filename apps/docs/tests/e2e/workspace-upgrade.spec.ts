import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page: Page, slug: string, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript((small) => {
    localStorage.setItem(
      'plainui-theme',
      JSON.stringify({ mode: small ? 'dark' : 'light', borders: 'subtle', motion: 'none' }),
    );
    localStorage.setItem('plainui-direction', small ? 'rtl' : 'ltr');
    localStorage.removeItem('plainui-token-overrides');
  }, width < 640);
  await page.goto(`/components/${slug}`);
  const preview = page.locator('.component-preview');
  await expect(preview).toBeVisible();
  return preview;
}
async function choose(page: Page, label: string, value: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function accessible(page: Page, selector: string) {
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }))).toEqual(
    [],
  );
}
for (const width of [1440, 320]) {
  test(`bottom navigation preserves icon geometry at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'bottom-navigation', width);
    const items = preview.locator('.ui-bottom-navigation-item');
    await expect(items).toHaveCount(3);
    for (const item of await items.all()) {
      await expect(item).toHaveAccessibleName(/\S/);
      const target = (await item.boundingBox())!;
      expect(target.width).toBeGreaterThanOrEqual(48);
      expect(target.height).toBeGreaterThanOrEqual(48);
      const icon = (await item.locator('.ui-bottom-navigation-icon').boundingBox())!;
      const svg = (await item.locator('svg').boundingBox())!;
      expect(svg.width).toBe(20);
      expect(svg.height).toBe(20);
      expect(svg.x).toBeGreaterThanOrEqual(icon.x);
      expect(svg.x + svg.width).toBeLessThanOrEqual(icon.x + icon.width);
      expect(svg.y).toBeGreaterThanOrEqual(icon.y);
      expect(svg.y + svg.height).toBeLessThanOrEqual(icon.y + icon.height);
    }
    const projects = preview.getByRole('button', { name: 'Projects', exact: true });
    await projects.click();
    await expect(projects).toHaveAttribute('aria-current', 'page');
    await expect(projects.locator('.ui-bottom-navigation-icon')).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    await fits(page);
    await accessible(page, '.component-preview');
    await preview.screenshot({ path: info.outputPath(`bottom-navigation-${width}.png`) });
  });
  test(`remote simple filters and pagination at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'data-table', width);
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await page.getByRole('switch', { name: 'remote', exact: true }).click();
    await choose(page, 'filterMode', 'simple');
    await expect(preview.locator('.ui-table-status')).toContainText('1-10 of 80');
    await preview.locator('[data-ui="chip"]').getByText('Status', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Filter value for Status', exact: true }).click();
    await page.getByRole('option', { name: 'Pending', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(preview.locator('.ui-table-status')).toContainText('1-10 of 30');
    await expect(preview.getByRole('table').getByText('Paid', { exact: true })).toHaveCount(0);
    await preview.getByRole('button', { name: 'Last page', exact: true }).click();
    await expect(preview.locator('.ui-table-status')).toContainText('21-30 of 30');
    await preview.screenshot({ path: info.outputPath(`remote-table-${width}.png`) });
    await fits(page);
    await accessible(page, '.component-preview');
  });
  test(`search result selection and focus restoration at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'search-view', width);
    const trigger = preview.getByRole('button', { name: 'Search workspace', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Search workspace' });
    const input = dialog.getByRole('combobox', { name: 'Search workspace' });
    await expect(input).toBeFocused();
    await input.fill('Mobile');
    await expect(dialog.getByRole('option', { name: 'Mobile experience' })).toBeVisible();
    await accessible(page, '.ui-search-view');
    await page.screenshot({ path: info.outputPath(`search-${width}.png`) });
    await input.press('Enter');
    await expect(dialog).not.toBeVisible();
    await expect(preview.getByRole('status')).toContainText('Mobile experience');
    await expect(trigger).toBeFocused();
    await fits(page);
  });
  test(`compact resizable panels and canonical route at ${width}px`, async ({ page }, info) => {
    const preview = await open(page, 'split-pane', width);
    await expect(page).toHaveURL(/\/components\/resizable$/);
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await page.getByRole('switch', { name: 'persist', exact: true }).click();
    if (width < 640) {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await accessible(page, '[data-vaul-drawer]');
      await page.getByRole('button', { name: 'Close panel', exact: true }).click();
      await preview.getByRole('button', { name: 'Open explorer' }).click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      const handle = preview.getByRole('separator', { name: 'Resize explorer' });
      await handle.focus();
      const before = await handle.getAttribute('aria-valuenow');
      await handle.press('ArrowRight');
      await expect(handle).not.toHaveAttribute('aria-valuenow', before!);
      await expect
        .poll(() =>
          page.evaluate(() => localStorage.getItem('react-resizable-panels:pui-docs-resizable')),
        )
        .not.toBeNull();
    }
    await fits(page);
    await preview.screenshot({ path: info.outputPath(`resizable-${width}.png`) });
  });
}
for (const dir of ['ltr', 'rtl']) {
  test(`native sticky table and synchronized scrollbars in ${dir}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 600, height: 850 });
    await page.goto(`/tests/fixtures/workspace-upgrade.html?mode=table&dir=${dir}`);
    const wrapper = page.locator('.ui-table-scroll');
    const bar = page.locator('.ui-table-sync-scrollbar');
    await expect(bar).toBeVisible();
    await wrapper.evaluate((node) => {
      node.scrollTop = 350;
      node.scrollLeft = getComputedStyle(node).direction === 'rtl' ? -200 : 200;
    });
    await expect
      .poll(() => bar.evaluate((node) => node.scrollLeft))
      .toBe(dir === 'rtl' ? -200 : 200);
    await expect
      .poll(() =>
        wrapper.evaluate((node) =>
          Math.abs(
            node.getBoundingClientRect().top -
              node.querySelector('thead')!.getBoundingClientRect().top,
          ),
        ),
      )
      .toBeLessThan(2);
    await expect
      .poll(() =>
        wrapper.evaluate((node) =>
          Math.abs(
            node.getBoundingClientRect().bottom -
              node.querySelector('tfoot')!.getBoundingClientRect().bottom,
          ),
        ),
      )
      .toBeLessThan(2);
    await bar.evaluate((node) => {
      node.scrollLeft = getComputedStyle(node).direction === 'rtl' ? -350 : 350;
    });
    await expect
      .poll(() => wrapper.evaluate((node) => node.scrollLeft))
      .toBe(dir === 'rtl' ? -350 : 350);
    await expect(page.getByRole('table').locator('thead')).toHaveCount(1);
    await page.screenshot({ path: info.outputPath(`sticky-${dir}.png`) });
    await accessible(page, '#root');
    await fits(page);
  });
}
test('Kanban move commands preserve focus after a cross-column move', async ({ page }) => {
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=kanban');
  await page.getByRole('button', { name: 'Move Research', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Move to Done', exact: true }).click();
  await expect(page.getByRole('region', { name: /^Done / })).toContainText('Research');
  await expect(page.getByRole('button', { name: 'Drag Research' })).toBeFocused();
  await expect(
    page.getByRole('status').filter({ hasText: 'Research moved to Done' }),
  ).toBeVisible();
  await expect(page.locator('[data-kanban-item="1"]').locator('..').locator('..')).toContainText(
    'Done',
  );
  await accessible(page, '#root');
});

test('Kanban pointer dragging moves a card into an empty lane', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=kanban');
  const handle = page.getByRole('button', { name: 'Drag Research' });
  const start = (await handle.boundingBox())!;
  const target = (await page.getByRole('region', { name: /^Done / }).boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 80, { steps: 15 });
  await expect(page.locator('[data-kanban-item="1"]')).toHaveAttribute('data-dragging');
  await page.mouse.up();
  await expect(page.getByRole('region', { name: /^Done / })).toContainText('Research');
  await expect(handle).toBeFocused();
});

test('Kanban keyboard dragging reorders cards within a lane', async ({ page }) => {
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=kanban');
  const handle = page.getByRole('button', { name: 'Drag Research' });
  await handle.focus();
  await handle.press('Space');
  await expect(page.locator('[data-kanban-item="1"]')).toHaveAttribute('data-dragging');
  await handle.press('ArrowDown');
  await handle.press('Space');
  await expect
    .poll(() =>
      page
        .getByRole('region', { name: /^Todo / })
        .locator('[data-kanban-item]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-kanban-item'))),
    )
    .toEqual(['2', '1']);
  await expect(handle).toBeFocused();
});

for (const dir of ['ltr', 'rtl']) {
  test(`Gantt keyboard edits retain dates and focus in ${dir}`, async ({ page }) => {
    await page.goto(`/tests/fixtures/workspace-upgrade.html?mode=gantt-edit&dir=${dir}`);
    const task = page.getByRole('button', { name: /^Task 0,/ });
    await task.focus();
    await task.press(dir === 'rtl' ? 'Alt+ArrowLeft' : 'Alt+ArrowRight');
    await expect(page.getByLabel('Result')).toContainText(
      '"start":"2026-10-06","end":"2026-10-13","action":"move"',
    );
    await task.press(dir === 'rtl' ? 'Alt+Shift+ArrowLeft' : 'Alt+Shift+ArrowRight');
    await expect(page.getByLabel('Result')).toContainText(
      '"start":"2026-10-06","end":"2026-10-14","action":"resize"',
    );
    await expect(task).toBeFocused();
    await expect(page.getByRole('button', { name: /^Task 1,/ })).toBeDisabled();
  });
  test(`Gantt labels leave a usable timeline on a small phone in ${dir}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`/tests/fixtures/workspace-upgrade.html?mode=gantt-edit&dir=${dir}`);
    const label = page.locator('.ui-gantt-label').first();
    await expect.poll(async () => (await label.boundingBox())!.width).toBeLessThan(125);
    await expect(label).toHaveAttribute('title', 'Task 0');
    const scroll = page.locator('.ui-gantt-scroll');
    expect(await scroll.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`gantt-compact-${dir}.png`) });
    await accessible(page, '#root');
    await fits(page);
  });
}

for (const scroll of ['outer', 'page']) {
  for (const dir of ['ltr', 'rtl']) {
    test(`sticky header and footer follow ${scroll} scrolling in ${dir}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 600, height: 850 });
      await page.goto(
        `/tests/fixtures/workspace-upgrade.html?mode=table&scroll=${scroll}&dir=${dir}`,
      );
      const outer = page.getByRole('region', { name: 'Outer scroller', exact: true });
      const wrapper = page.locator('.ui-table-scroll');
      const bar = page.locator('.ui-table-sync-scrollbar');
      if (scroll === 'outer')
        await outer.evaluate((node) => {
          node.scrollTop = 400;
        });
      else await page.evaluate(() => window.scrollTo(0, 400));
      await expect
        .poll(async () => {
          const bounds = scroll === 'outer' ? (await outer.boundingBox())! : { y: 0, height: 850 };
          const header = (await page.getByRole('table').locator('thead').boundingBox())!;
          return Math.abs(header.y - bounds.y - 24);
        })
        .toBeLessThan(2);
      await expect
        .poll(async () => {
          const bounds = scroll === 'outer' ? (await outer.boundingBox())! : { y: 0, height: 850 };
          const footer = (await page.getByRole('table').locator('tfoot').boundingBox())!;
          return Math.abs(footer.y + footer.height - bounds.y - bounds.height + 16);
        })
        .toBeLessThan(2);
      await bar.evaluate((node) => {
        node.scrollLeft = getComputedStyle(node).direction === 'rtl' ? -250 : 250;
      });
      await expect
        .poll(() => wrapper.evaluate((node) => node.scrollLeft))
        .toBe(dir === 'rtl' ? -250 : 250);
      await expect(page.getByRole('table').locator('thead')).toHaveCount(1);
      await page.screenshot({ path: info.outputPath(`sticky-${scroll}-${dir}.png`) });
      await fits(page);
    });
  }
}
test('Gantt virtualizes a large timeline while keeping later tasks interactive', async ({
  page,
}, info) => {
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=gantt');
  const scroll = page.locator('.ui-gantt-scroll');
  await expect(page.getByRole('button', { name: /Task 0,/ })).toBeVisible();
  expect(await page.locator('.ui-gantt-row').count()).toBeLessThan(30);
  await scroll.evaluate((node) => {
    node.scrollTop = 40000;
  });
  await expect.poll(() => page.locator('.ui-gantt-row').first().textContent()).toContain('Task 9');
  await page.locator('.ui-gantt-task').nth(6).click();
  await expect(page.getByLabel('Result')).toContainText('task-');
  await page.screenshot({ path: info.outputPath('gantt-large.png') });
  await accessible(page, '#root');
});
test('heatmap cells support RTL keyboard selection', async ({ page }) => {
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=heatmap&dir=rtl&theme=dark');
  const first = page.getByRole('button', { name: 'Design, Mon: 3' });
  await first.focus();
  await first.press('ArrowLeft');
  const second = page.getByRole('button', { name: 'Design, Tue: 4' });
  await expect(second).toBeFocused();
  await second.press('Enter');
  await expect(page.getByLabel('Result')).toContainText('Design, Tue');
  await accessible(page, '#root');
});
test('all calendar views respond with a thousand events and print primary-token styling', async ({
  page,
}, info) => {
  await page.goto('/tests/fixtures/workspace-upgrade.html?mode=calendar&theme=dark');
  const root = page.locator('[data-ui="full-calendar"][data-slot="root"]');
  await expect(root).toBeVisible();
  const times: Record<string, number> = {};
  for (const view of ['Week', 'Day', 'Agenda', 'Month']) {
    const start = Date.now();
    await choose(page, 'Calendar view', view);
    await expect(root).toHaveAttribute('data-view', view.toLowerCase());
    times[view] = Date.now() - start;
    expect(times[view]).toBeLessThan(2000);
  }
  await page.getByRole('button', { name: 'Update events', exact: true }).click();
  await page.evaluate(() => {
    window.print = () => {
      const print = document.querySelector<HTMLElement>('.ui-calendar-print')!;
      (
        window as Window & { calendarPrint?: { text: string; foreground: string; surface: string } }
      ).calendarPrint = {
        text: print.textContent ?? '',
        foreground: getComputedStyle(print).getPropertyValue('--ui-foreground').trim(),
        surface: getComputedStyle(print).getPropertyValue('--ui-surface').trim(),
      };
    };
  });
  await page.getByRole('button', { name: 'Print calendar' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { calendarPrint?: { text: string } }).calendarPrint?.text,
      ),
    )
    .toContain('Added event');
  const print = await page.evaluate(
    () => (window as Window & { calendarPrint?: unknown }).calendarPrint,
  );
  await info.attach('calendar-responsiveness', {
    body: JSON.stringify({ times, print }, null, 2),
    contentType: 'application/json',
  });
  await page.screenshot({ path: info.outputPath('calendar-large.png') });
});
test('calendar printing isolates a light page from a dark application', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1123 });
  await page.addInitScript(() => {
    localStorage.setItem('plainui-theme', JSON.stringify({ mode: 'dark', motion: 'none' }));
    localStorage.setItem('plainui-direction', 'rtl');
  });
  await page.goto('/components/full-calendar');
  const calendar = page.locator('.component-preview [data-ui="full-calendar"][data-slot="root"]');
  await expect(calendar).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      const snapshot = document.querySelector('.ui-calendar-print')!.cloneNode(true) as HTMLElement;
      snapshot.dataset.printEvidence = 'true';
      document.body.append(snapshot);
    };
  });
  await calendar.getByRole('button', { name: 'Print calendar' }).click();
  const snapshot = page.locator('[data-print-evidence]');
  await expect(snapshot).toHaveCount(1);
  await page.emulateMedia({ media: 'print' });
  await expect(snapshot).toBeVisible();
  await expect(snapshot).toHaveAttribute('dir', 'rtl');
  await expect(snapshot).toContainText('P.UI project schedule');
  await expect(snapshot).toContainText('Prepared for the team.');
  await expect(snapshot.locator('tbody tr')).toHaveCount(6);
  await expect(page.locator('#root')).toBeHidden();
  for (const surface of [snapshot, page.locator('body'), page.locator('html')]) {
    await expect(surface).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  }
  await page.pdf({
    path: info.outputPath('calendar-print.pdf'),
    format: 'A4',
    printBackground: true,
  });
  await page.screenshot({ path: info.outputPath('calendar-print.png') });
});
for (const mode of ['light', 'dark']) {
  for (const dir of ['ltr', 'rtl']) {
    test(`calendar event times retain contrast in ${mode} ${dir}`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.addInitScript(
        ({ mode, dir }) => {
          localStorage.setItem('plainui-theme', JSON.stringify({ mode, motion: 'none' }));
          localStorage.setItem('plainui-direction', dir);
        },
        { mode, dir },
      );
      await page.goto('/components/full-calendar');
      const calendar = page.locator(
        '.component-preview [data-ui="full-calendar"][data-slot="root"]',
      );
      await expect(calendar).toBeVisible();
      for (const view of ['Month', 'Week', 'Day', 'Agenda']) {
        await choose(page, 'Calendar view', view);
        await expect(calendar).toHaveAttribute('data-view', view.toLowerCase());
        const event = calendar
          .locator('.ui-calendar-event')
          .filter({ hasText: 'Project kickoff' })
          .first();
        await expect(event).toBeVisible();
        const time = event.locator('.ui-calendar-event-time');
        await expect(time).toHaveCSS(
          'color',
          await event.evaluate((node) => getComputedStyle(node).color),
        );
        await accessible(page, '.component-preview');
        await event.hover();
        await accessible(page, '.component-preview');
      }
    });
  }
}
test('nested language defaults localize pagination and calendar actions', async ({ page }) => {
  const preview = await open(page, 'language-provider', 390);
  await expect(preview.getByRole('navigation', { name: 'الصفحات' })).toBeVisible();
  await choose(page, 'Language', 'English');
  await expect(preview.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
  await accessible(page, '.component-preview');
});

for (const width of [1440, 320]) {
  test(`detached and floating Sheets remain contained at ${width}px`, async ({ page }, info) => {
    await open(page, 'sheet', width);
    await page.getByRole('button', { name: 'Preview properties', exact: true }).click();
    await choose(page, 'size', 'lg');
    for (const variant of ['detached', 'floating']) {
      await choose(page, 'variant', variant);
      const trigger = page.getByRole('button', { name: 'Open preview sheet', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Project settings' });
      await expect(dialog).toHaveAttribute('data-variant', variant);
      await expect
        .poll(async () => {
          const box = (await dialog.boundingBox())!;
          return (
            box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= 900
          );
        })
        .toBe(true);
      await accessible(page, '[data-vaul-drawer]');
      await page.screenshot({ path: info.outputPath(`sheet-${variant}-${width}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await fits(page);
  });
}

for (const policy of ['system', 'none']) {
  test(`Stepper content motion respects ${policy} policy and leaves embedded controls alone`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/tests/fixtures/workspace-upgrade.html?mode=stepper&motion=${policy}`);
    await page.getByRole('button', { name: 'Team', exact: true }).click();
    const content = page.locator('[data-ui="stepper"][data-slot="content"]');
    await expect(content).toContainText('Team');
    const duration = await content.evaluate((node) =>
      parseFloat(getComputedStyle(node).animationDuration),
    );
    expect(policy === 'none' ? duration < 0.001 : duration >= 0.2).toBe(true);
    const action = content.getByRole('button', { name: 'Content action' });
    await action.focus();
    await action.press('Home');
    await expect(action).toBeFocused();
    await accessible(page, '#root');
  });
}
