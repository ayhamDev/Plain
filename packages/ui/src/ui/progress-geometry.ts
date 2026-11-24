/** Geometry stays in CSS pixels, including when a responsive linear bar resizes. */
export function finiteRange(value: number, fallback: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

export function progressValue(value: number | null | undefined, max: number) {
  return value == null || !Number.isFinite(value) ? null : Math.max(0, Math.min(max, value));
}

const coordinate = (value: number) => Number(value.toFixed(3));

/** Cubic Hermite segments preserve a smooth sine wave and rounded, exact endpoints. */
export function linearWave(
  start: number,
  end: number,
  y: number,
  amplitude: number,
  wavelength: number,
) {
  const omega = (2 * Math.PI) / wavelength;
  let path = `M${coordinate(start)} ${coordinate(y)}`;
  const sample = (x: number) => y + amplitude * Math.sin((x - start) * omega);
  const slope = (x: number) => amplitude * omega * Math.cos((x - start) * omega);
  for (let x = start; x < end;) {
    const next = Math.min(end, x + wavelength / 4);
    const control = (next - x) / 3;
    path += `C${coordinate(x + control)} ${coordinate(sample(x) + slope(x) * control)} ${coordinate(next - control)} ${coordinate(sample(next) - slope(next) * control)} ${coordinate(next)} ${coordinate(sample(next))}`;
    x = next;
  }
  return path;
}

export function circularWave(center: number, radius: number, amplitude: number, waves: number) {
  const steps = waves * 16;
  let path = '';
  for (let index = 0; index <= steps; index++) {
    const angle = (index / steps) * Math.PI * 2 - Math.PI / 2;
    const r = radius + amplitude * Math.sin(waves * (angle + Math.PI / 2));
    path += `${index ? 'L' : 'M'}${coordinate(center + r * Math.cos(angle))} ${coordinate(center + r * Math.sin(angle))}`;
  }
  return `${path}Z`;
}
