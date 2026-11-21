import Encoder from 'qrcode';
import type { QRCodeErrorCorrectionLevel, QRCodeModuleShape } from './qr-code';

export interface QRMatrix {
  state: 'ready' | 'empty' | 'error';
  size: number;
  data: Uint8Array;
  reserved: Uint8Array;
  error: Error | null;
}
export function encodeQR(
  value: string,
  level: QRCodeErrorCorrectionLevel,
  version?: number,
  mask?: number,
): QRMatrix {
  const empty = { size: 0, data: new Uint8Array(), reserved: new Uint8Array() };
  if (value === '') return { ...empty, state: 'empty', error: null };
  try {
    if (typeof value !== 'string') throw new TypeError('QRCode value must be a string.');
    const { modules } = Encoder.create(value, {
      errorCorrectionLevel: level,
      version,
      maskPattern: mask as Encoder.QRCodeMaskPattern | undefined,
    });
    return {
      state: 'ready',
      size: modules.size,
      data: modules.data,
      reserved: modules.reservedBit,
      error: null,
    };
  } catch (error) {
    return {
      ...empty,
      state: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
const number = (value: number) => Number(value.toFixed(4));
export function roundedRect(x: number, y: number, size: number, radius: number) {
  const r = number(Math.min(size / 2, Math.max(0, radius)));
  const endX = number(x + size),
    endY = number(y + size);
  return `M${number(x + r)} ${number(y)}H${number(endX - r)}Q${endX} ${number(y)} ${endX} ${number(y + r)}V${number(endY - r)}Q${endX} ${endY} ${number(endX - r)} ${endY}H${number(x + r)}Q${number(x)} ${endY} ${number(x)} ${number(endY - r)}V${number(y + r)}Q${number(x)} ${number(y)} ${number(x + r)} ${number(y)}Z`;
}
export function modulePath(x: number, y: number, shape: QRCodeModuleShape, scale = 1) {
  const inset = (1 - scale) / 2;
  const left = number(x + inset),
    top = number(y + inset),
    side = number(scale);
  if (shape === 'dots') {
    const r = number(scale / 2),
      cx = number(x + 0.5),
      cy = number(y + 0.5);
    return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${side} 0a${r} ${r} 0 1 0 ${-side} 0Z`;
  }
  if (shape === 'diamond')
    return `M${number(x + 0.5)} ${top}L${number(left + side)} ${number(y + 0.5)} ${number(x + 0.5)} ${number(top + side)} ${left} ${number(y + 0.5)}Z`;
  if (shape === 'rounded') return roundedRect(left, top, side, side * 0.28);
  return `M${left} ${top}h${side}v${side}h${-side}Z`;
}
export function finderAt(x: number, y: number, size: number) {
  return (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
}
export interface QRLogoBounds {
  x: number;
  y: number;
  size: number;
  padding: number;
}
export function inLogo(x: number, y: number, logo?: QRLogoBounds) {
  return (
    !!logo &&
    x + 1 > logo.x - logo.padding &&
    x < logo.x + logo.size + logo.padding &&
    y + 1 > logo.y - logo.padding &&
    y < logo.y + logo.size + logo.padding
  );
}
export function qrPaths(
  matrix: QRMatrix,
  shape: QRCodeModuleShape,
  scale: number,
  logo?: QRLogoBounds,
) {
  const runs = (match: (x: number, y: number, index: number) => boolean) => {
    const paths: string[] = [];
    for (let y = 0; y < matrix.size; y++) {
      let x = 0;
      while (x < matrix.size) {
        if (!match(x, y, y * matrix.size + x)) {
          x++;
          continue;
        }
        const start = x;
        while (x < matrix.size && match(x, y, y * matrix.size + x)) x++;
        paths.push(`M${start} ${y}h${x - start}v1H${start}Z`);
      }
    }
    return paths.join('');
  };
  if (shape === 'square' && scale === 1)
    return {
      data: runs((x, y, i) => !!matrix.data[i] && !matrix.reserved[i] && !inLogo(x, y, logo)),
      functions: runs(
        (x, y, i) => !!matrix.data[i] && !!matrix.reserved[i] && !finderAt(x, y, matrix.size),
      ),
      reserved: logo ? runs((_x, _y, i) => !!matrix.reserved[i]) : '',
    };
  const data: string[] = [],
    functions: string[] = [],
    reserved: string[] = [];
  for (let y = 0; y < matrix.size; y++)
    for (let x = 0; x < matrix.size; x++) {
      const index = y * matrix.size + x;
      if (logo && matrix.reserved[index]) reserved.push(modulePath(x, y, 'square'));
      if (!matrix.data[index] || finderAt(x, y, matrix.size)) continue;
      if (matrix.reserved[index]) functions.push(modulePath(x, y, 'square'));
      else if (!inLogo(x, y, logo)) data.push(modulePath(x, y, shape, scale));
    }
  return { data: data.join(''), functions: functions.join(''), reserved: reserved.join('') };
}
export function circlePattern(
  matrix: QRMatrix,
  extent: number,
  margin: number,
  shape: QRCodeModuleShape,
  scale: number,
) {
  if (!matrix.size) return '';
  const center = extent / 2,
    quietHalf = (matrix.size + margin * 2) / 2;
  const radius = center - margin;
  const paths: string[] = [];
  for (let y = 0; y < extent; y++)
    for (let x = 0; x < extent; x++) {
      // The whole decorative module must be outside the required square quiet zone.
      if (
        x < center + quietHalf &&
        x + 1 > center - quietHalf &&
        y < center + quietHalf &&
        y + 1 > center - quietHalf
      )
        continue;
      if (Math.hypot(Math.abs(x + 0.5 - center) + 0.5, Math.abs(y + 0.5 - center) + 0.5) > radius)
        continue;
      // Repeat encoded bits deterministically: no random render/SSR differences.
      if (matrix.data[(y * extent + x) % matrix.data.length])
        paths.push(modulePath(x, y, shape, scale));
    }
  return paths.join('');
}
export function finite(value: number | undefined, fallback: number, min: number, max: number) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
