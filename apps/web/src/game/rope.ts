import type { Arrow, Point, Puzzle } from './engine';
import { flattenPath } from './vector-shape';

export const PULL_MS=800;
export const BUMP_MS=900;
export const BUMP_CONTACT_RATIO=.42;
export function bumpHasContact(progress:number,distance:number):boolean {
  return distance===0||progress>=BUMP_CONTACT_RATIO;
}
export function bumpProgress(t:number):number {
  const p=Math.max(0,Math.min(1,t));
  if(p===1)return 0;
  // Approach contact, briefly hold, then unwind to the exact original state.
  if(p<BUMP_CONTACT_RATIO)return 1-(1-p/BUMP_CONTACT_RATIO)**2;
  if(p<.56)return 1;
  return (1-(p-.56)/.44)**2;
}
export function measureRope(arrow:Arrow) {
  const points=arrow.rope?flattenPath(arrow.rope.path,.03)[0]:[...arrow.points];
  const lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  return {points,lengths,length:lengths.at(-1)!};
}
export function ropeFrame(rope:ReturnType<typeof measureRope>,direction:Point,board:Pick<Puzzle,'width'|'height'>,progress:number,travelLimit?:number){
  const m=Math.hypot(direction.x,direction.y),u={x:direction.x/m,y:direction.y/m};
  if(!Number.isFinite(m)||m===0)throw new Error('Invalid rope direction');
  const cap=rope.points.at(-1)!;
  const edge=Math.max(0,Math.min(u.x>0?(board.width-cap.x)/u.x:u.x<0?-cap.x/u.x:Infinity,
    u.y>0?(board.height-cap.y)/u.y:u.y<0?-cap.y/u.y:Infinity));
  const travel=Math.max(0,Math.min(1,progress))*(travelLimit??(edge+rope.length+40));
  const consumed=Math.min(travel,rope.length);
  let i=1;
  while(i<rope.lengths.length-1&&rope.lengths[i]<consumed)i++;
  const a=rope.points[i-1],b=rope.points[i],t=(consumed-rope.lengths[i-1])/(rope.lengths[i]-rope.lengths[i-1]||1);
  const cut={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  const remaining=[cut,...rope.points.slice(i)];
  const along=(d:number)=>({x:cap.x+u.x*d,y:cap.y+u.y*d});
  return {travel,consumed,remaining,from:along(Math.max(0,travel-rope.length)),to:along(travel),unit:u};
}
