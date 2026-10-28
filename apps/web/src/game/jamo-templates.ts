import { isShapeConnected, pointTouchesShape } from './engine';
import type { Arrow, Point, Target } from './engine';
import { flattenPath, transformCommands } from './vector-shape';
import type { PathCommand } from './vector-shape';

export type StrokeTemplate = { key: string; name: string; path: readonly PathCommand[]; fill?: boolean; strokeWidth?: number; head: { anchor: Point; direction: Point } };
export type JamoTemplate = { strokes: readonly StrokeTemplate[]; rings: readonly { center: Point; radius: number }[] };

// Absolute SVG/font-outline commands. Unsupported commands fail explicitly;
// an upstream font exporter can supply the same typed M/L/Q/C/Z commands.
export function svgPath(source: string): PathCommand[] {
  const tokenPattern = /[a-zA-Z]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/g;
  if (source.replace(tokenPattern, '').replace(/[\s,]/g, '')) throw new Error('Invalid SVG path syntax');
  const tokens = source.match(tokenPattern) ?? [];
  const result: PathCommand[] = [];
  let i = 0;
  const number = () => {
    const value = Number(tokens[i++]);
    if (!Number.isFinite(value)) throw new Error('Invalid SVG path number');
    return value;
  };
  while (i < tokens.length) {
    const type = tokens[i++];
    if (type === 'M' || type === 'L') result.push({ type, x: number(), y: number() });
    else if (type === 'Q') result.push({ type, x1: number(), y1: number(), x: number(), y: number() });
    else if (type === 'C') result.push({ type, x1: number(), y1: number(), x2: number(), y2: number(), x: number(), y: number() });
    else if (type === 'Z') result.push({ type });
    else throw new Error(`Unsupported SVG path command: ${type}`);
  }
  return result;
}

function stroke(key: string, name: string, path: string, x: number, y: number, dx: number, dy: number): StrokeTemplate {
  const commands = svgPath(path);
  let anchor = { x, y }, best = Infinity;
  // Project a template's preferred head position onto its own path, keeping
  // curved-stroke heads attached after editing the shared control points.
  for (const contour of flattenPath(commands)) for (let i = 1; i < contour.length; i++) {
    const a = contour[i - 1], b = contour[i], vx = b.x - a.x, vy = b.y - a.y;
    const squared = vx * vx + vy * vy;
    const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / squared));
    const projected = { x: a.x + t * vx, y: a.y + t * vy };
    const distance = Math.hypot(projected.x - x, projected.y - y);
    if (distance < best) { best = distance; anchor = projected; }
  }
  return { key, name, path: commands, head: { anchor, direction: { x: dx, y: dy } } };
}
const jamo = (...strokes: StrokeTemplate[]): JamoTemplate => ({ strokes, rings: [] });
const vertical = (key: string, x: number) => stroke(key, '세로 획, 위 방향', `M${x} 92 L${x} 8`, x, 42, 0, -1);
const horizontal = (key: string, y: number, left = 10, right = 90) => stroke(key, '가로 획, 왼쪽 방향', `M${right} ${y} L${left} ${y}`, (left + right) / 2, y, -1, 0);

