export function getProductCreatedTimestamp(product = {}) {
  if (!product.createdAt) return 0;
  const timestamp = Date.parse(product.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortProductsByNewest(products = []) {
  const uniqueProducts = products.filter((product, index, source) => {
    const key = product.id || product._id || product.slug;
    if (!key) return true;
    return source.findIndex((candidate) => (candidate.id || candidate._id || candidate.slug) === key) === index;
  });

  return uniqueProducts
    .map((product, index) => ({ product, index, timestamp: getProductCreatedTimestamp(product) }))
    .sort((left, right) => right.timestamp - left.timestamp || left.index - right.index)
    .map(({ product }) => product);
}
