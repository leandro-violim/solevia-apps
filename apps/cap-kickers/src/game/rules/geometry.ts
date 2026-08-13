import { type Vec2 } from "../physics/vec";

// Signed area * 2 of triangle (p1, p2, p3): >0 CCW, <0 CW, 0 collinear.
const orient = (p1: Vec2, p2: Vec2, p3: Vec2): number =>
  (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

// Assuming p, q, r are collinear, is q within the bounding box of segment p..r?
const onSegment = (p: Vec2, q: Vec2, r: Vec2): boolean =>
  Math.min(p.x, r.x) <= q.x &&
  q.x <= Math.max(p.x, r.x) &&
  Math.min(p.y, r.y) <= q.y &&
  q.y <= Math.max(p.y, r.y);

/**
 * Do segments p1..p2 and p3..p4 intersect? Includes endpoint touches and
 * collinear overlap. Standard orientation test (CLRS).
 */
export const segmentsIntersect = (p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean => {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p1, p4)) return true;
  if (d2 === 0 && onSegment(p3, p2, p4)) return true;
  if (d3 === 0 && onSegment(p1, p3, p2)) return true;
  if (d4 === 0 && onSegment(p1, p4, p2)) return true;

  return false;
};
