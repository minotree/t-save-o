import { glyphs } from './cute-easy';
import { phraseGlyphs } from './phrase-puzzle';
import { assembleGlyphPuzzle, successLetters, rings } from './success-puzzle';
import type { GlyphCell } from './success-puzzle';
import { reverseArrow } from './reverse-arrow';

const courseGlyphs:Record<string,Omit<GlyphCell,'letter'|'origin'>>={
  ...glyphs,...phraseGlyphs,
  '성':{strokes:successLetters[0],ring:rings[0]},
  '공':{strokes:successLetters[1],ring:rings[1]},
  '적':{strokes:successLetters[2]}
};
export type CourseLayout={id:string;rows:readonly string[];offsets:readonly number[];lineHeight:number;flipped:readonly string[]};

export function composeCoursePuzzle(layout:CourseLayout){
  const cells:GlyphCell[]=[];
  const maxLetters=layout.rows.length>1?4:Math.max(...layout.rows.map(row=>[...row].length));
  layout.rows.forEach((row,r)=>{
    if(!row.length||[...row].length>4)throw new Error(`Invalid course row: ${row}`);
    [...row].forEach((letter,c)=>{
      const glyph=courseGlyphs[letter];if(!glyph)throw new Error(`Unreviewed glyph: ${letter}`);
      cells.push({...glyph,letter,origin:{x:layout.offsets[r]+c*294,y:285+r*layout.lineHeight},
        strokes:glyph.strokes.map(stroke=>({...stroke,key:`${layout.id}-${r}-${c}-${stroke.key}`}))});
    });
  });
  const puzzle=assembleGlyphPuzzle(cells,layout.rows.join(' / '),maxLetters*294+54,370+(layout.rows.length-1)*layout.lineHeight);
  const flipped=new Set(layout.flipped);
  return {...puzzle,arrows:puzzle.arrows.map(arrow=>flipped.has(arrow.id)?reverseArrow(arrow):arrow)};
}

// Authored word collections using the already-reviewed font glyph vocabulary.
// The first board in each course remains the existing representative problem.
export const normalRows=[
  ['아기여우'],['아기오리'],['콩우유'],['오리','여우'],['아기','우유'],
  ['아이','성공'],['여우','오이'],['우리가','성공'],['아기여우','콩우유']
];
export const hardRows=[
  ['아기여우','아기오리','콩우유'],
  ['아이','아기여우','아기오리','우유'],
  ['아기오리','아기여우','성공'],
  ['아기오리','오리','아기여우','여우'],
  ['아기여우','아기오리','오리'],
  ['아기여우','아기오리','아이','콩'],
  ['아기여우','아이','아기오리','우유'],
  ['콩우유','아기여우','오리','오이'],
  ['아기여우','아기오리','아이','공']
];
