// GameScene.js — コア。自動加速・左右ステア・ドリフト物理・壁/CP/ゴール・HUD
import { GAME_W, GAME_H, makeCarConfig, CAR_RADIUS } from './config.js';
import { getCourse, courseBounds } from './courses.js';
import { getBest, getSettings } from './storage.js';
import * as P from './physics.js';
import { fmtTime, button } from './ui.js';
import * as AU from './audio.js';

const MARK_MAX = 300;

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.courseId = data.courseId || 'night_pass';
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    AU.unlock();
    const settings = getSettings();
    this.quality = settings.quality;
    this.course = getCourse(this.courseId);
    this.cfg = makeCarConfig(this.difficulty, settings.handling);
    const th = this.course.theme;
    this.cameras.main.setBackgroundColor(th.background);

    this.drawCourse();
    this.makeTireMarks();
    this.makeSparks();

    const sp = this.course.startPosition;
    this.car = {
      x: sp.x, y: sp.y, angle: this.course.startAngle,
      vx: 0, vy: 0, speed: 0, seg: 0, drift: 0, combo: 0, comboTime: 0,
      driftScore: 0, wallHits: 0, maxCombo: 0, lastHit: -1, noHit: true,
      safeX: sp.x, safeY: sp.y, prevX: sp.x, prevY: sp.y,
    };
    this.sprite = this.add.image(sp.x, sp.y, 'car').setDepth(10);
    this.sprite.rotation = this.car.angle + Math.PI / 2;

    // カメラ追従（先のコーナーが見えるよう少し引き＆先読み）
    const zoom = Phaser.Math.Clamp(GAME_H / 1180, 0.72, 0.95);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.startFollow(this.sprite, true, 0.14, 0.14);
    this.lookahead = 170;

    this.buildHUD();
    this.setupInput();

    this.cpIndex = 0;
    this.state = 'COUNTDOWN';
    this.startTime = 0;
    this.elapsed = 0;
    this.runStartedAt = 0;
    this.ghostFrames = []; // 拡張用

    this.debug = new URLSearchParams(location.search).get('debug') === '1';
    if (this.debug) this.buildDebug();

    AU.startEngine();
    this.countdown();
  }

  /* ---------- コース描画（静的Graphics 1回） ---------- */
  drawCourse() {
    const c = this.course, th = c.theme, pts = c.pathPoints, hw = c.roadWidth / 2;
    const g = this.add.graphics().setDepth(0);
    // オフロード地面（バウンディング全体）
    const b = courseBounds(c);
    g.fillStyle(Phaser.Display.Color.ValueToColor(th.background).darken(8).color, 1);
    g.fillRect(b.minX, b.minY, b.w, b.h);
    // 道路本体（縁取り→道路）
    const drawStroke = (w, col) => {
      g.lineStyle(w, col, 1);
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };
    drawStroke(c.roadWidth + 14, 0x12161c);       // 外縁の影
    drawStroke(c.roadWidth, th.road);             // アスファルト
    // 縁石（左右オフセット線）
    for (let side = -1; side <= 1; side += 2) {
      g.lineStyle(4, side < 0 ? 0xd23a3a : th.roadEdge, 0.9);
      g.beginPath();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], bb = pts[i + 1], dx = bb.x - a.x, dy = bb.y - a.y, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * hw * side, ny = dx / L * hw * side;
        if (i === 0) g.moveTo(a.x + nx, a.y + ny);
        g.lineTo(bb.x + nx, bb.y + ny);
      }
      g.strokePath();
    }
    // センターの破線
    g.lineStyle(3, 0xdddc9a, 0.4);
    for (let i = 0; i < pts.length - 1; i += 2) {
      g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[i + 1].x, pts[i + 1].y); g.strokePath();
    }
    // スタート/ゴールのチェッカー
    this.drawChecker(g, pts[0], pts[1], hw, 0xffffff);
    this.drawChecker(g, pts[pts.length - 1], pts[pts.length - 2], hw, 0xffd23f);
    // チェックポイント（debug時のみ後で表示）
    this.cpGraphics = this.add.graphics().setDepth(1);
  }

  drawChecker(g, p, p2, hw, col) {
    const dx = p.x - p2.x, dy = p.y - p2.y, ang = Math.atan2(dy, dx) + Math.PI / 2;
    const n = 8, cw = (hw * 2) / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle((i % 2) ? col : 0x222222, 1);
      // 回転矩形を点で
      const ox = -hw + i * cw + cw / 2;
      const cxp = p.x + Math.cos(ang) * ox, cyp = p.y + Math.sin(ang) * ox;
      g.save(); g.translateCanvas(cxp, cyp); g.rotateCanvas(ang);
      g.fillRect(-cw / 2, -7, cw, 14); g.restore();
    }
  }

  makeTireMarks() {
    this.marks = [];
    this.markIdx = 0;
    this.markLayer = this.add.group();
  }
  addMark(x, y) {
    if (this.quality === 'LOW') return;
    let m;
    if (this.marks.length < MARK_MAX) {
      m = this.add.image(x, y, 'skid').setDepth(5).setAlpha(0.5);
      this.marks.push(m);
    } else {
      m = this.marks[this.markIdx];
      m.setPosition(x, y).setAlpha(0.5);
      this.markIdx = (this.markIdx + 1) % MARK_MAX;
    }
  }

  makeSparks() {
    if (this.quality === 'LOW') { this.sparks = null; return; }
    this.sparks = this.add.particles(0, 0, 'spark', {
      lifespan: 380, speed: { min: 60, max: 180 }, scale: { start: 1, end: 0 },
      quantity: 0, emitting: false, blendMode: 'ADD', depth: 12,
    });
  }

  /* ---------- HUD ---------- */
  buildHUD() {
    const best = getBest(this.courseId);
    const top = 8;
    this.hudTime = this.add.text(12, top + 14, "0'00.000", { fontFamily: 'sans-serif', fontSize: '20px', color: '#eaffea', fontStyle: '800' }).setScrollFactor(0).setDepth(50);
    this.add.text(12, top, 'TIME', { fontFamily: 'sans-serif', fontSize: '9px', color: '#9fd99f' }).setScrollFactor(0).setDepth(50);
    this.add.text(GAME_W / 2, top + 4, this.course.name, { fontFamily: 'sans-serif', fontSize: '14px', color: '#cfeccf', fontStyle: '700' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(GAME_W / 2, top + 24, this.difficulty.toUpperCase(), { fontFamily: 'sans-serif', fontSize: '10px', color: '#7fae7f' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    this.add.text(GAME_W - 60, top, 'BEST', { fontFamily: 'sans-serif', fontSize: '9px', color: '#9fd99f' }).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.hudBest = this.add.text(GAME_W - 60, top + 14, fmtTime(best ? best.bestTimeMs : null), { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffd23f', fontStyle: '700' }).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    // 一時停止ボタン
    const pb = this.add.text(GAME_W - 14, top + 44, '⏸', { fontFamily: 'sans-serif', fontSize: '24px', color: '#cfeccf' }).setOrigin(1, 0).setScrollFactor(0).setDepth(51).setInteractive();
    pb.on('pointerdown', () => this.togglePause());
    // ドリフト評価テキスト
    this.driftText = this.add.text(GAME_W / 2, GAME_H * 0.34, '', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd23f', fontStyle: '900' }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setAlpha(0);
    // 中央メッセージ
    this.centerText = this.add.text(GAME_W / 2, GAME_H * 0.42, '', { fontFamily: 'sans-serif', fontSize: '60px', color: '#ffffff', fontStyle: '900' }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    // ドリフトスコア
    this.dsText = this.add.text(12, GAME_H - 26 - this.safeBottom(), 'DRIFT 0', { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffd23f', fontStyle: '700' }).setScrollFactor(0).setDepth(50);
  }
  safeBottom() { return 0; }

  buildDebug() {
    this.dbg = this.add.text(8, GAME_H - 120, '', { fontFamily: 'monospace', fontSize: '10px', color: '#7CFC7C', backgroundColor: '#000a' }).setScrollFactor(0).setDepth(80);
    this.cpVisible = true;
    this.input.keyboard.on('keydown-R', () => this.scene.restart({ courseId: this.courseId, difficulty: this.difficulty }));
    this.input.keyboard.on('keydown-G', () => { this.cpIndex = this.course.checkpoints.length; const f = this.course.finishLine; this.car.x = (f.a.x + f.b.x) / 2 - 1; this.car.y = (f.a.y + f.b.y) / 2 - 1; });
    this.input.keyboard.on('keydown-H', () => this.wallHit());
  }

  /* ---------- 入力 ---------- */
  setupInput() {
    this.input.addPointer(2);
    this.steer = { l: false, r: false, last: 0 };
    const recompute = () => {
      let l = false, r = false;
      const ps = this.input.manager.pointers;
      for (const p of ps) {
        if (p && p.isDown) { if (p.x < this.scale.width / 2) l = true; else r = true; }
      }
      this.steer.l = l; this.steer.r = r;
    };
    this.input.on('pointerdown', (p) => { this.steer.last = (p.x < this.scale.width / 2) ? -1 : 1; recompute(); });
    this.input.on('pointermove', recompute);
    this.input.on('pointerup', recompute);
    this.input.on('pointerupoutside', recompute);
    this.input.on('gameout', () => { this.steer.l = this.steer.r = false; });
    // キーボード
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,ESC');
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
  }

  inputSteer() {
    let l = this.steer.l || this.keys.LEFT.isDown || this.keys.A.isDown;
    let r = this.steer.r || this.keys.RIGHT.isDown || this.keys.D.isDown;
    if (l && r) return this.steer.last; // 両押しは最後の側
    if (l) return -1; if (r) return 1; return 0;
  }

  /* ---------- カウントダウン ---------- */
  countdown() {
    let n = 3;
    this.centerText.setText('3'); AU.SE.count();
    const ti = this.time.addEvent({
      delay: 800, repeat: 3, callback: () => {
        n--;
        if (n > 0) { this.centerText.setText(String(n)); this.pop(this.centerText); AU.SE.count(); }
        else if (n === 0) { this.centerText.setText('GO!'); this.pop(this.centerText); AU.SE.go(); }
        else {
          this.centerText.setText('');
          this.state = 'PLAYING';
          this.runStartedAt = this.time.now;
        }
      },
    });
  }
  pop(obj) { obj.setScale(0.5); this.tweens.add({ targets: obj, scale: 1, duration: 200, ease: 'Back.out' }); }

  /* ---------- メインループ ---------- */
  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (this.state === 'PLAYING') {
      this.stepCar(dt);
      this.elapsed = this.time.now - this.runStartedAt;
      this.hudTime.setText(fmtTime(this.elapsed));
      this.dsText.setText('DRIFT ' + Math.floor(this.car.driftScore));
      // lookahead camera offset
      const f = P.vecFromAngle(this.car.angle);
      this.cameras.main.setFollowOffset(-f.x * this.lookahead, -f.y * this.lookahead);
    }
    if (this.debug && this.dbg) this.updateDebug();
  }

  stepCar(dt) {
    const car = this.car, cfg = this.cfg;
    car.prevX = car.x; car.prevY = car.y;
    // ステア入力
    const inS = this.inputSteer();
    car.steer = P.moveToward(car.steer || 0, inS, cfg.steerReturnSpeed * dt);
    // 旋回（止まっていても少し曲がれるよう下限を設ける）
    const sp0 = Math.hypot(car.vx, car.vy);
    const turnRate = car.steer * cfg.steerStrength * (0.45 + 0.75 * Math.min(1, sp0 / cfg.maxSpeed));
    car.angle += turnRate * dt;
    // ★氷上モデル：エンジンは車体の向きへ推進、横方向の慣性はほぼ残る
    const fwd = P.vecFromAngle(car.angle);
    car.vx += fwd.x * cfg.acceleration * dt;
    car.vy += fwd.y * cfg.acceleration * dt;
    // 横滑り成分をほんの少しだけ戻す（iceGrip≒0 ＝ ツルツル）
    const fdot = car.vx * fwd.x + car.vy * fwd.y;
    const latx = car.vx - fwd.x * fdot, laty = car.vy - fwd.y * fdot;
    car.vx -= latx * cfg.iceGrip; car.vy -= laty * cfg.iceGrip;
    // 慣性を保つ弱い摩擦
    car.vx *= cfg.friction; car.vy *= cfg.friction;
    // 最高速で頭打ち
    let sp = Math.hypot(car.vx, car.vy);
    if (sp > cfg.maxSpeed) { const m = cfg.maxSpeed / sp; car.vx *= m; car.vy *= m; sp = cfg.maxSpeed; }
    car.speed = sp;
    // 移動
    car.x += car.vx * dt; car.y += car.vy * dt;
    // ドリフト角＝車体の向きと進行方向の差（氷上なので常に大きく出る）
    const vmag = Math.hypot(car.vx, car.vy) || 0.0001;
    const travel = Math.atan2(car.vy, car.vx);
    let dsigned = P.angleDiff(car.angle, travel);
    car.drift = Math.abs(dsigned);
    // ★スピン防止＝持続ドリフト：車体の向きが進行方向から離れすぎたら緩く戻す。
    // これにより「一度切ると車体が流れたまま滑り続ける」滑らかなドリフトになる。
    const md = cfg.maxDrift || 1.05;
    if (car.drift > md && vmag > 40) {
      car.angle -= Math.sign(dsigned) * (car.drift - md) * 0.35;
      car.drift = md;
    }
    const isDrift = car.drift > cfg.driftThreshold && car.speed > cfg.maxSpeed * 0.18;
    // sprite
    this.sprite.setPosition(car.x, car.y);
    this.sprite.rotation = car.angle + Math.PI / 2;

    // road / wall
    const r = P.isOnRoad({ x: car.x, y: car.y }, this.course, CAR_RADIUS, car.seg);
    if (r.info.seg >= car.seg) car.seg = r.info.seg;
    if (r.on) { car.safeX = car.x; car.safeY = car.y; }
    else {
      if (this.time.now - car.lastHit > 350) this.wallHit(r.info);
    }

    // drift score & marks & sound
    if (isDrift) {
      car.combo += dt; car.comboTime += dt;
      car.driftScore += car.drift * (car.speed / cfg.maxSpeed) * 220 * dt;
      car.maxCombo = Math.max(car.maxCombo, car.combo);
      // marks at rear
      const rx = car.x - fwd.x * 14, ry = car.y - fwd.y * 14;
      this.addMark(rx + (Math.random() * 6 - 3), ry + (Math.random() * 6 - 3));
      this.showDriftLabel(car.combo);
      AU.setSkid(true);
    } else {
      car.combo = 0; this.hideDriftLabel(); AU.setSkid(false);
    }
    AU.setRpm(car.speed / cfg.maxSpeed);

    // checkpoints
    if (this.cpIndex < this.course.checkpoints.length) {
      if (P.isCheckpointReached({ x: car.x, y: car.y }, this.course.checkpoints[this.cpIndex])) this.cpIndex++;
    }
    // finish
    if (this.cpIndex >= this.course.checkpoints.length) {
      if (P.hasCrossedFinish({ x: car.prevX, y: car.prevY }, { x: car.x, y: car.y }, this.course.finishLine)) {
        this.finish();
      }
    }
    // ghost capture (拡張用・軽量)
    if ((this.ghostFrames.length === 0) || (this.elapsed - this.ghostFrames[this.ghostFrames.length - 1].t > 100)) {
      this.ghostFrames.push({ t: this.elapsed, x: car.x, y: car.y, angle: car.angle, speed: car.speed });
    }
  }

  wallHit(info) {
    const car = this.car, cfg = this.cfg;
    car.lastHit = this.time.now;
    car.wallHits++; car.noHit = false; car.combo = 0; car.comboTime = 0;
    // 戻す
    car.x = car.safeX; car.y = car.safeY;
    // 速度ペナルティ（難易度補正）
    const pen = Phaser.Math.Clamp(1 - (1 - cfg.wallSpeedPenalty) * (cfg.wallPenMul || 1), 0.2, 0.9);
    car.speed *= pen;
    // 内側へ弾く
    if (info) {
      const tx = info.cx - car.x, ty = info.cy - car.y, tl = Math.hypot(tx, ty) || 1;
      car.vx = tx / tl * car.speed * cfg.wallBounce;
      car.vy = ty / tl * car.speed * cfg.wallBounce;
    } else { car.vx *= -cfg.wallBounce; car.vy *= -cfg.wallBounce; }
    AU.SE.hit();
    if (this.quality !== 'LOW') this.cameras.main.shake(180, 0.01);
    if (this.sparks) this.sparks.emitParticleAt(car.x, car.y, 14);
    this.flashCenter('HIT!');
  }

  showDriftLabel(combo) {
    let label = '';
    if (combo >= 15) label = 'LEGEND DRIFT!';
    else if (combo >= 10) label = 'GREAT DRIFT!';
    else if (combo >= 5) label = 'GOOD DRIFT!';
    if (label && this.driftText.text !== label) {
      this.driftText.setText(label).setAlpha(1);
      this.tweens.killTweensOf(this.driftText);
      this.driftText.setScale(0.7);
      this.tweens.add({ targets: this.driftText, scale: 1, duration: 200, ease: 'Back.out' });
    }
    if (this.driftText.alpha < 1 && combo > 0.3) { this.driftText.setText('DRIFT').setAlpha(0.85); }
  }
  hideDriftLabel() { this.driftText.setAlpha(0); }
  flashCenter(t) {
    const x = this.add.text(GAME_W / 2, GAME_H * 0.5, t, { fontFamily: 'sans-serif', fontSize: '40px', color: '#ff5a5a', fontStyle: '900' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.tweens.add({ targets: x, alpha: 0, y: GAME_H * 0.44, duration: 600, onComplete: () => x.destroy() });
  }

  /* ---------- 一時停止 ---------- */
  // 画面固定の素のボタン（矩形＋テキスト）。カメラが動くGameSceneでも確実にタップできる。
  fixedButton(x, y, w, h, label, fill, color, onClick) {
    const rect = this.add.rectangle(x, y, w, h, fill, 1).setStrokeStyle(2, 0x4ade80, 1)
      .setScrollFactor(0).setDepth(72).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: '18px', color: color || '#eaffea', fontStyle: '800' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(73);
    rect.on('pointerdown', () => { rect.setScale(0.96); });
    rect.on('pointerup', () => { rect.setScale(1); AU.SE.select(); onClick(); });
    rect.on('pointerout', () => { rect.setScale(1); });
    return [rect, txt];
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      AU.setSkid(false); AU.stopEngine();
      const objs = [];
      const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.78)
        .setScrollFactor(0).setDepth(70).setInteractive(); // 背後への貫通タップを防ぐ
      const t = this.add.text(GAME_W / 2, GAME_H / 2 - 150, 'PAUSE', { fontFamily: 'sans-serif', fontSize: '34px', color: '#7CFC7C', fontStyle: '900' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(73);
      objs.push(bg, t);
      objs.push(...this.fixedButton(GAME_W / 2, GAME_H / 2 - 40, 270, 56, '再開', 0x22c55e, '#04210f', () => this.togglePause()));
      objs.push(...this.fixedButton(GAME_W / 2, GAME_H / 2 + 32, 270, 56, 'リスタート', 0x16321f, '#eaffea', () => { this.scene.restart({ courseId: this.courseId, difficulty: this.difficulty }); }));
      objs.push(...this.fixedButton(GAME_W / 2, GAME_H / 2 + 104, 270, 56, 'コース選択へ', 0x10241a, '#eaffea', () => { AU.stopEngine(); AU.setSkid(false); this.scene.start('Title'); }));
      this.pauseObjs = objs;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.pauseObjs) { this.pauseObjs.forEach((o) => o.destroy()); this.pauseObjs = null; }
      AU.startEngine();
    }
  }

  /* ---------- ゴール ---------- */
  finish() {
    if (this.state !== 'PLAYING') return;
    this.state = 'FINISHED';
    AU.setSkid(false); AU.stopEngine();
    const car = this.car, course = this.course;
    const clearTimeMs = Math.round(this.elapsed);
    const noHitClear = car.wallHits === 0;
    // スコア
    const baseScore = 100000;
    const timePenalty = clearTimeMs / 10;
    const wallPenalty = car.wallHits * 5000;
    const driftBonus = Math.floor(car.driftScore);
    const noHitBonus = noHitClear ? 30000 : 0;
    const targetBonus = clearTimeMs <= course.targetTimeMs ? 20000 : 0;
    const totalScore = Math.max(0, Math.floor(baseScore - timePenalty - wallPenalty + driftBonus + noHitBonus + targetBonus));
    // ランク
    let rank = 'C';
    if (car.wallHits >= 5) rank = 'D';
    else if (noHitClear && clearTimeMs <= course.targetTimeMs) rank = 'S';
    else if (clearTimeMs <= course.targetTimeMs) rank = 'A';
    else if (clearTimeMs <= course.targetTimeMs * 1.2) rank = 'B';
    const result = {
      courseId: course.id, courseName: course.name, difficulty: this.difficulty,
      clearTimeMs, wallHits: car.wallHits, maxCombo: car.maxCombo,
      driftScore: driftBonus, totalScore, noHitClear, rank,
      targetTimeMs: course.targetTimeMs, createdAt: new Date().toISOString(),
    };
    this.scene.start('Result', result);
  }

  updateDebug() {
    const c = this.car;
    this.dbg.setText([
      'fps ' + Math.round(this.game.loop.actualFps),
      'speed ' + c.speed.toFixed(0) + '/' + this.cfg.maxSpeed.toFixed(0),
      'drift ' + c.drift.toFixed(2) + (c.drift > this.cfg.driftThreshold ? ' DRIFT' : ''),
      'wallHits ' + c.wallHits,
      'cp ' + this.cpIndex + '/' + this.course.checkpoints.length,
      'pos ' + c.x.toFixed(0) + ',' + c.y.toFixed(0),
      'steer ' + (c.steer || 0).toFixed(2),
    ].join('\n'));
  }
}
