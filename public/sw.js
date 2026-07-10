self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // Ignore cache cleanup errors.
      }

      try {
        await self.registration.unregister();
      } catch {
        // Ignore unregister errors.
      }

      try {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        await Promise.all(
          clients.map((client) => {
            if ("navigate" in client) {
              return client.navigate(client.url);
            }
            return undefined;
          }),
        );
      } catch {
        // Ignore client navigation errors.
      }
    })(),
  );
});

self.addEventListener("fetch", () => {
  // Intentionally do nothing. No caching.
});
