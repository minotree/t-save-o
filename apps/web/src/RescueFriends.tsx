import { useEffect, useMemo, useState } from 'react';
import type { Puzzle, Target } from './game/engine';
import { pathData } from './game/vector-shape';
import { friendLayout, FRIEND_SPACING, PARADE_MS, paradeFrame } from './game/rescue-parade';

export function RescueTarget({target}:{target:Target}){
  return <g className="rescue-target" aria-label="구출 대상 ㅇ">
    <path d={pathData(target.shape!.commands)} fillRule="evenodd" className="target-ring font-target"/>
    <ellipse cx={target.center.x-target.radius*.55} cy={target.center.y+target.radius*.2} rx={target.radius*.15} ry={target.radius*.1} className="cheek"/>
    <ellipse cx={target.center.x+target.radius*.55} cy={target.center.y+target.radius*.2} rx={target.radius*.15} ry={target.radius*.1} className="cheek"/>
    <circle cx={target.center.x-target.radius*.3} cy={target.center.y-target.radius*.075} r={target.radius*.075} className="eye"/>
    <circle cx={target.center.x+target.radius*.3} cy={target.center.y-target.radius*.075} r={target.radius*.075} className="eye"/>
    <path d={`M${target.center.x-8} ${target.center.y+10} Q${target.center.x} ${target.center.y+18} ${target.center.x+8} ${target.center.y+10}`} className="smile"/>
  </g>;
}

export function RescueParade({puzzle,onFinished}:{puzzle:Puzzle;onFinished?:()=>void}){
  const [elapsed,setElapsed]=useState(0);
  const layouts=useMemo(()=>puzzle.targets.map((target,i)=>friendLayout(target,i,puzzle.targets.length,puzzle)),[puzzle]);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setElapsed(PARADE_MS);return;}
    const start=performance.now();let raf=0;
    const tick=(now:number)=>{const t=Math.min(PARADE_MS,now-start);setElapsed(t);if(t<PARADE_MS)raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[]);
  const frame=paradeFrame(elapsed),exit=frame.walk*(puzzle.width+puzzle.targets.length*FRIEND_SPACING);
  useEffect(()=>{if(frame.phase==='gone')onFinished?.();},[frame.phase,onFinished]);
  return <g className={`rescue-parade ${frame.phase==='walking'?'is-walking':''}`} data-phase={frame.phase}
    aria-label="구출된 ㅇ들이 모여 손을 잡고 떠나요" pointerEvents="none">
    <g className="friends-chain" transform={`translate(${exit} 0)`}>
      {puzzle.targets.map((target,i)=>{
        const layout=layouts[i],x=target.center.x+(layout.x-target.center.x)*frame.gather;
        const y=target.center.y+(layout.y-target.center.y)*frame.gather,scale=1+(layout.scale-1)*frame.gather;
        return <g key={target.id} className="rescued-friend" data-friend={target.id} transform={`translate(${x} ${y})`}>
          <g className="friend-limbs" opacity={frame.limbs} transform={`scale(${frame.limbs})`}>
            <path className="friend-arm" d={`M${-layout.halfWidth*.9} 0 Q${-layout.halfWidth-10} 18 ${-FRIEND_SPACING/2} 12`}/>
            <path className="friend-arm" d={`M${layout.halfWidth*.9} 0 Q${layout.halfWidth+10} 18 ${FRIEND_SPACING/2} 12`}/>
            <circle className="friend-hand" cx={-FRIEND_SPACING/2} cy="12" r="5"/>
            <circle className="friend-hand" cx={FRIEND_SPACING/2} cy="12" r="5"/>
            <g className="friend-leg left" style={{transformOrigin:`-18px ${layout.halfHeight-4}px`}}>
              <path d={`M-18 ${layout.halfHeight-4} L-23 ${layout.halfHeight+26} l-12 1`}/>
            </g>
            <g className="friend-leg right" style={{transformOrigin:`18px ${layout.halfHeight-4}px`}}>
              <path d={`M18 ${layout.halfHeight-4} L23 ${layout.halfHeight+26} l12 1`}/>
            </g>
          </g>
          <g transform={`scale(${scale}) translate(${-target.center.x} ${-target.center.y})`}><RescueTarget target={target}/></g>
        </g>;
      })}
    </g>
  </g>;
}
