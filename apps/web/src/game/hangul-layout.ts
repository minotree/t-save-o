import type { Point } from './engine';

// One 200-unit syllable cell: initial on the upper left, vertical vowel on
// the upper right, final underneath. Local stroke coordinates remain separate
// from placement, so the same composition can be translated to another cell.
export const verticalVowelWithFinal = {
  cellSize: 200,
  initial: { x: 10, y: 12, width: 110, height: 86 },
  medial: { x: 96, y: 0, width: 48, height: 96 },
  final: { x: 43, y: 112, width: 68, height: 68 }
} as const;

export function placeInSyllable(origin: Point, slot: 'initial' | 'medial' | 'final', local: Point): Point {
  const offset = verticalVowelWithFinal[slot];
  return { x: origin.x + offset.x + local.x, y: origin.y + offset.y + local.y };
}
