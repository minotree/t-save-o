import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bytes = fs.readFileSync(path.join(root, 'scripts/font-source/NotoSansKR-Regular.otf'));
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
if (hash !== '69975a0ac8472717870aefeab0a4d52739308d90856b9955313b2ad5e0148d68') throw new Error('Font source changed; review pen strokes');
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const glyph = font.charToGlyph('성'), original = glyph.getPath(0, 0, 1000), bounds = original.getBoundingBox();
if (glyph.index !== 15741) throw new Error('Unexpected reference glyph');
const scale = 190 / (bounds.y2 - bounds.y1);
const offset = { x: 180 - (bounds.x1 + bounds.x2) / 2 * scale, y: 75 - bounds.y1 * scale };
const round = n => Number(n.toFixed(8));
const p = (x, y) => ({ x, y });
const board = a => ({ x: round(offset.x + a.x * scale), y: round(offset.y + a.y * scale) });
const M = (x, y) => ({ type: 'M', x, y }), L = (x, y) => ({ type: 'L', x, y });
const C = (x1, y1, x2, y2, x, y) => ({ type: 'C', x1, y1, x2, y2, x, y });
const Z = { type: 'Z' };
function transform(commands) {
  return commands.map(c => c.type === 'Z' ? c : c.type === 'C' ? {
    ...c, ...board(c), x1: board(p(c.x1, c.y1)).x, y1: board(p(c.x1, c.y1)).y,
    x2: board(p(c.x2, c.y2)).x, y2: board(p(c.x2, c.y2)).y
  } : { ...c, ...board(c) });
}
const middle = (a, b) => p((a.x + b.x) / 2, (a.y + b.y) / 2);
const interpolate = (a, b, t) => p(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
function split(curve, t) {
  const [a,b,c,d]=curve, ab=interpolate(a,b,t), bc=interpolate(b,c,t), cd=interpolate(c,d,t);
  const abc=interpolate(ab,bc,t), bcd=interpolate(bc,cd,t), center=interpolate(abc,bcd,t);
  return [[a,ab,abc,center],[center,bcd,cd,d]];
}
const curveCommand = ([,b,c,d]) => C(b.x,b.y,c.x,c.y,d.x,d.y);
function closeContours(commands) {
  const output = [];
  for (const c of commands) {
    if (c.type === 'M' && output.length && output[output.length - 1].type !== 'Z') output.push(Z);
    output.push(c);
  }
  if (output.length && output[output.length - 1].type !== 'Z') output.push(Z);
  return output;
}

// Reviewed WRITING-STROKE topology, not polygon masks or direction-based cuts.
// Left: a complete top stem and left-descending stroke. Its inner stem edge
// is reconstructed as a continuous curve instead of giving part to the right.
const leftBody = [M(278,-776),L(278,-683),C(278,-544,188,-423,49,-374),L(93,-307),
  C(202,-348,283,-431,321,-538),C(345,-600,360,-642,360,-686),L(360,-776),Z];
const leftStart = p(319,-776), leftEnd = p(71,-340.5);
const leftSpine = [M(leftStart.x,leftStart.y),L(319,-683),C(319,-548,231,-411,leftEnd.x,leftEnd.y)];

// Right: an independent curved downstroke with its OWN natural start cap.
// Font edge segments are retained along its sides and bottom. Start/end are
// authored from the pen stroke, not from a half-plane through the whole glyph.
const outerRight = [p(360,-686),p(360,-558),p(449,-444),p(581,-399)];
const innerRightReverse = [p(536,-334),p(436,-371),p(360,-444),p(321,-538)];
const outer = split(outerRight,.40)[1];
const inner = split(innerRightReverse,.88)[0];
const rightStart = middle(inner[3],outer[0]), rightEnd = p(558.5,-366.5);
const rightBody = [M(outer[0].x,outer[0].y),curveCommand(outer),L(536,-334),curveCommand(inner),L(outer[0].x,outer[0].y),Z];
const rightSpine = [M(rightStart.x,rightStart.y),C(391,-478,467,-407,rightEnd.x,rightEnd.y)];

const jointGap = 1.2, barEnd = 711 - jointGap / scale;
const definitions = [
  { key:'siot-first',jamo:'ㅅ',role:'initial',order:1,name:'왼쪽 내려쓰기 획, 위 방향',
    body:leftBody,spine:leftSpine,start:leftStart,end:leftEnd,startWidth:82,endWidth:Math.hypot(44,67),direction:p(0,-1) },
  { key:'siot-second',jamo:'ㅅ',role:'initial',order:2,name:'오른쪽 내려쓰기 획, 왼쪽 위 방향',
    body:rightBody,spine:rightSpine,start:rightStart,end:rightEnd,startWidth:Math.hypot(outer[0].x-inner[3].x,outer[0].y-inner[3].y),endWidth:Math.hypot(45,65),direction:p(-34.1,-49.88) },
  { key:'eo-vertical',jamo:'ㅓ',role:'medial',order:1,name:'세로 내려쓰기 획, 위 방향',
    body:[M(711,-827),L(794,-827),L(794,-292),L(711,-292),Z],spine:[M(752.5,-827),L(752.5,-292)],start:p(752.5,-827),end:p(752.5,-292),startWidth:83,endWidth:83,direction:p(0,-.96) },
  { key:'eo-horizontal',jamo:'ㅓ',role:'medial',order:2,name:'가로 긋기 획, 왼쪽 방향',
    body:[M(514,-636),L(barEnd,-636),L(barEnd,-567),L(514,-567),Z],spine:[M(514,-601.5),L(barEnd,-601.5)],start:p(514,-601.5),end:p(barEnd,-601.5),startWidth:69,endWidth:69,direction:p(-.48,0) }
];
const strokes = definitions.map(s => ({ key:s.key,jamoInstance:`seong:${s.role}`,jamo:s.jamo,role:s.role,order:s.order,name:s.name,
  body:{commands:transform(s.body),fill:true,strokeWidth:0},
  pen:{path:transform(s.spine),start:{center:board(s.start),width:round(s.startWidth*scale)},end:{center:board(s.end),width:round(s.endWidth*scale)}},
  head:{at:'start',direction:s.direction,length:s.key==='siot-second'?12:10,width:round(s.startWidth*scale*1.05),overlap:.8}
}));
const source = {family:'Noto Sans KR',style:'Regular',version:'2.004',codepoint:'U+C131',glyphId:glyph.index,sha256:hash,
  copyright:font.names.windows.copyright.en,license:'SIL Open Font License 1.1',fontUrl:'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf'};
const asset = {source,method:'reviewed-pen-stroke-reconstruction',transform:{scale,offset},
  notes:['Writing-stroke topology and both caps are authored explicitly from the font reference.',
    'No whole-glyph half-plane cuts or inferred movement directions.',
    'The left stroke inner stem and the right start cap are reconstructed; this is not a lossless glyph partition.'],
  originalPath:transform(closeContours(original.commands)),strokes,
  target:{id:'ieung',center:board(p(496,-94.5)),radius:33.7,ringWidth:6.2},jointGap};
fs.writeFileSync(path.join(root,'src/game/seong-pen.generated.ts'), '// Generated by scripts/generate-seong-pen.mjs; review pen definitions in that source.\nexport const seongPenAsset = '+JSON.stringify(asset,null,2)+' as const;\n');
const d = commands => commands.map(c=>c.type==='Z'?'Z':c.type==='C'?`C${c.x1},${c.y1} ${c.x2},${c.y2} ${c.x},${c.y}`:`${c.type}${c.x},${c.y}`).join(' ');
const heads = strokes.map(s=>{
  const cap=s.pen[s.head.at],v=s.head.direction,m=Math.hypot(v.x,v.y);
  const base=p(cap.center.x-v.x/m*s.head.overlap,cap.center.y-v.y/m*s.head.overlap);
  return `<path d="M0 ${-s.head.width/2} L${s.head.length} 0 L0 ${s.head.width/2} Z" fill="#258C78" transform="translate(${base.x} ${base.y}) rotate(${Math.atan2(v.y,v.x)*180/Math.PI})"/>`;
});
const t=asset.target;
const face=`<circle cx="${t.center.x}" cy="${t.center.y}" r="${t.radius-3.1}" fill="#FFFCF2" stroke="#FFB84D" stroke-width="6.2"/><circle cx="${t.center.x-10.11}" cy="${t.center.y-2.5275}" r="2.5275" fill="#684832"/><circle cx="${t.center.x+10.11}" cy="${t.center.y-2.5275}" r="2.5275" fill="#684832"/><path d="M${t.center.x-8} ${t.center.y+10} Q${t.center.x} ${t.center.y+18} ${t.center.x+8} ${t.center.y+10}" fill="none" stroke="#684832" stroke-width="2.5" stroke-linecap="round"/>`;
const bodies=strokes.map(s=>`<path d="${d(s.body.commands)}" fill="#258C78" fill-rule="evenodd"/>`);
const panel=(x,title,note,body)=>`<g transform="translate(${x} 0)"><rect x="8" y="8" width="344" height="360" rx="24" fill="#FFFCF2" stroke="#F7DEAA"/><text x="180" y="40" text-anchor="middle" font-size="20" font-weight="700" fill="#684832">${title}</text><text x="180" y="65" text-anchor="middle" font-size="12" fill="#80644e">${note}</text>${body}</g>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="390" viewBox="0 0 720 390" style="font-family:system-ui,sans-serif"><rect width="720" height="390" fill="#FFF5D9"/>${panel(0,'기준 폰트의 성','Noto Sans KR Regular',`<path d="${d(asset.originalPath)}" fill="#684832" fill-rule="evenodd"/>`)}${panel(360,'필획 단위 게임의 성','완결된 두 필획 · 끝단의 단색 화살촉',bodies.join('')+face+heads.join(''))}<text x="360" y="386" text-anchor="middle" font-size="12" fill="#80644e">기준 폰트의 비율을 유지한 필획 재구성 · 임의 영역 절단 없음</text></svg>`;
const review=path.join(root,'public/review');fs.mkdirSync(review,{recursive:true});
fs.writeFileSync(path.join(review,'seong-font-comparison.svg'),svg);
const isolated=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="360" viewBox="0 0 1440 360" style="font-family:system-ui,sans-serif"><rect width="1440" height="360" fill="#FFF5D9"/>${strokes.map((s,i)=>`<g transform="translate(${360*i} 0)"><text x="180" y="35" text-anchor="middle" font-size="16" fill="#684832">${i+1}. ${s.jamo} ${s.name}</text>${bodies[i]}${heads[i]}</g>`).join('')}</svg>`;
fs.writeFileSync(path.join(review,'seong-stroke-parts.svg'),isolated);
fs.writeFileSync(path.join(review,'seong-font-comparison.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>성 · 필획과 끝단 화살촉 검토</title><style>body{margin:0;padding:24px 12px;background:#FFF5D9;color:#684832;font:15px/1.7 system-ui,sans-serif;text-align:center}main{max-width:960px;margin:auto}img{width:100%;height:auto}a{color:#216F60}h1{font-size:24px}p{max-width:760px;margin:12px auto}</style></head><body><main><h1>실제 폰트와 게임의 ‘성’ 비교</h1><img src="seong-font-comparison.svg" alt="왼쪽 기준 폰트의 성, 오른쪽 독립 필획과 끝단 화살촉으로 구성한 게임의 성"><p>ㅅ은 위에서 왼쪽으로 내려쓰는 한 획과 오른쪽으로 내려쓰는 한 획으로 재구성했습니다. 완성형 윤곽을 이동 방향의 영역으로 잘라 나누지 않습니다. 왼쪽 획의 안쪽 줄기와 오른쪽 획의 시작 단면은 필획 구조에 맞게 재구성했으므로 원본 폰트와 완전히 같지는 않습니다.</p><p>화살촉은 각 필획의 끝단에만 배치하며 내부 흰색 삼각형을 사용하지 않습니다. ㅇ은 기존 원형 캐릭터를 유지하므로 기준 폰트의 타원형 ㅇ과 다릅니다.</p><h2>각 필획을 따로 보기</h2><img src="seong-stroke-parts.svg" alt="1번 왼쪽 내려쓰기 획, 2번 오른쪽 내려쓰기 획, 3번 세로 획, 4번 가로 획 각각의 온전한 모습"><p>각 조각의 본체와 시작·끝 단면, 화살촉 위치·방향은 별도 데이터입니다. 곡선 형태를 따라 휘어 이동하지 않고 화살촉 방향으로 도형 전체가 평행 이동합니다.</p><p><a href="/">게임 열기</a> · <a href="NotoSansKR-OFL.txt">기준 폰트 출처·라이선스</a></p></main></body></html>`);
const notice=`${source.family} ${source.style} ${source.version}\n${source.copyright}\nSource: ${source.fontUrl}\nSHA256: ${hash}\n\n${fs.readFileSync(path.join(root,'scripts/font-source/OFL.txt'),'utf8')}`;
fs.writeFileSync(path.join(review,'NotoSansKR-OFL.txt'),notice);
console.log(JSON.stringify({method:asset.method,font:source.family,strokes:strokes.map(s=>({key:s.key,start:s.pen.start.center,end:s.pen.end.center,headAt:s.head.at,direction:s.head.direction}))},null,2));