// Authored, editable stroke templates, not automatic extraction from a font.
// Curves and joins are kept in Path data; movement is a separate head vector.
const base: Record<string, JamoTemplate> = {
  'ㄱ': jamo(stroke('corner', '꺾인 획', 'M12 18 L78 18 Q84 18 84 24 L84 88', 84, 54, 0, -1)),
  'ㄴ': jamo(stroke('corner', '꺾인 획', 'M16 12 L16 80 Q16 86 22 86 L90 86', 52, 86, 1, 0)),
  'ㄷ': jamo(stroke('body', '연결 획', 'M88 16 L22 16 Q16 16 16 22 L16 80 Q16 86 22 86 L88 86', 52, 16, 1, 0)),
  'ㄹ': jamo(stroke('body', '연결 획', 'M12 14 L78 14 Q84 14 84 20 L84 44 Q84 50 78 50 L22 50 Q16 50 16 56 L16 80 Q16 86 22 86 L90 86', 52, 86, 1, 0)),
  'ㅁ': jamo(stroke('body', '고리 획', 'M22 16 L78 16 Q84 16 84 22 L84 78 Q84 84 78 84 L22 84 Q16 84 16 78 L16 22 Q16 16 22 16 Z', 50, 16, 0, -1)),
  'ㅂ': jamo(stroke('body', '연결 획', 'M18 12 L18 80 Q18 86 24 86 L76 86 Q82 86 82 80 L82 12', 82, 43, 0, -1), horizontal('bar', 48, 18, 82)),
  'ㅅ': jamo(
    stroke('first', '왼쪽 획, 오른쪽 위 방향', 'M8 88 C30 69 52 35 62 10', 38, 54, 40, -78),
    stroke('second', '오른쪽 획, 왼쪽 위 방향', 'M92 88 C79 72 69 49 61 30', 77, 61, -31, -58)),
  'ㅇ': { strokes: [], rings: [{ center: { x: 50, y: 50 }, radius: 45 }] },
  'ㅈ': jamo(stroke('body', '가로와 왼쪽 연결 획', 'M12 16 L83 16 C73 42 45 72 14 90', 49, 63, -69, 74), stroke('branch', '오른쪽 획', 'M88 90 C78 82 67 68 61 54', 75, 77, -27, -36)),
  'ㅊ': jamo(horizontal('top', 3, 40, 60), stroke('body', '가로와 왼쪽 연결 획', 'M12 28 L83 28 C73 50 45 76 14 94', 49, 70, -69, 66), stroke('branch', '오른쪽 획', 'M88 94 C78 86 67 74 61 63', 75, 81, -27, -31)),
  'ㅋ': jamo(stroke('body', '꺾인 획', 'M12 16 L78 16 Q84 16 84 22 L84 90', 84, 61, 0, -1), horizontal('bar', 49, 16, 84)),
  'ㅌ': jamo(stroke('body', '연결 획', 'M88 16 L22 16 Q16 16 16 22 L16 80 Q16 86 22 86 L88 86', 52, 16, 1, 0), horizontal('bar', 50, 16, 83)),
  'ㅍ': jamo(horizontal('top', 15), vertical('left', 28), vertical('right', 72), horizontal('bottom', 85)),
  'ㅎ': { strokes: [horizontal('top', 8, 40, 60), horizontal('bar', 29, 14, 86)], rings: [{ center: { x: 50, y: 67 }, radius: 27 }] },
  'ㅏ': jamo(vertical('vertical', 30), horizontal('horizontal', 50, 30, 85)),
  'ㅑ': jamo(vertical('vertical', 30), horizontal('bar1', 34, 30, 85), horizontal('bar2', 65, 30, 85)),
  'ㅓ': jamo(stroke('vertical', '세로 획, 위 방향', 'M90 100 L90 0', 90, 40, 0, -1), stroke('horizontal', '가로 획, 왼쪽 방향', 'M74 50 L5 50', 43, 50, -1, 0)),
  'ㅕ': jamo(vertical('vertical', 76), horizontal('bar1', 34, 15, 76), horizontal('bar2', 65, 15, 76)),
  'ㅗ': jamo(stroke('stem', '세로 획', 'M50 68 L50 12', 50, 37, 0, -1), horizontal('bar', 68)),
  'ㅛ': jamo(stroke('stem1', '세로 획', 'M33 68 L33 12', 33, 37, 0, -1), stroke('stem2', '세로 획', 'M67 68 L67 12', 67, 37, 0, -1), horizontal('bar', 68)),
  'ㅜ': jamo(horizontal('bar', 32), stroke('stem', '세로 획', 'M50 32 L50 90', 50, 62, 0, 1)),
  'ㅠ': jamo(horizontal('bar', 32), stroke('stem1', '세로 획', 'M33 32 L33 90', 33, 62, 0, 1), stroke('stem2', '세로 획', 'M67 32 L67 90', 67, 62, 0, 1)),
  'ㅡ': jamo(horizontal('bar', 50)),
  'ㅣ': jamo(vertical('vertical', 50))
};

