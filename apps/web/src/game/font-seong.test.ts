import fs from 'node:fs';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { findBlocker, isShapeConnected, pointTouchesShape, shapesOverlap } from './engine';
import type { Arrow } from './engine';
import { fontSeongPuzzle as puzzle } from './font-seong';
import { seongPenAsset as asset } from './seong-pen.generated';

describe('real Noto Sans KR seong outline', () => {
  it('records the actual licensed source and pins its font bytes', () => {
    const bytes = fs.readFileSync(new URL('../../scripts/font-source/NotoSansKR-Regular.otf', import.meta.url));
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(asset.source.sha256);
    expect(asset.source.family).toBe('Noto Sans KR');
    expect(asset.source.glyphId).toBe(15741);
    expect(asset.source.license).toBe('SIL Open Font License 1.1');
    expect(asset.source.codepoint).toBe('U+C131');
  });
  it('uses complete writing strokes with source-font proportions instead of whole-glyph clipping', () => {
    expect(asset.transform.scale * 903).toBeCloseTo(190);
    expect(asset.method).toBe('reviewed-pen-stroke-reconstruction');
    expect(asset.originalPath.some(c => c.type === 'C')).toBe(true);
    expect(asset.strokes.some(piece => piece.body.commands.some(c => c.type === 'C'))).toBe(true);
    expect(asset.strokes).toHaveLength(4);
    expect(asset.strokes.every(piece => piece.body.fill && piece.body.strokeWidth === 0)).toBe(true);
    const left = asset.strokes[0];
    expect(left.pen.start.center.y).toBeLessThan(left.pen.end.center.y);
    expect(left.pen.start.center.x).toBeGreaterThan(left.pen.end.center.x);
    const right = asset.strokes[1];
    expect(right.pen.start.center.y).toBeLessThan(right.pen.end.center.y);
    expect(right.pen.start.center.x).toBeLessThan(right.pen.end.center.x);
  });
  it('has four connected, non-overlapping bodies with attached heads', () => {
    for (let i = 0; i < puzzle.arrows.length; i++) {
      const a = puzzle.arrows[i];
      expect(isShapeConnected(a.shape!)).toBe(true);
      expect(pointTouchesShape(a.head!.anchor, a.shape!)).toBe(true);
      for (let j = i + 1; j < puzzle.arrows.length; j++) expect(shapesOverlap(a.shape!, puzzle.arrows[j].shape!)).toBe(false);
    }
  });
  it('uses authored terminal-head directions and keeps the existing circular character', () => {
    const previous = [[0, -1], [-34.1, -49.88], [0, -.96], [-.48, 0]];
    puzzle.arrows.forEach((a, i) => {
      expect(a.direction.x).toBeCloseTo(previous[i][0], 12);
      expect(a.direction.y).toBeCloseTo(previous[i][1], 12);
      expect(a.head?.direction).toEqual(a.direction);
      expect(a.head?.endpoint).toBe('start');
      expect(a.head?.capCenter).toEqual(a.penStroke?.pen.start.center);
    });
    expect(puzzle.targets).toHaveLength(1);
    expect(puzzle.targets[0].id).toBe('ieung');
    expect(puzzle.targets[0].radius).toBe(33.7);
    expect(puzzle.targets[0].ringWidth).toBe(6.2);
  });
  it('keeps the geometric siot removal dependency without answer-order exceptions', () => {
    const [first, second] = puzzle.arrows;
    expect(findBlocker(first, puzzle.arrows, puzzle)).toBeNull();
    expect(findBlocker(second, puzzle.arrows, puzzle)).toBe(first.id);
    expect(findBlocker(second, puzzle.arrows.filter(a => a.id !== first.id), puzzle)).toBeNull();
  });
  it('completes on every legal branch and still permits multiple correct orders', () => {
    let completed = 0;
    function explore(remaining: readonly Arrow[]) {
      if (!remaining.length) { completed++; return; }
      const legal = remaining.filter(a => !findBlocker(a, remaining, puzzle));
      expect(legal.length).toBeGreaterThan(0);
      for (const a of legal) explore(remaining.filter(b => b.id !== a.id));
    }
    explore(puzzle.arrows);
    expect(completed).toBeGreaterThan(1);
  });
});
