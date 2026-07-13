export function getBestSellingScore(product = {}) {
  const keys = ["salesCount", "ordersCount", "soldCount", "purchaseCount", "popularity", "rating"];
  return keys.reduce((score, key) => {
    const value = Number(product[key]);
    return Number.isFinite(value) ? Math.max(score, value) : score;
  }, 0);
}

export function sortProductsByBestSelling(products = []) {
  return products
    .map((product, index) => ({ product, index, score: getBestSellingScore(product) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product);
}
