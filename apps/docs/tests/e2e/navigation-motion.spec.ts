import { test, expect } from '@playwright/test';

interface NavigationFrame {
  state: string | undefined;
  width: number;
  rows: { height: number; y: number; icon: number; labelHeight: number }[];
  indicatorGap: number;
  shade: number;
  shadeLayer: number;
  layer: number;
  changed: boolean;
}
type MotionWindow = Window & { stopNavigationCapture?: () => NavigationFrame[] };

for (const kind of ['sidebar', 'rail']) {
  for (const mode of ['inline', 'overlay']) {
    for (const dir of ['ltr', 'rtl']) {
      test(`${kind} ${mode} ${dir} keeps rows, icons and overlay layers stable throughout hover motion`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width: 1100, height: 800 });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(
          `/tests/fixtures/sidebar-overflow.html?hover=${kind}&mode=${mode}&dir=${dir}&theme=${dir === 'rtl' ? 'dark' : 'light'}`,
        );
        const panel =
          kind === 'sidebar'
            ? page.getByRole('complementary')
            : page.getByRole('navigation', { name: 'Workspaces', exact: true });
        await expect(panel).toHaveAttribute('data-state', 'collapsed');
        await expect.poll(async () => (await panel.boundingBox())!.width).toBe(64);
        await panel.evaluate((node) => {
          const frames: NavigationFrame[] = [];
          let raf = 0;
          const read = (changed = false) => {
            const root = node.getBoundingClientRect();
            const rtl = getComputedStyle(node).direction === 'rtl';
            const rows = [
              ...node.querySelectorAll<HTMLElement>('.ui-sidebar-item, .ui-navigation-rail-item'),
            ].slice(0, 4);
            const indicator = node.querySelector<HTMLElement>('.ui-selection-indicator');
            const shade = node
              .closest('.ui-sidebar-provider')!
              .querySelector<HTMLElement>('.ui-navigation-expansion-backdrop');
            const frame = node.closest('.ui-navigation-expansion-frame');
            frames.push({
              state: node.dataset.state,
              width: root.width,
              changed,
              rows: rows.map((row) => {
                const box = row.getBoundingClientRect();
                const icon = row
                  .querySelector<HTMLElement>('.ui-sidebar-item-icon, .ui-navigation-rail-icon')!
                  .getBoundingClientRect();
                const label = row
                  .querySelector<HTMLElement>('.ui-sidebar-item-label, .ui-navigation-rail-label')!
                  .getBoundingClientRect();
                return {
                  height: box.height,
                  y: box.y - root.y,
                  icon: rtl ? root.right - icon.right : icon.left - root.left,
                  labelHeight: label.height,
                };
              }),
              indicatorGap: indicator
                ? Math.abs(
                    indicator.getBoundingClientRect().width - rows[0].getBoundingClientRect().width,
                  )
                : 0,
              shade: shade ? Number(getComputedStyle(shade).opacity) : 0,
              shadeLayer: shade ? Number(getComputedStyle(shade).zIndex) : 0,
              layer: frame ? Number(getComputedStyle(frame).zIndex) : 0,
            });
          };
          const tick = () => {
            read();
            raf = requestAnimationFrame(tick);
          };
          const observer = new MutationObserver(() => read(true));
          observer.observe(node, { attributes: true, attributeFilter: ['data-state'] });
          read();
          raf = requestAnimationFrame(tick);
          (window as MotionWindow).stopNavigationCapture = () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            return frames;
          };
        });
        await panel.hover();
        await expect(panel).toHaveAttribute('data-state', 'expanded');
        await expect
          .poll(async () => (await panel.boundingBox())!.width)
          .toBe(kind === 'rail' ? 264 : 248);
        await page.mouse.move(1050, 700);
        await expect(panel).toHaveAttribute('data-state', 'collapsed');
        await expect.poll(async () => (await panel.boundingBox())!.width).toBe(64);
        const frames = await page.evaluate(() => (window as MotionWindow).stopNavigationCapture!());
        expect(frames.filter((frame) => frame.changed).map((frame) => frame.state)).toEqual([
          'expanded',
          'collapsed',
        ]);
        for (let index = 0; index < frames[0].rows.length; index++) {
          const rows = frames.map((frame) => frame.rows[index]);
          expect(
            Math.max(...rows.map((row) => row.height)) - Math.min(...rows.map((row) => row.height)),
          ).toBeLessThanOrEqual(1);
          expect(
            Math.max(...rows.map((row) => row.y)) - Math.min(...rows.map((row) => row.y)),
          ).toBeLessThanOrEqual(1);
          expect(
            Math.max(...rows.map((row) => row.icon)) - Math.min(...rows.map((row) => row.icon)),
          ).toBeLessThanOrEqual(1);
          expect(Math.max(...rows.map((row) => row.labelHeight))).toBeLessThanOrEqual(24);
        }
        if (kind === 'rail')
          expect(Math.max(...frames.map((frame) => frame.indicatorGap))).toBeLessThanOrEqual(1);
        if (mode === 'overlay') {
          const closing = frames.find((frame) => frame.changed && frame.state === 'collapsed')!;
          expect(closing.shade).toBeGreaterThan(0);
          expect(closing.layer).toBeGreaterThan(closing.shadeLayer);
          await expect(panel.locator('..')).toHaveCSS('z-index', '0');
        }
        await info.attach('motion-geometry', {
          body: JSON.stringify(frames),
          contentType: 'application/json',
        });
      });
    }
  }

  test(`${kind} reverses a closing hover without remounting or resetting width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(`/tests/fixtures/sidebar-overflow.html?hover=${kind}&mode=overlay`);
    const panel =
      kind === 'sidebar'
        ? page.getByRole('complementary')
        : page.getByRole('navigation', { name: 'Workspaces', exact: true });
    const targetWidth = kind === 'rail' ? 264 : 248;
    await panel.hover();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(targetWidth);
    await panel.evaluate((node) => {
      node.dataset.captureIdentity = 'retained';
    });
    await page.mouse.move(1050, 700);
    await expect(panel).toHaveAttribute('data-state', 'collapsed');
    await expect
      .poll(async () => (await panel.boundingBox())!.width)
      .toBeLessThan(targetWidth - 20);
    const box = (await panel.boundingBox())!;
    await page.mouse.move(box.x + 24, box.y + 20);
    await expect(panel).toHaveAttribute('data-state', 'expanded');
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(targetWidth);
    await expect(panel).toHaveAttribute('data-capture-identity', 'retained');
    const frame = panel.locator('..');
    await expect(frame).toHaveCSS('z-index', '79');
  });
}
