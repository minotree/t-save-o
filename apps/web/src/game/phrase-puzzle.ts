import { assembleGlyphPuzzle } from './success-puzzle';
import type { GlyphCell, RingDefinition, Stroke } from './success-puzzle';
import type { Point } from './engine';
import type { PathCommand } from './vector-shape';
const p=(x:number,y:number):Point=>({x,y});
const pen=(key:string,jamo:string,body:string,spine:string,marker:Point,direction:Point,width=80):Stroke=>({key,jamo,body,spine,marker,direction,width});
function rect(key:string,jamo:string,x0:number,y0:number,x1:number,y1:number,heading:'U'|'D'|'L'|'R'):Stroke {
  const x=(x0+x1)/2,y=(y0+y1)/2;
  const ends={U:[p(x,y1),p(x,y0)],D:[p(x,y0),p(x,y1)],L:[p(x1,y),p(x0,y)],R:[p(x0,y),p(x1,y)]};
  const [tail,cap]=ends[heading],direction={U:p(0,-1),D:p(0,1),L:p(-1,0),R:p(1,0)}[heading];
  return pen(key,jamo,`M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1} Z`,
    `M${tail.x} ${tail.y} L${cap.x} ${cap.y}`,p(cap.x-direction.x*38,cap.y-direction.y*38),direction,
    heading==='U'||heading==='D'?x1-x0:y1-y0);
}
const a=(key:string,bottom:number,top:number,right:number)=>[
  rect(`${key}-vertical`,'ㅏ',662,-827,745,bottom,'U'),rect(`${key}-bar`,'ㅏ',745,top,right,top+69,'R')];
function mieum(key:string,x0:number,y0:number,x1:number,y1:number,ix0:number,iy0:number,ix1:number,iy1:number):Stroke[]{
  const lx=(x0+ix0)/2,by=(iy1+y1)/2,rx=(ix1+x1)/2,ty=(y0+iy0)/2;
  return [
    pen(`${key}-lower`,'ㅁ',`M${x0} ${y0} L${ix0} ${y0} L${ix0} ${iy1} L${x1} ${iy1} L${x1} ${y1} L${x0} ${y1} Z`,
      `M${lx} ${y0} L${lx} ${by} L${x1} ${by}`,p(x1-38,by),p(1,0),y1-iy1),
    pen(`${key}-upper`,'ㅁ',`M${ix0} ${y0} L${x1} ${y0} L${x1} ${iy1} L${ix1} ${iy1} L${ix1} ${iy0} L${ix0} ${iy0} Z`,
      `M${ix0} ${ty} L${rx} ${ty} L${rx} ${iy1}`,p(rx,iy1-38),p(0,1),x1-ix1),
  ];
}
// All exterior contours below are the complete-syllable Noto Sans KR glyphs.
// Only actual pen junctions are split; circles are fixed rescue targets.
const wu:RingDefinition=[
  'M457 -791 C269 -791 141 -714 141 -592 C141 -471 269 -394 457 -394 C646 -394 774 -471 774 -592 C774 -714 646 -791 457 -791 Z',
  'M457 -724 C596 -724 689 -672 689 -592 C689 -512 596 -461 457 -461 C319 -461 226 -512 226 -592 C226 -672 319 -724 457 -724 Z',p(457,-592)];
const hieut:RingDefinition=[
  'M338 -619 C205 -619 117 -556 117 -458 C117 -359 205 -297 338 -297 C471 -297 558 -359 558 -458 C558 -556 471 -619 338 -619 Z',
  'M338 -556 C423 -556 479 -518 479 -458 C479 -398 423 -360 338 -360 C252 -360 196 -398 196 -458 C196 -518 252 -556 338 -556 Z',p(338,-458)];
const eRing:RingDefinition=[
  'M253 -751 C137 -751 61 -630 61 -437 C61 -243 137 -121 253 -121 C365 -121 439 -230 446 -407 L446 -475 C437 -646 363 -751 253 -751 Z',
  'M253 -674 C325 -674 370 -583 370 -437 C370 -290 325 -199 253 -199 C183 -199 138 -290 138 -437 C138 -583 183 -674 253 -674 Z',p(253,-437)];
const unRing:RingDefinition=[
  'M458 -804 C267 -804 141 -734 141 -622 C141 -510 267 -441 458 -441 C650 -441 775 -510 775 -622 C775 -734 650 -804 458 -804 Z',
  'M458 -737 C596 -737 687 -693 687 -622 C687 -552 596 -509 458 -509 C321 -509 229 -552 229 -622 C229 -693 321 -737 458 -737 Z',p(458,-622)];
