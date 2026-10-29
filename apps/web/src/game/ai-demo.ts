import type { Arrow, Puzzle, Target } from './engine';
import { svgPath } from './jamo-templates';
import { transformCommands } from './vector-shape';
import type { PathCommand } from './vector-shape';

export { arrow as authoredDemoArrow, ellipse as demoEllipse };

// Authored orthogonal paths: one closed physical outline shared by rendering and collision.
function arrow(id:string,label:string,coordinates:number[][],color:string):Arrow {
  const points=coordinates.map(([x,y])=>({x,y})),half=4;
  const units=points.slice(1).map((p,i)=>{const a=points[i],n=Math.hypot(p.x-a.x,p.y-a.y);return {x:(p.x-a.x)/n,y:(p.y-a.y)/n};});
  const side=(sign:number)=>points.map((p,i)=>{
    const before=units[Math.max(0,i-1)],after=units[Math.min(i,units.length-1)];
    const factor=sign*half/(1+before.x*after.x+before.y*after.y);
    return {x:p.x-(before.y+after.y)*factor,y:p.y+(before.x+after.x)*factor};
  });
  const polygon=[...side(1),...side(-1).reverse()];
  const commands:PathCommand[]=[...polygon.map((p,i)=>({type:i?'L' as const:'M' as const,...p})),{type:'Z'}];
  const direction=units.at(-1)!,cap=points.at(-1)!;
  return {id,label,points,direction,color,shape:{commands,fill:true,strokeWidth:0},
    rope:{path:points.map((p,i)=>({type:i?'L':'M',...p})),width:half*2},
    head:{anchor:{x:cap.x-direction.x*13,y:cap.y-direction.y*13},direction,length:9,width:5,endpoint:'end',capCenter:cap}};
}
function ellipse(cx:number,cy:number,rx:number,ry:number){
  const k=.5522847498;
  return `M${cx+rx} ${cy} C${cx+rx} ${cy+ry*k} ${cx+rx*k} ${cy+ry} ${cx} ${cy+ry} C${cx-rx*k} ${cy+ry} ${cx-rx} ${cy+ry*k} ${cx-rx} ${cy} C${cx-rx} ${cy-ry*k} ${cx-rx*k} ${cy-ry} ${cx} ${cy-ry} C${cx+rx*k} ${cy-ry} ${cx+rx} ${cy-ry*k} ${cx+rx} ${cy} Z`;
}
function target(id:string,x:number,requiredArrowIds:string[]):Target {
  const outer=ellipse(x,360,72,108);
  return {id,center:{x,y:360},radius:55,requiredArrowIds,
    shape:{commands:svgPath(outer+' '+ellipse(x,360,67,103)),fill:true,strokeWidth:0},
    obstacle:{commands:svgPath(outer),fill:true,strokeWidth:0}};
}
export function createAiDemo():Puzzle {
  const black='#252832';
  const arrows=[
    // All authored centerlines use a 24-unit lattice: width 8 leaves a 16-unit lane gap.
    arrow('ai-a-upper','아 ㅏ 위쪽 획, 위 방향',[[432,360],[360,360],[360,192]],'#D85F92'),
    arrow('ai-a-lower','아 ㅏ 아래쪽 획, 아래 방향',[[360,384],[360,504]],'#D85F92'),
    arrow('ai-i','이 ㅣ, 아래 방향',[[744,192],[744,504]],'#4285C5'),
    // Physical dependencies: gate -> surrounding train -> independent inner train.
    // Every terminal ray opens away from its own body; no self-collision exemption is needed by this layout.
    arrow('ai-fill-1','검정 왼쪽 외곽, 왼쪽 방향',[[24,216],[24,120],[48,120],[48,96],[192,96],[192,72],[240,72],[240,48],[24,48]],black),
    arrow('ai-fill-2','검정 위쪽 가운데, 위 방향',[[288,168],[288,48],[336,48],[336,72],[480,72],[480,96],[336,96],[336,120],[432,120],[432,144],[480,144],[480,120],[528,120],[528,48]],black),
    arrow('ai-fill-3','검정 오른쪽 외곽, 위 방향',[[384,216],[384,168],[552,168],[552,120],[624,120],[624,144],[648,144],[648,120],[744,120],[744,96],[576,96],[576,72],[768,72],[768,144],[792,144],[792,48]],black),
    arrow('ai-fill-4','검정 왼쪽 안쪽 열차, 위 방향',[[96,456],[72,456],[72,288]],black),
    arrow('ai-fill-5','검정 오른쪽 안쪽 열차, 위 방향',[[504,456],[480,456],[480,288]],black),
    arrow('ai-fill-6','검정 왼쪽 감싼 열차, 위 방향',[[96,480],[48,480],[48,240],[264,240],[264,432],[288,432],[288,216]],black),
    arrow('ai-fill-7','검정 오른쪽 감싼 열차, 위 방향',[[528,480],[456,480],[456,240],[672,240],[672,432],[696,432],[696,216]],black),
    arrow('ai-fill-8','검정 오른쪽 세로, 아래 방향',[[792,216],[792,528]],black),
    arrow('ai-fill-9','검정 아 아래 열린 경로, 위 방향',[[48,552],[48,648],[216,648],[216,600],[192,600],[192,624],[168,624],[168,552]],black),
    arrow('ai-fill-10','검정 이 아래 열린 경로, 위 방향',[[480,552],[480,648],[624,648],[624,600],[600,600],[600,624],[576,624],[576,552]],black),
    arrow('ai-fill-11','검정 아래 왼쪽 외곽, 왼쪽 방향',[[408,408],[408,528],[384,528],[384,696],[336,696],[336,552],[288,552],[288,672],[192,672],[192,696],[96,696],[96,672],[24,672]],black),
    arrow('ai-fill-12','검정 아래 오른쪽 외곽, 오른쪽 방향',[[768,216],[768,552],[648,552],[648,624],[744,624],[744,648],[672,648],[672,696],[792,696]],black),
    arrow('ai-fill-13','검정 왼쪽 위 안쪽, 오른쪽 방향',[[96,120],[192,120],[192,144],[216,144]],black),
    arrow('ai-fill-14','검정 왼쪽 위 아래 통로, 오른쪽 방향',[[96,168],[216,168]],black),
    arrow('ai-fill-15','검정 아 옆 짧은 획, 위 방향',[[336,336],[336,312]],black),
    arrow('ai-fill-16','검정 두 글자 사이 짧은 획, 아래 방향',[[384,264],[384,288],[432,288],[432,336]],black),
    arrow('ai-fill-17','검정 왼쪽 아래 짧은 획, 위 방향',[[240,648],[240,576]],black),
    arrow('ai-fill-18','검정 왼쪽 아래 안쪽, 위 방향',[[120,624],[120,576]],black),
    arrow('ai-fill-19','검정 오른쪽 아래 안쪽, 위 방향',[[552,624],[552,576]],black),
    arrow('ai-fill-20','검정 왼쪽 맨 아래, 오른쪽 방향',[[120,672],[144,672]],black),
    arrow('ai-fill-21','검정 오른쪽 맨 아래, 오른쪽 방향',[[528,672],[576,672]],black),
    arrow('ai-fill-22','검정 왼쪽 맨 위 틈, 오른쪽 방향',[[72,72],[144,72]],black),
    arrow('ai-fill-23','검정 가운데 맨 위 틈, 오른쪽 방향',[[384,48],[432,48]],black),
    arrow('ai-fill-24','검정 오른쪽 맨 위 틈, 오른쪽 방향',[[576,24],[672,24]],black),
    arrow('ai-fill-25','검정 오른쪽 위 가로 틈, 오른쪽 방향',[[720,144],[744,144]],black),
    arrow('ai-fill-26','검정 왼쪽 바깥 틈, 아래 방향',[[24,288],[24,432]],black),
    arrow('ai-fill-27','검정 아 아래 가로 틈, 오른쪽 방향',[[96,528],[264,528]],black),
    arrow('ai-fill-28','검정 이 아래 가로 틈, 오른쪽 방향',[[552,504],[672,504]],black),
    arrow('ai-fill-29','검정 왼쪽 하단 바깥 틈, 아래 방향',[[24,552],[24,624]],black),
    arrow('ai-fill-30','검정 오른쪽 하단 안쪽 틈, 오른쪽 방향',[[672,600],[744,600]],black),
    arrow('ai-fill-31','검정 하단 가운데 틈, 아래 방향',[[432,624],[432,672]],black),
    arrow('ai-fill-32','검정 오른쪽 하단 바닥 틈, 오른쪽 방향',[[528,696],[648,696]],black),
  ];
  return {letter:'아이',width:816,height:816,waitingY:768,arrows,
    targets:[target('ieung-ai-a',168,['ai-a-upper','ai-a-lower']),target('ieung-ai-i',576,['ai-i'])]};
}
export function activeTargets(puzzle:Puzzle,removed:readonly string[]){
  return puzzle.targets.filter(t=>!t.requiredArrowIds||!t.requiredArrowIds.every(id=>removed.includes(id)));
}
export function waitingPosition(puzzle:Puzzle,index:number){
  return {x:puzzle.width/2+(index-(puzzle.targets.length-1)/2)*86,y:puzzle.waitingY!,scale:.24};
}
export function waitingParadePuzzle(puzzle:Puzzle):Puzzle {
  if(puzzle.waitingY===undefined)return puzzle;
  return {...puzzle,targets:puzzle.targets.map((t,i)=>{
    const p=waitingPosition(puzzle,i),origin={x:p.x-t.center.x*p.scale,y:p.y-t.center.y*p.scale};
    return {...t,center:{x:p.x,y:p.y},radius:t.radius*p.scale,
      shape:t.shape?{...t.shape,commands:transformCommands(t.shape.commands,origin,{x:p.scale,y:p.scale})}:undefined};
  })};
}
