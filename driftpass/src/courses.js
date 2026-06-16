// courses.js — 3コースの定義（中心線・道幅・チェックポイント・ゴール）
// pathPoints は buildPath で生成。後からコースを足す時はこの配列に push するだけ。

/** segs: [曲がり角度(度/ステップ), ステップ数] の並び。0=直線 */
function buildPath(segs, step) {
  let x = 0, y = 0, a = -Math.PI / 2; // 上向きスタート
  const pts = [{ x, y }];
  for (const [degPerStep, count] of segs) {
    const dr = degPerStep * Math.PI / 180;
    for (let i = 0; i < count; i++) {
      a += dr;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return pts;
}

function makeCourse(id, name, difficulty, roadWidth, segs, step, targetTimeMs, theme) {
  const pts = buildPath(segs, step);
  const p0 = pts[0], p1 = pts[1];
  const startAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  // チェックポイントを一定間隔で配置（逆走/ショートカット防止）
  const checkpoints = [];
  const every = Math.max(8, Math.floor(pts.length / 7));
  for (let i = every; i < pts.length - 3; i += every) {
    checkpoints.push({ id: 'cp' + checkpoints.length, position: { x: pts[i].x, y: pts[i].y }, radius: roadWidth * 0.85 });
  }
  // ゴールライン：最終セグメントに垂直な線分
  const last = pts[pts.length - 1], prev = pts[pts.length - 2];
  const dx = last.x - prev.x, dy = last.y - prev.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const finishLine = {
    a: { x: last.x + nx * roadWidth * 0.7, y: last.y + ny * roadWidth * 0.7 },
    b: { x: last.x - nx * roadWidth * 0.7, y: last.y - ny * roadWidth * 0.7 },
  };
  return {
    id, name, difficulty, roadWidth,
    startPosition: { x: p0.x, y: p0.y }, startAngle,
    finishLine, checkpoints, pathPoints: pts, targetTimeMs, theme,
  };
}

export const COURSES = [
  makeCourse('night_pass', 'NIGHT PASS', 'easy', 150,
    [[0,6],[1.6,18],[0,5],[-1.6,18],[0,6],[1.2,24],[0,5],[-1.4,20],[0,6],[1.0,18],[0,8]],
    62, 45000,
    { background: 0x05070f, road: 0x23262e, roadEdge: 0xe6eef7 }),

  makeCourse('snake_hill', 'SNAKE HILL', 'normal', 116,
    [[0,5],[3.4,13],[0,3],[-3.4,13],[0,3],[4.2,11],[-4.2,11],[0,3],[2.6,16],[0,3],[-5,10],[0,3],[3.6,12],[0,7]],
    58, 70000,
    { background: 0x0a0612, road: 0x2a2630, roadEdge: 0xf0d27a }),

  makeCourse('narrow_ridge', 'NARROW RIDGE', 'hard', 92,
    [[0,5],[6,12],[-6,12],[0,3],[7.5,10],[-7.5,11],[0,3],[5,13],[-5,13],[0,3],[8.5,9],[-8.5,9],[0,3],[4.5,14],[0,7]],
    56, 90000,
    { background: 0x0c0608, road: 0x2c2422, roadEdge: 0xf08a8a }),
];

export function getCourse(id) { return COURSES.find(c => c.id === id) || COURSES[0]; }

// コースの描画範囲（バウンディングボックス）
export function courseBounds(course) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of course.pathPoints) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const pad = course.roadWidth + 240;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad,
           w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
}
