// audio.js — Web Audio APIで簡易SE/BGMを生成（外部音源なし）。
// iOS対策：必ずユーザータップ後に unlock() を呼んでから使う。
import { getSettings } from './storage.js';

let ctx = null;
let skidNode = null;
let engine = null;

export function unlock() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function seOn() { return getSettings().se; }

function tone(freq, dur, vol, type, slideTo) {
  if (!ctx || !seOn()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, vol, filter, type) {
  if (!ctx || !seOn()) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const flt = ctx.createBiquadFilter(); flt.type = type || 'lowpass'; flt.frequency.value = filter || 1000;
  const g = ctx.createGain(); g.gain.value = vol || 0.2;
  src.connect(flt); flt.connect(g); g.connect(ctx.destination);
  src.start(t0); src.stop(t0 + dur + 0.05);
}

export const SE = {
  select() { tone(880, 0.07, 0.1, 'square'); },
  count() { tone(520, 0.18, 0.13, 'triangle'); },
  go() { tone(1040, 0.45, 0.16, 'triangle'); },
  hit() { noise(0.25, 0.28, 800); tone(120, 0.18, 0.16, 'square', 60); },
  goal() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.28, 0.14, 'triangle'), i * 110)); },
  best() { [784, 988, 1318, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.3, 0.14, 'triangle'), i * 90)); },
  drift() { tone(300, 0.2, 0.05, 'sawtooth', 360); },
};

// エンジン音（連続）。setRpm(0..1)で音程変化
export function startEngine() {
  if (!ctx || !seOn() || engine) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = 70; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0.04;
  o.connect(f); f.connect(g); g.connect(ctx.destination); o.start();
  engine = { o, g, f };
}
export function setRpm(t) { if (engine) { engine.o.frequency.value = 60 + t * 140; engine.f.frequency.value = 500 + t * 1400; } }
export function stopEngine() { if (engine) { try { engine.o.stop(); } catch (e) {} engine = null; } }

// スキッド音（ループ）
export function setSkid(on) {
  if (!ctx || !seOn()) { if (skidNode) { try { skidNode.src.stop(); } catch (e) {} skidNode = null; } return; }
  if (on && !skidNode) {
    const len = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 2200;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start();
    skidNode = { src, g };
  } else if (!on && skidNode) {
    try { skidNode.src.stop(); } catch (e) {} skidNode = null;
  }
}
