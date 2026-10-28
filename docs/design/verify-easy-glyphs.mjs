import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as opentype from '../../apps/web/node_modules/opentype.js/dist/opentype.mjs';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
const folder=path.dirname(fileURLToPath(import.meta.url));
const bytes=fs.readFileSync(path.join(folder,'../../apps/web/scripts/font-source/NotoSansKR-Regular.otf'));
const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const references=Object.fromEntries([...'아이오우유기리여공콩양용'].map(letter=>[letter,font.charToGlyph(letter).getPath(0,0,1000).toPathData(8)]));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');
  const results=await page.evaluate(async references=>{
    const source='/src/game/cute-easy.ts',vector='/src/game/vector-shape.ts';
    const puzzles=(await import(source)).cuteEasyPuzzles,{pathData}=await import(vector);
    const make=d=>{const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d',d);e.setAttribute('fill-rule','evenodd');return e;};
    return puzzles.flatMap(puzzle=>{
      const pieces=[...puzzle.arrows.map(a=>make(pathData(a.shape.commands))),...puzzle.targets.map(t=>make(pathData(t.shape.commands)))];
      return [...puzzle.letter].map((letter,i)=>{
        const original=make(references[letter]);let checked=0,mismatch=0;
        for(let y=-840;y<90;y+=7)for(let x=30;x<900;x+=7){
          const actual=pieces.some(e=>e.isPointInFill(new DOMPoint(22+i*294+x*.29,290+y*.29)));
          checked++;if(actual!==original.isPointInFill(new DOMPoint(x,y)))mismatch++;
        }
        return {word:puzzle.letter,letter,checked,mismatch};
      });
    });
  },references);
  console.log(JSON.stringify(results));if(results.some(r=>r.mismatch))process.exitCode=1;
}finally{await browser.close();}
