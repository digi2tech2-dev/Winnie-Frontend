export function isProductVisibleInStore(product = {}) {
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
