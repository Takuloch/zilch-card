// storage.js — localStorageでベスト記録と設定を保存
import { DEFAULT_SETTINGS } from './config.js';

const KEY = 'driftpass_save_v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch (e) { return {}; }
}
function write(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
}

export function getSettings() {
  const s = read();
  return Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
}
export function setSettings(settings) {
  const s = read();
  s.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
  write(s);
}

/** @returns {null|{bestTimeMs:number,bestScore:number,noHitClear:boolean,updatedAt:string}} */
export function getBest(courseId) {
  const s = read();
  return (s.best && s.best[courseId]) || null;
}

/** ベスト更新（タイム/スコアそれぞれ良い方を保持）。更新有無を返す */
export function updateBest(courseId, result) {
  const s = read();
  s.best = s.best || {};
  const prev = s.best[courseId];
  const newTime = (!prev || result.clearTimeMs < prev.bestTimeMs);
  const newScore = (!prev || result.totalScore > prev.bestScore);
  s.best[courseId] = {
    bestTimeMs: newTime ? result.clearTimeMs : prev.bestTimeMs,
    bestScore: newScore ? result.totalScore : prev.bestScore,
    noHitClear: (prev && prev.noHitClear) || result.noHitClear,
    updatedAt: new Date().toISOString(),
  };
  write(s);
  return { newTime, newScore };
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}

// 後からゴースト保存に使える簡易ストレージ（拡張用）
export function saveGhost(courseId, frames) {
  const s = read();
  s.ghost = s.ghost || {};
  s.ghost[courseId] = frames;
  write(s);
}
export function loadGhost(courseId) {
  const s = read();
  return (s.ghost && s.ghost[courseId]) || null;
}
