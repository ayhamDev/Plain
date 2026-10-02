import { expect, test, type Locator, type Page } from '@playwright/test';
import { build, normalizePath } from 'vite';
import { fileURLToPath } from 'node:url';
import { chartSampleData, donutSampleData } from '../../src/docs/chart-samples';

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });

const slot = (component: string, part = 'root') => `[data-ui="${component}"][data-slot="${part}"]`;
type Appearance = {
  mode: 'light' | 'dark';
  dir: 'ltr' | 'rtl';
  seed: string | null;
  motion?: 'system' | 'none';
  borders?: 'none' | 'subtle';
};

async function initialize(page: Page, appearance: Appearance) {
  await page.addInitScript((settings) => {
    localStorage.setItem(
      'plainui-theme',
      JSON.stringify({
        mode: settings.mode,
        color: settings.seed,
        motion: settings.motion ?? 'system',
        borders: settings.borders ?? 'subtle',
      }),
    );
    localStorage.setItem('plainui-direction', settings.dir);
    localStorage.removeItem('plainui-token-overrides');
  }, appearance);
}

async function component(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`);
  expect(response?.ok(), `The ${slug} documentation must load`).toBe(true);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  const preview = page.locator('.component-preview');
  await expect(preview).toBeVisible({ timeout: 20000 });
  const family = slug.endsWith('-chart') ? 'chart' : slug;
  await expect(preview.locator(slot(family))).toBeVisible();
  return preview;
}

async function expectContained(element: Locator) {
  const overflow = await element.evaluate((node) => {
    const outer = node.getBoundingClientRect();
    return Array.from(node.querySelectorAll('input:not([aria-hidden]), button, label'))
      .filter((child) => child.getBoundingClientRect().width > 0)
      .filter((child) => {
        const rect = child.getBoundingClientRect();
        return rect.left < outer.left - 1 || rect.right > outer.right + 1;
      })
      .map((child) => child.outerHTML.slice(0, 160));
  });
  expect(overflow, 'Controls and labels must fit inside their component').toEqual([]);
}

const plotSelector = [
  'path.recharts-line-curve',
  'path.recharts-area-curve',
  '.recharts-bar path.recharts-rectangle',
  '.recharts-pie-sector path.recharts-sector',
].join(', ');

async function expectPlot(page: Page, chart: Locator) {
  await expect(chart).toHaveAttribute('data-state', 'ready');
  const surface = chart.locator('svg.recharts-surface[role="application"]');
  await expect(surface).toHaveAttribute('tabindex', '0');
  const bounds = await surface.boundingBox();
  expect(bounds!.width).toBeGreaterThan(140);
  expect(bounds!.height).toBeGreaterThan(200);
  const paths = chart.locator(plotSelector);
  await expect.poll(() => paths.count()).toBeGreaterThan(1);
  const colors = await paths.evaluateAll((nodes) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const channels = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    return nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        width: rect.width,
        height: rect.height,
        d: node.getAttribute('d'),
        color: channels(
          node.classList.contains('recharts-line-curve') ||
            node.classList.contains('recharts-area-curve')
            ? style.stroke
            : style.fill,
        ),
      };
    });
  });
  for (const path of colors) {
    expect(path.width).toBeGreaterThan(12);
    expect(path.height).toBeGreaterThan(12);
    expect(path.d).not.toMatch(/NaN|Infinity/);
    expect(path.color[3]).toBe(255);
  }
  expect(new Set(colors.map((path) => path.color.join(','))).size).toBeGreaterThan(1);

  // Raster pixels catch invisible plots even when the SVG and its paths exist in the DOM.
  const png = await chart.screenshot({ animations: 'disabled' });
  const pixels = await page.evaluate(
    async ({ base64, palette }) => {
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      const image = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const result = palette.map((color) => {
        let matches = 0;
        for (
          let index = 0;
          index < bitmap.width * Math.max(0, bitmap.height - 42) * 4;
          index += 4
        ) {
          if (
            color
              .slice(0, 3)
              .every((channel, offset) => Math.abs(channel - image[index + offset]) < 12)
          )
            matches++;
        }
        return matches;
      });
      bitmap.close();
      return result;
    },
    { base64: png.toString('base64'), palette: colors.map((path) => path.color) },
  );
  for (const count of pixels)
    expect(count, 'The rendered series must contain colored pixels').toBeGreaterThan(20);
  await expect(chart.locator(slot('chart', 'table'))).toHaveCount(1);
  const expectedRows = (await chart.locator('.recharts-pie-sector').count())
    ? donutSampleData.length
    : chartSampleData.length;
  await expect(chart.locator('tbody tr')).toHaveCount(expectedRows);
  await expect(chart.locator('.recharts-default-legend')).toBeVisible();
}

for (const mode of ['light', 'dark'] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const seed of [null, '#087f5b']) {
      test(`integrated temporal, chart and calendar previews fit 320/390/1440px in ${mode} ${dir} ${seed ?? 'default'} theme`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(120000);
        await initialize(page, { mode, dir, seed });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
          for (const slug of [
            'date-time-range-picker',
            'date-range-picker',
            'line-chart',
            'donut-chart',
            'full-calendar',
          ]) {
            const preview = await component(page, slug);
            await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
            await expect(page.locator('html')).toHaveAttribute('dir', dir);
            await expectContained(preview);
            expect(
              await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
            ).toBeLessThanOrEqual(1);
            if (slug.endsWith('-chart')) {
              const chart = preview.locator(slot('chart'));
              await expect(chart).toHaveAttribute('dir', dir);
              await expect(chart).toHaveAttribute('data-motion', 'disabled');
              await expectPlot(page, chart);
            } else if (slug === 'full-calendar') {
              await expect(preview.locator(slot('full-calendar'))).toHaveAttribute(
                'data-view',
                'month',
              );
              await expect(
                preview.getByRole('combobox', { name: 'Calendar view', exact: true }),
              ).toBeVisible();
            } else if (slug === 'date-range-picker') {
              await preview.getByRole('button', { name: 'Project dates', exact: true }).click();
              const dialog = page.getByRole('dialog');
              await expect(dialog).toBeVisible();
              const rect = await dialog.boundingBox();
              expect(rect!.x).toBeGreaterThanOrEqual(0);
              expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
              await expectContained(dialog);
              await page.keyboard.press('Escape');
              await expect(dialog).toHaveCount(0);
            }
            if (
              (mode === 'light' && dir === 'ltr' && seed === null) ||
              (mode === 'dark' && dir === 'rtl' && seed !== null)
            ) {
              await preview.screenshot({
                path: testInfo.outputPath(`${slug}-${width}.png`),
                animations: 'disabled',
              });
            }
          }
        }
        expect(errors).toEqual([]);
      });
    }
  }
}

test('all native chart types have visible plots, data alternatives, keyboard tooltips and semantic palette colors', async ({
  page,
}, testInfo) => {
  await initialize(page, { mode: 'light', dir: 'ltr', seed: '#2563eb' });
  for (const slug of ['area-chart', 'bar-chart', 'line-chart', 'donut-chart']) {
    const preview = await component(page, slug);
    const chart = preview.locator(slot('chart'));
    await expectPlot(page, chart);
    const surface = chart.locator('svg[role="application"]');
    await surface.focus();
    await surface.press('ArrowRight');
    await expect(chart.locator('.recharts-tooltip-wrapper')).toBeVisible();
    await expect(chart.locator('.recharts-tooltip-wrapper')).toContainText(
      slug === 'donut-chart' ? /Active|Review|Complete/ : /Revenue|Costs/,
    );
    const palette = await chart.evaluate((node, selector) => {
      const first = node.querySelector(selector)!;
      const style = getComputedStyle(first);
      const sample = document.createElement('span');
      sample.style.color = 'var(--ui-chart-1)';
      node.append(sample);
      const expected = getComputedStyle(sample).color;
      sample.remove();
      return {
        actual:
          first.classList.contains('recharts-line-curve') ||
          first.classList.contains('recharts-area-curve')
            ? style.stroke
            : style.fill,
        expected,
      };
    }, plotSelector);
    expect(palette.actual).toBe(palette.expected);
    await chart.screenshot({ path: testInfo.outputPath(`${slug}-keyboard.png`) });
  }
});

test('motion-none disables chart animation even without a reduced-motion media preference', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await initialize(page, { mode: 'dark', dir: 'rtl', seed: '#be185d', motion: 'none' });
  const preview = await component(page, 'line-chart');
  const chart = preview.locator(slot('chart'));
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
  await expect(chart).toHaveAttribute('data-motion', 'disabled');
  await expectPlot(page, chart);
});

test('border-none and motion-none remove temporal control borders and transition durations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await initialize(page, {
    mode: 'light',
    dir: 'ltr',
    seed: null,
    borders: 'none',
    motion: 'none',
  });
  for (const slug of [
    'time-picker',
    'time-range-picker',
    'date-range-picker',
    'date-time-picker',
    'date-time-range-picker',
  ]) {
    const preview = await component(page, slug);
    await expect(page.locator('html')).toHaveAttribute('data-borders', 'none');
    await expect
      .poll(() =>
        page
          .locator('html')
          .evaluate((node) => getComputedStyle(node).getPropertyValue('--ui-motion-scale').trim()),
      )
      .toBe('0');
    const controls = preview.locator('.ui-temporal-input, .ui-date-range-trigger');
    expect(await controls.count()).toBeGreaterThan(0);
    for (let index = 0; index < (await controls.count()); index++) {
      await expect(controls.nth(index)).toHaveCSS('border-width', '0px');
      const duration = await controls
        .nth(index)
        .evaluate((node) =>
          Math.max(...getComputedStyle(node).transitionDuration.split(',').map(parseFloat)),
        );
      expect(duration).toBeLessThanOrEqual(0.00001);
    }
  }
});

let fixtureModule: Promise<string> | undefined;

async function serveFixtureModule(page: Page) {
  // An in-memory bundle works on both Vite and production previews without altering the docs.
  fixtureModule ??= (async () => {
    const source = (name: string) =>
      JSON.stringify(
        normalizePath(
          fileURLToPath(new URL(`../../../../packages/ui/src/ui/${name}`, import.meta.url)),
        ),
      );
    const entry = normalizePath(
      fileURLToPath(new URL('./__date-charts-fixture.js', import.meta.url)),
    );
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [
        {
          name: 'date-charts-browser-fixture',
          enforce: 'pre',
          resolveId(id) {
            return normalizePath(id) === entry ? `\0${entry}` : undefined;
          },
          load(id) {
            return id === `\0${entry}`
              ? [
                  'import * as React from "react"; export { React };',
                  'export { createRoot } from "react-dom/client";',
                  `export * as controls from ${source('date-time.tsx')};`,
                  `export { Field } from ${source('forms.tsx')};`,
                  `export { FullCalendar } from ${source('full-calendar.tsx')};`,
                ].join('\n')
              : undefined;
          },
        },
      ],
      build: {
        write: false,
        emptyOutDir: false,
        minify: false,
        lib: { entry, formats: ['es'] },
        rolldownOptions: { output: { codeSplitting: false } },
      },
    });
    const output = Array.isArray(result) ? result[0] : result;
    if (!('output' in output)) throw new Error('Expected an in-memory browser bundle');
    const chunk = output.output.find((item) => item.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk') throw new Error('Missing browser fixture module');
    return chunk.code;
  })();
  const code = await fixtureModule;
  await page.route('**/__date-charts-fixture.js', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: code }),
  );
}

async function mountTemporalForm(page: Page) {
  test.setTimeout(90000);
  await serveFixtureModule(page);
  // Mount public controls in the real docs page; the catalogue itself stays untouched.
  await page.evaluate(async () => {
    const modulePath = '/__date-charts-fixture.js';
    const { React, createRoot, controls, Field } = await import(/* @vite-ignore */ modulePath);
    const host = document.createElement('div');
    host.dataset.testid = 'temporal-regression';
    document.querySelector('.component-preview')!.append(host);
    const h = React.createElement;
    function Form() {
      const [controlled, setControlled] = React.useState(undefined);
      return h(
        'form',
        { id: 'temporal-regression', onSubmit: (event: Event) => event.preventDefault() },
        h(
          Field,
          { label: 'Business start', description: 'Local wall time', required: true },
          h(controls.TimePicker, {
            name: 'time',
            defaultValue: '09:00',
            min: '08:00',
            max: '18:00',
          }),
        ),
        h(
          Field,
          { label: 'Booking dates', required: true },
          h(controls.DateRangePicker, {
            name: 'booking',
            min: '2026-10-01',
            max: '2026-10-31',
            minNights: 1,
            disabledDates: new Date(2026, 9, 8),
            calendarProps: { defaultMonth: new Date(2026, 9) },
          }),
        ),
        h(controls.TimeRangePicker, {
          name: 'office',
          'aria-label': 'Office',
          fromLabel: 'Office start',
          toLabel: 'Office end',
          defaultValue: { from: '09:00', to: '17:00' },
          required: true,
        }),
        h(controls.TimeRangePicker, {
          name: 'night',
          'aria-label': 'Night',
          fromLabel: 'Night start',
          toLabel: 'Night end',
          allowOvernight: true,
          defaultValue: { from: '23:00', to: '01:00' },
        }),
        h(
          Field,
          { label: 'New York meeting' },
          h(controls.DateTimePicker, {
            name: 'zoned',
            defaultValue: '2026-11-01T03:30',
            timeZone: 'America/New_York',
            disambiguation: 'reject',
          }),
        ),
        h(
          Field,
          { label: 'Controlled meeting' },
          h(controls.DateTimePicker, {
            name: 'controlled',
            value: controlled,
            defaultValue: '2026-10-05T09:00',
            onValueChange: setControlled,
          }),
        ),
        h(controls.DateTimeRangePicker, {
          name: 'maintenance',
          'aria-label': 'Maintenance',
          fromLabel: 'Maintenance start',
          toLabel: 'Maintenance end',
          defaultValue: { from: '2026-10-05T09:00', to: '2026-10-05T17:00' },
        }),
        h(
          'button',
          { type: 'button', onClick: () => setControlled('2026-10-05T09:00') },
          'Set controlled meeting',
        ),
        h(
          'button',
          { type: 'button', onClick: () => setControlled(undefined) },
          'Clear controlled meeting',
        ),
        h('button', { type: 'reset' }, 'Reset form'),
      );
    }
    createRoot(host, { identifierPrefix: 'qa-temporal-' }).render(h(Form));
  });
  const form = page.getByTestId('temporal-regression');
  await expect(form.getByLabel('Business start')).toBeVisible();
  return form;
}

test.describe('native wall-time forms across zones', () => {
  test.use({ timezoneId: 'Pacific/Kiritimati' });

  test('range keyboard selection submits local dates, validates bounds and disabled days, and clears or resets natively', async ({
    page,
  }) => {
    await initialize(page, { mode: 'light', dir: 'ltr', seed: null });
    await component(page, 'date-range-picker');
    const form = await mountTemporalForm(page);
    const trigger = form.getByRole('button', { name: 'Booking dates', exact: true });
    const valid = () =>
      form.locator('form').evaluate((node) => (node as HTMLFormElement).checkValidity());
    expect(await valid()).toBe(false);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('button', { name: 'Thursday, October 8, 2026', exact: true }),
    ).toBeDisabled();
    const start = dialog.getByRole('button', { name: 'Monday, October 5, 2026', exact: true });
    await start.focus();
    await start.press('Enter');
    await expect(dialog).toBeVisible();
    await start.press('ArrowRight');
    const end = dialog.getByRole('button', { name: 'Tuesday, October 6, 2026', exact: true });
    await expect(end).toBeFocused();
    await end.press('Enter');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await valid()).toBe(true);
    const values = await form
      .locator('form')
      .evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement)));
    expect(values).toMatchObject({
      'booking[from]': '2026-10-05',
      'booking[to]': '2026-10-06',
      time: '09:00',
      'office[from]': '09:00',
      'office[to]': '17:00',
      'night[from]': '23:00',
      'night[to]': '01:00',
      'maintenance[from]': '2026-10-05T09:00',
      'maintenance[to]': '2026-10-05T17:00',
    });
    await form.getByLabel('Business start').fill('07:00');
    expect(await valid()).toBe(false);
    await form.getByRole('button', { name: 'Reset form', exact: true }).click();
    await expect(form.getByLabel('Business start')).toHaveValue('09:00');
    await expect(trigger).toHaveText('Pick a date range');
    await trigger.click();
    await dialog.getByRole('button', { name: 'Monday, October 5, 2026', exact: true }).click();
    await dialog.getByRole('button', { name: 'Tuesday, October 6, 2026', exact: true }).click();
    await trigger.press('Control+Backspace');
    const cleared = await form
      .locator('form')
      .evaluate((node) => Object.fromEntries(new FormData(node as HTMLFormElement)));
    expect(cleared['booking[from]']).toBe('');
    expect(cleared['booking[to]']).toBe('');
    expect(await valid()).toBe(false);
  });

  test('DST gaps and repetitions reject in the chosen zone while values remain wall time; explicit undefined clears controlled inputs', async ({
    page,
  }) => {
    await initialize(page, { mode: 'dark', dir: 'rtl', seed: '#087f5b' });
    await component(page, 'date-time-picker');
    const form = await mountTemporalForm(page);
    const zoned = form.getByLabel('New York meeting', { exact: true });
    const validity = () => zoned.evaluate((node) => (node as HTMLInputElement).checkValidity());
    await zoned.fill('2026-03-08T02:30');
    await expect(zoned).toHaveAttribute('aria-invalid', 'true');
    expect(await validity()).toBe(false);
    await zoned.fill('2026-11-01T01:30');
    expect(await validity()).toBe(false);
    await zoned.fill('2026-11-01T03:30');
    await expect(zoned).toHaveValue('2026-11-01T03:30');
    expect(await validity()).toBe(true);
    const submitted = await form
      .locator('form')
      .evaluate((node) => new FormData(node as HTMLFormElement).get('zoned'));
    expect(submitted).toBe('2026-11-01T03:30');
    const controlled = form.getByLabel('Controlled meeting', { exact: true });
    await expect(controlled).toHaveValue('');
    await form.getByRole('button', { name: 'Set controlled meeting', exact: true }).click();
    await expect(controlled).toHaveValue('2026-10-05T09:00');
    await form.getByRole('button', { name: 'Clear controlled meeting', exact: true }).click();
    await expect(controlled).toHaveValue('');
    await form.getByLabel('Office end', { exact: true }).fill('08:00');
    expect(
      await form
        .getByLabel('Office end', { exact: true })
        .evaluate((node) => (node as HTMLInputElement).checkValidity()),
    ).toBe(false);
    await form.getByLabel('Maintenance end', { exact: true }).fill('2026-10-05T08:00');
    expect(
      await form
        .getByLabel('Maintenance end', { exact: true })
        .evaluate((node) => (node as HTMLInputElement).checkValidity()),
    ).toBe(false);
    await zoned.press('Control+Backspace');
    await expect(zoned).toHaveValue('');
    expect(await validity()).toBe(true);
  });
});

test('P.UI scheduler views, event editor and compact month retain the chosen view', async ({
  page,
}, testInfo) => {
  await initialize(page, { mode: 'light', dir: 'ltr', seed: null });
  const preview = await component(page, 'full-calendar');
  const calendar = preview.locator(slot('full-calendar'));
  await expect(calendar).toHaveAttribute('data-view', 'month');
  await expect(calendar.getByText('Project kickoff', { exact: true })).toBeVisible();
  await expect(calendar.getByText('Design review', { exact: true })).toBeVisible();
  await calendar.getByRole('button', { name: /^Monday, October 19, 2026/ }).click();
  const editor = page.getByRole('dialog', { name: 'New event' });
  await editor.getByRole('textbox', { name: 'Event title' }).fill('New meeting');
  await editor.getByRole('button', { name: 'Save event' }).click();
  await expect(editor).toBeHidden();
  await expect(calendar.getByText('New meeting', { exact: true })).toBeVisible();
  for (const [name, view] of [
    ['week', 'week'],
    ['day', 'day'],
    ['agenda', 'agenda'],
    ['month', 'month'],
  ]) {
    await calendar.getByRole('combobox', { name: 'Calendar view' }).click();
    await page
      .getByRole('option', { name: name[0].toUpperCase() + name.slice(1), exact: true })
      .click();
    await expect(calendar).toHaveAttribute('data-view', view);
    await calendar.screenshot({ path: testInfo.outputPath(`calendar-${name}.png`) });
  }
  for (const width of [320, 1440, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
    await expect(calendar).toHaveAttribute('data-view', 'month');
  }
  await page.screenshot({ fullPage: true, path: testInfo.outputPath('calendar-full-page.png') });
  await expect(calendar).toHaveAttribute('data-view', 'month');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  const copy = await page
    .locator('[role="tabpanel"]')
    .filter({ has: page.locator('pre') })
    .innerText();
  expect(copy).toContain("from '@plain/ui/full-calendar'");
  expect(copy).toContain("import '@plain/ui/full-calendar.css'");
  expect(copy).toContain('defaultDate="2026-10-05"');
  expect(copy).toContain('onEventsChange');
  expect(copy).toContain('start: "2026-10-05T09:00"');
  expect(copy).not.toContain('@fullcalendar/core');
});

test('scheduler ref, events and exclusive selections stay usable in controlled RTL layouts', async ({
  page,
}) => {
  test.setTimeout(90000);
  await initialize(page, { mode: 'dark', dir: 'rtl', seed: '#2563eb' });
  await component(page, 'full-calendar');
  await serveFixtureModule(page);
  await page.evaluate(async () => {
    const modulePath = '/__date-charts-fixture.js';
    const { React, createRoot, FullCalendar } = await import(/* @vite-ignore */ modulePath);
    const h = React.createElement;
    const host = document.createElement('div');
    host.dataset.testid = 'engine-regression';
    document.querySelector('.component-preview')!.append(host);
    function Scheduler() {
      const ref = React.useRef(null);
      const [date, setDate] = React.useState('2026-10-05');
      const [clicked, setClicked] = React.useState('');
      const [selected, setSelected] = React.useState('');
      return h(
        'div',
        null,
        h(FullCalendar, {
          ref,
          date,
          onDateChange: setDate,
          dir: 'rtl',
          locale: 'ar',
          height: 480,
          selectable: true,
          events: [
            {
              id: 'review',
              title: 'Engine review',
              start: '2026-10-05T09:00',
              end: '2026-10-05T10:00',
            },
          ],
          renderEvent: (info: { event: { title: string } }) => h('strong', null, info.event.title),
          onEventClick: (event: { id: string }) => setClicked(event.id),
          onSlotSelect: (info: { start: string; end: string }) =>
            setSelected(`${info.start}|${info.end}`),
        }),
        h('output', { 'aria-label': 'Clicked event' }, clicked),
        h('output', { 'aria-label': 'Selected interval' }, selected),
        h('button', { onClick: () => setDate('2026-11-01') }, 'Focus November'),
        h('button', { onClick: () => setDate('2026-10-05') }, 'Focus October'),
        h(
          'button',
          { onClick: () => ref.current.getApi().gotoDate('2026-10-06') },
          'Focus from calendar ref',
        ),
      );
    }
    createRoot(host, { identifierPrefix: 'qa-calendar-' }).render(h(Scheduler));
  });
  const fixture = page.getByTestId('engine-regression');
  const calendar = fixture.locator(slot('full-calendar'));
  await expect(calendar).toHaveAttribute('dir', 'rtl');
  await calendar.getByText('Engine review', { exact: true }).click();
  await expect(fixture.getByLabel('Clicked event')).toHaveText('review');
  await fixture.getByRole('button', { name: 'Focus from calendar ref' }).click();
  await calendar.locator('[data-calendar-date="2026-10-06"]').click();
  await calendar.locator('[data-calendar-date="2026-10-07"]').click({ modifiers: ['Shift'] });
  await expect(fixture.getByLabel('Selected interval')).toHaveText('2026-10-06|2026-10-08');
  await fixture.getByRole('button', { name: 'Focus November' }).click();
  await expect(calendar.locator('[data-calendar-date="2026-11-15"]')).toHaveCount(1);
  await expect(calendar.getByText('Engine review', { exact: true })).toHaveCount(0);
  await fixture.getByRole('button', { name: 'Focus October' }).click();
  await expect(calendar.getByText('Engine review', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(calendar).toHaveAttribute('data-view', 'month');
  await calendar.locator('[data-calendar-date="2026-10-05"]').click();
  await expect(calendar.getByText('Engine review', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(calendar).toHaveAttribute('data-view', 'month');
});
