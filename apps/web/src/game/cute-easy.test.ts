import { expect,it } from 'vitest';
import { cuteEasyPuzzles, cuteEasyWords } from './cute-easy';
import { findHeadBlocker, isShapeConnected, pointTouchesShape, headTip } from './engine';
import { readableHead } from './pen-stroke';

it.each(cuteEasyPuzzles)('$letter has complete connected strokes and internal visible markers',puzzle=>{
  expect(puzzle.targets.length).toBeGreaterThan(0);expect(puzzle.arrows.length).toBeGreaterThan(0);
  expect(new Set(puzzle.arrows.map(a=>a.id)).size).toBe(puzzle.arrows.length);
  for(const a of puzzle.arrows){
    expect(isShapeConnected(a.shape!),a.id).toBe(true);
    expect(pointTouchesShape(headTip(a),a.shape!),a.id).toBe(true);
    const display=readableHead(a);expect(display.length,a.id).toBeGreaterThan(a.head!.length!);
    expect(headTip({...a,head:display}).x).toBeCloseTo(headTip(a).x,9);
    expect(headTip({...a,head:display}).y).toBeCloseTo(headTip(a).y,9);
  }
});
it.each(cuteEasyPuzzles)('$letter completes under every legal removal sequence',puzzle=>{
  const visited=new Set<string>();
  function visit(remaining:typeof puzzle.arrows){
    if(!remaining.length)return;
    const key=remaining.map(a=>a.id).join('|');if(visited.has(key))return;visited.add(key);
    const legal=remaining.filter(a=>!findHeadBlocker(a,remaining,puzzle));
    expect(legal.length,`dead end ${puzzle.letter}: ${key}`).toBeGreaterThan(0);
    for(const a of legal)visit(remaining.filter(b=>a!==b));
  }
  visit(puzzle.arrows);
});
it('contains the approved ten words in order',()=>expect(cuteEasyWords).toEqual(['아이','오이','우유','아기','오리','여우','공','콩','양','용']));
