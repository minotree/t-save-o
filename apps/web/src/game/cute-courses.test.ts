import { expect,it } from 'vitest';
import { cuteCourses } from './cute-courses';
import { findHeadBlocker, headTip, pointTouchesShape, isShapeConnected } from './engine';

it('each course has ten distinct bounded boards, all legal branches remain solvable, and reference depths increase',()=>{
  const metrics=cuteCourses.map(course=>course.puzzles.map(puzzle=>{
    const deps=new Map(puzzle.arrows.map(a=>[a.id,puzzle.arrows.filter(b=>a!==b&&findHeadBlocker(a,[a,b],{...puzzle,targets:[]})).map(b=>b.id)]));
    for(const a of puzzle.arrows)for(const target of puzzle.targets){
      if(!findHeadBlocker(a,[a],{...puzzle,targets:[target]}))continue;
      if(target.requiredArrowIds)deps.get(a.id)!.push(...target.requiredArrowIds);
      else expect(findHeadBlocker(a,[a],{...puzzle,targets:[target]}),a.id).toBeNull();
    }
    for(const a of puzzle.arrows){
      expect(pointTouchesShape(headTip(a),a.shape!),a.id).toBe(true);
      expect(isShapeConnected(a.shape!),a.id).toBe(true);
    }
    const pending=new Set(puzzle.arrows.map(a=>a.id));let depth=0;
    while(pending.size){
      const free=[...pending].filter(id=>!deps.get(id)!.some(other=>pending.has(other)));
      expect(free,`dependency cycle: ${puzzle.letter}`).not.toHaveLength(0);
      for(const id of free)pending.delete(id);depth++;
    }
    return {depth,strokes:puzzle.arrows.length};
  }));
  expect(metrics[0]).toHaveLength(10);
  expect(metrics[1]).toHaveLength(10);expect(metrics[2]).toHaveLength(10);
  for(const course of cuteCourses){
    expect(new Set(course.puzzles.map(p=>p.letter)).size).toBe(10);
    for(const puzzle of course.puzzles){
      const rows=puzzle.letter.split(' / ');
      expect(rows.length).toBeLessThanOrEqual(course.id==='hard'?4:2);
      expect(rows.every(row=>[...row].length<=4)).toBe(true);
    }
  }
  expect(Math.max(...metrics[0].map(m=>m.depth))).toBeLessThan(metrics[1][0].depth);
  expect(metrics[1][0].depth).toBeLessThan(metrics[2][0].depth);
  expect(metrics[1][0].strokes).toBe(13);expect(metrics[2][0].strokes).toBe(37);
});
