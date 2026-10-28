import { describe, expect, it } from 'vitest';
import { exitTranslation, findBlocker } from './engine';
import type { Arrow, Point, Puzzle } from './engine';
import { firstPuzzle } from './puzzle';
import { transformCommands } from './vector-shape';

const arrow = (id: string, points: Point[], direction: Point): Arrow => ({ id, label: id, points, direction });
const board = (arrows: Arrow[], targets: Puzzle['targets'] = []): Puzzle => ({ width: 100, height: 100, letter: '', arrows, targets });

describe('ㅅ example uses actual geometry', () => {
  const first = firstPuzzle.arrows[0], second = firstPuzzle.arrows[1];
  it('first arm is free, second NW arm is blocked by first', () => {
    expect(findBlocker(first, firstPuzzle.arrows, firstPuzzle)).toBeNull();
    expect(findBlocker(second, firstPuzzle.arrows, firstPuzzle)).toBe(first.id);
    expect(findBlocker(second, firstPuzzle.arrows.filter(a => a.id !== first.id), firstPuzzle)).toBeNull();
  });
  it('changing geometry changes the answer without changing IDs', () => {
    const movedFirst = { ...first, points: first.points.map(p => ({ x: p.x, y: p.y + 180 })),
      shape: first.shape && { ...first.shape, commands: transformCommands(first.shape.commands, { x: 0, y: 180 }, { x: 1, y: 1 }) } };
    expect(findBlocker(second, [movedFirst, second], { ...firstPuzzle, targets: [] })).toBeNull();
  });
  it('every legal removal branch reaches completion, with multiple solutions', () => {
    let solutions = 0;
    function explore(remaining: readonly Arrow[]) {
      if (remaining.length === 0) { solutions++; return; }
      const legal = remaining.filter(a => findBlocker(a, remaining, firstPuzzle) === null);
      expect(legal.length).toBeGreaterThan(0);
      for (const selected of legal) explore(remaining.filter(a => a.id !== selected.id));
    }
    explore(firstPuzzle.arrows);
    expect(solutions).toBeGreaterThan(1);
  });
  it('every stroke uses the direction shown by its head, including curves', () => {
    for (const a of firstPuzzle.arrows) {
      expect(a.direction).toEqual(a.head?.direction);
      expect(Math.hypot(a.direction.x, a.direction.y)).toBeGreaterThan(0);
    }
  });
});

describe('continuous path geometry', () => {
  it('checks a non-45-degree path without snapping and independently of vector magnitude', () => {
    const a = arrow('a', [{ x: 10, y: 70 }, { x: 25, y: 30 }], { x: 3, y: -8 });
    const b = arrow('b', [{ x: 27, y: 22 }, { x: 29, y: 22 }], { x: 1, y: 0 });
    const nearby = { ...b, points: [{ x: 33, y: 22 }, { x: 35, y: 22 }] };
    for (const multiplier of [.1, 1, 17]) {
      const moving = { ...a, direction: { x: 3 * multiplier, y: -8 * multiplier } };
      expect(findBlocker(moving, [moving, b], board([moving, b]))).toBe('b');
      expect(findBlocker(moving, [moving, nearby], board([moving, nearby]))).toBeNull();
      expect(findBlocker(moving, [moving], board([moving]))).toBeNull();
    }
  });
  it.each([{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }])('checks full path in direction %j', direction => {
    const a = arrow('moving', [{ x: 49, y: 49 }, { x: 51, y: 51 }], direction);
    const obstacle = arrow('blocking', [{ x: 50 + direction.x * 20, y: 50 + direction.y * 20 },
      { x: 50 + direction.x * 20 + 1, y: 50 + direction.y * 20 }], { x: 1, y: 0 });
    const b = board([a, obstacle]);
    expect(findBlocker(a, b.arrows, b)).toBe('blocking');
    const delta = exitTranslation(a, b);
    expect(a.points.every(p => p.x + delta.x < 0) || a.points.every(p => p.x + delta.x > 100) ||
      a.points.every(p => p.y + delta.y < 0) || a.points.every(p => p.y + delta.y > 100)).toBe(true);
  });
  it('detects a thin obstacle midway, even when neither endpoint position overlaps it', () => {
    const a = arrow('a', [{ x: 10, y: 20 }, { x: 10, y: 30 }], { x: 1, y: 0 });
    const b = arrow('b', [{ x: 40, y: 24 }, { x: 40, y: 26 }], { x: 0, y: -1 });
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
  });
  it('treats initial contact as blocked, including shared siot apex', () => {
    const a = arrow('a', [{ x: 20, y: 40 }, { x: 40, y: 20 }], { x: 1, y: -1 });
    const b = arrow('b', [{ x: 60, y: 40 }, { x: 40, y: 20 }], { x: -1, y: -1 });
    expect(findBlocker(a, [a, b], board([a, b]))).toBe('b');
    expect(findBlocker(b, [a, b], board([a, b]))).toBe('a');
  });
  it('treats disk tangency and interior as collisions, but not a nearby gap', () => {
    const a = arrow('a', [{ x: 10, y: 20 }, { x: 20, y: 20 }], { x: 1, y: 0 });
    for (const y of [20, 25]) {
      const b = board([a], [{ id: 'ieung', center: { x: 50, y }, radius: 5 }]);
      expect(findBlocker(a, [a], b)).toBe('ieung');
    }
    expect(findBlocker(a, [a], board([a], [{ id: 'ieung', center: { x: 50, y: 25.001 }, radius: 5 }]))).toBeNull();
  });
  it('checks connected segments individually rather than their bounding box', () => {
    const a = arrow('bent', [{ x: 20, y: 20 }, { x: 40, y: 20 }, { x: 40, y: 40 }], { x: 1, y: 0 });
    const b = board([a], [{ id: 'inside-empty-corner', center: { x: 28, y: 32 }, radius: 2 }]);
    expect(findBlocker(a, [a], b)).toBeNull();
  });
  it('does not mutate the board on a blocked attempt', () => {
    const before = JSON.stringify(firstPuzzle);
    findBlocker(firstPuzzle.arrows[1], firstPuzzle.arrows, firstPuzzle);
    expect(JSON.stringify(firstPuzzle)).toBe(before);
  });
  it('rejects a zero direction', () => {
    expect(() => exitTranslation(arrow('a', [{ x: 1, y: 1 }, { x: 2, y: 2 }], { x: 0, y: 0 }), firstPuzzle)).toThrow();
  });
});
