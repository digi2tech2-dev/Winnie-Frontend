const STORAGE_KEY = "winnie:admin:fazercards:retrieved-catalogs:v1";
const CHANGE_EVENT = "winnie:fazercards-catalogs-change";

const safeText = (value) => String(value ?? "").trim();

function normalizeFieldKey(value, index = 0) {
  const normalized = safeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "");
  return normalized || `field_${index + 1}`;
}

export function isFazerCardsProvider(provider = {}) {
  const code = safeText(provider.providerCode || provider.code).toUpperCase().replace(/[-\s]+/g, "_");
  const slug = safeText(provider.slug).toLowerCase();
  const name = safeText(provider.name || provider.displayName).toLowerCase().replace(/\s+/g, "");
  return code === "FAZER_CARDS" || code === "FAZERCARDS" || slug === "fazer-cards" || name === "fazercards";
}

export function getFazerCardsCatalogFromProduct(product = {}) {
  const category = safeText(product.category || product.categoryLabel || product.categoryName);
  const name = safeText(product.categoryName || product.categoryLabel || product.category) || "كتالوج بدون اسم";
  const familyKey = safeText(product.familyKey).toUpperCase();
  const keySource = category || name;

  return {
    category: category || name,
    familyKey,
    key: `${familyKey || "CATALOG"}:${keySource.toLocaleLowerCase("en")}`,
    name,
    offerCount: 0,
  };
}

export function groupFazerCardsCatalogs(products = []) {
  const grouped = new Map();

  products.forEach((product) => {
    const catalog = getFazerCardsCatalogFromProduct(product);
    const current = grouped.get(catalog.key);
    if (current) {
      current.offerCount += 1;
      current.offerIds.add(product.offerId || product.id);
      return;
    }

    grouped.set(catalog.key, {
      ...catalog,
      offerCount: 1,
      offerIds: new Set([product.offerId || product.id]),
    });
  });

  return Array.from(grouped.values())
    .map(({ offerIds, ...catalog }) => ({ ...catalog, offerCount: offerIds.size }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function readRetrievedFazerCardsCatalogs() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((catalog) => catalog && catalog.key && catalog.name && catalog.category)
      : [];
  } catch {
    return [];
  }
}

export function saveRetrievedFazerCardsCatalog(catalog) {
  if (typeof window === "undefined" || !catalog?.key) return [];
  const current = readRetrievedFazerCardsCatalogs();
  const nextCatalog = {
    category: safeText(catalog.category || catalog.name),
    familyKey: safeText(catalog.familyKey).toUpperCase(),
    key: safeText(catalog.key),
    name: safeText(catalog.name),
    offerCount: Math.max(0, Number(catalog.offerCount) || 0),
    retrievedAt: catalog.retrievedAt || new Date().toISOString(),
  };
  const next = [nextCatalog, ...current.filter((item) => item.key !== nextCatalog.key)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  return next;
}

export function removeRetrievedFazerCardsCatalog(catalogKey) {
  if (typeof window === "undefined") return [];
  const next = readRetrievedFazerCardsCatalogs().filter((catalog) => catalog.key !== catalogKey);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  return next;
}

export function subscribeToFazerCardsCatalogs(listener) {
  if (typeof window === "undefined") return () => {};
  const handleChange = (event) => listener(event.detail || readRetrievedFazerCardsCatalogs());
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function normalizeFazerCardsOrderFields(fields = []) {
  return (Array.isArray(fields) ? fields : [])
    .map((field, index) => {
      const key = normalizeFieldKey(field.key || field.name || field.id || field.label, index);
      const options = Array.isArray(field.options)
        ? field.options.map((option) => typeof option === "object" ? option.label || option.value || option.name : option).filter(Boolean)
        : [];
      const rawType = safeText(field.type).toLowerCase();
      const type = rawType === "number" || rawType === "integer" || rawType === "numeric"
        ? "number"
        : rawType === "select" || rawType === "dropdown" || options.length
          ? "select"
          : ["email", "tel", "url", "date", "textarea"].includes(rawType) ? rawType : "text";

      return {
        active: field.isActive !== false && field.active !== false,
        id: `provider-${key}`,
        key,
        label: safeText(field.label || field.name || field.key) || `حقل العميل ${index + 1}`,
        max: field.max ?? "",
        min: field.min ?? "",
        options,
        optionsText: options.join("\n"),
        placeholder: safeText(field.placeholder),
        required: field.required !== false,
        sortOrder: Number.isFinite(Number(field.sortOrder)) ? Number(field.sortOrder) : index,
        type,
      };
    })
    .filter((field) => field.key && field.label);
}

export function mergeFazerCardsOrderFields(currentFields = [], providerFields = []) {
  const current = Array.isArray(currentFields) ? currentFields : [];
  const existingKeys = new Set(current.map((field, index) => normalizeFieldKey(field.key || field.name || field.label, index)));
  return [...current, ...providerFields.filter((field) => !existingKeys.has(field.key))];
}
