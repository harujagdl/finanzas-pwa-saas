const CACHE_VERSION = "v1.0.1"; // actualizar en cada deploy
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

const isIndexRequest = (request) => {
  if (request.mode === "navigate") return true;
  const url = new URL(request.url);
  return url.origin === self.location.origin && (url.pathname === "/" || url.pathname === "/index.html");
};

const isCacheableStaticAsset = (request) => {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (STATIC_ASSETS.includes(url.pathname)) return true;
  return /\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/.test(url.pathname);
};

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== STATIC_CACHE ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isIndexRequest(event.request)) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put("/index.html", networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match("/index.html");
          if (cachedResponse) return cachedResponse;
          return caches.match(event.request);
        }
      })()
    );
    return;
  }

  if (isCacheableStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => cached);
      })
    );
  }
});
