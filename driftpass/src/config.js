// config.js — ゲーム内部解像度・車両基本値・難易度/ハンドリング設定
export const GAME_W = 390;
export const GAME_H = 844;

/** @type {import('./types.js').CarConfig} */
// ★氷上ドリフト仕様：横方向グリップをほぼ0にして常にツルツル滑る。
// エンジンは車体の向きへ推進し、慣性（横滑り）でコーナーを抜ける挙動。
export const BASE_CAR = {
  maxSpeed: 340,
  acceleration: 340,    // 車体の向きへ押し出す推進力
  friction: 0.992,      // ほぼ減速しない＝慣性が残る（ツルツル）
  iceGrip: 0.045,       // 横滑りを戻す力（小さいほど滑る＝氷）
  steerStrength: 3.0,   // 旋回の強さ
  steerReturnSpeed: 8.0,
  driftThreshold: 0.12,
  wallBounce: 0.40,
  wallSpeedPenalty: 0.62,
  // 互換のため残置（未使用）
  baseGrip: 0.5, driftGrip: 0.5, angularDamping: 0.88, lateralFriction: 0.92, alignAssist: 0,
};

export const CAR_RADIUS = 10;

// 難易度ごとの補正（iceGripが小さいほど滑る＝難しい）
export const DIFFICULTY = {
  easy:   { roadMul: 1.28, speedMul: 0.86, iceGrip: 0.075, wallPenMul: 0.85 },
  normal: { roadMul: 1.00, speedMul: 1.00, iceGrip: 0.050, wallPenMul: 1.00 },
  hard:   { roadMul: 0.86, speedMul: 1.12, iceGrip: 0.032, wallPenMul: 1.20 },
};

// ハンドリング感度（steerStrength）
export const HANDLING = { LOW: 2.6, NORMAL: 3.0, HIGH: 3.5 };

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
  c.iceGrip = d.iceGrip;
  c.wallPenMul = d.wallPenMul;
  c.steerStrength = HANDLING[handling] || HANDLING.NORMAL;
  return c;
}
