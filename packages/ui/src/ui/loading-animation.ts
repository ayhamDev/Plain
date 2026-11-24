import { loadingMorphPairs, loadingShapePaths } from './loading-shapes';

// Material's 650ms cadence, 200 stiffness / 0.6 damping spring, and independent
// quarter turns + slow 4666ms rotation. These tables run on the native SVG clock.
export const loadingCycleDuration = 4550;
export const loadingRotationDuration = 4666;
const step = 0.65;
const damping = 0.6 * Math.sqrt(200);
const frequency = Math.sqrt(200 - damping * damping);
const crossing = (Math.PI - Math.atan(frequency / damping)) / frequency;
const response = (t: number) =>
  1 -
  Math.exp(-damping * t) *
    (Math.cos(frequency * t) + (damping / frequency) * Math.sin(frequency * t));
const velocity = (t: number) =>
  (200 / frequency) * Math.exp(-damping * t) * Math.sin(frequency * t);
const trim = (n: number) => Number(n.toFixed(6));
const ease = (start: number, end: number) => {
  const delta = response(end) - response(start);
  const bounded = (n: number) => trim(Math.max(0, Math.min(1, n)));
  return `0.333333 ${bounded(((end - start) * velocity(start)) / delta / 3)} 0.666667 ${bounded(1 - ((end - start) * velocity(end)) / delta / 3)}`;
};
const shapeTimes = [0, 0.065, 0.13, crossing];
const turnTimes = [
  0,
  0.065,
  0.13,
  crossing,
  Math.PI / frequency,
  0.4,
  (Math.PI * 2) / frequency,
  step,
];

function visibility(start: number, end: number) {
  const times = start === 0 ? [0, end, 1] : end === 1 ? [0, start, 1] : [0, start, end, 1];
  const values =
    start === 0
      ? ['visible', 'hidden', 'hidden']
      : end === 1
        ? ['hidden', 'visible', 'hidden']
        : ['hidden', 'visible', 'hidden', 'hidden'];
  return { times: times.map(trim).join(';'), values: values.join(';') };
}

function turnAnimation() {
  const values: string[] = ['0 24 24'];
  const times = [0];
  const splines: string[] = [];
  // Four contour cycles make 28 quarter turns, so the repeat boundary is exact.
  for (let index = 0; index < 28; index++) {
    for (let sample = 1; sample < turnTimes.length; sample++) {
      const time = turnTimes[sample];
      values.push(`${trim((index + (time === step ? 1 : response(time))) * 90)} 24 24`);
      times.push(trim((index + time / step) / 28));
      splines.push(ease(turnTimes[sample - 1], time));
    }
  }
  return { values: values.join(';'), times: times.join(';'), splines: splines.join(';') };
}

function stage(index: number, first: number) {
  const source = (first + index) % 7;
  const target = (source + 1) % 7;
  const [from, to] = loadingMorphPairs[source];
  const paths = shapeTimes.map((time) => {
    const progress = time === crossing ? 1 : response(time);
    return `M${from.map((point, i) => point.map((value, axis) => Number((value + (to[i][axis] - value) * progress).toFixed(2))).join(' ')).join('L')}Z`;
  });
  const start = index / 7;
  const settled = (index + crossing / step) / 7;
  const times = shapeTimes.map((time) => trim((index + time / step) / 7));
  const splines = shapeTimes.slice(1).map((time, i) => ease(shapeTimes[i], time));
  if (start > 0) {
    times.unshift(0);
    paths.unshift(paths[0]);
    splines.unshift('0 0 1 1');
  }
  times.push(1);
  paths.push(paths[paths.length - 1]);
  splines.push('0 0 1 1');
  return {
    source,
    target,
    path: paths[0],
    rest: loadingShapePaths[target],
    values: paths.join(';'),
    times: times.join(';'),
    splines: splines.join(';'),
    morphVisibility: visibility(start, settled),
    restVisibility: visibility(settled, (index + 1) / 7),
  };
}

const cache = new Map<
  number,
  { turn: ReturnType<typeof turnAnimation>; stages: ReturnType<typeof stage>[] }
>();
let turn: ReturnType<typeof turnAnimation> | undefined;
export function loadingAnimation(first: number) {
  let animation = cache.get(first);
  if (!animation) {
    animation = {
      turn: (turn ??= turnAnimation()),
      stages: Array.from({ length: 7 }, (_, index) => stage(index, first)),
    };
    cache.set(first, animation);
  }
  return animation;
}
