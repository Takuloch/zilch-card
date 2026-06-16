// config.js — ゲーム内部解像度・車両基本値・難易度/ハンドリング設定
export const GAME_W = 390;
export const GAME_H = 844;

/** @type {import('./types.js').CarConfig} */
export const BASE_CAR = {
  maxSpeed: 360,
  acceleration: 90,
  baseGrip: 0.92,
  driftGrip: 0.82,
  steerStrength: 2.8,
  steerReturnSpeed: 5.5,
  angularDamping: 0.88,
  lateralFriction: 0.92,
  driftThreshold: 0.28,
  wallBounce: 0.45,
  wallSpeedPenalty: 0.55,
};

export const CAR_RADIUS = 11;

// 難易度ごとの補正
export const DIFFICULTY = {
  easy:   { roadMul: 1.25, speedMul: 0.90, gripAdd:  0.04, wallPenMul: 0.80 },
  normal: { roadMul: 1.00, speedMul: 1.00, gripAdd:  0.00, wallPenMul: 1.00 },
  hard:   { roadMul: 0.82, speedMul: 1.10, gripAdd: -0.04, wallPenMul: 1.20 },
};

// ハンドリング感度（steerStrength）
export const HANDLING = { LOW: 2.2, NORMAL: 2.8, HIGH: 3.4 };

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
  c.baseGrip = Math.min(0.98, BASE_CAR.baseGrip + d.gripAdd);
  c.driftGrip = Math.min(0.95, BASE_CAR.driftGrip + d.gripAdd);
  c.wallSpeedPenalty = BASE_CAR.wallSpeedPenalty; // ペナルティ倍率は別途wallPenで使用
  c.wallPenMul = d.wallPenMul;
  c.steerStrength = HANDLING[handling] || HANDLING.NORMAL;
  return c;
}
