import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bytes=fs.readFileSync(path.join(root,'scripts/font-source/NotoSansKR-Regular.otf'));
if(crypto.createHash('sha256').update(bytes).digest('hex')!=='69975a0ac8472717870aefeab0a4d52739308d90856b9955313b2ad5e0148d68')throw new Error('Font source changed');
const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const references={};
for(const letter of '아이오우유기리여공콩양용'){
  const contours=[];let current=[];
  for(const command of font.charToGlyph(letter).getPath(0,0,1000).commands){
    if(command.type==='M'&&current.length){current.push({type:'Z'});contours.push(current);current=[];}
    if(command.type!=='Z')current.push(command);
  }
  if(current.length){current.push({type:'Z'});contours.push(current);}
  references[letter]=contours;
}
fs.writeFileSync(path.join(root,'src/game/easy-font-reference.generated.ts'),
  '// Generated from unmodified Noto Sans KR Regular 2.004 (SIL OFL 1.1).\n// Source and license: scripts/font-source. Regenerate: node scripts/generate-easy-reference.mjs\nexport const easyFontReference = '+JSON.stringify(references,null,2)+' as const;\n');
console.log(`Extracted ${Object.keys(references).length} complete glyph references; no automatic pen splitting.`);
