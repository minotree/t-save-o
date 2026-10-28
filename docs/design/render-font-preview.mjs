// Review artifact only. Does not change game data or runtime rendering.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as opentype from '../../apps/web/node_modules/opentype.js/dist/opentype.mjs';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';

const folder = path.dirname(fileURLToPath(import.meta.url));
const fontBytes = fs.readFileSync(path.join(folder, '../../apps/web/scripts/font-source/NotoSansKR-Regular.otf'));
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
const outline = font.charToGlyph('성').getPath(0, 0, 1000).toPathData(4);
const marks = [
  { x: 319, y: -736, dx: 0, dy: -1 },
  { x: 395, y: -478, dx: -34.1, dy: -49.88 },
  { x: 752.5, y: -784, dx: 0, dy: -1 },
  { x: 550, y: -601.5, dx: -1, dy: 0 },
].map(({x,y,dx,dy}) => {
  const n = Math.hypot(dx,dy), ux = dx/n, uy = dy/n;
  return [[x+ux*12,y+uy*12],[x-ux*10-uy*11,y-uy*10+ux*11],[x-ux*10+uy*11,y-uy*10-ux*11]];
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="850" viewBox="0 0 900 850">
<title>Noto Sans KR Regular 성 — original outline with interior direction marks</title>
<desc>Unmodified complete font glyph. Yellow interior markers only; no stroke splitting or gameplay changes. SIL OFL 1.1; font license is in apps/web/scripts/font-source/OFL.txt.</desc>
<rect width="900" height="850" fill="#FFF5D9"/>
<defs><clipPath id="final"><rect x="0" y="-280" width="1000" height="400"/></clipPath></defs>
<g transform="translate(162 670) scale(.68)">
<path id="glyph" d="${outline}" fill="#258C78"/>
<path d="${outline}" fill="#FFB84D" clip-path="url(#final)"/>
${marks.map(p=>`<polygon points="${p.map(v=>v.join(',')).join(' ')}" fill="#FFFF00"/>`).join('\n')}
<g fill="#6E4930"><circle cx="456" cy="-111" r="8"/><circle cx="536" cy="-111" r="8"/></g>
<path d="M471 -77 Q496 -52 521 -77" fill="none" stroke="#6E4930" stroke-width="8" stroke-linecap="round"/>
<g fill="#FFADB8"><ellipse cx="428" cy="-80" rx="13" ry="8"/><ellipse cx="564" cy="-80" rx="13" ry="8"/></g>
</g></svg>`;
const svgPath = path.join(folder, 'seong-original-glyph-preview.svg');
fs.writeFileSync(svgPath, svg);
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:900,height:850},deviceScaleFactor:2});
  await page.setContent(`<style>html,body{margin:0;background:#FFF5D9}svg{display:block}</style>${svg}`);
  const inside = await page.evaluate(points => {
    const glyph = document.querySelector('#glyph');
    return points.map(triangle=>triangle.every(([x,y])=>glyph.isPointInFill(new DOMPoint(x,y))));
  }, marks);
  if (inside.some(v=>!v)) throw new Error(`Direction marker outside glyph: ${inside}`);
  await page.screenshot({path:path.join(folder,'seong-original-glyph-preview.png')});
  console.log(JSON.stringify({svg:svgPath,markersInsideOriginalGlyph:inside}));
} finally { await browser.close(); }