const ri:Stroke[]=[
  pen('ri-rieul-top','ㄹ','M100 -743 L518 -743 L518 -487 L434 -487 L434 -675 L100 -675 Z','M100 -709 L476 -709 L476 -487',p(476,-525),p(0,1)),
  rect('ri-rieul-middle','ㄹ',102,-487,518,-420,'R'),
  pen('ri-rieul-bottom','ㄹ','M102 -420 L186 -420 L186 -209 C334 -209 466 -216 624 -241 L632 -173 C469 -146 333 -140 177 -140 L102 -140 Z',
    'M144 -420 L144 -174.5 C330 -174.5 466 -181 628 -207',p(590,-202),p(1,0),76),
  rect('ri-i','ㅣ',709,-827,791,79,'U')];
const ga:Stroke[]=[
  pen('ga-giyeok','ㄱ','M97 -730 L512 -730 C512 -473 394 -240 101 -94 L55 -158 C285 -274 410 -447 429 -661 L97 -661 Z',
    'M97 -695.5 L470.5 -695.5 C456 -450 324 -256 78 -126',p(115,-134),p(-1,0)),...a('ga-a',77,-460,889)];
// Split 저's right outer cubic at t=.36, preserving both original halves.
const lerp=(v:Point,w:Point)=>p(v.x+(w.x-v.x)*.36,v.y+(w.y-v.y)*.36);
const ab=lerp(p(363,-562),p(363,-411)),bc=lerp(p(363,-411),p(468,-246)),cd=lerp(p(468,-246),p(599,-185));
const abc=lerp(ab,bc),bcd=lerp(bc,cd),q=lerp(abc,bcd),cap=p((q.x+322)/2,(q.y-405)/2);
const jeo:Stroke[]=[
  rect('jeo-jieut-bar','ㅈ',76,-734,567,-666,'R'),
  pen('jeo-jieut-left','ㅈ',`M279 -666 L279 -562 C279 -401 173 -230 42 -166 L92 -100 C195 -154 282 -271 322 -405 L${q.x} ${q.y} C${abc.x} ${abc.y} ${ab.x} ${ab.y} 363 -562 L363 -666 Z`,
    'M67 -133 C222 -219 321 -400 321 -562 L321 -666',p(321,-626),p(0,-1),84),
  pen('jeo-jieut-right','ㅈ',`M${q.x} ${q.y} C${bcd.x} ${bcd.y} ${cd.x} ${cd.y} 599 -185 L550 -119 C447 -170 363 -279 322 -405 Z`,
    `M574.5 -152 C444 -220 385 -341 ${cap.x} ${cap.y}`,p(cap.x+18,cap.y+22),p(-34.1,-49.88)),
  rect('jeo-eo-vertical','ㅓ',711,-827,794,79,'U'),rect('jeo-eo-bar','ㅓ',517,-498,711,-430,'R')];
const ma=[...mieum('ma-mieum',86,-736,501,-152,167,-670,419,-219),
  rect('ma-a-vertical','ㅏ',662,-827,745,78,'U'),rect('ma-a-bar','ㅏ',745,-466,893,-396,'R')];
const da:Stroke[]=[rect('da-digeut-top','ㄷ',89,-739,508,-671,'R'),
  pen('da-digeut-lower','ㄷ','M89 -671 L171 -671 L171 -217 C331 -217 446 -224 578 -248 L588 -177 C448 -152 330 -147 160 -147 L89 -147 Z',
    'M583 -212.5 C448 -187 330 -182 130 -182 L130 -671',p(130,-633),p(0,-1)),...a('da-a',79,-470,893)];
const him:Stroke[]=[rect('him-hieut-stem','ㅎ',296,-834,380,-731,'U'),rect('him-hieut-bar','ㅎ',63,-731,612,-663,'L'),
  rect('him-i','ㅣ',708,-827,791,-279,'U'),...mieum('him-mieum',207,-231,791,66,288,-164,710,-2)];
const e:Stroke[]=[rect('e-left-vertical','ㅔ',559,-808,638,32,'U'),
  pen('e-bar','ㅔ','M446 -475 L559 -475 L559 -407 L446 -407 Z','M446 -430 L559 -430',p(521,-430),p(1,0),68),
  rect('e-right-vertical','ㅔ',739,-827,819,78,'U')];
