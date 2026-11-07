const CACHE_NAME = "e-connect-cache-v1";
const urlsToCache = ["./", "./index.html", "./manifest.json", "./logo.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(urlsToCache.map((u) => cache.add(u).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Never touch API calls (POST to Apps Script), Razorpay, Drive images or any other site
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Page navigations: network first, cache only as offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Static files (logo, icons, manifest): cache first
  event.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
