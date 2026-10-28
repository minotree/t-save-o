import { expect,it } from 'vitest';
import { cuteCourses } from './cute-courses';
import { friendLayout } from './rescue-parade';

it('all course rescue chains fit the board and adjacent hands meet, including many friends',()=>{
  for(const course of cuteCourses)for(const puzzle of course.puzzles){
    const layouts=puzzle.targets.map((target,i)=>friendLayout(target,i,puzzle.targets.length,puzzle));
    for(const [i,layout] of layouts.entries()){
      expect(layout.x-layout.spacing/2,puzzle.letter).toBeGreaterThanOrEqual(0);
      expect(layout.x+layout.spacing/2,puzzle.letter).toBeLessThanOrEqual(puzzle.width);
      expect(layout.halfWidth).toBeLessThan(layout.spacing/2);
      if(i)expect(layouts[i-1].x+layouts[i-1].spacing/2).toBeCloseTo(layout.x-layout.spacing/2,9);
    }
  }
});
