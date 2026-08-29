export function getBestSellingScore(product = {}) {
  // Backends have used a few names for the same counter over time. Normalize
  // all of them here so the public and customer lists stay correctly ranked
  // even when an older API deployment is serving the response.
  const keys = [
    "salesCount", "ordersCount", "soldCount", "purchaseCount", "totalSold",
    "totalSales", "totalOrders", "sold", "sales", "orders", "purchases",
    "unitsSold", "salesVolume", "popularity", "rating",
  ];
  const metrics = product.metrics && typeof product.metrics === "object" ? product.metrics : {};
  return keys.reduce((score, key) => {
    const value = Number(product[key] ?? metrics[key]);
    return Number.isFinite(value) ? Math.max(score, value) : score;
  }, 0);
}

export function sortProductsByBestSelling(products = []) {
  return products
    .map((product, index) => ({ product, index, score: getBestSellingScore(product) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product);
}
