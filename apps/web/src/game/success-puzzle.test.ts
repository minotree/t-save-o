import { describe,it,expect } from 'vitest';
import { createSuccessPuzzle } from './success-puzzle';
import { findHeadBlocker, headTip, pointTouchesShape } from './engine';
import { measureRope, ropeFrame } from './rope';
import { svgPath } from './jamo-templates';

describe('성공적 word puzzle',()=>{
  const puzzle=createSuccessPuzzle();
  it('has three natural glyphs, thirteen pen pieces and two fixed targets',()=>{
    expect(puzzle.letter).toBe('성공적');expect(puzzle.arrows).toHaveLength(13);expect(puzzle.targets).toHaveLength(2);
    for(const a of puzzle.arrows){
      expect(a.shape?.fill).toBe(true);expect(a.rope).toBeDefined();
      expect(a.head?.direction).toEqual(a.direction);
      const h=a.head!,m=Math.hypot(a.direction.x,a.direction.y),u={x:a.direction.x/m,y:a.direction.y/m};
      const vertices=[headTip(a),{x:h.anchor.x-u.y*h.width!/2,y:h.anchor.y+u.x*h.width!/2},
        {x:h.anchor.x+u.y*h.width!/2,y:h.anchor.y-u.x*h.width!/2}];
      for(const v of vertices) expect(pointTouchesShape(v,a.shape!),`${a.id} interior head`).toBe(true);
    }
  });
  it('first ㅅ is free, its right pen piece is blocked, then becomes free',()=>{
    const first=puzzle.arrows[0],second=puzzle.arrows[1];
    expect(findHeadBlocker(first,puzzle.arrows,puzzle)).toBeNull();
    expect(findHeadBlocker(second,puzzle.arrows,puzzle)).toBe(first.id);
    expect(findHeadBlocker(second,puzzle.arrows.filter(a=>a!==first),puzzle)).toBeNull();
  });
  it('all legal removal branches complete; graph matches geometric queries',()=>{
    const all=puzzle.arrows,n=all.length;
    const dependencies=all.map(a=>all.reduce((mask,b,j)=>a!==b&&findHeadBlocker(a,[a,b],{...puzzle,targets:[]})?mask|(1<<j):mask,0));
    for(const a of all)expect(findHeadBlocker(a,[a],puzzle),`${a.id} fixed obstacle`).toBeNull();
    // Fixed rays / fixed blockers: removing a piece only deletes its dependency.
    // Exhaust every reachable subset, rather than storing one "correct" sequence.
    const seen=new Set<number>();let branching=false;
    function visit(mask:number){
      if(!mask||seen.has(mask))return;seen.add(mask);
      const legal=all.map((_,i)=>i).filter(i=>(mask&(1<<i))&&!(dependencies[i]&mask));
      expect(legal.length,`dead end ${mask}`).toBeGreaterThan(0);if(legal.length>1)branching=true;
      for(const i of legal)visit(mask&~(1<<i));
    }
    visit((1<<n)-1);expect(branching).toBe(true);
    // Small-board exhaustive oracle and full-board sampled geometric oracle.
    for(let mask=0;mask<1<<n;mask++){
      if(mask>31&&mask%137!==0)continue;
      const remaining=all.filter((_,i)=>mask&(1<<i));
      for(let i=0;i<n;i++)if(mask&(1<<i))expect(findHeadBlocker(all[i],remaining,puzzle)===null).toBe(!(dependencies[i]&mask));
    }
  });
});

describe('head ray rules',()=>{
  const p=createSuccessPuzzle(),base=p.arrows[0];
  const a={...base,id:'a',head:{...base.head!,anchor:{x:20,y:40},length:0,direction:{x:1,y:0}},direction:{x:1,y:0}};
  it('ignores hypothetical collisions of the middle of a moving stroke',()=>{
    const b={...base,id:'b',shape:{commands:svgPath('M50 70 L55 70 L55 80 L50 80 Z'),strokeWidth:0,fill:true}};
    expect(findHeadBlocker(a,[a,b],{...p,targets:[]})).toBeNull();
    const ahead={...b,shape:{...b.shape,commands:svgPath('M50 39 L55 39 L55 41 L50 41 Z')}};
    expect(findHeadBlocker(a,[a,ahead],{...p,targets:[]})).toBe('b');
    expect(findHeadBlocker(a,[a],{...p,targets:[]})).toBeNull();
  });
  it('counts tangency with a fixed disk and excludes decorative heads',()=>{
    const b={...base,id:'b',head:{...base.head!,length:10000,width:10000},shape:{commands:svgPath('M50 60 L55 60 L55 65 L50 65 Z'),strokeWidth:0,fill:true}};
    expect(findHeadBlocker(a,[a,b],{...p,targets:[]})).toBeNull();
    expect(findHeadBlocker(a,[a],{...p,targets:[{id:'disk',center:{x:60,y:45},radius:5}]})).toBe('disk');
    expect(findHeadBlocker(a,[a],{...p,targets:[{id:'disk',center:{x:60,y:45.01},radius:5}]})).toBeNull();
  });
});

describe('rope length and path motion',()=>{
  it.each(['M0 0 L40 0 L40 40','M0 0 C60 0 -30 80 40 80','M0 0 C100 -100 100 100 30 50 C-20 0 60 0 40 40'])('consumes a curved/angled spine without translating its fixed path: %s',path=>{
    const a={...createSuccessPuzzle().arrows[0],rope:{path:svgPath(path),width:10}};
    const rope=measureRope(a),before=JSON.stringify(a.rope.path),direction={x:3,y:-7};
    for(const progress of [0,.01,.05,.2,.8,1]){
      const frame=ropeFrame(rope,direction,{width:400,height:400},progress);
      const outside=Math.hypot(frame.to.x-frame.from.x,frame.to.y-frame.from.y);
      expect(rope.length-frame.consumed+outside).toBeCloseTo(rope.length,7);
      expect((frame.to.x-rope.points.at(-1)!.x)*direction.y-(frame.to.y-rope.points.at(-1)!.y)*direction.x).toBeCloseTo(0,7);
    }
    expect(JSON.stringify(a.rope.path)).toBe(before);
  });
});
