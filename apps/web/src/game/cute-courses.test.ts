import { expect,it } from 'vitest';
import { cuteCourses } from './cute-courses';
import { findHeadBlocker } from './engine';

it('difficulty increases in real dependency depth and all courses remain solvable',()=>{
  const metrics=cuteCourses.map(course=>course.puzzles.map(puzzle=>{
    const deps=new Map(puzzle.arrows.map(a=>[a.id,puzzle.arrows.filter(b=>a!==b&&findHeadBlocker(a,[a,b],{...puzzle,targets:[]})).map(b=>b.id)]));
    for(const a of puzzle.arrows)expect(findHeadBlocker(a,[a],puzzle),a.id).toBeNull();
    const pending=new Set(puzzle.arrows.map(a=>a.id));let depth=0;
    while(pending.size){
      const free=[...pending].filter(id=>!deps.get(id)!.some(other=>pending.has(other)));
      expect(free,`dependency cycle: ${puzzle.letter}`).not.toHaveLength(0);
      for(const id of free)pending.delete(id);depth++;
    }
    return {depth,strokes:puzzle.arrows.length};
  }));
  expect(metrics[0]).toHaveLength(10);
  expect(Math.max(...metrics[0].map(m=>m.depth))).toBeLessThan(metrics[1][0].depth);
  expect(metrics[1][0].depth).toBeLessThan(metrics[2][0].depth);
  expect(metrics[1][0].strokes).toBe(13);expect(metrics[2][0].strokes).toBe(37);
});
