import { isShapeConnected, pointTouchesShape } from './engine';
import type { Arrow, Point } from './engine';
import { CURVE_TOLERANCE, flattenPath } from './vector-shape';
import type { PathCommand, VectorShape } from './vector-shape';

export type PenCap = { center: Point; width: number };
export type PenStrokeDefinition = {
  key: string;
  jamoInstance: string;
  jamo: string;
  role: 'initial' | 'medial' | 'final';
  order: number;
  name: string;
  // A complete physical stroke, not a clipped region of a whole glyph.
  body: VectorShape;
  pen: { path: readonly PathCommand[]; start: PenCap; end: PenCap };
  // Author-controlled. Never infer direction from the spine or either tangent.
  head: { at: 'start' | 'end'; direction: Point; length: number; width: number; overlap: number };
};

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
  const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / squared));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export function headGeometry(head: NonNullable<Arrow['head']>): { d: string; transform: string } {
  if (!head.endpoint || !head.capCenter || !head.length || !head.width) throw new Error('Rendering requires an explicit terminal head');
  const length = head.length, width = head.width;
  const angle = Math.atan2(head.direction.y, head.direction.x) * 180 / Math.PI;
  return { d: `M0 ${-width / 2} L${length} 0 L0 ${width / 2} Z`,
    transform: `translate(${head.anchor.x} ${head.anchor.y}) rotate(${angle})` };
}

// Enlarge the visual marker backwards from its unchanged tip. Ray origin and
// movement data are untouched; test the whole triangle against the real body.
export function readableHead(arrow:Arrow):NonNullable<Arrow['head']> {
  const head=arrow.head!;
  if(!arrow.shape)return head;
  const magnitude=Math.hypot(head.direction.x,head.direction.y);
  const u={x:head.direction.x/magnitude,y:head.direction.y/magnitude};
  const tip={x:head.anchor.x+u.x*head.length!,y:head.anchor.y+u.y*head.length!};
  for(let factor=2.1;factor>=1;factor-=.1){
    const length=head.length!*factor,width=head.width!*Math.min(factor,1.85);
    const anchor={x:tip.x-u.x*length,y:tip.y-u.y*length};
    let fits=true;
    for(let row=0;row<=8&&fits;row++)for(let col=0;col<=row;col++){
      const along=row/8,across=(col-row/2)/8*width;
      const point={x:tip.x-u.x*length*along-u.y*across,y:tip.y-u.y*length*along+u.x*across};
      if(![{x:0,y:0},{x:.6,y:0},{x:-.6,y:0},{x:0,y:.6},{x:0,y:-.6}]
        .every(offset=>pointTouchesShape({x:point.x+offset.x,y:point.y+offset.y},arrow.shape!))){fits=false;break;}
    }
    if(fits)return {...head,anchor,length,width};
  }
  return head;
}

export function instantiatePenStrokes(definitions: readonly PenStrokeDefinition[], maxPieces: 2 | 3 | 4): Arrow[] {
  const counts = new Map<string, number>();
  for (const stroke of definitions) {
    const group = stroke.jamoInstance;
    counts.set(group, (counts.get(group) ?? 0) + 1);
    if (counts.get(group)! > maxPieces) throw new Error(`Split limit exceeded: ${group}`);
  }
  return definitions.map(stroke => {
    if (!stroke.body.fill || stroke.body.strokeWidth !== 0) throw new Error('Pen strokes require an explicit filled body outline');
    if (!isShapeConnected(stroke.body)) throw new Error(`Disconnected pen stroke: ${stroke.key}`);
    const boundaries = flattenPath(stroke.body.commands);
    const contours = flattenPath(stroke.pen.path);
    if (contours.length !== 1 || contours[0].length < 2) throw new Error('A pen spine must be one continuous path');
    const spine = contours[0];
    for (const [point, cap] of [[spine[0], stroke.pen.start], [spine[spine.length - 1], stroke.pen.end]] as const) {
      if (Math.hypot(point.x - cap.center.x, point.y - cap.center.y) > .001 || !pointTouchesShape(cap.center, stroke.body)) {
        throw new Error(`Pen endpoint must match its physical cap: ${stroke.key}`);
      }
      if (!(Number.isFinite(cap.width) && cap.width > 0) || !boundaries.some(contour => contour.slice(1).some((b, i) =>
        distanceToSegment(cap.center, contour[i], b) <= CURVE_TOLERANCE + .001))) throw new Error(`A cap must be on the body boundary, not its interior: ${stroke.key}`);
    }
    const selectedCap = stroke.pen[stroke.head.at];
    const direction = stroke.head.direction;
    const magnitude = Math.hypot(direction.x, direction.y);
    if (!Number.isFinite(magnitude) || magnitude === 0) throw new Error('Invalid head direction');
    if (!(stroke.head.length > 0 && stroke.head.width > 0 && stroke.head.overlap > 0 && stroke.head.overlap < stroke.head.length)) throw new Error('Invalid head size/overlap');
    const unit = { x: direction.x / magnitude, y: direction.y / magnitude };
    const anchor = { x: selectedCap.center.x - unit.x * stroke.head.overlap, y: selectedCap.center.y - unit.y * stroke.head.overlap };
    const tip = { x: anchor.x + unit.x * stroke.head.length, y: anchor.y + unit.y * stroke.head.length };
    if (!pointTouchesShape(anchor, stroke.body) || pointTouchesShape(tip, stroke.body)) throw new Error(`Head must join a cap and point outside its own body: ${stroke.key}`);
    return { id: stroke.key, label: `${stroke.jamo} ${stroke.name}`, points: spine,
      shape: stroke.body, direction,
      head: { anchor, direction, length: stroke.head.length, width: stroke.head.width, endpoint: stroke.head.at, capCenter: selectedCap.center },
      penStroke: stroke };
  });
}
