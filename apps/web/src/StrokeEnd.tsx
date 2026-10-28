import { useId, useMemo } from 'react';
import type { Arrow } from './game/engine';
import { headTip } from './game/engine';
import { readableHead } from './game/pen-stroke';
import { measureRope } from './game/rope';
import { pathData } from './game/vector-shape';

const endColors=['#E65A62','#427BC4','#9564C5','#DE8B28','#D95892'];
export function strokeEndColor(id:string){
  let hash=0;
  for(const char of id)hash=(hash*31+char.charCodeAt(0))>>>0;
  return endColors[hash%endColors.length];
}

// Display-only paint: the real body clip keeps every edge inside the font.
export function StrokeEnd({arrow,shift=0,extension=0,mask,color}:{
  arrow:Arrow;shift?:number;extension?:number;mask?:string;color?:string;
}){
  const id=`end-${useId().replace(/:/g,'')}`;
  const geometry=useMemo(()=>{
    const rope=measureRope(arrow),cap=rope.points.at(-1)!,m=Math.hypot(arrow.direction.x,arrow.direction.y);
    const u={x:arrow.direction.x/m,y:arrow.direction.y/m},tip=headTip(arrow);
    const inset=(cap.x-tip.x)*u.x+(cap.y-tip.y)*u.y;
    return {rope,cap,u,length:Math.min(rope.length,inset+(readableHead(arrow).length??0)+4)};
  },[arrow]);
  const {rope,cap,u,length}=geometry;
  const point=(distance:number)=>`${cap.x+u.x*distance},${cap.y+u.y*distance}`;
  const outsideStart=Math.max(0,shift-length,shift-rope.length);
  const paint=color??strokeEndColor(arrow.id);
  return <g className="stroke-end" pointerEvents="none" aria-hidden="true" data-end-color={paint}>
    <defs><clipPath id={id}><path d={pathData(arrow.shape!.commands)} clipRule="evenodd"/></clipPath></defs>
    <g mask={mask}><path className="stroke-end-inside" d={`M${point(shift-length)} L${point(shift+1)}`}
      clipPath={`url(#${id})`} fill="none" stroke={paint} strokeWidth={arrow.rope!.width*2} strokeLinecap="butt"/></g>
    {extension>outsideStart&&<path className="stroke-end-outside" d={`M${point(outsideStart)} L${point(extension)}`}
      fill="none" stroke={paint} strokeWidth={arrow.rope!.width} strokeLinecap="butt"/>}
  </g>;
}
