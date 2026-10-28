import { describe,it,expect } from 'vitest';
import { createPhrasePuzzle } from './phrase-puzzle';
import { findHeadContact } from './engine';
import { bumpProgress } from './rope';
import { svgPath } from './jamo-templates';

describe('contact distance and return motion',()=>{
  const puzzle=createPhrasePuzzle(),base=puzzle.arrows[0];
  const a={...base,id:'moving',direction:{x:1,y:0},head:{...base.head!,anchor:{x:10,y:20},length:0,direction:{x:1,y:0}}};
  const block=(id:string,x:number)=>({...base,id,shape:{commands:svgPath(`M${x} 10 L${x+5} 10 L${x+5} 30 L${x} 30 Z`),fill:true,strokeWidth:0}});
  it('finds the nearest actual hit independently of array order',()=>{
    const near=block('near',40),far=block('far',70);
    for(const other of [[far,near],[near,far]]){
      const hit=findHeadContact(a,[a,...other],{...puzzle,targets:[]})!;
      expect(hit.id).toBe('near');expect(hit.distance).toBeCloseTo(30);expect(hit.point).toEqual({x:40,y:20});
    }
  });
  it('finds tangency, fixed disks and zero-distance initial contact',()=>{
    const hit=findHeadContact(a,[a],{...puzzle,targets:[{id:'fixed',center:{x:50,y:25},radius:5}]})!;
    expect(hit.distance).toBeCloseTo(40);expect(hit.id).toBe('fixed');
    expect(findHeadContact(a,[a,block('touch',10)],{...puzzle,targets:[]})?.distance).toBe(0);
  });
  it('approaches contact without overshooting, holds and returns exactly',()=>{
    expect(bumpProgress(0)).toBe(0);expect(bumpProgress(.42)).toBe(1);expect(bumpProgress(.5)).toBe(1);expect(bumpProgress(1)).toBe(0);
    for(let i=0;i<=100;i++){expect(bumpProgress(i/100)).toBeGreaterThanOrEqual(0);expect(bumpProgress(i/100)).toBeLessThanOrEqual(1);}
  });
});
