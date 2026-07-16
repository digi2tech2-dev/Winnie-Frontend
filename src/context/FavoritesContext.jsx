import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { favoriteService, getFavoriteOwnerId, getFavoriteProductId, GUEST_FAVORITES_OWNER } from "../services/favoriteService";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const ownerId = getFavoriteOwnerId(user);
  const [favorites, setFavorites] = useState(() => favoriteService.getAllFavorites(ownerId));

  useEffect(() => {
    favoriteService.migrateLegacyFavorites(ownerId);

    const nextFavorites = ownerId === GUEST_FAVORITES_OWNER
      ? favoriteService.getAllFavorites(ownerId)
      : favoriteService.mergeFavorites(GUEST_FAVORITES_OWNER, ownerId, { clearSource: true });

    setFavorites(nextFavorites);
  }, [ownerId]);

  const addFavorite = useCallback((product) => {
    const result = favoriteService.addFavorite(ownerId, product);
    setFavorites(result.favorites);
    return result.isFavorite;
  }, [ownerId]);

  const removeFavorite = useCallback((productOrId) => {
    const result = favoriteService.removeFavorite(ownerId, productOrId);
    setFavorites(result.favorites);
    return result.isFavorite;
  }, [ownerId]);

  const toggleFavorite = useCallback((product) => {
    const result = favoriteService.toggleFavorite(ownerId, product);
    setFavorites(result.favorites);
    return result.isFavorite;
  }, [ownerId]);

  const isFavorite = useCallback(
    (product) => {
      const productId = getFavoriteProductId(product);
      return Boolean(productId) && favorites.some((item) => getFavoriteProductId(item) === productId);
    },
    [favorites],
  );

  const clearFavorites = useCallback(() => {
    setFavorites(favoriteService.clearFavorites(ownerId));
  }, [ownerId]);

  const value = useMemo(
    () => ({ addFavorite, clearFavorites, favorites, isFavorite, removeFavorite, toggleFavorite }),
    [addFavorite, clearFavorites, favorites, isFavorite, removeFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}

