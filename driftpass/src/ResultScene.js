// ResultScene.js — リザルト表示・ベスト更新・ランク
import { GAME_W, GAME_H } from './config.js';
import { getBest, updateBest, grantGems } from './storage.js';
import { button, fmtTime } from './ui.js';
import * as AU from './audio.js';

const RANK_COLOR = { S: '#ffd23f', A: '#7CFC7C', B: '#7fd0ff', C: '#cfeccf', D: '#ff8a8a' };

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  init(data) { this.result = data; }

  create() {
    const r = this.result, cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor(0x05070f);
    const prevBest = getBest(r.courseId);
    const firstClear = !prevBest;
    const upd = updateBest(r.courseId, r);
    const isBest = upd.newTime || upd.newScore;
    if (isBest) AU.SE.best(); else AU.SE.goal();

    // ★ダイヤ報酬（カードゲームのガチャ用に加算）
    let gems = 0; this.rewardLines = [];
    if (r.noHitClear) { gems += 6000; this.rewardLines.push(['ノーヒット完走', '+💎6000']); }
    if (firstClear) { gems += 300; this.rewardLines.push(['初完走ボーナス', '+💎300']); }
    if (upd.newTime && !firstClear) { gems += 500; this.rewardLines.push(['ベストタイム更新', '+💎500']); }
    if (gems > 0) grantGems(gems);
    this.gemTotal = gems;

    this.add.text(cx, 70, r.noHitClear ? 'PERFECT CLEAR!' : 'CLEAR!', {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#7CFC7C', fontStyle: '900',
    }).setOrigin(0.5).setShadow(0, 0, '#22c55e', 16, true, true);
    this.add.text(cx, 104, r.courseName + ' / ' + r.difficulty.toUpperCase(), { fontFamily: 'sans-serif', fontSize: '13px', color: '#9fd99f' }).setOrigin(0.5);

    // ランク
    const rk = this.add.text(cx, 168, r.rank, { fontFamily: 'sans-serif', fontSize: '80px', color: RANK_COLOR[r.rank], fontStyle: '900' }).setOrigin(0.5);
    rk.setShadow(0, 0, RANK_COLOR[r.rank], 24, true, true);
    this.tweens.add({ targets: rk, scale: { from: 0.4, to: 1 }, duration: 400, ease: 'Back.out' });

    // タイム
    this.add.text(cx, 240, 'TIME', { fontFamily: 'sans-serif', fontSize: '11px', color: '#9fd99f' }).setOrigin(0.5);
    this.add.text(cx, 268, fmtTime(r.clearTimeMs), { fontFamily: 'sans-serif', fontSize: '40px', color: '#ffffff', fontStyle: '800' }).setOrigin(0.5);
    this.add.text(cx, 298, 'BEST ' + fmtTime(getBest(r.courseId).bestTimeMs) + (isBest ? '   ★UPDATE!' : ''), {
      fontFamily: 'sans-serif', fontSize: '13px', color: isBest ? '#ffd23f' : '#9fd99f', fontStyle: '700',
    }).setOrigin(0.5);

    // 内訳
    const rows = [
      ['SCORE', String(r.totalScore)],
      ['DRIFT SCORE', '+' + r.driftScore],
      ['WALL HITS', String(r.wallHits)],
      ['NO HIT BONUS', r.noHitClear ? '+30000' : '0'],
      ['TARGET BONUS', r.clearTimeMs <= r.targetTimeMs ? '+20000' : '0'],
    ];
    let y = 332;
    rows.forEach(([k, v]) => {
      this.add.text(cx - 150, y, k, { fontFamily: 'sans-serif', fontSize: '14px', color: '#9fd99f' }).setOrigin(0, 0.5);
      this.add.text(cx + 150, y, v, { fontFamily: 'sans-serif', fontSize: '16px', color: '#eaffea', fontStyle: '700' }).setOrigin(1, 0.5);
      y += 28;
    });

    // ダイヤ報酬パネル
    if (this.gemTotal > 0) {
      y += 8;
      this.add.rectangle(cx, y + 4 + this.rewardLines.length * 11, 320, 30 + this.rewardLines.length * 22, 0x1a1407, 1).setStrokeStyle(2, 0xffd23f, 0.8).setOrigin(0.5, 0);
      this.add.text(cx, y + 14, '💎 ダイヤ獲得！', { fontFamily: 'sans-serif', fontSize: '15px', color: '#ffd23f', fontStyle: '800' }).setOrigin(0.5);
      y += 34;
      this.rewardLines.forEach(([k, v]) => {
        this.add.text(cx - 140, y, k, { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff3c4' }).setOrigin(0, 0.5);
        this.add.text(cx + 140, y, v, { fontFamily: 'sans-serif', fontSize: '15px', color: '#ffd23f', fontStyle: '800' }).setOrigin(1, 0.5);
        y += 22;
      });
      this.add.text(cx, y + 4, '計 💎' + this.gemTotal + ' → カードゲームのダイヤに加算', { fontFamily: 'sans-serif', fontSize: '12px', color: '#9fd99f' }).setOrigin(0.5);
      y += 24;
    }

    button(this, cx, y + 28, 300, 54, 'もう一度', { fontSize: 18, fill: 0x22c55e, color: '#04210f', onClick: () => { AU.unlock(); AU.SE.select(); this.scene.start('Game', { courseId: r.courseId, difficulty: r.difficulty }); } });
    button(this, cx, y + 90, 300, 48, 'コース選択へ', { fontSize: 16, onClick: () => { AU.SE.select(); this.scene.start('Title'); } });
  }
}
