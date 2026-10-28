import { describe, expect, it } from 'vitest';
import { exitTranslation, findBlocker, pointTouchesShape } from './engine';
import { headGeometry, instantiatePenStrokes } from './pen-stroke';
import type { PenStrokeDefinition } from './pen-stroke';
import { flattenPath, transformCommands } from './vector-shape';
import { svgPath } from './jamo-templates';
import { fontSeongPuzzle as puzzle } from './font-seong';
import type { PathCommand } from './vector-shape';

const straight: PenStrokeDefinition = {
  key: 'stroke', jamoInstance: 'test:initial', jamo: 'test', role: 'initial', order: 1, name: 'explicit pen stroke',
  body: { commands: svgPath('M10 10 L50 10 L50 16 L10 16 Z'), fill: true, strokeWidth: 0 },
  pen: { path: svgPath('M10 13 L50 13'), start: { center: { x: 10, y: 13 }, width: 6 }, end: { center: { x: 50, y: 13 }, width: 6 } },
  head: { at: 'start', direction: { x: -1, y: 0 }, length: 7, width: 6, overlap: .6 }
};

describe('terminal head and writing-stroke contract', () => {
  it('places every 성 head at its declared physical endpoint with its tip outside the body', () => {
    for (const a of puzzle.arrows) {
      const head = a.head!, pen = a.penStroke!, cap = pen.pen[head.endpoint!];
      expect(head.capCenter).toEqual(cap.center);
      expect(Math.hypot(head.anchor.x - cap.center.x, head.anchor.y - cap.center.y)).toBeCloseTo(pen.head.overlap, 6);
      const m = Math.hypot(a.direction.x, a.direction.y);
      const tip = { x: head.anchor.x + a.direction.x / m * head.length!, y: head.anchor.y + a.direction.y / m * head.length! };
      expect(pointTouchesShape(head.anchor, a.shape!)).toBe(true);
      expect(pointTouchesShape(tip, a.shape!)).toBe(false);
      const render = headGeometry(head);
      expect(render.d).toContain(`L${head.length} 0`);
      const rotation = Number(render.transform.match(/rotate\(([^)]+)\)/)?.[1]) * Math.PI / 180;
      const exit = exitTranslation(a, puzzle);
      expect(Math.cos(rotation) * exit.y - Math.sin(rotation) * exit.x).toBeCloseTo(0, 8);
      expect(Math.cos(rotation) * exit.x + Math.sin(rotation) * exit.y).toBeGreaterThan(0);
    }
  });
  it('does not let an interior point masquerade as a pen endpoint', () => {
    const fake = { ...straight, pen: { ...straight.pen, path: svgPath('M30 13 L50 13'), start: { center: { x: 30, y: 13 }, width: 6 } } };
    expect(() => instantiatePenStrokes([fake], 2)).toThrow(/boundary/);
    expect(() => headGeometry({ anchor: { x: 30, y: 13 }, direction: { x: 1, y: 0 } })).toThrow(/terminal head/);
  });
  it('does not infer movement from writing order, end-to-end vector or tangent', () => {
    const result = instantiatePenStrokes([straight], 2)[0];
    expect(result.direction).toEqual({ x: -1, y: 0 });
    expect(result.points[result.points.length - 1].x).toBeGreaterThan(result.points[0].x);
    expect(result.shape).toBe(straight.body);
    expect(result.head?.direction).toBe(straight.head.direction);
    const reversedHead = { ...straight, head: { ...straight.head, at: 'end' as const, direction: { x: 1, y: 0 } } };
    expect(instantiatePenStrokes([reversedHead], 2)[0].direction).toEqual({ x: 1, y: 0 });
  });
  it('uses the same complete body and collision result regardless of visual head size', () => {
    const a = instantiatePenStrokes([straight], 2)[0];
    const large = instantiatePenStrokes([{ ...straight, head: { ...straight.head, width: 90, length: 80 } }], 2)[0];
    const board = { ...puzzle, width: 100, height: 100, targets: [] };
    expect(a.shape).toBe(large.shape);
    expect(findBlocker(a, [a], board)).toBe(findBlocker(large, [large], board));
    expect(exitTranslation(a, board)).toEqual(exitTranslation(large, board));
  });
  it('keeps the difficulty split cap per jamo and role', () => {
    expect(() => instantiatePenStrokes([straight, { ...straight, key: '2' }, { ...straight, key: '3' }], 2)).toThrow(/Split limit/);
    expect(instantiatePenStrokes([straight, { ...straight, key: '2' }, { ...straight, key: '3' }], 3)).toHaveLength(3);
    expect(instantiatePenStrokes([straight, { ...straight, key: '2' }, { ...straight, key: '3', jamoInstance: 'second-cell:initial' }], 2)).toHaveLength(3);
  });
  it('keeps both writing spines inside their whole ㅅ bodies', () => {
    for (const a of puzzle.arrows.slice(0, 2)) {
      for (const point of flattenPath(a.penStroke!.pen.path).flat()) expect(pointTouchesShape(point, a.shape!)).toBe(true);
    }
  });
});

