// main.js — Phaser起動エントリ
import { GAME_W, GAME_H } from './config.js';
import { BootScene } from './BootScene.js';
import { PreloadScene } from './PreloadScene.js';
import { TitleScene } from './TitleScene.js';
import { GameScene } from './GameScene.js';
import { ResultScene } from './ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#05070f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  input: { activePointers: 3 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, PreloadScene, TitleScene, GameScene, ResultScene],
};

// eslint-disable-next-line no-new
window.__DRIFT_GAME = new Phaser.Game(config);

// サービスワーカー登録（PWA / オフライン）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
