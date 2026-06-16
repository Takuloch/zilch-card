// types.js — 共有の型(JSDoc)と状態enum。実行時定数のみ持つ。
// （TypeScript版に移行する際は types.ts の interface に置き換え可能）

/** @typedef {{x:number,y:number}} Vec2 */
/** @typedef {'easy'|'normal'|'hard'} Difficulty */

/**
 * @typedef {Object} CourseData
 * @property {string} id
 * @property {string} name
 * @property {Difficulty} difficulty
 * @property {number} roadWidth
 * @property {Vec2} startPosition
 * @property {number} startAngle
 * @property {{a:Vec2,b:Vec2}} finishLine
 * @property {Array<{id:string,position:Vec2,radius:number}>} checkpoints
 * @property {Vec2[]} pathPoints
 * @property {number} targetTimeMs
 * @property {{background:number,road:number,roadEdge:number}} theme
 */

/**
 * @typedef {Object} CarConfig
 * @property {number} maxSpeed
 * @property {number} acceleration
 * @property {number} baseGrip
 * @property {number} driftGrip
 * @property {number} steerStrength
 * @property {number} steerReturnSpeed
 * @property {number} angularDamping
 * @property {number} lateralFriction
 * @property {number} driftThreshold
 * @property {number} wallBounce
 * @property {number} wallSpeedPenalty
 */

export const STATE = Object.freeze({
  TITLE: 'TITLE',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  RESULT: 'RESULT',
});
