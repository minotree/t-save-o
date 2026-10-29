// Measure tolerance in screen pixels, independently of the puzzle viewBox.
export function touchArrow(board: SVGSVGElement, x: number, y: number): string | null {
  const paths = Array.from(board.querySelectorAll<SVGPathElement>('.arrow-hit, .arrow-head'));
  const candidates = paths.flatMap(path => {
    const matrix = path.getScreenCTM();
    return matrix ? [{ path, inverse: matrix.inverse() }] : [];
  });
  const hit = (sx: number, sy: number) => candidates.find(({ path, inverse }) =>
    path.isPointInFill(new DOMPoint(sx, sy).matrixTransform(inverse)));
  // A direct body or visible head hit wins over a neighbor's tolerance.
  let match = hit(x, y);
  for (let radius = 1; !match && radius <= 10; radius++) {
    for (let i = 0; i < 32 && !match; i++) {
      const angle = i * Math.PI / 16;
      match = hit(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
  }
  return match?.path.closest('[data-arrow]')?.getAttribute('data-arrow') ?? null;
}
