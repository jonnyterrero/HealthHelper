/* Orchids PWA Service Worker */
const CACHE_NAME = "orchids-cache-v2";
const ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/offline"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

// Helpers
const isStaticAsset = (req) => {
  const d = req.destination;
  if (["style", "script", "image", "font"].includes(d)) return true;
  const url = new URL(req.url);
  return url.pathname.startsWith("/_next/static/");
};

const isChartsRoute = (req) => {
  const url = new URL(req.url);
  return ["/analytics", "/skintrack", "/gastro", "/mindtrack"].some((p) => url.pathname.startsWith(p));
};

// Fetch strategies
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  // For navigations use network-first with offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match("/offline")))
    );
    return;
  }

  // Stale-While-Revalidate for static assets (scripts, styles, images, fonts, Next static)
  if (isStaticAsset(req)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => undefined);
        // Return cached immediately if present, else wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Runtime cache for charts-heavy routes (network-first)
  if (isChartsRoute(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Default: cache-first with network fallback and populate cache
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});