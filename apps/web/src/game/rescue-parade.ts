import type { Puzzle, Target } from './engine';
import { flattenPath } from './vector-shape';

export const GATHER_MS=1000;
export const LIMBS_MS=450;
export const HOLD_MS=600;
export const WALK_MS=2000;
export const PARADE_MS=GATHER_MS+LIMBS_MS+HOLD_MS+WALK_MS;
export const FRIEND_SPACING=165;
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const ease=(t:number)=>t*t*(3-2*t);

export function paradeFrame(elapsed:number){
  const gather=clamp(elapsed/GATHER_MS),limbs=clamp((elapsed-GATHER_MS)/LIMBS_MS);
  const walk=clamp((elapsed-GATHER_MS-LIMBS_MS-HOLD_MS)/WALK_MS);
  return {gather:ease(gather),limbs:ease(limbs),walk,
    phase:elapsed<GATHER_MS?'gathering':elapsed<GATHER_MS+LIMBS_MS+HOLD_MS?'holding-hands':elapsed<PARADE_MS?'walking':'gone'};
}

export function friendLayout(target:Target,index:number,count:number,board:Pick<Puzzle,'width'|'height'>){
  const points=target.shape?flattenPath(target.shape.commands).flat():[
    {x:target.center.x-target.radius,y:target.center.y-target.radius},
    {x:target.center.x+target.radius,y:target.center.y+target.radius}];
  const width=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x));
  const height=Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y));
  const scale=Math.min(138/width,104/height);
  return {x:board.width/2+(index-(count-1)/2)*FRIEND_SPACING,y:board.height*.55,
    scale,halfWidth:width*scale/2,halfHeight:height*scale/2};
}
