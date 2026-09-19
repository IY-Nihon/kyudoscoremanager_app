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

// 新しい束（/_expo/static/js/web/AppEntry-….js、4MB ほど）を控えたら、前の束は捨てる。
// 束の名前は配信のたびに変わるので、捨てないと配信の数だけ溜まる
const 束の置き場 = '/_expo/static/js/web/';
function 古い束を捨てる(cache, pathname) {
  if (!pathname.startsWith(束の置き場)) return Promise.resolve();
  return cache.keys().then((keys) =>
    Promise.all(
      keys
        .filter((k) => {
          const p = new URL(k.url).pathname;
          return p.startsWith(束の置き場) && p !== pathname;
        })
        .map((k) => cache.delete(k))
    )
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET以外、または外部データAPIへのリクエストは素通し
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (BYPASS_HOSTS.some((host) => url.hostname.includes(host))) return;
  if (url.origin !== self.location.origin) return;

  // 名前に中身の印（ハッシュ）が付いた束と字体・画像（/_expo/static/…、/assets/…）は中身が変わらないので、
  // キャッシュ優先。前はここもネットワーク優先で、電波の弱い端末では 390KB の Ionicons の字体を毎回
  // 取り寄せ直し、12 秒で諦めた Icon が「12000ms timeout exceeded」「A network error occurred.」を
  // 9 月に 47 通送ってきた（src/iconFont.js）。キャッシュに無いときだけ取りに行き、取れたら控える
  if (url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone).then(() => 古い束を捨てる(cache, url.pathname)));
            }
            return response;
          })
      )
    );
    return;
  }

  // それ以外のアプリ本体（index.html・sw.js・manifest など）: ネットワーク優先、失敗時はキャッシュにフォールバック
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
