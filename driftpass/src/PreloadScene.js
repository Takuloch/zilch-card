// PreloadScene.js — 画像素材を持たず、Graphicsからテクスチャを生成する
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  create() {
    this.makeCarTexture();
    this.makeDotTextures();
    this.scene.start('Title');
  }

  makeCarTexture() {
    const w = 26, h = 44;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // 影
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(2, 4, w - 2, h - 2, 6);
    // ボディ（グラデ風に2層）
    g.fillStyle(0x2b3a4a, 1); g.fillRoundedRect(0, 0, w - 2, h - 2, 6);
    g.fillStyle(0x3f5a72, 1); g.fillRoundedRect(2, 2, w - 6, h - 8, 5);
    // ノーズ（前方を示す）
    g.fillStyle(0x5b86a8, 1); g.fillTriangle(2, 2, w - 4, 2, (w - 2) / 2, -3 + 5);
    // ウィンドウ
    g.fillStyle(0x0c1820, 1); g.fillRoundedRect(5, 9, w - 12, 13, 3);
    // ヘッドライト
    g.fillStyle(0xfff7d0, 1); g.fillRect(2, 0, 5, 3); g.fillRect(w - 9, 0, 5, 3);
    // テールライト
    g.fillStyle(0xff3030, 1); g.fillRect(2, h - 5, 5, 3); g.fillRect(w - 9, h - 5, 5, 3);
    g.generateTexture('car', w, h);
    g.destroy();
  }

  makeDotTextures() {
    // タイヤ痕
    let g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.5); g.fillCircle(4, 4, 4);
    g.generateTexture('skid', 8, 8); g.destroy();
    // 火花
    g = this.make.graphics({ add: false });
    g.fillStyle(0xffd23f, 1); g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6); g.destroy();
    // 煙
    g = this.make.graphics({ add: false });
    g.fillStyle(0xdfe6ee, 1); g.fillCircle(6, 6, 6);
    g.generateTexture('smoke', 12, 12); g.destroy();
  }
}
