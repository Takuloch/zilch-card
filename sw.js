/* ZILCH CARD ONLINE — Service Worker
   方針：HTML/コードは必ず最新を取りに行く（network-first）。
   音楽(mp3)は重いのでキャッシュ優先（cache-first）。
   これによりホーム画面アプリでも毎回最新のゲームが読み込まれ、
   オフライン時は前回のキャッシュで起動する。 */
const CACHE = 'zilch-cache-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('.mp3')) {
    // 音楽：キャッシュ優先
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
  } else {
    // HTML/その他：ネット優先（最新を取得）→ 失敗時はキャッシュ
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
