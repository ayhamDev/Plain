import { test, expect } from '@playwright/test';

test('Material loading settles each contour and springs its quarter turns', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tests/fixtures/expressive-feedback.html');
  const svg = page.getByTestId('loader').locator('svg');
  await expect(svg.locator('animateTransform')).toHaveCount(2);
  const samples = await svg.evaluate(async (element: SVGSVGElement) => {
    element.pauseAnimations();
    const result = [];
    for (const time of [0, 0.065, 0.13, 0.28, 0.4, 0.6, 0.65, 0.9, 4.549, 4.551, 18.199, 18.201]) {
      element.setCurrentTime(time);
      await new Promise(requestAnimationFrame);
      const paths = [...element.querySelectorAll('path')].filter(
        (path) => getComputedStyle(path).visibility === 'visible',
      );
      const turn = element.querySelector<SVGGElement>('[data-loading-rotation="turn"]')!;
      const global = element.querySelector<SVGGElement>('[data-loading-rotation="global"]')!;
      result.push({
        time,
        visible: paths.length,
        contour: paths[0]?.dataset.loadingContour,
        phase: paths[0]?.dataset.loadingPhase,
        curved: paths[0]?.getAttribute('d')?.includes('C'),
        turn: turn.transform.animVal.getItem(0).angle,
        global: global.transform.animVal.getItem(0).angle,
      });
    }
    return result;
  });
  expect(samples.every((sample) => sample.visible === 1)).toBe(true);
  expect(samples.find((sample) => sample.time === 0)!.contour).toBe('0');
  expect(samples.find((sample) => sample.time === 0.28)!.turn).toBeGreaterThan(98);
  expect(Math.abs(samples.find((sample) => sample.time === 0.6)!.turn - 90)).toBeLessThan(1);
  expect(samples.find((sample) => sample.time === 0.65)!.turn).toBeCloseTo(90, 1);
  for (const time of [0.28, 0.4, 0.6]) {
    const sample = samples.find((sample) => sample.time === time)!;
    expect(sample.phase).toBe('rest');
    expect(sample.contour).toBe('1');
    expect(sample.curved).toBe(true);
  }
  expect(samples.find((sample) => sample.time === 0.13)!.global).toBeCloseTo(
    (360 * 0.13) / 4.666,
    1,
  );
  await info.attach('native-material-motion.json', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  });
});

test('every animated contour remains inside its bounds through rotations and repeat boundaries', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/tests/fixtures/expressive-feedback.html?dir=rtl&theme=dark');
  const svg = page.getByTestId('loader').locator('svg');
  await expect(svg.locator('animateTransform')).toHaveCount(2);
  const bounds = await svg.evaluate(async (element: SVGSVGElement) => {
    element.pauseAnimations();
    const records = [];
    const times = [0, 0.1, 0.3, 0.8, 1.4, 2.05, 2.7, 3.35, 4, 4.549, 4.551, 18.199, 18.201];
    for (const time of times) {
      element.setCurrentTime(time);
      await new Promise(requestAnimationFrame);
      const path = [...element.querySelectorAll('path')].find(
        (path) => getComputedStyle(path).visibility === 'visible',
      )!;
      const length = path.getTotalLength(),
        matrix = path.getScreenCTM()!,
        frame = element.getBoundingClientRect();
      const points = Array.from({ length: 192 }, (_, i) =>
        path.getPointAtLength((length * i) / 192).matrixTransform(matrix),
      );
      records.push({
        time,
        x: Math.min(...points.map((p) => p.x)),
        right: Math.max(...points.map((p) => p.x)),
        y: Math.min(...points.map((p) => p.y)),
        bottom: Math.max(...points.map((p) => p.y)),
        frame: { x: frame.x, y: frame.y, right: frame.right, bottom: frame.bottom },
      });
    }
    return records;
  });
  for (const box of bounds) {
    expect(box.x).toBeGreaterThanOrEqual(box.frame.x);
    expect(box.y).toBeGreaterThanOrEqual(box.frame.y);
    expect(box.right).toBeLessThanOrEqual(box.frame.right);
    expect(box.bottom).toBeLessThanOrEqual(box.frame.bottom);
  }
  for (const [before, after] of [
    [4.549, 4.551],
    [18.199, 18.201],
  ]) {
    const a = bounds.find((box) => box.time === before)!,
      b = bounds.find((box) => box.time === after)!;
    expect(
      Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.right - b.right),
        Math.abs(a.bottom - b.bottom),
      ),
    ).toBeLessThan(1);
  }
  await info.attach('rotated-contour-bounds.json', {
    body: JSON.stringify(bounds, null, 2),
    contentType: 'application/json',
  });
  await page.screenshot({ path: info.outputPath('material-mobile-rtl.png'), fullPage: true });
});
