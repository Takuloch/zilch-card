// config.js — ゲーム内部解像度・車両基本値・難易度/ハンドリング設定
export const GAME_W = 390;
export const GAME_H = 844;

/** @type {import('./types.js').CarConfig} */
// 常時ドリフト仕様：グリップを低く設定し、車は常に横滑りする。
export const BASE_CAR = {
  maxSpeed: 330,
  acceleration: 130,
  baseGrip: 0.66,     // 低めグリップ＝常時スライド（ただし操作可能）
  driftGrip: 0.52,    // 深いドリフト中はさらに滑る
  steerStrength: 3.2, // 360°スピンを決められる強いステア
  steerReturnSpeed: 7.0,
  angularDamping: 0.88,
  lateralFriction: 0.92,
  driftThreshold: 0.12, // ほぼ常にドリフト判定
  wallBounce: 0.45,
  wallSpeedPenalty: 0.6,
  alignAssist: 0.07,  // 無操作時に進行方向へ緩く整える量
};

export const CAR_RADIUS = 10;

// 難易度ごとの補正
export const DIFFICULTY = {
  easy:   { roadMul: 1.20, speedMul: 0.86, gripAdd:  0.07, wallPenMul: 0.85 },
  normal: { roadMul: 1.00, speedMul: 1.00, gripAdd:  0.00, wallPenMul: 1.00 },
  hard:   { roadMul: 0.84, speedMul: 1.12, gripAdd: -0.05, wallPenMul: 1.20 },
};

// ハンドリング感度（steerStrength）— 常時ドリフトなので全体的に強め
export const HANDLING = { LOW: 2.7, NORMAL: 3.2, HIGH: 3.8 };

// 既定設定
export const DEFAULT_SETTINGS = {
  bgm: true,
  se: true,
  showTouch: true,
  quality: 'NORMAL',   // LOW / NORMAL / HIGH
  handling: 'NORMAL',  // LOW / NORMAL / HIGH
};

// 難易度＋ハンドリングを反映した CarConfig を返す
export function makeCarConfig(difficulty, handling) {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const c = Object.assign({}, BASE_CAR);
  c.maxSpeed = BASE_CAR.maxSpeed * d.speedMul;
  c.baseGrip = Math.max(0.35, Math.min(0.8, BASE_CAR.baseGrip + d.gripAdd));
  c.driftGrip = Math.max(0.28, Math.min(0.7, BASE_CAR.driftGrip + d.gripAdd));
  c.wallSpeedPenalty = BASE_CAR.wallSpeedPenalty;
  c.wallPenMul = d.wallPenMul;
  c.steerStrength = HANDLING[handling] || HANDLING.NORMAL;
  c.alignAssist = BASE_CAR.alignAssist;
  return c;
}
