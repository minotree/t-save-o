import type { Puzzle } from './engine';
import { instantiatePenStrokes } from './pen-stroke';
import { seongPenAsset } from './seong-pen.generated';

// The reference font supplies proportions; authored pen strokes supply topology.
// Body, pen caps and explicit head directions share one uniform glyph transform.
export const fontSeongPuzzle: Puzzle = {
  width: 360, height: 340, letter: '성',
  arrows: instantiatePenStrokes(seongPenAsset.strokes, 2),
  targets: [{ ...seongPenAsset.target, center: { ...seongPenAsset.target.center } }]
};
