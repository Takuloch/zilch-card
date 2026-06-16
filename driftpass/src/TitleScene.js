// TitleScene.js — タイトル/コース選択/難易度/設定/ベスト
import { GAME_W, GAME_H } from './config.js';
import { COURSES } from './courses.js';
import { getBest, getSettings, setSettings, resetAll } from './storage.js';
import { button, fmtTime } from './ui.js';
import { unlock, SE } from './audio.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.diff = 'normal';
    this.cameras.main.setBackgroundColor(0x05070f);
    this.build();
  }

  clear() { this.children.removeAll(true); }

  build() {
    this.clear();
    const cx = GAME_W / 2;
    // タイトル
    this.add.text(cx, 92, 'DRIFT PASS', {
      fontFamily: 'sans-serif', fontSize: '46px', color: '#7CFC7C', fontStyle: '900',
    }).setOrigin(0.5).setShadow(0, 0, '#22c55e', 18, true, true);
    this.add.text(cx, 132, 'One touch. Full drift.', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#9fd99f', fontStyle: '600',
    }).setOrigin(0.5);

    // 難易度セレクタ
    this.add.text(cx, 178, '難易度', { fontFamily: 'sans-serif', fontSize: '12px', color: '#7fae7f' }).setOrigin(0.5);
    const diffs = [['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD']];
    this.diffBtns = [];
    diffs.forEach((d, i) => {
      const b = button(this, 70 + i * 125, 208, 116, 38, d[1], {
        fontSize: 15,
        onClick: () => { unlock(); SE.select(); this.diff = d[0]; this.refreshDiff(); },
      });
      this.diffBtns.push({ key: d[0], c: b });
    });
    this.refreshDiff();

    // コースボタン
    this.add.text(cx, 256, 'コースを選択', { fontFamily: 'sans-serif', fontSize: '12px', color: '#7fae7f' }).setOrigin(0.5);
    COURSES.forEach((co, i) => {
      const best = getBest(co.id);
      const sub = '難易度:' + co.difficulty.toUpperCase() + '  BEST ' + fmtTime(best ? best.bestTimeMs : null) + (best && best.noHitClear ? '  ★NO HIT' : '');
      button(this, cx, 300 + i * 84, 340, 70, co.name, {
        sub, fontSize: 20, fill: i === 0 ? 0x1c4a2c : 0x16321f,
        onClick: () => { unlock(); SE.select(); this.startCourse(co.id); },
      });
    });

    // 下部ボタン
    button(this, cx - 88, 572, 160, 48, '⚙ 設定', { fontSize: 16, onClick: () => { unlock(); SE.select(); this.showSettings(); } });
    button(this, cx + 88, 572, 160, 48, '🏆 記録', { fontSize: 16, onClick: () => { unlock(); SE.select(); this.showRecords(); } });
    button(this, cx, 632, 340, 46, '← カードゲームに戻る', { fontSize: 15, fill: 0x10241a, onClick: () => { location.href = '../index.html'; } });

    this.add.text(cx, GAME_H - 24, '画面の左半分=左 / 右半分=右 ・ 加速は自動', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#5f7f5f',
    }).setOrigin(0.5);
  }

  refreshDiff() {
    for (const d of this.diffBtns) {
      const on = d.key === this.diff;
      d.c._bg.setFillStyle(on ? 0x22c55e : 0x16321f);
      d.c._label.setColor(on ? '#04210f' : '#eaffea');
    }
  }

  startCourse(courseId) {
    this.scene.start('Game', { courseId, difficulty: this.diff });
  }

  showSettings() {
    this.clear();
    const cx = GAME_W / 2;
    const s = getSettings();
    this.add.text(cx, 80, '設定', { fontFamily: 'sans-serif', fontSize: '30px', color: '#7CFC7C', fontStyle: '900' }).setOrigin(0.5);
    const rows = [
      ['BGM', 'bgm', ['ON', 'OFF']],
      ['効果音 SE', 'se', ['ON', 'OFF']],
      ['タッチ表示', 'showTouch', ['ON', 'OFF']],
      ['画質', 'quality', ['LOW', 'NORMAL', 'HIGH']],
      ['ハンドリング', 'handling', ['LOW', 'NORMAL', 'HIGH']],
    ];
    let y = 150;
    rows.forEach(([label, key, opts]) => {
      this.add.text(40, y, label, { fontFamily: 'sans-serif', fontSize: '15px', color: '#cfeccf' }).setOrigin(0, 0.5);
      const optw = opts.length === 2 ? 70 : 88;
      opts.forEach((o, i) => {
        const val = (key === 'bgm' || key === 'se' || key === 'showTouch') ? (o === 'ON') : o;
        const cur = s[key];
        const on = cur === val;
        button(this, GAME_W - 40 - (opts.length - 1 - i) * (optw + 6) - optw / 2, y, optw, 36, o, {
          fontSize: 13, fill: on ? 0x22c55e : 0x16321f, color: on ? '#04210f' : '#eaffea',
          onClick: () => { unlock(); SE.select(); const ns = getSettings(); ns[key] = val; setSettings(ns); this.showSettings(); },
        });
      });
      y += 58;
    });
    button(this, cx, y + 10, 300, 44, '記録をすべてリセット', { fontSize: 14, fill: 0x4a1010, stroke: 0xef4444, onClick: () => { resetAll(); SE.select(); this.showSettings(); } });
    button(this, cx, y + 64, 200, 44, '← 戻る', { fontSize: 15, onClick: () => { SE.select(); this.build(); } });
  }

  showRecords() {
    this.clear();
    const cx = GAME_W / 2;
    this.add.text(cx, 80, 'ベスト記録', { fontFamily: 'sans-serif', fontSize: '30px', color: '#7CFC7C', fontStyle: '900' }).setOrigin(0.5);
    let y = 150;
    COURSES.forEach((co) => {
      const b = getBest(co.id);
      this.add.text(cx, y, co.name, { fontFamily: 'sans-serif', fontSize: '17px', color: '#eaffea', fontStyle: '700' }).setOrigin(0.5);
      this.add.text(cx, y + 24, 'TIME ' + fmtTime(b ? b.bestTimeMs : null) + '   SCORE ' + (b ? b.bestScore : '---'), {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#ffd23f',
      }).setOrigin(0.5);
      this.add.text(cx, y + 44, b && b.noHitClear ? '★ NO HIT CLEAR 達成' : '— ノーヒット未達成', {
        fontFamily: 'sans-serif', fontSize: '11px', color: b && b.noHitClear ? '#7CFC7C' : '#5f7f5f',
      }).setOrigin(0.5);
      y += 92;
    });
    button(this, cx, y + 10, 200, 44, '← 戻る', { fontSize: 15, onClick: () => { SE.select(); this.build(); } });
  }
}
