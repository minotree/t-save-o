import { expect,it } from 'vitest';
import { createPhrasePuzzle } from './phrase-puzzle';
import { headTip } from './engine';
import { readableHead } from './pen-stroke';

it('enlarges all visual markers without moving a single collision ray origin or direction',()=>{
  for(const arrow of createPhrasePuzzle().arrows){
    const original=JSON.stringify(arrow),head=readableHead(arrow);
    expect(head.length,arrow.id).toBeGreaterThan(arrow.head!.length!*1.1);
    expect(head.width,arrow.id).toBeGreaterThan(arrow.head!.width!);
    const displayed=headTip({...arrow,head});
    expect(displayed.x).toBeCloseTo(headTip(arrow).x,10);
    expect(displayed.y).toBeCloseTo(headTip(arrow).y,10);
    expect(head.direction).toEqual(arrow.direction);
    expect(JSON.stringify(arrow)).toBe(original);
  }
});
