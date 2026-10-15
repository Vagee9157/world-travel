// 网络优先：有网拿最新内容，没网用上次缓存的；联网打开过一次就能离线看
const CACHE = 'world-travel-v11';
const CORE = ['./', 'index.html', 'assets/css/style.css?v=11', 'assets/data/index.js?v=11', 'assets/js/app.js?v=11', 'assets/js/globe.js?v=11', 'assets/vendor/d3-array.min.js', 'assets/vendor/d3-geo.min.js', 'assets/vendor/topojson-client.min.js', 'assets/data/countries-110m.json?v=1', 'assets/data/japan.js?v=11', 'assets/data/korea.js?v=11', 'assets/data/guangzhou.js?v=11', 'assets/data/eastasia-land-50m.json?v=1', 'assets/icon.svg', 'assets/apple-touch-icon.png', 'manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((r) => r || caches.match('index.html')))
  );
});
