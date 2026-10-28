import { describe, expect, it } from 'vitest';
import { compileShape, flattenPath, pathData, transformCommands } from './vector-shape';
import type { VectorShape } from './vector-shape';
import { findBlocker, isShapeConnected, pointTouchesShape, shapesOverlap } from './engine';
import type { Arrow, Puzzle } from './engine';
import { instantiateJamo, instantiateTemplate, jamoTemplates, modernConsonants, modernVowels, svgPath } from './jamo-templates';
import { firstPuzzle } from './puzzle';

const shape = (path: string, strokeWidth = 6, fill = false): VectorShape => ({ commands: svgPath(path), strokeWidth, fill });
const arrow = (id: string, body: VectorShape): Arrow => ({ id, label: id, shape: body, points: flattenPath(body.commands).flat(), direction: { x: 1, y: 0 } });
const board = (arrows: Arrow[]): Puzzle => ({ width: 100, height: 100, letter: '', arrows, targets: [] });

describe('shared SVG path geometry', () => {
  it('includes real stroke thickness rather than only centerline intersections', () => {
    const a = arrow('a', shape('M10 20 L20 20'));
    const b = arrow('b', shape('M50 25 L60 25'));
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
    const separated = arrow('b', shape('M50 26.001 L60 26.001'));
    expect(findBlocker(a, [a, separated], board([a, separated]))).toBeNull();
  });
  it('treats thickness boundaries touching as a collision', () => {
    const a = arrow('a', shape('M10 20 L20 20'));
    const b = arrow('b', shape('M50 26 L60 26'));
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
  });
  it('keeps a curved bulge in collision instead of replacing it with its endpoint chord', () => {
    const a = { ...arrow('a', shape('M10 50 C10 10 90 10 90 50', 2)), direction: { x: 0, y: 1 } };
    const b = arrow('b', shape('M49 20 L51 20', 2));
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
    const chord = { ...a, shape: shape('M10 50 L90 50', 2) };
    expect(findBlocker(chord, [chord, b], board([chord, b]))).toBeNull();
  });
  it('supports quadratic curves, closed contours and multiple connected subpaths', () => {
    expect(flattenPath(svgPath('M0 0 Q50 100 100 0'))[0].length).toBeGreaterThan(8);
    expect(isShapeConnected(shape('M0 0 L20 0 M10 0 L10 20'))).toBe(true);
    expect(isShapeConnected(shape('M0 0 L20 0 M50 0 L50 20'))).toBe(false);
    expect(isShapeConnected(shape('M0 0 L20 0 Q25 0 25 5 L25 20 L0 20 Z'))).toBe(true);
  });
  it('does not hide collinear curve overshoot behind a zero-length chord', () => {
    const points = flattenPath(svgPath('M0 0 C100 0 -100 0 0 0'))[0];
    expect(Math.max(...points.map(p => p.x))).toBeGreaterThan(20);
    expect(Math.min(...points.map(p => p.x))).toBeLessThan(-20);
  });
  it('triangulates font-style filled contours and preserves holes', () => {
    const outline = shape('M0 0 L10 0 L10 10 L0 10 Z M3 3 L7 3 L7 7 L3 7 Z', 0, true);
    const area = compileShape(outline).reduce((total, p) => {
      const [a, b, c] = p.polygon;
      return total + Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
    }, 0);
    expect(area).toBeCloseTo(84);
    expect(shapesOverlap(outline, shape('M4 4 L6 4 L6 6 L4 6 Z', 0, true))).toBe(false);
    expect(shapesOverlap(outline, shape('M1 4 L2 4 L2 6 L1 6 Z', 0, true))).toBe(true);
  });
  it('checks the complete movement of a filled outline', () => {
    const a = arrow('a', shape('M10 10 L15 10 L15 20 L10 20 Z', 0, true));
    const b = arrow('b', shape('M60 12 L62 12 L62 18 L60 18 Z', 0, true));
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
  });
  it('translates curve control points without changing their shape', () => {
    const original = svgPath('M0 0 Q10 20 20 0 C30 0 40 10 50 0 Z');
    const moved = transformCommands(original, { x: 15, y: 25 }, { x: 1, y: 1 });
    const before = flattenPath(original), after = flattenPath(moved);
    expect(after[0]).toHaveLength(before[0].length);
    after[0].forEach((p, i) => {
      expect(p.x).toBeCloseTo(before[0][i].x + 15, 10);
      expect(p.y).toBeCloseTo(before[0][i].y + 25, 10);
    });
    expect(pathData(moved)).toContain('Q');
    expect(pathData(moved)).toContain('C');
  });
  it('rejects unsupported path commands and invalid geometry', () => {
    expect(() => svgPath('M0 0 A10 10 0 0 0 20 20')).toThrow();
    expect(() => compileShape(shape('M0 0 L1 1', -1))).toThrow();
    expect(() => flattenPath(svgPath('M0 0 L1 1'), 0)).toThrow();
  });
});

