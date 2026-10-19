const IMAGE_CACHE = "winnie-images-v1";
const MAX_IMAGES = 120;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((names) => Promise.all(names
      .filter((name) => name.startsWith("winnie-images-") && name !== IMAGE_CACHE)
      .map((name) => caches.delete(name)))),
  ]));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.destination !== "image") return;

  const url = new URL(request.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/uploads/")) return;

  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      event.waitUntil((async () => {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map((key) => cache.delete(key)));
      })());
    }
    return response;
  })());
});
