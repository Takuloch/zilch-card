// ui.js — Phaserでの共通ボタン/パネル部品
export function button(scene, x, y, w, h, label, opts = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, opts.fill ?? 0x16321f, 1)
    .setStrokeStyle(2, opts.stroke ?? 0x4ade80, 1);
  bg.setOrigin(0.5);
  const t = scene.add.text(0, opts.sub ? -8 : 0, label, {
    fontFamily: 'sans-serif', fontSize: (opts.fontSize ?? 18) + 'px',
    color: opts.color ?? '#eaffea', fontStyle: '700',
  }).setOrigin(0.5);
  c.add([bg, t]);
  if (opts.sub) {
    const s = scene.add.text(0, 12, opts.sub, {
      fontFamily: 'sans-serif', fontSize: '11px', color: opts.subColor ?? '#9fd99f',
    }).setOrigin(0.5);
    c.add(s);
  }
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => bg.setFillStyle(opts.hover ?? 0x1f4a2d));
  bg.on('pointerout', () => bg.setFillStyle(opts.fill ?? 0x16321f));
  bg.on('pointerdown', () => { bg.setScale(0.96); });
  bg.on('pointerup', () => { bg.setScale(1); if (opts.onClick) opts.onClick(); });
  c.setSize(w, h);
  c._bg = bg; c._label = t;
  return c;
}

export function fmtTime(ms) {
  if (ms == null) return "--'--.---";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return m + "'" + (s < 10 ? '0' : '') + s.toFixed(3);
}