function combine(parts: { template: JamoTemplate; x: number; y: number; sx: number; sy: number }[]): JamoTemplate {
  const strokes: StrokeTemplate[] = [], rings: { center: Point; radius: number }[] = [];
  parts.forEach((part, i) => {
    const origin = { x: part.x, y: part.y }, scale = { x: part.sx, y: part.sy };
    for (const s of part.template.strokes) strokes.push({ ...s, key: `${i}-${s.key}`, path: transformCommands(s.path, origin, scale), head: {
      anchor: { x: origin.x + s.head.anchor.x * scale.x, y: origin.y + s.head.anchor.y * scale.y },
      direction: { x: s.head.direction.x * scale.x, y: s.head.direction.y * scale.y }
    } });
    for (const r of part.template.rings) rings.push({ center: { x: origin.x + r.center.x * scale.x, y: origin.y + r.center.y * scale.y }, radius: r.radius * Math.min(scale.x, scale.y) });
  });
  return { strokes, rings };
}
const sideBySide = (a: JamoTemplate, b: JamoTemplate) => combine([
  { template: a, x: 0, y: 0, sx: .47, sy: 1 }, { template: b, x: 53, y: 0, sx: .47, sy: 1 }
]);
for (const [doubled, single] of Object.entries({ 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' })) base[doubled] = sideBySide(base[single], base[single]);
for (const [compound, parts] of Object.entries({ 'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'] })) base[compound] = sideBySide(base[parts[0]], base[parts[1]]);
for (const [compound, single] of Object.entries({ 'ㅐ': 'ㅏ', 'ㅒ': 'ㅑ', 'ㅔ': 'ㅓ', 'ㅖ': 'ㅕ' })) {
  base[compound] = combine([{ template: base[single], x: 0, y: 0, sx: .72, sy: 1 }, { template: base['ㅣ'], x: 49, y: 0, sx: .8, sy: 1 }]);
}
// A physically connected horizontal vowel may remain one piece in compounds.
const joinedO = jamo(stroke('joined', '연결 모음 획', 'M50 12 L50 68 M10 68 L90 68', 50, 38, 0, -1));
const joinedU = jamo(stroke('joined', '연결 모음 획', 'M10 32 L90 32 M50 32 L50 90', 50, 61, 0, 1));
for (const [compound, horizontalVowel, verticalVowel] of [
  ['ㅘ', joinedO, 'ㅏ'], ['ㅙ', joinedO, 'ㅐ'], ['ㅚ', joinedO, 'ㅣ'],
  ['ㅝ', joinedU, 'ㅓ'], ['ㅞ', joinedU, 'ㅔ'], ['ㅟ', joinedU, 'ㅣ'], ['ㅢ', base['ㅡ'], 'ㅣ']
] as const) base[compound] = combine([
  { template: horizontalVowel, x: 0, y: horizontalVowel === joinedU ? 29.2 : 32, sx: .66, sy: .65 },
  { template: base[verticalVowel], x: 59, y: 0, sx: .4, sy: 1 }
]);

export const jamoTemplates: Readonly<Record<string, JamoTemplate>> = base;
export const modernConsonants = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
export const modernVowels = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];

export type TemplatePlacement = {
  origin: Point; size: Point; prefix: string; thickness?: number; maxPieces?: 2 | 3 | 4; targetIds?: string[];
};

export function instantiateJamo(character: string, options: TemplatePlacement): { arrows: Arrow[]; targets: Target[] } {
  const template = jamoTemplates[character];
  if (!template) throw new Error(`No jamo template: ${character}`);
  return instantiateTemplate(template, { ...options, label: character });
}

// Reviewed font contours can enter here without changing the renderer/engine.
export function instantiateTemplate(template: JamoTemplate, options: TemplatePlacement & { label: string }): { arrows: Arrow[]; targets: Target[] } {
  if (template.strokes.length > (options.maxPieces ?? 4)) throw new Error(`Split limit exceeded: ${options.label}`);
  const scale = { x: options.size.x / 100, y: options.size.y / 100 };
  if (!(scale.x > 0 && scale.y > 0)) throw new Error('Invalid jamo size');
  const thickness = options.thickness ?? 6.2;
  if (!(thickness > 0)) throw new Error('Invalid jamo thickness');
  return {
    arrows: template.strokes.map(s => {
      const commands = transformCommands(s.path, options.origin, scale);
      const direction = { x: s.head.direction.x * scale.x, y: s.head.direction.y * scale.y };
      if (!Number.isFinite(Math.hypot(direction.x, direction.y)) || !Math.hypot(direction.x, direction.y)) throw new Error('Invalid head direction');
      const shape = { commands, strokeWidth: s.strokeWidth ?? thickness, fill: s.fill };
      if (!isShapeConnected(shape)) throw new Error(`Disconnected moving piece: ${options.label}/${s.key}`);
      const anchor = { x: options.origin.x + s.head.anchor.x * scale.x, y: options.origin.y + s.head.anchor.y * scale.y };
      if (!pointTouchesShape(anchor, shape)) throw new Error(`Head must lie on its own stroke: ${options.label}/${s.key}`);
      return { id: `${options.prefix}-${s.key}`, label: `${options.label} ${s.name}`, points: flattenPath(commands).flat(),
        shape, direction,
        head: { anchor, direction } };
    }),
    targets: template.rings.map((ring, i) => ({ id: options.targetIds?.[i] ?? `${options.prefix}-target-${i}`,
      center: { x: options.origin.x + ring.center.x * scale.x, y: options.origin.y + ring.center.y * scale.y },
      radius: ring.radius * Math.min(scale.x, scale.y) + thickness / 2, ringWidth: thickness }))
  };
}
