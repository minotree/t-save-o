import { compileShape } from './vector-shape';
import type { Primitive, VectorShape } from './vector-shape';
import type { PenStrokeDefinition } from './pen-stroke';

// Pure logical geometry: SVG paths and thickness share one source with display.
export type Point = { x: number; y: number };
export type Arrow = {
  id: string;
  label: string;
  points: readonly Point[];
  direction: Point;
  shape?: VectorShape;
  head?: { anchor: Point; direction: Point; length?: number; width?: number; endpoint?: 'start' | 'end'; capCenter?: Point };
  penStroke?: PenStrokeDefinition;
  // Interior direction marker and a tail-to-head writing spine for rope pulling.
  rope?: { path: readonly import('./vector-shape').PathCommand[]; width: number };
  color?: string;
};
// radius is the OUTER collision radius, including the visible ring thickness.
export type Target = { id: string; center: Point; radius: number; ringWidth?: number; shape?: VectorShape; obstacle?: VectorShape; requiredArrowIds?: readonly string[] };
export type Puzzle = {
  width: number; height: number; letter: string;
  arrows: readonly Arrow[]; targets: readonly Target[];
  waitingY?: number;
};
const EPS = 1e-8;
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const turn = (a: Point, b: Point, c: Point) => cross(sub(b, a), sub(c, a));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function onSegment(p: Point, a: Point, b: Point): boolean {
  return Math.abs(turn(a, b, p)) <= EPS &&
    p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS &&
    p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
}

function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = turn(a, b, c), abD = turn(a, b, d);
  const cdA = turn(c, d, a), cdB = turn(c, d, b);
  return ((abC > EPS && abD < -EPS || abC < -EPS && abD > EPS) &&
    (cdA > EPS && cdB < -EPS || cdA < -EPS && cdB > EPS)) ||
    onSegment(c, a, b) || onSegment(d, a, b) || onSegment(a, c, d) || onSegment(b, c, d);
}

function hull(points: Point[]): Point[] {
  const sorted = points.sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((p, i, all) => i === 0 || distance(p, all[i - 1]) > EPS);
  if (sorted.length < 3) return sorted;
  const half = (items: Point[]) => {
    const result: Point[] = [];
    for (const p of items) {
      while (result.length > 1 && turn(result[result.length - 2], result[result.length - 1], p) <= EPS) result.pop();
      result.push(p);
    }
    return result.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

function contains(p: Point, polygon: Point[]): boolean {
  if (polygon.length === 1) return distance(p, polygon[0]) <= EPS;
  if (polygon.length === 2) return onSegment(p, polygon[0], polygon[1]);
  return polygon.every((a, i) => turn(a, polygon[(i + 1) % polygon.length], p) >= -EPS);
}

function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const v = sub(b, a), w = sub(p, a);
  const lengthSquared = v.x * v.x + v.y * v.y;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (v.x * w.x + v.y * w.y) / lengthSquared));
  return distance(p, { x: a.x + t * v.x, y: a.y + t * v.y });
}

export function exitTranslation(arrow: Arrow, board: Pick<Puzzle, 'width' | 'height'>): Point {
  const length = Math.hypot(arrow.direction.x, arrow.direction.y);
  if (!Number.isFinite(length) || length === 0) throw new Error('이동 방향은 0이 아닌 유한 벡터여야 합니다.');
  const unit = { x: arrow.direction.x / length, y: arrow.direction.y / length };
  const primitives = arrowPrimitives(arrow);
  const minX = Math.min(...primitives.flatMap(p => p.polygon.map(v => v.x - p.radius)));
  const maxX = Math.max(...primitives.flatMap(p => p.polygon.map(v => v.x + p.radius)));
  const minY = Math.min(...primitives.flatMap(p => p.polygon.map(v => v.y - p.radius)));
  const maxY = Math.max(...primitives.flatMap(p => p.polygon.map(v => v.y + p.radius)));
  // First time all points clear any one side of the board, plus animation margin.
  const times: number[] = [];
  if (unit.x > 0) times.push((board.width - minX) / unit.x);
  if (unit.x < 0) times.push(-maxX / unit.x);
  if (unit.y > 0) times.push((board.height - minY) / unit.y);
  if (unit.y < 0) times.push(-maxY / unit.y);
  const travel = Math.max(0, Math.min(...times)) + 32;
  return { x: unit.x * travel, y: unit.y * travel };
}

// Sweeping one translating segment fills exactly its endpoint quadrilateral.
// A segment parallel to its movement degenerates to a segment, handled above.
function arrowPrimitives(arrow: Arrow): Primitive[] {
  if (arrow.shape) return compileShape(arrow.shape);
  return arrow.points.slice(1).map((b, i) => ({ polygon: [arrow.points[i], b], radius: 0 }));
}

function sweptSegments(arrow: Arrow, board: Puzzle): Primitive[] {
  const delta = exitTranslation(arrow, board);
  return arrowPrimitives(arrow).map(p => ({ radius: p.radius,
    polygon: hull([...p.polygon, ...p.polygon.map(v => ({ x: v.x + delta.x, y: v.y + delta.y }))]) }));
}

function polygonDistance(a: Point[], b: Point[]): number {
  if (contains(a[0], b) || contains(b[0], a)) return 0;
  let result = Infinity;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    const p = a[i], q = a[(i + 1) % a.length], r = b[j], s = b[(j + 1) % b.length];
    if (intersects(p, q, r, s)) return 0;
    result = Math.min(result, pointSegmentDistance(p, r, s), pointSegmentDistance(q, r, s), pointSegmentDistance(r, p, q), pointSegmentDistance(s, p, q));
  }
  return result;
}

