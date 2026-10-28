// Compare the game-body union against the untouched font glyph, in Chrome.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as opentype from '../../apps/web/node_modules/opentype.js/dist/opentype.mjs';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
const folder=path.dirname(fileURLToPath(import.meta.url));
const bytes=fs.readFileSync(path.join(folder,'../../apps/web/scripts/font-source/NotoSansKR-Regular.otf'));
const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const reference=[...'성공적'].map(c=>font.charToGlyph(c).getPath(0,0,1000).toPathData(8));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');
  const results=await page.evaluate(async reference=>{
    const source='/src/game/success-puzzle.ts',vectors='/src/game/vector-shape.ts';
    const puzzle=(await import(source)).createSuccessPuzzle(),{pathData}=await import(vectors);
    const make=d=>{const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d',d);e.setAttribute('fill-rule','evenodd');return e;};
    const originals=reference.map(make),parts=puzzle.arrows.map(a=>make(pathData(a.shape.commands)));
    parts.push(...puzzle.targets.map(t=>make(pathData(t.shape.commands))));
    return originals.map((original,i)=>{
      let checked=0,mismatch=0;
      for(let y=-840;y<90;y+=7)for(let x=30;x<890;x+=7){
        const point=new DOMPoint(22+i*294+x*.29,285+y*.29);
        const expected=original.isPointInFill(new DOMPoint(x,y));
        const actual=parts.some(part=>part.isPointInFill(point));
        checked++;if(expected!==actual)mismatch++;
      }
      return {glyph:'성공적'[i],checked,mismatch};
    });
  },reference);
  console.log(JSON.stringify(results));
  if(results.some(r=>r.mismatch))process.exitCode=1;
}finally{await browser.close();}
