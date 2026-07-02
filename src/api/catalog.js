import { apiRequest } from "./client";
import {
  asArray,
  DEFAULT_CURRENCY,
  formatCurrency,
  getItemId,
  humanizeToken,
  normalizePagination,
  resolveBackendAssetUrl,
  toNumber,
} from "./adapters";

const toneClasses = [
  "from-[#7C3AED] via-[#8B5CF6] to-[#38BDF8]",
  "from-[#0EA5E9] via-[#2563EB] to-[#7C3AED]",
  "from-[#EC4899] via-[#A855F7] to-[#2563EB]",
  "from-[#F59E0B] via-[#F97316] to-[#7C3AED]",
  "from-[#22C55E] via-[#14B8A6] to-[#2563EB]",
  "from-[#64748B] via-[#334155] to-[#111827]",
];

const iconByCategoryText = [
  ["game", "Gamepad2"],
  ["pubg", "Crosshair"],
  ["social", "UsersRound"],
  ["media", "Share2"],
  ["gift", "Gift"],
  ["card", "Gift"],
  ["subscription", "Crown"],
  ["voice", "Mic2"],
  ["chat", "MessageCircle"],
  ["ai", "Bot"],
  ["wallet", "WalletCards"],
];

function pickTone(seed = "") {
  const text = String(seed || "");
  const total = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return toneClasses[total % toneClasses.length];
}

function pickIcon(text = "") {
  const normalized = String(text || "").toLowerCase();
  return iconByCategoryText.find(([keyword]) => normalized.includes(keyword))?.[1] || "ShoppingBag";
}

export function normalizeCategory(category = {}, index = 0) {
  const id = getItemId(category, category.slug || `category-${index}`);
  const title = category.name || category.title || category.nameAr || "Untitled category";
  const parentId = category.parentCategory?._id || category.parentCategory || null;

  return {
    ...category,
    id,
    _id: category._id ?? id,
    title,
    name: category.name || title,
    nameAr: category.nameAr || "",
    slug: category.slug || id,
    subtitle: category.description || category.subtitle || "",
    image: resolveBackendAssetUrl(category.image),
    parentCategory: parentId,
    sortOrder: toNumber(category.sortOrder, index),
    isActive: category.isActive !== false,
    icon: category.icon || pickIcon(`${title} ${category.slug || ""}`),
    tone: category.tone || pickTone(`${id}${title}`),
  };
}

export function normalizeProduct(product = {}, index = 0, categoryLookup = new Map()) {
  const id = getItemId(product, `product-${index}`);
  const categoryValue = product.category?._id || product.category || "";
  const category = categoryLookup.get(String(categoryValue)) || categoryLookup.get(String(product.categorySlug || ""));
  const displayCurrency = String(product.displayCurrency || product.currency || DEFAULT_CURRENCY).toUpperCase();
  const displayPrice = product.displayPrice ?? product.finalPrice ?? product.sellingPrice ?? product.price ?? product.basePrice;
  const hasDisplayPrice = displayPrice !== undefined && displayPrice !== null && displayPrice !== "";
  const numericPrice = hasDisplayPrice ? toNumber(displayPrice, 0) : null;
  const name = product.name || product.title || "Untitled product";
  const categoryTitle = category?.title || product.categoryName || humanizeToken(categoryValue, "Catalog");

  return {
    ...product,
    id,
    _id: product._id ?? id,
    category: categoryValue ? String(categoryValue) : "",
    categoryId: category?.id || (categoryValue ? String(categoryValue) : ""),
    categorySlug: category?.slug || "",
    categoryTitle,
    cover: product.cover || pickTone(`${id}${name}`),
    description: product.description || "",
    displayCurrency,
    displayPrice: numericPrice,
    displayPriceLabel: hasDisplayPrice ? formatCurrency(numericPrice, displayCurrency) : "",
    icon: product.icon || pickIcon(`${name} ${categoryTitle}`),
    image: resolveBackendAssetUrl(product.image),
    isActive: product.isActive !== false,
    maxQty: toNumber(product.maxQty, 999),
    minQty: toNumber(product.minQty, 1),
    name,
    price: hasDisplayPrice ? formatCurrency(numericPrice, displayCurrency) : "",
    priceValue: numericPrice,
    tone: product.tone || pickTone(`${name}${categoryTitle}`),
  };
}

function buildCategoryLookup(categories) {
  const lookup = new Map();

  categories.forEach((category) => {
    lookup.set(String(category.id), category);
    lookup.set(String(category._id), category);
    lookup.set(String(category.slug), category);
    lookup.set(String(category.name), category);
  });

  return lookup;
}

export async function getCategories() {
  const response = await apiRequest("/categories");
  return asArray(response.data?.categories || response.data).map(normalizeCategory);
}

export async function getCustomerProducts(token, query = {}) {
  const response = await apiRequest("/me/products", {
    token,
    query: {
      limit: 100,
      ...query,
    },
  });

  const products = asArray(response.data).map((product, index) => normalizeProduct(product, index));

  return {
    products,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit || 100,
      total: products.length,
    }),
    message: response.message,
  };
}

export async function getCustomerProduct(token, productId) {
  const response = await apiRequest(`/me/products/${productId}`, { token });
  return normalizeProduct(response.data || {});
}

export async function getCustomerCatalog(token, query = {}) {
  const [categories, productResult] = await Promise.all([
    getCategories(),
    getCustomerProducts(token, query),
  ]);
  const lookup = buildCategoryLookup(categories);
  const products = productResult.products.map((product, index) => normalizeProduct(product, index, lookup));

  return {
    categories,
    products,
    pagination: productResult.pagination,
  };
}

export async function getPublicCatalog(query = {}) {
  const response = await apiRequest("/public/catalog", {
    query: {
      limit: 100,
      ...query,
    },
  });
  const categories = asArray(response.data?.categories || response.categories).map(normalizeCategory);
  const lookup = buildCategoryLookup(categories);
  const products = asArray(response.data?.products || response.products).map((product, index) =>
    normalizeProduct(product, index, lookup),
  );

  return {
    categories,
    products,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit || 100,
      total: products.length,
    }),
  };
}

export function filterProductsByCategory(products, category) {
  if (!category) return [];
  const accepted = new Set([
    String(category.id || ""),
    String(category._id || ""),
    String(category.slug || ""),
    String(category.name || ""),
    String(category.title || ""),
  ].filter(Boolean));

  return products.filter((product) => {
    const values = [
      product.category,
      product.categoryId,
      product.categorySlug,
      product.categoryTitle,
      product.categoryName,
    ].map((value) => String(value || ""));

    return values.some((value) => accepted.has(value));
  });
}
