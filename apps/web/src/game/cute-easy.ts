import { assembleGlyphPuzzle, rings, successLetters } from './success-puzzle';
import type { GlyphCell, RingDefinition, Stroke } from './success-puzzle';
import { rect, pen, wu } from './phrase-puzzle';
import { easyFontReference as font } from './easy-font-reference.generated';
import { pathData } from './vector-shape';
const p=(x:number,y:number)=>({x,y});
const contour=(letter:keyof typeof font,index:number)=>pathData(font[letter][index]);
const ring=(letter:keyof typeof font,outer:number,inner:number,x:number,y:number):RingDefinition=>[contour(letter,outer),contour(letter,inner),p(x,y)];
type Glyph={strokes:readonly Stroke[];rings?:readonly RingDefinition[]};

// Reviewed pen joints in the original complete glyph. No direction-based crops.
export const glyphs:Record<string,Glyph>={
  '아':{rings:[ring('아',0,1,290,-442)],strokes:[
    pen('a-upper','ㅏ','M662 -827 L745 -827 L745 -466 L893 -466 L893 -396 L662 -396 Z',
      'M893 -431 L703.5 -431 L703.5 -827',p(703.5,-789),p(0,-1),83),
    rect('a-lower','ㅏ',662,-396,745,78,'U')]},
  '이':{rings:[ring('이',1,2,313,-442)],strokes:[rect('i','ㅣ',707,-827,790,79,'U')]},
  '오':{rings:[[
    'M458 -768 C268 -768 130 -674 130 -531 C130 -397 248 -308 417 -295 L499 -295 C668 -308 787 -397 787 -531 C787 -674 649 -768 458 -768 Z',
    contour('오',0),p(458,-531)]],strokes:[
    rect('o-horizontal','ㅗ',50,-107,870,-38,'L'),rect('o-vertical','ㅗ',417,-295,499,-107,'D')]},
  '우':{rings:[wu],strokes:[rect('u-horizontal','ㅜ',49,-309,869,-240,'L'),rect('u-vertical','ㅜ',416,-240,498,78,'D')]},
  '유':{rings:[ring('유',0,1,457,-593)],strokes:[
    rect('yu-horizontal','ㅠ',49,-312,869,-244,'L'),rect('yu-left','ㅠ',260,-244,345,78,'D'),rect('yu-right','ㅠ',571,-244,655,78,'D')]},
  '기':{strokes:[
    pen('gi-giyeok','ㄱ',contour('기',1),'M103 -695.5 L484 -695.5 C466 -452 332 -255 83 -124.5',p(119,-134),p(-1,.7)),
    rect('gi-i','ㅣ',709,-827,792,78,'U')]},
  '리':{strokes:[
    pen('ri-rieul','ㄹ',contour('리',1),'M100 -709 L476 -709 L476 -453.5 L144 -453.5 L144 -174.5 C330 -174.5 466 -181 628 -207',p(590,-202),p(1,0),76),
    rect('ri-i','ㅣ',709,-827,791,79,'U')]},
  '여':{rings:[[
    'M291 -757 C159 -757 66 -634 66 -442 C66 -249 159 -126 291 -126 C378 -126 448 -179 486 -271 L506 -339 C513 -370 516 -405 516 -442 C516 -484 512 -522 503 -557 L480 -625 C441 -709 374 -757 291 -757 Z',
    contour('여',0),p(291,-442)]],strokes:[
    pen('yeo-upper','ㅕ','M712 -827 L794 -827 L794 -557 L503 -557 L480 -625 L712 -625 Z',
      'M491.5 -591 L753 -591 L753 -827',p(753,-789),p(0,-1),82),
    rect('yeo-lower','ㅕ',712,-557,794,79,'D'),
    pen('yeo-bar','ㅕ','M506 -339 L712 -339 L712 -271 L486 -271 Z','M496 -305 L712 -305',p(674,-305),p(1,0),68)]},
  '공':{rings:[rings[1]],strokes:successLetters[1]},
  '콩':{rings:[ring('콩',0,1,458,-82)],strokes:[
    pen('kong-kieuk','ㅋ','M147 -791 L767 -791 L767 -722 C767 -646 767 -557 744 -438 L661 -444 C671 -492 676 -536 679 -575 L683 -637 L684 -722 L684 -724 L147 -724 Z',
      'M702.5 -441 C725 -552 725 -645 725 -757.5 L147 -757.5',p(185,-757.5),p(-1,0),78),
    pen('kong-bar','ㅋ','M125 -620 L683 -637 L679 -575 L137 -549 Z','M131 -584.5 L681 -606',p(643,-604.5),p(550,-21.5),65),
    rect('kong-o-horizontal','ㅗ',51,-379,866,-312,'L'),rect('kong-o-vertical','ㅗ',382,-505,465,-379,'U')]},
  '양':{rings:[ring('양',0,1,302,-560),ring('양',2,3,464,-93)],strokes:[
    rect('yang-ya-vertical','ㅑ',669,-827,752,-291,'U'),rect('yang-ya-top','ㅑ',752,-692,883,-623,'R'),rect('yang-ya-bottom','ㅑ',752,-499,883,-430,'R')]},
  '용':{rings:[[
    'M458 -810 C262 -810 140 -748 140 -642 C140 -581 180 -535 251 -507 L334 -485 C371 -478 412 -475 458 -475 C504 -475 546 -478 583 -485 L665 -507 C736 -535 776 -581 776 -642 C776 -748 654 -810 458 -810 Z',
    contour('용',2),p(458,-642)],ring('용',0,1,458,-85)],strokes:[
    pen('yong-yo-left','ㅛ','M251 -507 L334 -485 L334 -313 L50 -313 L50 -380 L251 -380 Z','M292.5 -496 L292.5 -346.5 L50 -346.5',p(88,-346.5),p(-1,0),75),
    pen('yong-yo-right','ㅛ','M583 -485 L665 -507 L665 -380 L867 -380 L867 -313 L583 -313 Z','M624 -496 L624 -346.5 L867 -346.5',p(829,-346.5),p(1,0),75),
    rect('yong-yo-middle','ㅛ',334,-380,583,-313,'L')]},
};

export const cuteEasyWords=['아이','오이','우유','아기','오리','여우','공','콩','양','용'] as const;
export type EasyWord=typeof cuteEasyWords[number];
export function createCuteEasyPuzzle(index:number){
  const word=cuteEasyWords[index];if(!word)throw new Error('Unknown easy puzzle');
  const cells:GlyphCell[]=[...word].map((letter,i)=>{
    const glyph=glyphs[letter];
    let strokes=glyph.strokes;
    if(word==='여우'&&letter==='우')strokes=[rect('u-horizontal','ㅜ',49,-309,869,-240,'R'),rect('u-vertical','ㅜ',416,-240,498,78,'D')];
    return {letter,origin:p(22+i*294,290),rings:glyph.rings,strokes:strokes.map(s=>({...s,key:`easy-${index}-${i}-${s.key}`}))};
  });
  return assembleGlyphPuzzle(cells,word,word.length*294+40,400);
}
export const cuteEasyPuzzles=cuteEasyWords.map((_,i)=>createCuteEasyPuzzle(i));
