import { describe, it, expect } from 'vitest';
import {
  loadingAnimation,
  loadingCycleDuration,
  loadingRotationDuration,
} from '../src/ui/loading-animation';
import { loadingShapePaths } from '../src/ui/loading-shapes';

describe('Material loading choreography', () => {
  it('keeps the original curved contours and a separate slow rotation', () => {
    expect(loadingShapePaths).toHaveLength(7);
    expect(loadingShapePaths.every((path) => path.includes('C'))).toBe(true);
    expect(loadingShapePaths[0]).toMatch(/^M22\.47 7\.84C/);
    expect(loadingCycleDuration / 7).toBe(650);
    expect(loadingRotationDuration).toBe(4666);
  });
  it('caches feature-matched transitions without mutating the starting sequence', () => {
    const base = loadingAnimation(0),
      shifted = loadingAnimation(6);
    expect(loadingAnimation(0)).toBe(base);
    expect(shifted.stages[0].source).toBe(6);
    expect(shifted.stages[0].target).toBe(0);
    expect(base.stages[0].source).toBe(0);
    for (const animation of [base, shifted])
      for (const stage of animation.stages) {
        const paths = stage.values.split(';');
        expect(new Set(paths.map((path) => path.split('L').length)).size).toBe(1);
        expect(stage.rest).toBe(loadingShapePaths[stage.target]);
        const times = stage.times.split(';').map(Number);
        expect(times[0]).toBe(0);
        expect(times.at(-1)).toBe(1);
        expect(times.every((time, i) => !i || time > times[i - 1])).toBe(true);
        expect(stage.splines.split(';')).toHaveLength(times.length - 1);
        expect(stage.values).not.toMatch(/NaN|Infinity/);
      }
  });
  it('overshoots and settles a quarter turn, with a continuous repeat boundary', () => {
    const turn = loadingAnimation(0).turn;
    const values = turn.values.split(';').map((value) => Number(value.split(' ')[0]));
    const times = turn.times.split(';').map(Number);
    const stepEnd = times.findIndex((time) => time === Number((1 / 28).toFixed(6)));
    expect(values[stepEnd]).toBe(90);
    expect(Math.max(...values.slice(0, stepEnd))).toBeGreaterThan(98);
    expect(values[0]).toBe(0);
    expect(values.at(-1)! % 360).toBe(0);
    expect(values.at(-1)).toBe(28 * 90);
    expect(times.at(-1)).toBe(1);
    expect(turn.splines.split(';')).toHaveLength(times.length - 1);
  });
});
