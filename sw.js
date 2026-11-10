// Service Worker - سیستەمێ دوکانێ
// دەمێ فایلێن سیستەمی دگۆڕی، ژمارا V بگۆڕە (مثلا shop-v2) دا ئامیر نوی بکەنەڤە.
const V = 'shop-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(CORE);
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  // لاپەڕا سەرەکی: ئینتەرنێت هەبیت نوی دهێت، نەبیت ژ ناڤ ئامیری
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone();
      caches.open(V).then(c => c.put('./index.html', cp));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // فایل و کتێبخانە: ژ ناڤ ئامیری ئێکسەر، و ل پشت نوی دبن
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const cp = res.clone();
        caches.open(V).then(c => c.put(r, cp));
      }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
