import type { Arrow, Point, Puzzle, Target } from './engine';
import { svgPath } from './jamo-templates';
import { flattenPath, transformCommands } from './vector-shape';

// Reviewed Noto Sans KR Regular 2.004 outlines in the original 1000-unit em.
// Each junction is split along a pen seam, not a rectangular glyph crop.
// Bezier sides and outer silhouettes are retained; the combined bodies reconstruct
// the original glyph. Spines are authored separately, always tail -> pulling end.
export type Stroke = { key:string; jamo:string; body:string; spine:string; marker:Point; direction:Point; width:number };
const p = (x:number,y:number):Point => ({x,y});
const cubic = (a:Point,b:Point,c:Point,d:Point,t:number) => p((1-t)**3*a.x+3*(1-t)**2*t*b.x+3*(1-t)*t*t*c.x+t**3*d.x,
  (1-t)**3*a.y+3*(1-t)**2*t*b.y+3*(1-t)*t*t*c.y+t**3*d.y);
function split(a:Point,b:Point,c:Point,d:Point,t:number) {
  const lerp=(v:Point,w:Point)=>p(v.x+(w.x-v.x)*t,v.y+(w.y-v.y)*t);
  const ab=lerp(a,b),bc=lerp(b,c),cd=lerp(c,d),abc=lerp(ab,bc),bcd=lerp(bc,cd),q=cubic(a,b,c,d,t);
  return { q, first:`C${ab.x} ${ab.y} ${abc.x} ${abc.y} ${q.x} ${q.y}`,
    last:`C${bcd.x} ${bcd.y} ${cd.x} ${cd.y} ${d.x} ${d.y}`,
    reverseFirst:`C${abc.x} ${abc.y} ${ab.x} ${ab.y} ${a.x} ${a.y}` };
}
function siot(prefix:string, jieut=false):Stroke[] {
  const top=jieut?-697:-776, apex=p(jieut?324:321,jieut?-525:-538);
  const outer=jieut?split(p(364,-662),p(364,-545),p(452,-432),p(583,-386),.36)
    :split(p(360,-686),p(360,-558),p(449,-444),p(581,-399),.36);
  const q=outer.q, cap=p((q.x+apex.x)/2,(q.y+apex.y)/2);
  return [
    {key:`${prefix}-left`,jamo:jieut?'ㅈ':'ㅅ',
      body:jieut?`M280 ${top} L280 -661 C280 -534 187 -413 53 -366 L96 -300 C203 -339 285 -422 324 -525 L${q.x} ${q.y} ${outer.reverseFirst} L364 ${top} Z`
        :`M278 ${top} L278 -683 C278 -544 188 -423 49 -374 L93 -307 C202 -348 283 -431 321 -538 L${q.x} ${q.y} ${outer.reverseFirst} L360 ${top} Z`,
      spine:jieut?'M74 -333 C230 -398 322 -531 322 -661 L322 -697':'M71 -340.5 C231 -411 319 -548 319 -683 L319 -776',
      marker:p(jieut?322:319,jieut?-665:-736),direction:p(0,-1),width:82},
    {key:`${prefix}-right`,jamo:jieut?'ㅈ':'ㅅ',
      body:jieut?`M${q.x} ${q.y} ${outer.last} L541 -321 C440 -357 362 -432 324 -525 Z`
        :`M${q.x} ${q.y} ${outer.last} L536 -334 C436 -371 360 -444 321 -538 Z`,
      spine:`M${jieut?562:558.5} ${jieut?-353.5:-366.5} C470 -408 395 -475 ${cap.x} ${cap.y}`,
      marker:p(cap.x+15,cap.y+20),direction:p(-34.1,-49.88),width:78},
  ];
}
const eo=(prefix:string,barTop:number,bottom:number,left:number):Stroke[]=>[
  {key:`${prefix}-vertical`,jamo:'ㅓ',body:`M711 -827 L794 -827 L794 ${bottom} L711 ${bottom} Z`,spine:`M752.5 ${bottom} L752.5 -827`,marker:p(752.5,-784),direction:p(0,-1),width:83},
  {key:`${prefix}-horizontal`,jamo:'ㅓ',body:`M${left} ${barTop} L711 ${barTop} L711 ${barTop+69} L${left} ${barTop+69} Z`,spine:`M711 ${barTop+34.5} L${left} ${barTop+34.5}`,marker:p(left+36,barTop+34.5),direction:p(-1,0),width:69},
];
export const successLetters:Stroke[][]=[
  [...siot('seong-siot'),...eo('seong-eo',-636,-292,514)],
  [
    {key:'gong-giyeok',jamo:'ㄱ',body:'M147 -781 L147 -714 L681 -714 L681 -705 C681 -634 681 -567 657 -474 L738 -465 C763 -558 763 -632 763 -705 L763 -781 Z',
      spine:'M697.5 -469.5 C722 -565 722 -637 722 -705 L722 -747.5 L147 -747.5',marker:p(187,-747.5),direction:p(-1,0),width:74},
    {key:'gong-o-vertical',jamo:'ㅗ',body:'M386 -580 L468 -580 L468 -406 L386 -406 Z',spine:'M427 -406 L427 -580',marker:p(427,-540),direction:p(0,-1),width:82},
    {key:'gong-o-horizontal',jamo:'ㅗ',body:'M51 -406 L866 -406 L866 -338 L51 -338 Z',spine:'M866 -372 L51 -372',marker:p(91,-372),direction:p(-1,0),width:68},
  ],
  [
    {key:'jeok-jieut-top',jamo:'ㅈ',body:'M79 -765 L562 -765 L562 -697 L79 -697 Z',spine:'M562 -731 L79 -731',marker:p(119,-731),direction:p(-1,0),width:68},
    ...siot('jeok-jieut',true),...eo('jeok-eo',-591,-286,534),
    {key:'jeok-final',jamo:'ㄱ',body:'M190 -237 L794 -237 L794 78 L711 78 L711 -169 L190 -169 Z',spine:'M190 -203 L752.5 -203 L752.5 78',marker:p(752.5,38),direction:p(0,1),width:74},
  ],
];
export const rings=[
  ['M496 -265 C309 -265 195 -202 195 -94 C195 14 309 76 496 76 C683 76 797 14 797 -94 C797 -202 683 -265 496 -265 Z',
    'M496 -199 C632 -199 715 -160 715 -94 C715 -29 632 10 496 10 C360 10 277 -29 277 -94 C277 -160 360 -199 496 -199 Z',p(496,-94)],
  ['M455 -256 C263 -256 141 -194 141 -89 C141 14 263 76 455 76 C648 76 770 14 770 -89 C770 -194 648 -256 455 -256 Z',
    'M455 -192 C597 -192 688 -153 688 -89 C688 -27 597 11 455 11 C314 11 223 -27 223 -89 C223 -153 314 -192 455 -192 Z',p(455,-89)],
] as const;

