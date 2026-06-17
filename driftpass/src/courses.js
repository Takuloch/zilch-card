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

// 走り屋の峠イメージ：長くて流れるようなコーナー連続。ほぼ全コーナーをドリフトで抜ける。
// （氷上ドリフト物理に合わせ、道幅は広め＝横滑りで抜けられる）
// 急カーブ多数（6箇所以上）。短い直線でリズムを作りつつ、はっきりした角を連続配置。
// 道幅は攻略ラインが通る広さに調整（壁に当たらず抜けられるが難しい）。
export const COURSES = [
  // 初級：はっきりした中カーブ8つ＋広め道幅で攻略ラインが取りやすい
  makeCourse('yoake', '夜明けの峠', 'easy', 158,
    [[0,5],[6,11],[0,3],[-6,11],[0,4],[7,10],[0,3],[-6,11],[0,4],[6,11],[0,3],[-7,10],[0,4],[6,11],[0,3],[-6,11],[0,6]],
    58, 70000,
    { background: 0x05070f, road: 0x23262e, roadEdge: 0xe6eef7 }),

  // 中級：急カーブ10＋短い切り返し。道幅やや狭め
  makeCourse('kiri', '霧の九十九折', 'normal', 126,
    [[0,4],[8,10],[0,2],[-8,10],[0,3],[9,9],[0,2],[-7,11],[0,3],[8,10],[0,2],[-9,9],[0,3],[7,11],[0,2],[-8,10],[0,3],[9,9],[0,2],[-8,10],[0,5]],
    56, 96000,
    { background: 0x0a0612, road: 0x2a2630, roadEdge: 0xf0d27a }),

  // 上級：鋭角の急カーブ12連発。道幅は狭いが攻略ラインはある
  makeCourse('zekkei', '断崖クライマックス', 'hard', 108,
    [[0,4],[10,9],[0,2],[-10,9],[0,2],[12,8],[0,2],[-9,10],[0,2],[11,8],[0,2],[-12,8],[0,2],[9,10],[0,2],[-11,8],[0,2],[12,8],[0,2],[-10,9],[0,2],[10,9],[0,2],[-12,8],[0,5]],
    54, 128000,
    { background: 0x0c0608, road: 0x2c2422, roadEdge: 0xf08a8a }),

  // 究極：いろは坂風のタイトヘアピン連続（下り）
  makeCourse('switchback', 'スイッチバック', 'hard', 104,
    [[0,3],
     [10,18],[0,3],[-10,18],[0,3],
     [11,16],[0,3],[-11,16],[0,3],
     [10,18],[0,3],[-10,18],[0,3],
     [11,16],[0,3],[-11,16],[0,3],
     [10,18],[0,3],[-10,18],[0,4]],
    52, 132000,
    { background: 0x060a06, road: 0x232a22, roadEdge: 0x9be39b }),
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
