// Pixel-free browser comparison: unchanged font outline vs the game-body union.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as opentype from '../../apps/web/node_modules/opentype.js/dist/opentype.mjs';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
const folder=path.dirname(fileURLToPath(import.meta.url));
const bytes=fs.readFileSync(path.join(folder,'../../apps/web/scripts/font-source/NotoSansKR-Regular.otf'));
const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const letters=[...'우리가저마다힘에겨운'];
const reference=letters.map(letter=>({letter,d:font.charToGlyph(letter).getPath(0,0,1000).toPathData(8)}));
const origins=[[22,285],[316,285],[610,285],[944,285],[1238,285],[1532,285],[180,615],[474,615],[768,615],[1062,615]];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');
  const results=await page.evaluate(async({reference,origins})=>{
    const source='/src/game/phrase-puzzle.ts',vectors='/src/game/vector-shape.ts';
    const puzzle=(await import(source)).createPhrasePuzzle(),{pathData}=await import(vectors);
    const make=d=>{const e=document.createElementNS('http://www.w3.org/2000/svg','path');e.setAttribute('d',d);e.setAttribute('fill-rule','evenodd');return e;};
    const parts=[...puzzle.arrows.map(a=>make(pathData(a.shape.commands))),...puzzle.targets.map(t=>make(pathData(t.shape.commands)))];
    return reference.map(({letter,d},i)=>{
      const original=make(d);let checked=0,mismatch=0;
      for(let y=-840;y<90;y+=7)for(let x=30;x<900;x+=7){
        const actual=parts.some(part=>part.isPointInFill(new DOMPoint(origins[i][0]+x*.29,origins[i][1]+y*.29)));
        checked++;if(actual!==original.isPointInFill(new DOMPoint(x,y)))mismatch++;
      }
      return {letter,checked,mismatch};
    });
  },{reference,origins});
  console.log(JSON.stringify(results));if(results.some(r=>r.mismatch))process.exitCode=1;
}finally{await browser.close();}
