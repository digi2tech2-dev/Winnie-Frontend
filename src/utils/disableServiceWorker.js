const PWA_STATUS_KEYS = ["vite-pwa:offline-ready", "vite-pwa:need-refresh"];
const CLEANUP_VERSION_KEY = "winnie-sw-cleanup-version";
const CLEANUP_VERSION = "2";

export async function cleanupServiceWorkersAndCaches() {
  try {
    if (typeof window !== "undefined" && window.localStorage?.getItem(CLEANUP_VERSION_KEY) === CLEANUP_VERSION) {
      return;
    }

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
      window.localStorage.setItem(CLEANUP_VERSION_KEY, CLEANUP_VERSION);
    }
  } catch (error) {
    console.warn("[service-worker-cleanup] failed", error);
  }
}
