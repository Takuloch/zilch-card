// sw.js — DRIFT PASS service worker
// HTML/コードはネット優先（更新を確実に取得）、その他はキャッシュ優先。オフライン対応。
const CACHE = 'driftpass-v5';
const ASSETS = [
  './', './index.html', './phaser.min.js',
  './manifest.webmanifest',
  './src/styles.css', './src/main.js', './src/config.js', './src/types.js',
  './src/storage.js', './src/physics.js', './src/courses.js', './src/audio.js',
  './src/ui.js', './src/BootScene.js', './src/PreloadScene.js',
  './src/TitleScene.js', './src/GameScene.js', './src/ResultScene.js',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  const isCode = /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isCode) {
    // network-first
    e.respondWith(
      fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
  } else {
    // cache-first
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })));
  }
});