export function shapesOverlap(a: VectorShape, b: VectorShape): boolean {
  return compileShape(a).some(p => compileShape(b).some(q => polygonDistance(p.polygon, q.polygon) <= p.radius + q.radius + EPS));
}

export function pointTouchesShape(point: Point, shape: VectorShape): boolean {
  return compileShape(shape).some(p => polygonDistance([point], p.polygon) <= p.radius + EPS);
}

export function isShapeConnected(shape: VectorShape): boolean {
  const parts = compileShape(shape), visited = new Set([0]), queue = [0];
  while (queue.length) {
    const i = queue.pop();
    if (i === undefined) break;
    for (let j = 0; j < parts.length; j++) {
      if (visited.has(j)) continue;
      if (polygonDistance(parts[i].polygon, parts[j].polygon) <= parts[i].radius + parts[j].radius + EPS) { visited.add(j); queue.push(j); }
    }
  }
  return visited.size === parts.length;
}

export function findBlocker(arrow: Arrow, remaining: readonly Arrow[], board: Puzzle): string | null {
  for (const swept of sweptSegments(arrow, board)) {
    for (const other of remaining) {
      if (other.id === arrow.id) continue;
      for (const obstacle of arrowPrimitives(other)) if (polygonDistance(swept.polygon, obstacle.polygon) <= swept.radius + obstacle.radius + EPS) return other.id;
    }
    for (const target of board.targets) {
      if (contains(target.center, swept.polygon) || swept.polygon.some((p, j) =>
        pointSegmentDistance(target.center, p, swept.polygon[(j + 1) % swept.polygon.length]) <= target.radius + swept.radius + EPS)) return target.id;
    }
  }
  return null;
}

// Active rope game: only the forward ray from the displayed marker tip matters.
// The legacy rigid-body query above remains for the earlier template fixtures.
export function headTip(arrow: Arrow): Point {
  if (!arrow.head) throw new Error('An explicit direction marker is required');
  const m = Math.hypot(arrow.direction.x, arrow.direction.y);
  if (!Number.isFinite(m) || m === 0) throw new Error('Invalid movement vector');
  return { x: arrow.head.anchor.x + arrow.direction.x / m * (arrow.head.length ?? 0),
    y: arrow.head.anchor.y + arrow.direction.y / m * (arrow.head.length ?? 0) };
}

export type HeadContact={id:string;distance:number;point:Point};

function rayPrimitive(start:Point,u:Point,limit:number,primitive:Primitive):number|null {
  const {polygon,radius}=primitive;
  if(polygonDistance([start],polygon)<=radius+EPS)return 0;
  let nearest=Infinity;
  const circle=(center:Point)=>{
    const v=sub(center,start),projection=v.x*u.x+v.y*u.y;
    const perpendicular=cross(v,u),disc=radius*radius-perpendicular*perpendicular;
    if(disc < -EPS)return;
    const t=projection-Math.sqrt(Math.max(0,disc));
    if(t>=-EPS&&t<=limit+EPS)nearest=Math.min(nearest,Math.max(0,t));
  };
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],v=sub(b,a),m=Math.hypot(v.x,v.y);
    circle(a);
    if(m===0)continue;
    for(const sign of radius?[1,-1]:[0]){
      const offset={x:a.x-v.y/m*radius*sign,y:a.y+v.x/m*radius*sign};
      const w=sub(offset,start),denominator=cross(u,v);
      if(Math.abs(denominator)<=EPS){
        if(Math.abs(cross(w,u))<=EPS){
          const t=w.x*u.x+w.y*u.y,other=t+v.x*u.x+v.y*u.y;
          if(Math.max(t,other)>=0)nearest=Math.min(nearest,Math.max(0,Math.min(t,other)));
        }
        continue;
      }
      const t=cross(w,v)/denominator,s=cross(w,u)/denominator;
      if(t>=-EPS&&t<=limit+EPS&&s>=-EPS&&s<=1+EPS)nearest=Math.min(nearest,Math.max(0,t));
    }
  }
  return nearest<=limit+EPS?nearest:null;
}

export function findHeadContact(arrow: Arrow, remaining: readonly Arrow[], board: Puzzle): HeadContact | null {
  const start = headTip(arrow), m = Math.hypot(arrow.direction.x, arrow.direction.y);
  const u = { x: arrow.direction.x / m, y: arrow.direction.y / m };
  const distances = [u.x > 0 ? (board.width-start.x)/u.x : u.x < 0 ? -start.x/u.x : Infinity,
    u.y > 0 ? (board.height-start.y)/u.y : u.y < 0 ? -start.y/u.y : Infinity];
  const t = Math.max(0, Math.min(...distances)) + 1;
  let contact:HeadContact|null=null;
  const consider=(id:string,primitives:Primitive[])=>{
    for(const primitive of primitives){
      const distance=rayPrimitive(start,u,t,primitive);
      if(distance!==null&&(!contact||distance<contact.distance))contact={id,distance,point:{x:start.x+u.x*distance,y:start.y+u.y*distance}};
    }
  };
  for (const other of remaining) {
    if (other.id === arrow.id) continue;
    consider(other.id,arrowPrimitives(other));
  }
  for (const target of board.targets) {
    consider(target.id,target.obstacle?compileShape(target.obstacle):[{polygon:[target.center],radius:target.radius}]);
  }
  return contact;
}

export function findHeadBlocker(arrow:Arrow,remaining:readonly Arrow[],board:Puzzle):string|null {
  return findHeadContact(arrow,remaining,board)?.id??null;
}