export type RingDefinition=readonly [outer:string,inner:string,center:Point];
export type GlyphCell={ letter:string; strokes:readonly Stroke[]; origin:Point; ring?:RingDefinition; rings?:readonly RingDefinition[] };
export function assembleGlyphPuzzle(cells:readonly GlyphCell[],letter:string,width:number,height:number):Puzzle {
  const scale=.29;
  const arrows:Arrow[]=[], targets:Target[]=[];
  cells.forEach(({strokes,origin,letter,ring,rings:extraRings},i)=>{
    const point=(v:Point)=>p(origin.x+v.x*scale,origin.y+v.y*scale);
    const commands=(d:string)=>transformCommands(svgPath(d),origin,p(scale,scale));
    for(const s of strokes){
      const shape={commands:commands(s.body),fill:true,strokeWidth:0},spine=commands(s.spine);
      const marker=point(s.marker), m=Math.hypot(s.direction.x,s.direction.y),length=22*scale,width=24*scale;
      const anchor=p(marker.x-s.direction.x/m*length/2,marker.y-s.direction.y/m*length/2);
      const description=s.key.endsWith('-left')?'왼쪽 획':s.key.endsWith('-right')?'오른쪽 획'
        :s.key.endsWith('-vertical')?'세로 획':s.key.endsWith('-horizontal')?'가로 획':s.key.endsWith('-top')?'윗 가로획':'꺾인 획';
      const heading=s.direction.y===0?s.direction.x<0?'왼쪽':'오른쪽':s.direction.x===0?s.direction.y<0?'위':'아래'
        :s.direction.y<0?'왼쪽 위':'왼쪽 아래';
      arrows.push({id:s.key,label:`${letter} ${s.jamo} ${description}, ${heading} 방향`,points:flattenPath(spine)[0],direction:s.direction,shape,
        head:{anchor,direction:s.direction,length,width,endpoint:'end',capCenter:flattenPath(spine)[0].at(-1)!},
        rope:{path:spine,width:s.width*scale}});
    }
    for(const [ringIndex,definition] of (extraRings??(ring?[ring]:[])).entries()){
      const [outer,inner,center]=definition;
      targets.push({id:ringIndex?`ieung-${i}-${ringIndex}`:`ieung-${i}`,center:point(center),radius:100*scale,
        shape:{commands:commands(outer+' '+inner),fill:true,strokeWidth:0},obstacle:{commands:commands(outer),fill:true,strokeWidth:0}});
    }
  });
  return {width,height,letter,arrows,targets};
}

export function createSuccessPuzzle():Puzzle {
  return assembleGlyphPuzzle(successLetters.map((strokes,i)=>({letter:'성공적'[i],strokes,origin:p(22+i*294,285),ring:i<2?rings[i]:undefined})),
    '성공적',900,370);
}

export const wordStrokeColors={body:'#258C78',head:'#FFFF00',blocked:'#FF727E'};
