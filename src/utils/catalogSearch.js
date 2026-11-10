export function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

const categorySearchText = (category = {}) => [
  category.title,
  category.name,
  category.nameAr,
  category.slug,
  category.id,
  category._id,
  category.compatCategoryId,
].filter(Boolean).join(" ");

const getCategoryParentId = (category = {}) => String(
  category.parentId || category.parentCategory?._id || category.parentCategory || "",
);

export function getCategorySearchResults(categories = [], query = "") {
  const term = normalizeSearchValue(query);
  if (!term) return [];
  const activeCategoryIds = new Set(categories
    .filter((category) => category.isActive !== false)
    .flatMap((category) => [category.id, category._id, category.slug].filter(Boolean).map(String)));

  return categories
    .filter((category) => (
      category.isActive !== false
      && (!getCategoryParentId(category) || activeCategoryIds.has(getCategoryParentId(category)))
      && normalizeSearchValue(categorySearchText(category)).includes(term)
    ))
    .sort((left, right) => {
      const rank = (category) => {
        const values = categorySearchText(category).split(" ").map(normalizeSearchValue);
        return values.includes(term) ? 0 : values.some((value) => value.startsWith(term)) ? 1 : 2;
      };
      const leftExact = rank(left);
      const rightExact = rank(right);
      const leftLevel = getCategoryParentId(left) ? 0 : 1;
      const rightLevel = getCategoryParentId(right) ? 0 : 1;
      return leftLevel - rightLevel
        || leftExact - rightExact
        || String(left.title || left.name || "").localeCompare(String(right.title || right.name || ""));
    })
    .slice(0, 24);
}

export function getCatalogSearchResults(categories = [], products = [], query = "") {
  const term = normalizeSearchValue(query);
  if (!term) return { categories: [], products: [] };

  const mainCategoryIds = new Set(categories
    .filter((category) => !category.parentId && !category.parentCategory)
    .flatMap((category) => [category.id, category._id, category.slug].filter(Boolean).map(String)));

  return {
    categories: getCategorySearchResults(categories, query).slice(0, 12),
    products: products.filter((product) =>
      product.isActive !== false
      && !product.subCategoryId
      && mainCategoryIds.has(String(product.categoryId || product.category || product.mainCategoryId || ""))
      && normalizeSearchValue(`${product.name || product.title} ${product.nameAr || ""}`).includes(term),
    ).slice(0, 12),
  };
}
