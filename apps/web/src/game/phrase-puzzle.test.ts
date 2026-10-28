import { it,expect } from 'vitest';
import { createPhrasePuzzle } from './phrase-puzzle';
import { findHeadBlocker, headTip, pointTouchesShape } from './engine';

it('우리가 저마다 / 힘에겨운: 37 real pen bodies, four fixed circles, interior heads',()=>{
  const puzzle=createPhrasePuzzle();
  expect(puzzle.arrows).toHaveLength(37);expect(puzzle.targets).toHaveLength(4);
  expect(new Set(puzzle.arrows.map(a=>a.id)).size).toBe(37);
  for(const a of puzzle.arrows){
    const h=a.head!,m=Math.hypot(a.direction.x,a.direction.y),u={x:a.direction.x/m,y:a.direction.y/m};
    for(const v of [headTip(a),{x:h.anchor.x-u.y*h.width!/2,y:h.anchor.y+u.x*h.width!/2},{x:h.anchor.x+u.y*h.width!/2,y:h.anchor.y-u.x*h.width!/2}])
      expect(pointTouchesShape(v,a.shape!),a.id).toBe(true);
  }
});
it('every legal branch is solvable: no permanent fixed blocker and acyclic dependencies',()=>{
  const puzzle=createPhrasePuzzle(),all=puzzle.arrows;
  const dependencies=new Map(all.map(a=>[a.id,new Set(all.filter(b=>a!==b&&findHeadBlocker(a,[a,b],{...puzzle,targets:[]})!==null).map(b=>b.id))]));
  expect(all.flatMap(a=>{const fixed=findHeadBlocker(a,[a],puzzle);return fixed?[`${a.id}: ${fixed}`]:[];})).toEqual([]);
  const pending=new Set(all.map(a=>a.id));
  while(pending.size){
    const legal=[...pending].filter(id=>![...dependencies.get(id)!].some(other=>pending.has(other)));
    expect(legal,`cycle: ${[...pending].join(', ')}`).not.toHaveLength(0);
    for(const id of legal)pending.delete(id);
  }
  const small=all.slice(0,6);
  for(let mask=1;mask<64;mask++){
    const remaining=small.filter((_,i)=>mask&(1<<i));
    for(const a of remaining)expect(findHeadBlocker(a,remaining,puzzle)===null).toBe(!remaining.some(b=>dependencies.get(a.id)!.has(b.id)));
  }
});
