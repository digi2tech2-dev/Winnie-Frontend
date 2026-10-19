const normalizedText = (value) => String(value || "").trim().toLocaleLowerCase();

export function getCatalogSearchResults(categories = [], products = [], query = "") {
  const term = normalizedText(query);
  if (!term) return { categories: [], products: [] };

  const mainCategoryIds = new Set(categories
    .filter((category) => !category.parentId && !category.parentCategory)
    .flatMap((category) => [category.id, category._id, category.slug].filter(Boolean).map(String)));

  return {
    categories: categories.filter((category) =>
      (category.parentId || category.parentCategory)
      && category.isActive !== false
      && normalizedText(`${category.title || category.name} ${category.nameAr || ""}`).includes(term),
    ).slice(0, 12),
    products: products.filter((product) =>
      product.isActive !== false
      && !product.subCategoryId
      && mainCategoryIds.has(String(product.categoryId || product.category || product.mainCategoryId || ""))
      && normalizedText(`${product.name || product.title} ${product.nameAr || ""}`).includes(term),
    ).slice(0, 12),
  };
}
