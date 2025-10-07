const CACHE_NAME = "fit-course-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install - precache
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch - cache-first for app shell, network-first for others
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Simple strategy: try cache, otherwise network
  event.respondWith(
    caches
      .match(req)
      .then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            // optionally cache fetched assets:
            return res;
          })
      )
      .catch(() => caches.match("/"))
  );
});
