const PWA_STATUS_KEYS = ["vite-pwa:offline-ready", "vite-pwa:need-refresh"];

export async function cleanupServiceWorkersAndCaches() {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }

    if (typeof window !== "undefined" && window.localStorage) {
      PWA_STATUS_KEYS.forEach((key) => window.localStorage.removeItem(key));
    }
  } catch (error) {
    console.warn("[service-worker-cleanup] failed", error);
  }
}
