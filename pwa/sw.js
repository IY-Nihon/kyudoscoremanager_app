// 弓道部的中ノート用 Service Worker
// 目的: アプリ本体（HTML/JS/CSS）だけをキャッシュして起動を速くする / 完全オフライン時でも起動できるようにする。
// データ通信（Firebase等）には一切介入しない。データのオフライン対応はFirestoreのオフライン永続化に任せる。

const CACHE_NAME = 'kyudo-app-shell-v1';

// Firebase / Google APIs などデータ通信系は素通し（キャッシュ対象外）にするためのホスト名リスト
const BYPASS_HOSTS = [
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firebasestorage.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.googleapis.com',
  'firebaseremoteconfig.googleapis.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET以外、または外部データAPIへのリクエストは素通し
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (BYPASS_HOSTS.some((host) => url.hostname.includes(host))) return;
  if (url.origin !== self.location.origin) return;

  // アプリ本体（同一オリジンの静的ファイル）: ネットワーク優先、失敗時はキャッシュにフォールバック
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  );
});
