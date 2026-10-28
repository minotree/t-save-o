import earcut from 'earcut';
import type { Point } from './engine';

export type PathCommand =
  | { type: 'M' | 'L'; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' };

// Matches the M/L/Q/C/Z commands of SVG and common font outline exporters.
// A filled outline may have multiple nested contours (even-odd holes).
export type VectorShape = { commands: readonly PathCommand[]; strokeWidth: number; fill?: boolean };
export type Primitive = { polygon: Point[]; radius: number };
export const CURVE_TOLERANCE = .025; // Logical units, independent of zoom/device.

export function pathData(commands: readonly PathCommand[]): string {
  return commands.map(c => {
    if (c.type === 'Z') return 'Z';
    if (c.type === 'Q') return `Q${c.x1},${c.y1} ${c.x},${c.y}`;
    if (c.type === 'C') return `C${c.x1},${c.y1} ${c.x2},${c.y2} ${c.x},${c.y}`;
    return `${c.type}${c.x},${c.y}`;
  }).join(' ');
}

export function transformCommands(commands: readonly PathCommand[], origin: Point, scale: Point): PathCommand[] {
  return commands.map(c => {
    if (c.type === 'Z') return c;
    const end = { x: origin.x + c.x * scale.x, y: origin.y + c.y * scale.y };
    if (c.type === 'Q') return { ...c, ...end, x1: origin.x + c.x1 * scale.x, y1: origin.y + c.y1 * scale.y };
    if (c.type === 'C') return { ...c, ...end, x1: origin.x + c.x1 * scale.x, y1: origin.y + c.y1 * scale.y, x2: origin.x + c.x2 * scale.x, y2: origin.y + c.y2 * scale.y };
    return { ...c, ...end };
  });
}

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
  const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / squared));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// De Casteljau subdivision. Every control point is within tolerance of the
// finite chord before it is accepted, including overshoot/collinear reversals.
export function flattenPath(commands: readonly PathCommand[], tolerance = CURVE_TOLERANCE): Point[][] {
  if (!(tolerance > 0)) throw new Error('Curve tolerance must be positive');
  const contours: Point[][] = [];
  let current: Point[] = [];
  function cubic(a: Point, b: Point, c: Point, d: Point, depth = 0) {
    if (Math.max(segmentDistance(b, a, d), segmentDistance(c, a, d)) <= tolerance) { current.push(d); return; }
    if (depth >= 24) throw new Error('Curve subdivision limit exceeded');
    const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d);
    const abc = midpoint(ab, bc), bcd = midpoint(bc, cd), center = midpoint(abc, bcd);
    cubic(a, ab, abc, center, depth + 1);
    cubic(center, bcd, cd, d, depth + 1);
  }
  for (const c of commands) {
    if (c.type === 'M') { current = [{ x: c.x, y: c.y }]; contours.push(current); continue; }
    if (!current.length) throw new Error('Path must start with M');
    const a = current[current.length - 1];
    if (c.type === 'Z') { current.push({ ...current[0] }); continue; }
    const end = { x: c.x, y: c.y };
    if (c.type === 'L') current.push(end);
    else if (c.type === 'Q') {
      cubic(a, { x: a.x + 2 / 3 * (c.x1 - a.x), y: a.y + 2 / 3 * (c.y1 - a.y) },
        { x: end.x + 2 / 3 * (c.x1 - end.x), y: end.y + 2 / 3 * (c.y1 - end.y) }, end);
    } else if (c.type === 'C') cubic(a, { x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }, end);
  }
  return contours;
}

function inside(p: Point, polygon: Point[]): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}

const compiled = new WeakMap<VectorShape, Primitive[]>();
export function compileShape(shape: VectorShape): Primitive[] {
  const cached = compiled.get(shape);
  if (cached) return cached;
  if (!Number.isFinite(shape.strokeWidth) || shape.strokeWidth < 0) throw new Error('Invalid stroke width');
  const contours = flattenPath(shape.commands);
  if (!contours.length || contours.some(c => c.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)))) throw new Error('Invalid path');
  const curved = shape.commands.some(c => c.type === 'Q' || c.type === 'C');
  // Padding bounds the curve/chord approximation; straight paths get no padding.
  const error = curved ? CURVE_TOLERANCE : 0;
  const primitives: Primitive[] = [];
  if (shape.strokeWidth > 0) {
    for (const contour of contours) for (let i = 1; i < contour.length; i++) {
      primitives.push({ polygon: [contour[i - 1], contour[i]], radius: shape.strokeWidth / 2 + error });
    }
  }
  if (shape.fill) {
    const rings = contours.map(c => c.length > 1 && c[0].x === c[c.length - 1].x && c[0].y === c[c.length - 1].y ? c.slice(0, -1) : c);
    if (rings.some(c => c.length < 3)) throw new Error('Filled contours need at least three points');
    const depths = rings.map((ring, i) => rings.filter((other, j) => j !== i && inside(ring[0], other)).length);
    rings.forEach((outer, i) => {
      if (depths[i] % 2) return;
      const holes = rings.filter((ring, j) => depths[j] === depths[i] + 1 && inside(ring[0], outer));
      const vertices = [...outer], holeIndices: number[] = [];
      for (const hole of holes) { holeIndices.push(vertices.length); vertices.push(...hole); }
      const indices = earcut(vertices.flatMap(p => [p.x, p.y]), holeIndices);
      for (let k = 0; k < indices.length; k += 3) primitives.push({ polygon: indices.slice(k, k + 3).map(index => vertices[index]), radius: error });
    });
  }
  if (!primitives.length) throw new Error('Empty shape');
  compiled.set(shape, primitives);
  return primitives;
}
