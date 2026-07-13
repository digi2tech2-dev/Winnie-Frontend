import { createContext, useCallback, useContext, useMemo, useState } from "react";

const storageKey = "winnie-favorite-products";
const FavoritesContext = createContext(null);

function getProductId(product = {}) {
  return String(product.id || product._id || product.productId || product.slug || product.name || "");
}

function readStoredFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(stored) ? stored.filter((product) => getProductId(product)) : [];
  } catch {
    return [];
  }
}

function storeFavorites(products) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(products));
}

function createProductSnapshot(product) {
  return JSON.parse(JSON.stringify(product, (_key, value) => (typeof value === "function" ? undefined : value)));
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(readStoredFavorites);

  const toggleFavorite = useCallback((product) => {
    const productId = getProductId(product);
    if (!productId) return false;

    let nextFavoriteState = false;
    setFavorites((current) => {
      const exists = current.some((item) => getProductId(item) === productId);
      const next = exists
        ? current.filter((item) => getProductId(item) !== productId)
        : [createProductSnapshot(product), ...current];

      nextFavoriteState = !exists;
      storeFavorites(next);
      return next;
    });

    return nextFavoriteState;
  }, []);

  const isFavorite = useCallback(
    (product) => {
      const productId = getProductId(product);
      return Boolean(productId) && favorites.some((item) => getProductId(item) === productId);
    },
    [favorites],
  );

  const value = useMemo(() => ({ favorites, isFavorite, toggleFavorite }), [favorites, isFavorite, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}

