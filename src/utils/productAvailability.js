export function isProductVisibleInStore(product = {}) {
  // Active products are always visible in the store.
  // The visibleInStore / visible flags from the backend are only consulted
  // when the product is explicitly inactive, so that an enabled product is
  // never silently hidden due to a stale or missing backend flag.
  if (product.isActive !== false) return true;
  return product.visibleInStore !== false && product.visible !== false;
}

export function isProductUnavailable(product = {}) {
  return product.isPurchasable === false
    || product.isActive === false
    || product.isPaused === true
    || product.paused === true
    || product.status === "unavailable";
}

export function canPurchaseProduct(product = {}) {
  return isProductVisibleInStore(product) && !isProductUnavailable(product);
}
