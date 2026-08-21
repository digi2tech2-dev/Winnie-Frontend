import { absoluteSiteUrl, SITE_NAME } from "../config/site";

export function slugifySeo(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function getProductPath(product = {}) {
  const id = product.id || product._id;
  if (!id) return "";
  const slug = slugifySeo(product.name || product.title);
  return `/products/${encodeURIComponent(String(id))}${slug ? `/${encodeURIComponent(slug)}` : ""}`;
}

export function cleanSeoText(value = "", maxLength = 160) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path),
    })),
  };
}

export function buildProductSchema(product = {}, productPath = getProductPath(product)) {
  const numericPrice = Number(product.displayPrice ?? product.priceValue ?? product.finalPrice);
  const hasPrice = Number.isFinite(numericPrice) && numericPrice >= 0;
  const availability = product.isPurchasable === false || product.status === "unavailable"
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteSiteUrl(productPath)}#product`,
    name: product.name || product.title,
    description: cleanSeoText(product.description || `${product.name || product.title} متوفر عبر ${SITE_NAME}.`, 500),
    sku: String(product.id || product._id || ""),
    category: product.categoryTitle || undefined,
    image: product.image ? [absoluteSiteUrl(product.image)] : undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    url: absoluteSiteUrl(productPath),
  };

  if (hasPrice) {
    schema.offers = {
      "@type": "Offer",
      url: absoluteSiteUrl(productPath),
      price: numericPrice.toFixed(2),
      priceCurrency: String(product.displayCurrency || "USD").toUpperCase(),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    };
  }

  return schema;
}

export function buildItemListSchema(items = [], name = "Winnie HUB catalog") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name || item.title,
      url: absoluteSiteUrl(getProductPath(item)),
    })),
  };
}

