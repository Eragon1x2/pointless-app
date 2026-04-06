self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Удаляем все старые кэши (исправляем ловушку, когда закэшировался старый HTML,
  // который ищет уже удаленные JS-файлы на сервере)
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Полностью "passthrough" стратегия — никаких мертвых кэшей.
  // Только сеть, благодаря чему PWA все равно признается валидным.
  e.respondWith(
    fetch(e.request).catch((err) => {
       console.warn('SW Network request failed:', e.request.url);
       throw err;
    })
  );
});