describe('reusable modern jamo templates', () => {
  it('accepts a reviewed filled font outline as a movable piece with its own head vector', () => {
    const result = instantiateTemplate({ rings: [], strokes: [{ key: 'outline', name: 'reviewed contour',
      path: svgPath('M0 0 L20 0 Q24 0 24 4 L24 20 L0 20 Z'), fill: true, strokeWidth: 0,
      head: { anchor: { x: 12, y: 10 }, direction: { x: 2, y: -5 } } }] },
    { label: 'outline', origin: { x: 10, y: 20 }, size: { x: 200, y: 100 }, prefix: 'font' });
    expect(result.arrows[0].shape?.fill).toBe(true);
    expect(result.arrows[0].shape?.strokeWidth).toBe(0);
    expect(result.arrows[0].direction).toEqual({ x: 4, y: -5 });
    expect(result.arrows[0].head?.anchor).toEqual({ x: 34, y: 30 });
    expect(result.arrows[0].head?.direction).toBe(result.arrows[0].direction);
  });
  it.each([...modernConsonants, ...modernVowels])('%s has a common render/collision/head model', character => {
    const result = instantiateJamo(character, { origin: { x: 10, y: 20 }, size: { x: 100, y: 100 }, prefix: character, maxPieces: 4 });
    expect(result.arrows.length + result.targets.length).toBeGreaterThan(0);
    expect(result.arrows.length).toBeLessThanOrEqual(4);
    for (const a of result.arrows) {
      expect(a.shape).toBeDefined();
      expect(a.head?.direction).toEqual(a.direction);
      expect(pointTouchesShape(a.head!.anchor, a.shape!)).toBe(true);
      expect(compileShape(a.shape!).length).toBeGreaterThan(0);
      expect(isShapeConnected(a.shape!)).toBe(true);
    }
  });
  it('keeps ㅇ and the circle in ㅎ as fixed rescue targets, not movable paths', () => {
    const options = { origin: { x: 0, y: 0 }, size: { x: 100, y: 100 }, prefix: 'test' };
    expect(instantiateJamo('ㅇ', options).arrows).toHaveLength(0);
    expect(instantiateJamo('ㅇ', options).targets).toHaveLength(1);
    const hieut = instantiateJamo('ㅎ', options);
    expect(hieut.arrows).toHaveLength(2);
    expect(hieut.targets).toHaveLength(1);
    expect(hieut.targets[0].radius).toBe(27 + 3.1);
  });
  it('enforces the total jamo split limit and excludes unsupported difficulty combinations', () => {
    const options = { origin: { x: 0, y: 0 }, size: { x: 100, y: 100 }, prefix: 'test' };
    expect(() => instantiateJamo('ㅆ', { ...options, maxPieces: 2 })).toThrow(/Split limit/);
    expect(instantiateJamo('ㅆ', { ...options, maxPieces: 4 }).arrows).toHaveLength(4);
    expect(() => instantiateJamo('ㄿ', { ...options, maxPieces: 4 })).toThrow(/Split limit/);
    expect(instantiateJamo('ㅎ', { ...options, maxPieces: 2 }).targets).toHaveLength(1);
    expect(jamoTemplates['ㅉ'].strokes).toHaveLength(4);
  });
  it('uses path curves for ㄹ, ㅎ composition, ㅅ, ㅈ, ㅊ and double consonants', () => {
    for (const character of ['ㄹ', 'ㅅ', 'ㅈ', 'ㅊ', 'ㅆ', 'ㅉ']) expect(jamoTemplates[character].strokes.some(s => s.path.some(c => c.type === 'Q' || c.type === 'C'))).toBe(true);
    expect(jamoTemplates['ㅎ'].rings).toHaveLength(1);
  });
  it('has no initial overlap between moving stroke bodies in 성', () => {
    for (let i = 0; i < firstPuzzle.arrows.length; i++) for (let j = i + 1; j < firstPuzzle.arrows.length; j++) {
      expect(shapesOverlap(firstPuzzle.arrows[i].shape!, firstPuzzle.arrows[j].shape!)).toBe(false);
    }
  });
});