describe('shape-independent rigid pen strokes', () => {
  function fixture(body: string, spine: string, start: { x: number; y: number }, end: { x: number; y: number }, width: number): PenStrokeDefinition {
    const translate = { x: 20, y: 20 }, unit = { x: 1, y: 1 };
    return { ...straight, body: { commands: transformCommands(svgPath(body), translate, unit), fill: true, strokeWidth: 0 },
      pen: { path: transformCommands(svgPath(spine), translate, unit), start: { center: { x: start.x + 20, y: start.y + 20 }, width }, end: { center: { x: end.x + 20, y: end.y + 20 }, width } },
      head: { at: 'start', direction: { x: 1, y: 0 }, length: 7, width, overlap: .4 } };
  }
  it('moves a bent stroke without treating the end-to-end diagonal as its direction', () => {
    const bent = fixture('M10 10 L40 10 L40 40 L34 40 L34 16 L10 16 Z', 'M10 13 L37 13 L37 40',
      { x: 10, y: 13 }, { x: 37, y: 40 }, 6);
    bent.head = { ...bent.head, direction: { x: -1, y: 0 } };
    const a = instantiatePenStrokes([bent], 2)[0];
    expect(a.direction).toEqual({ x: -1, y: 0 });
    expect(exitTranslation(a, { width: 100, height: 100 }).y).toBe(0);
    expect(a.points[a.points.length - 1].y - a.points[0].y).toBe(27);
  });
  it('moves an S curve as one unchanged body along the explicitly assigned head direction', () => {
    const s = fixture('M10 0 C-10 0 -10 20 10 20 C30 20 30 40 10 40 L10 36 C24 36 24 24 10 24 C-16 24 -16 -4 10 -4 Z',
      'M10 -2 C-13 -2 -13 22 10 22 C27 22 27 38 10 38', { x: 10, y: -2 }, { x: 10, y: 38 }, 4);
    const a = instantiatePenStrokes([s], 2)[0], before = JSON.stringify(a.shape);
    expect(a.direction).toEqual({ x: 1, y: 0 });
    expect(findBlocker(a, [a], { ...puzzle, width: 100, height: 100, targets: [] })).toBeNull();
    expect(exitTranslation(a, { width: 100, height: 100 }).y).toBe(0);
    expect(JSON.stringify(a.shape)).toBe(before);
  });
  it('supports a spiral body without deriving motion from its tangents', () => {
    const spine: { x: number; y: number }[] = [], left: { x: number; y: number }[] = [], right: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100, angle = t * Math.PI * 2.5, radius = 25 - 20 * t;
      const center = { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
      const dx = -20 * Math.cos(angle) - radius * Math.sin(angle) * Math.PI * 2.5;
      const dy = -20 * Math.sin(angle) + radius * Math.cos(angle) * Math.PI * 2.5, m = Math.hypot(dx, dy);
      spine.push(center); left.push({ x: center.x - dy / m * 2, y: center.y + dx / m * 2 }); right.push({ x: center.x + dy / m * 2, y: center.y - dx / m * 2 });
    }
    const path = (points: { x: number; y: number }[]): PathCommand[] => points.map((p, i) => ({ type: i ? 'L' : 'M', ...p }));
    const spiral: PenStrokeDefinition = { ...straight,
      body: { commands: [...path([...left, ...right.reverse()]), { type: 'Z' }], fill: true, strokeWidth: 0 },
      pen: { path: path(spine), start: { center: spine[0], width: 4 }, end: { center: spine[100], width: 4 } },
      head: { at: 'start', direction: { x: 1, y: 0 }, length: 7, width: 4, overlap: .4 } };
    const a = instantiatePenStrokes([spiral], 2)[0];
    expect(findBlocker(a, [a], { ...puzzle, width: 120, height: 120, targets: [] })).toBeNull();
    expect(exitTranslation(a, { width: 120, height: 120 }).y).toBe(0);
    expect(a.penStroke?.body).toBe(spiral.body);
  });
});
