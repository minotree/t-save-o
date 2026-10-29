import { expect,it } from 'vitest';
import { activeTargets,createAiDemo } from './ai-demo';
import { findHeadBlocker,findHeadContact,isShapeConnected,headTip,pointTouchesShape } from './engine';

it('uses one 24-unit lane grid with 8-unit bodies and matched friend surrounds',()=>{
  const p=createAiDemo();
  for(const a of p.arrows){
    expect(a.rope!.width).toBe(8);
    for(const point of a.points){
      expect(point.x%24,`${a.id} x`).toBe(0);
      expect(point.y%24,`${a.id} y`).toBe(0);
    }
  }
  expect(p.targets[1].center.x-p.targets[0].center.x).toBe(408);
  const left=p.arrows.find(a=>a.id==='ai-fill-4')!,right=p.arrows.find(a=>a.id==='ai-fill-5')!;
  expect(right.points.map((point,i)=>({x:point.x-left.points[i].x,y:point.y-left.points[i].y})))
    .toEqual(left.points.map(()=>({x:408,y:0})));
});

it('every engine has a forward exit that never meets its own carriages',()=>{
  const p=createAiDemo();
  for(const a of p.arrows){
    const probe={...a,id:'self-probe',head:{...a.head!,anchor:a.head!.capCenter!,length:18}};
    expect(findHeadContact(probe,[a],{...p,targets:[]}),a.id).toBeNull();
  }
});

it('outer trains block enclosed trains and require another train to leave first',()=>{
  const p=createAiDemo(),get=(id:number)=>p.arrows.find(a=>a.id===`ai-fill-${id}`)!;
  for(const [inner,outer,gate] of [[4,6,2],[5,7,3]]){
    expect(findHeadBlocker(get(inner),p.arrows,p)).toBe(get(outer).id);
    expect(findHeadBlocker(get(outer),p.arrows,p)).toBe(get(gate).id);
    expect(findHeadBlocker(get(outer),p.arrows.filter(a=>a.id!==get(gate).id),p)).toBeNull();
  }
});

it('keeps attached external heads clear of every body and friend',()=>{
  const p=createAiDemo();
  for(const a of p.arrows){
    const cap=a.head!.capCenter!,m=Math.hypot(a.direction.x,a.direction.y);
    const u={x:a.direction.x/m,y:a.direction.y/m};
    for(let row=1;row<=18;row++)for(let col=-8;col<=8;col++){
      const along=row/18,across=col/8*9*(1-along);
      const point={x:cap.x+u.x*18*along-u.y*across,y:cap.y+u.y*18*along+u.x*across};
      for(const b of p.arrows)expect(pointTouchesShape(point,b.shape!),`${a.id} head / ${b.id}`).toBe(false);
      for(const t of p.targets)expect(pointTouchesShape(point,t.obstacle!),`${a.id} head / ${t.id}`).toBe(false);
    }
  }
},15000);

it('rescues each friend only after its own strokes and opens its former blocked lane',()=>{
  const p=createAiDemo(),a=p.arrows.find(a=>a.id==='ai-fill-9')!;
  expect(activeTargets(p,['ai-a-upper'])).toHaveLength(2);
  expect(findHeadBlocker(a,[a],p)).toBe('ieung-ai-a');
  const removed=['ai-a-upper','ai-a-lower'];
  const board={...p,targets:activeTargets(p,removed)};
  expect(board.targets.map(t=>t.id)).toEqual(['ieung-ai-i']);
  expect(findHeadBlocker(a,p.arrows.filter(a=>!removed.includes(a.id)),board)).not.toBe('ieung-ai-a');
  expect(activeTargets(p,[...removed,'ai-i'])).toHaveLength(0);
  expect(p.arrows.filter(a=>a.color==='#252832')).toHaveLength(32);
  for(const arrow of p.arrows){
    expect(isShapeConnected(arrow.shape!),arrow.id).toBe(true);
    expect(pointTouchesShape(headTip(arrow),arrow.shape!),arrow.id).toBe(true);
    expect(arrow.rope!.width).toBe(8);
  }
});

it('has no dead end under any legal removal order including individual rescue',()=>{
  const p=createAiDemo();
  const dependencies=new Map(p.arrows.map(a=>[a.id,new Set(p.arrows.filter(b=>a!==b&&findHeadBlocker(a,[a,b],{...p,targets:[]})).map(b=>b.id))]));
  for(const a of p.arrows)for(const t of p.targets){
    if(!findHeadBlocker(a,[a],{...p,targets:[t]}))continue;
    expect(t.requiredArrowIds?.length).toBeGreaterThan(0);
    for(const id of t.requiredArrowIds!)dependencies.get(a.id)!.add(id);
  }
  // Blockers only disappear. A DAG stays acyclic after ANY legal removal,
  // so every nonempty remaining subset has a free arrow. This proves all
  // removal orders without exponential enumeration or 32-bit mask overflow.
  const pending=new Set(dependencies.keys());
  while(pending.size){
    const free=[...pending].filter(id=>![...dependencies.get(id)!].some(other=>pending.has(other)));
    expect(free,`dependency cycle: ${[...pending].join(',')}`).not.toHaveLength(0);
    for(const id of free)pending.delete(id);
  }
});
