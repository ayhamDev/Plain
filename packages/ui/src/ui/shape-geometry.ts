import { shapePaths } from './shape-data';

export type ShapeName = keyof typeof shapePaths;
export type ShapeType = ShapeName;
export const SHAPE_PATHS = shapePaths;
export const shapeNames = /* @__PURE__ */ Object.keys(shapePaths) as ShapeName[];
const clips = new Map<ShapeName, string>();

/** Responsive CSS mask geometry, with identical vertices for native interpolation. */
export function getShapeClipPath(shape: ShapeName) {
  let clip = clips.get(shape);
  if (!clip) {
    clip = `polygon(${shapePaths[shape]
      .slice(1, -1)
      .split('L')
      .map((pair) =>
        pair
          .split(' ')
          .map((value) => `${value}%`)
          .join(' '),
      )
      .join(',')})`;
    clips.set(shape, clip);
  }
  return clip;
}
