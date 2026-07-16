const LEGACY_STORAGE_KEY = "winnie-favorite-products";
export const GUEST_FAVORITES_OWNER = "guest";

const memoryStorage = new Map();

export function getFavoriteProductId(product = {}) {
  return String(product?.id || product?._id || product?.productId || product?.slug || product?.name || "");
}

export function getFavoriteOwnerId(user) {
  return String(user?.id || user?._id || user?.userId || GUEST_FAVORITES_OWNER);
}

function getStorageKey(ownerId) {
  const normalizedOwnerId = String(ownerId || GUEST_FAVORITES_OWNER);
  return `favorites_${normalizedOwnerId}`;
}

function createProductSnapshot(product) {
  try {
    return JSON.parse(JSON.stringify(product, (_key, value) => {
      if (typeof value === "function" || typeof value === "symbol") return undefined;
      if (typeof value === "bigint") return String(value);
      return value;
    }));
  } catch {
    return Object.fromEntries(
      Object.entries(product || {}).filter(([, value]) => typeof value !== "function" && typeof value !== "symbol"),
    );
  }
}

function normalizeFavorites(products) {
  if (!Array.isArray(products)) return [];

  const uniqueProducts = new Map();
  products.forEach((product) => {
    const productId = getFavoriteProductId(product);
    if (productId && !uniqueProducts.has(productId)) {
      uniqueProducts.set(productId, createProductSnapshot(product));
    }
  });

  return [...uniqueProducts.values()];
}

function readStorageValue(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const rawValue = window.localStorage.getItem(key);
      if (rawValue !== null) memoryStorage.set(key, rawValue);
      return rawValue;
    }
  } catch {
    // Fall back to memory when storage is blocked or unavailable.
  }

  return memoryStorage.get(key) ?? null;
}

function writeStorageValue(key, value) {
  memoryStorage.set(key, value);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // The in-memory copy keeps favorites working for the current session.
  }
}

function removeStorageValue(key) {
  memoryStorage.delete(key);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore removal failures; the active session copy has already been cleared.
  }
}

function readFavoritesByKey(key) {
  const rawValue = readStorageValue(key);
  if (!rawValue) return [];

  try {
    return normalizeFavorites(JSON.parse(rawValue));
  } catch {
    removeStorageValue(key);
    return [];
  }
}

function writeFavorites(ownerId, products) {
  const favorites = normalizeFavorites(products);
  writeStorageValue(getStorageKey(ownerId), JSON.stringify(favorites));
  return favorites;
}

class FavoriteService {
  addFavorite(ownerId, product) {
    const productId = getFavoriteProductId(product);
    const current = this.getAllFavorites(ownerId);
    if (!productId || current.some((item) => getFavoriteProductId(item) === productId)) {
      return { changed: false, favorites: current, isFavorite: Boolean(productId) };
    }

    const favorites = writeFavorites(ownerId, [createProductSnapshot(product), ...current]);
    return { changed: true, favorites, isFavorite: true };
  }

  removeFavorite(ownerId, productOrId) {
    const productId = typeof productOrId === "object"
      ? getFavoriteProductId(productOrId)
      : String(productOrId || "");
    const current = this.getAllFavorites(ownerId);
    if (!productId) return { changed: false, favorites: current, isFavorite: false };

    const favorites = current.filter((item) => getFavoriteProductId(item) !== productId);
    if (favorites.length === current.length) {
      return { changed: false, favorites: current, isFavorite: false };
    }

    return { changed: true, favorites: writeFavorites(ownerId, favorites), isFavorite: false };
  }

  toggleFavorite(ownerId, product) {
    return this.isFavorite(ownerId, product)
      ? this.removeFavorite(ownerId, product)
      : this.addFavorite(ownerId, product);
  }

  isFavorite(ownerId, productOrId) {
    const productId = typeof productOrId === "object"
      ? getFavoriteProductId(productOrId)
      : String(productOrId || "");
    return Boolean(productId) && this.getAllFavorites(ownerId)
      .some((item) => getFavoriteProductId(item) === productId);
  }

  getAllFavorites(ownerId) {
    return readFavoritesByKey(getStorageKey(ownerId));
  }

  clearFavorites(ownerId) {
    removeStorageValue(getStorageKey(ownerId));
    return [];
  }

  migrateLegacyFavorites(ownerId) {
    const legacyFavorites = readFavoritesByKey(LEGACY_STORAGE_KEY);
    if (!legacyFavorites.length) {
      removeStorageValue(LEGACY_STORAGE_KEY);
      return this.getAllFavorites(ownerId);
    }

    const favorites = writeFavorites(ownerId, [...this.getAllFavorites(ownerId), ...legacyFavorites]);
    removeStorageValue(LEGACY_STORAGE_KEY);
    return favorites;
  }

  mergeFavorites(sourceOwnerId, targetOwnerId, { clearSource = false } = {}) {
    if (String(sourceOwnerId) === String(targetOwnerId)) return this.getAllFavorites(targetOwnerId);

    const sourceFavorites = this.getAllFavorites(sourceOwnerId);
    const favorites = sourceFavorites.length
      ? writeFavorites(targetOwnerId, [...this.getAllFavorites(targetOwnerId), ...sourceFavorites])
      : this.getAllFavorites(targetOwnerId);

    if (clearSource && sourceFavorites.length) this.clearFavorites(sourceOwnerId);
    return favorites;
  }
}

export const favoriteService = new FavoriteService();

