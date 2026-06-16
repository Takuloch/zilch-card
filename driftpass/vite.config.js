// vite.config.js
// 注意：現状のゲームはビルド不要で動作します（index.html + src/*.js + phaser.min.js）。
// Node環境がある場合のみ、Viteで開発サーバ/最適化ビルドが可能です。
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', target: 'es2018' },
});
