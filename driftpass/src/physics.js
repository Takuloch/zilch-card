// physics.js — ベクトル演算とコース当たり判定（純粋関数）
export function vlen(x, y) { return Math.hypot(x, y); }
export function angleFromVec(x, y) { return Math.atan2(y, x); }
export function vecFromAngle(a, m = 1) { return { x: Math.cos(a) * m, y: Math.sin(a) * m }; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function moveToward(cur, target, maxDelta) {
  const d = target - cur;
  if (Math.abs(d) <= maxDelta) return target;
  return cur + Math.sign(d) * maxDelta;
}
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// 2つの角度差（-PI..PI）
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// 点Pから線分ABへの最短距離と最近点・パラメータt
export function distancePointToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1e-6;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = clamp(t, 0, 1);
  const cx = a.x + dx * t, cy = a.y + dy * t;
  return { dist: Math.hypot(p.x - cx, p.y - cy), t, cx, cy };
}

// 道路中心線からの最短距離情報（探索範囲は前回セグメント周辺に限定して高速化）
export function getNearestRoadInfo(point, course, fromSeg = 0) {
  const pts = course.pathPoints;
  let best = { dist: Infinity, seg: fromSeg, t: 0, cx: point.x, cy: point.y };
  const lo = Math.max(0, fromSeg - 3);
  const hi = Math.min(pts.length - 2, fromSeg + 10);
  for (let i = lo; i <= hi; i++) {
    const r = distancePointToSegment(point, pts[i], pts[i + 1]);
    if (r.dist < best.dist) best = { dist: r.dist, seg: i, t: r.t, cx: r.cx, cy: r.cy };
  }
  return best;
}

export function isOnRoad(point, course, carRadius, fromSeg = 0) {
  const info = getNearestRoadInfo(point, course, fromSeg);
  return { on: info.dist <= course.roadWidth / 2 - carRadius * 0.5, info };
}

// 線分交差（finishLine通過判定用）
function ccw(a, b, c) { return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x); }
export function segmentsIntersect(p1, p2, p3, p4) {
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}
export function hasCrossedFinish(prev, cur, finishLine) {
  return segmentsIntersect(prev, cur, finishLine.a, finishLine.b);
}

export function isCheckpointReached(position, checkpoint) {
  return Math.hypot(position.x - checkpoint.position.x, position.y - checkpoint.position.y) <= checkpoint.radius;
}
