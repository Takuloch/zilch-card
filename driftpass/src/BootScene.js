// BootScene.js — 初期化のみ
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    this.scene.start('Preload');
  }
}
