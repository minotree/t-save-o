import { expect,it } from 'vitest';
import { createPhrasePuzzle } from './phrase-puzzle';
import { friendLayout, FRIEND_SPACING, GATHER_MS, HOLD_MS, LIMBS_MS, PARADE_MS, paradeFrame } from './rescue-parade';
import { bumpHasContact } from './rope';

it('gathers before sprouting hands and legs, then walks completely off the board',()=>{
  expect(paradeFrame(0)).toMatchObject({phase:'gathering',gather:0,limbs:0,walk:0});
  expect(paradeFrame(GATHER_MS)).toMatchObject({phase:'holding-hands',gather:1,limbs:0,walk:0});
  expect(paradeFrame(GATHER_MS+LIMBS_MS)).toMatchObject({phase:'holding-hands',gather:1,limbs:1,walk:0});
  expect(paradeFrame(GATHER_MS+LIMBS_MS+HOLD_MS)).toMatchObject({phase:'walking',gather:1,limbs:1,walk:0});
  expect(paradeFrame(PARADE_MS)).toMatchObject({phase:'gone',gather:1,limbs:1,walk:1});
  const p=createPhrasePuzzle(),layouts=p.targets.map((t,i)=>friendLayout(t,i,p.targets.length,p));
  for(let i=0;i<layouts.length;i++){
    const current=layouts[i];
    expect(current.halfWidth).toBeLessThanOrEqual(69.001);expect(current.halfHeight).toBeLessThanOrEqual(52.001);
    expect(current.x+p.width+p.targets.length*FRIEND_SPACING-current.halfWidth).toBeGreaterThan(p.width);
    if(i)expect(current.x-FRIEND_SPACING/2).toBeCloseTo(layouts[i-1].x+FRIEND_SPACING/2);
  }
});
it('turns red at contact and remains red throughout the return, including zero-distance contact',()=>{
  expect(bumpHasContact(0,20)).toBe(false);expect(bumpHasContact(.419,20)).toBe(false);
  expect(bumpHasContact(.42,20)).toBe(true);expect(bumpHasContact(.9,20)).toBe(true);
  expect(bumpHasContact(0,0)).toBe(true);
});
