import { useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { Arrow, Puzzle } from './game/engine';
import { pathData } from './game/vector-shape';
import { headGeometry, readableHead } from './game/pen-stroke';
import { BUMP_MS, bumpHasContact, bumpProgress, measureRope, PULL_MS, ropeFrame } from './game/rope';
import { headTip } from './game/engine';
import { useMood } from './MoodContext';

export function PullStroke({arrow,board,exiting,attemptDistance,busy,blocked,onSelect,onKeyDown}:{
  arrow:Arrow;board:Puzzle;exiting:boolean;busy:boolean;blocked:boolean;
  attemptDistance?:number;
  onSelect:()=>void;onKeyDown:(event:KeyboardEvent<SVGGElement>)=>void;
}){
  const {colors}=useMood();
  const [progress,setProgress]=useState(0),id=useId().replace(/:/g,'');
  const rope=useMemo(()=>measureRope(arrow),[arrow]);
  useEffect(()=>{
    setProgress(0);
    if(!exiting&&attemptDistance===undefined)return;
    const start=performance.now();let raf=0;
    const tick=(now:number)=>{
      const t=Math.min(1,(now-start)/(exiting?PULL_MS:BUMP_MS));
      // Continuous speed: body length consumed equals length pulled from mouth.
      setProgress(t);if(t<1)raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[exiting,attemptDistance]);
  const attempting=attemptDistance!==undefined,active=exiting||attempting;
  const red=blocked||(attempting&&bumpHasContact(progress,attemptDistance));
  const fraction=exiting?progress:attempting?bumpProgress(progress):0;
  const frame=ropeFrame(rope,arrow.direction,board,fraction,attemptDistance);
  const d=pathData(arrow.shape!.commands);
  const headShape=useMemo(()=>headGeometry(readableHead(arrow)),[arrow]);
  const suffix=frame.remaining.map((v,i)=>`${i?'L':'M'}${v.x},${v.y}`).join(' ');
  const width=arrow.rope!.width;
  const shift=frame.travel;
  // The colored marker stays INSIDE the rope's flat leading cap, including
  // outside the tube. Its original inset from the cap never changes.
  const cap=rope.points.at(-1)!,tip=headTip(arrow);
  const inset=(cap.x-tip.x)*frame.unit.x+(cap.y-tip.y)*frame.unit.y;
  const extension=attempting?Math.max(0,Math.min(shift,attemptDistance-inset)):shift;
  const to=attempting?{x:cap.x+frame.unit.x*extension,y:cap.y+frame.unit.y*extension}:frame.to;
  const from=frame.consumed<rope.length
    ?{x:frame.from.x-frame.unit.x*.5,y:frame.from.y-frame.unit.y*.5}:frame.from;
  return <g data-arrow={arrow.id} data-progress={progress.toFixed(3)} data-travel={shift.toFixed(5)} data-contact={attemptDistance}
    data-direction={`${arrow.direction.x},${arrow.direction.y}`}
    role="button" tabIndex={busy?-1:0} aria-label={arrow.label} aria-disabled={busy}
    style={{'--stroke-body':colors.body,'--stroke-blocked':colors.blocked,'--stroke-hover':colors.hover,'--head-outline':colors.hover} as CSSProperties}
    className={`arrow ${red?'is-blocked':''} ${exiting?'is-exiting':''} ${attempting?'is-attempting':''}`}
    onClick={onSelect} onKeyDown={onKeyDown}>
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="4000" height="4000">
      {frame.consumed<rope.length&&<path d={suffix} fill="none" stroke="white" strokeWidth={width*1.65} strokeLinecap="butt" strokeLinejoin="round"/>}
    </mask></defs>
    <path d={d} className="arrow-hit" fillRule="evenodd" style={{fill:'transparent'}}/>
    <path d={d} className="arrow-body" fillRule="evenodd" style={{strokeWidth:0,fill:'currentColor'}} mask={active?`url(#${id})`:undefined}/>
    {active&&extension>0&&<path className="pulled-rope" d={`M${from.x},${from.y} L${to.x},${to.y}`}
      fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="butt" pointerEvents="none"/>}
    <path d={headShape.d} className="arrow-head" fill={red?colors.blocked:colors.head}
      pointerEvents="none" transform={`translate(${frame.unit.x*shift} ${frame.unit.y*shift}) ${headShape.transform}`} aria-hidden="true"/>
  </g>;
}
