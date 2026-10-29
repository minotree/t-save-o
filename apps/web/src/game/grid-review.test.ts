import {expect,it} from 'vitest';
import {createGridReview,gridReviewCoverage,gridReviewData,gridPoint} from './grid-review';
import {findHeadContact,findHeadBlocker,pointTouchesShape,isShapeConnected} from './engine';
import {activeTargets} from './ai-demo';

it('uses every one of the 144 nodes exactly once except the 16 ring/interior nodes',()=>{
  const nodes=gridReviewCoverage();
  expect(nodes).toHaveLength(144);
  expect(nodes.filter(n=>n.excluded)).toHaveLength(16);
  expect(nodes.filter(n=>!n.excluded)).toHaveLength(128);
  for(const n of nodes){
    expect(n.owners,`${n.x},${n.y}`).toHaveLength(n.excluded?0:1);
    const p=gridPoint(n.x,n.y),c=gridPoint(gridReviewData.circle.x,gridReviewData.circle.y);
    expect(Math.hypot(p.x-c.x,p.y-c.y)<=gridReviewData.circle.radius*32+4).toBe(n.excluded);
  }
});

it('has genuine diagonals, no crossings, no self-facing exits, and no touching heads',()=>{
  const p=createGridReview();
  expect(p.arrows.slice(0,2).every(a=>a.direction.x!==0&&a.direction.y!==0)).toBe(true);
  const segments=p.arrows.flatMap(a=>a.points.slice(1).map((to,i)=>({from:a.points[i],to,id:a.id})));
  const cross=(a:{x:number;y:number},b:{x:number;y:number})=>a.x*b.y-a.y*b.x;
  const sub=(a:{x:number;y:number},b:{x:number;y:number})=>({x:a.x-b.x,y:a.y-b.y});
  for(const [i,a] of segments.entries())for(const b of segments.slice(i+1)){
    const v=sub(a.to,a.from),w=sub(b.to,b.from),d=cross(v,w);
    if(Math.abs(d)<1e-8)continue;
    const t=cross(sub(b.from,a.from),w)/d,s=cross(sub(b.from,a.from),v)/d;
    expect(t>1e-8&&t<1-1e-8&&s>1e-8&&s<1-1e-8,`${a.id}/${b.id} crossing`).toBe(false);
  }
  for(const a of p.arrows){
    expect(isShapeConnected(a.shape!),a.id).toBe(true);
    for(const [i,to] of a.points.slice(1).entries()){
      const from=a.points[i],dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
      for(let step=0;step<=Math.ceil(length);step++)for(const side of [-4,0,4]){
        const t=step/Math.ceil(length);
        expect(pointTouchesShape({x:from.x+dx*t-dy/length*side,y:from.y+dy*t+dx/length*side},p.targets[0].obstacle!),`${a.id} body/ring`).toBe(false);
      }
    }
    const cap=a.head!.capCenter!,m=Math.hypot(a.direction.x,a.direction.y),u={x:a.direction.x/m,y:a.direction.y/m};
    expect(findHeadContact({...a,id:'probe',head:{...a.head!,anchor:cap,length:18}},[a],{...p,targets:[]}),a.id).toBeNull();
    for(let row=1;row<=18;row++)for(let col=-6;col<=6;col++){
      const along=row/18,across=col/6*9*(1-along);
      const point={x:cap.x+u.x*18*along-u.y*across,y:cap.y+u.y*18*along+u.x*across};
      for(const b of p.arrows)expect(pointTouchesShape(point,b.shape!),`${a.id} head/${b.id}`).toBe(false);
      expect(pointTouchesShape(point,p.targets[0].obstacle!),a.id).toBe(false);
    }
  }
},15000);

it('replays a complete legal solution and has an acyclic dependency graph for every legal order',()=>{
  const p=createGridReview(),removed:string[]=[];
  for(const index of gridReviewData.solution){
    const a=p.arrows[index];
    expect(findHeadBlocker(a,p.arrows.filter(b=>!removed.includes(b.id)),{...p,targets:activeTargets(p,removed)}),a.id).toBeNull();
    removed.push(a.id);
  }
  expect(removed).toHaveLength(p.arrows.length);
  const deps=new Map(p.arrows.map(a=>[a.id,new Set(p.arrows.filter(b=>a!==b&&findHeadBlocker(a,[a,b],{...p,targets:[]})).map(b=>b.id))]));
  for(const a of p.arrows)if(findHeadBlocker(a,[a],p))for(const id of p.targets[0].requiredArrowIds!)deps.get(a.id)!.add(id);
  const pending=new Set(deps.keys());
  while(pending.size){
    const free=[...pending].filter(id=>![...deps.get(id)!].some(other=>pending.has(other)));
    expect(free,`cycle ${[...pending]}`).not.toHaveLength(0);
    for(const id of free)pending.delete(id);
  }
});