const gyeo:Stroke[]=[
  pen('gyeo-giyeok','ㄱ','M89 -729 L505 -729 C505 -678 501 -628 491 -579 L475 -512 C424 -344 306 -197 94 -93 L50 -159 C287 -276 405 -449 422 -662 L89 -662 Z',
    'M89 -695.5 L463.5 -695.5 C456 -450 324 -256 72 -126',p(113,-134),p(-1,.7)),
  // Upper vertical + upper short bar form one connected L; this permits a
  // natural terminal UP exit instead of a horizontal ray into a fixed circle.
  pen('gyeo-yeo-upper','ㅕ','M711 -828 L793 -828 L793 -512 L475 -512 L491 -579 L711 -579 Z',
    'M483 -545.5 L752 -545.5 L752 -828',p(752,-790),p(0,-1),82),
  rect('gyeo-yeo-lower','ㅕ',711,-512,793,77,'D'),rect('gyeo-yeo-bar','ㅕ',461,-337,711,-269,'R')];
const un:Stroke[]=[rect('un-u-bar','ㅜ',49,-368,869,-300,'R'),rect('un-u-stem','ㅜ',424,-300,508,-117,'D'),
  pen('un-nieun','ㄴ','M154 -206 L237 -206 L237 -11 L778 -11 L778 58 L154 58 Z',
    'M195.5 -206 L195.5 23.5 L778 23.5',p(740,23.5),p(1,0),76)];

export function createPhrasePuzzle(layout:'original'|'four-per-line'|'four-per-line-playable'='original'){
  const cells:GlyphCell[]=[
    {letter:'우',strokes:[rect('wu-u-bar','ㅜ',49,-309,869,-240,'L'),rect('wu-u-stem','ㅜ',416,-240,498,78,'D')],origin:p(22,285),ring:wu},
    {letter:'리',strokes:ri,origin:p(316,285)},{letter:'가',strokes:ga,origin:p(610,285)},
    {letter:'저',strokes:jeo,origin:p(944,285)},{letter:'마',strokes:ma,origin:p(1238,285)},{letter:'다',strokes:da,origin:p(1532,285)},
    {letter:'힘',strokes:him,origin:p(180,615),ring:hieut},{letter:'에',strokes:e,origin:p(474,615),ring:eRing},
    {letter:'겨',strokes:gyeo,origin:p(768,615)},{letter:'운',strokes:un,origin:p(1062,615),ring:unRing}];
  if(layout!=='original'){
    // Design comparison: preserve word boundaries, font geometry and directions.
    const origins=[p(169,285),p(463,285),p(757,285),
      p(200,615),p(494,615),p(788,615),
      p(22,945),p(316,945),p(610,945),p(904,945)];
    const puzzle=assembleGlyphPuzzle(cells.map((cell,i)=>({...cell,origin:origins[i]})),
      '우리가 / 저마다 / 힘에겨운',1230,1030);
    if(layout==='four-per-line')return puzzle;
    // Explicit new puzzle data: reverse these writing paths to use their other
    // natural terminal. Body contours and the collision engine remain unchanged.
    const reversed=new Set(['jeo-jieut-bar','jeo-jieut-left','jeo-eo-bar','him-i']);
    return {...puzzle,arrows:puzzle.arrows.map(arrow=>{
      if(!reversed.has(arrow.id))return arrow;
      const commands=arrow.rope!.path,segments:{command:PathCommand;from:Point}[]=[];
      let current:Point={x:0,y:0};
      for(const command of commands){
        if(command.type==='Z')throw new Error('Expected an open writing path');
        if(command.type!=='M')segments.push({command,from:current});
        current=p(command.x,command.y);
      }
      const path:PathCommand[]=[{type:'M',...current}];
      for(const {command,from} of segments.reverse()){
        if(command.type==='C')path.push({type:'C',x1:command.x2,y1:command.y2,x2:command.x1,y2:command.y1,...from});
        else if(command.type==='Q')path.push({type:'Q',x1:command.x1,y1:command.y1,...from});
        else path.push({type:'L',...from});
      }
      const points=[...arrow.points].reverse(),cap=points.at(-1)!,previous=points.at(-2)!;
      const dx=cap.x-previous.x,dy=cap.y-previous.y,m=Math.hypot(dx,dy),direction=p(dx/m,dy/m);
      const anchor=p(cap.x-direction.x*(11.02+arrow.head!.length!),cap.y-direction.y*(11.02+arrow.head!.length!));
      const heading=Math.abs(direction.x)<.001?(direction.y<0?'위':'아래')
        :Math.abs(direction.y)<.001?(direction.x<0?'왼쪽':'오른쪽')
        :`${direction.x<0?'왼쪽':'오른쪽'} ${direction.y<0?'위':'아래'}`;
      return {...arrow,points,direction,label:`${arrow.label.split(',')[0]}, ${heading} 방향`,
        rope:{...arrow.rope!,path},head:{...arrow.head!,anchor,direction,capCenter:cap}};
    })};
  }
  return assembleGlyphPuzzle(cells,'우리가 저마다 / 힘에겨운',1830,700);
}

export { rect, pen, wu };
