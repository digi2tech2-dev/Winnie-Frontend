import { apiRequest } from "./client";
import {
  DEFAULT_CURRENCY,
  asArray,
  compactObject,
  formatCurrency,
  getItemId,
  normalizePagination,
  resolveBackendAssetUrl,
  toNumber,
} from "./adapters";

const FIELD_TYPES = new Set(["text", "textarea", "number", "select", "url", "email", "tel", "date"]);

function isFileLike(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function toId(value) {
  if (!value) return "";
  if (typeof value === "object") return getItemId(value);
  return String(value);
}

function sanitizeFieldKey(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "");

  return normalized || fallback;
}

function parseOptions(field = {}) {
  if (Array.isArray(field.options)) {
    return [...new Set(field.options.map((option) => String(option || "").trim()).filter(Boolean))];
  }

  return String(field.optionsText || "")
    .split(/[\n,]+/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeExtraFields(fields = []) {
  return asArray(fields)
    .map((field, index) => {
      const label = String(field.label || "").trim() || `Field ${index + 1}`;
      const key = sanitizeFieldKey(field.key || field.name || label, `field_${index + 1}`);
      const type = FIELD_TYPES.has(field.type) ? field.type : "text";
      const options = parseOptions(field);
      const min = numberOrNull(field.min);
      const max = numberOrNull(field.max);
      const isActive = field.isActive !== false && field.active !== false;

      return {
        id: String(field.id || `field_${index + 1}`),
        isActive,
        key,
        label,
        max,
        min,
        options,
        placeholder: field.placeholder || "",
        required: field.required !== false,
        sortOrder: toNumber(field.sortOrder, index),
        type,
      };
    })
    .filter((field) => field.key && field.label);
}

function getProductFields(product = {}) {
  const orderFields = Array.isArray(product.orderFields) ? product.orderFields : [];
  const dynamicFields = Array.isArray(product.dynamicFields) ? product.dynamicFields : [];
  const source = orderFields.length
    ? orderFields.map((field) => ({
        active: field.isActive !== false,
        id: field.id || field.key,
        key: field.key,
        label: field.label,
        max: field.max,
        min: field.min,
        options: field.options || [],
        placeholder: field.placeholder || "",
        required: field.required !== false,
        sortOrder: field.sortOrder,
        type: field.type,
      }))
    : dynamicFields.map((field) => ({
        active: field.isActive !== false,
        id: field.name,
        key: field.name,
        label: field.label,
        max: field.max,
        min: field.min,
        options: field.options || [],
        placeholder: "",
        required: field.required !== false,
        sortOrder: 0,
        type: field.type,
      }));

  return source.map((field, index) => ({
    ...field,
    id: String(field.id || `field_${index + 1}`),
    key: field.key || field.name || "",
    label: field.label || field.key || field.name || `Field ${index + 1}`,
    optionsText: Array.isArray(field.options) ? field.options.join("\n") : "",
    type: FIELD_TYPES.has(field.type) ? field.type : "text",
  }));
}

export function buildAdminCategoryLookup(categories = []) {
  const lookup = new Map();
  categories.forEach((category) => {
    const id = getItemId(category);
    if (!id) return;
    lookup.set(String(id), category);
    if (category._id) lookup.set(String(category._id), category);
    if (category.slug) lookup.set(String(category.slug), category);
    if (category.name) lookup.set(String(category.name), category);
  });
  return lookup;
}

export function normalizeAdminProduct(product = {}, index = 0, categoryLookup = new Map()) {
  const id = getItemId(product, `product-${index}`);
  const categoryId = toId(product.category);
  const category = categoryLookup.get(String(categoryId));
  const parentId = category?.parentId || toId(category?.parentCategory);
  const hasSubCategory = Boolean(category && parentId);
  const isActive = product.isActive !== false;
  const priceValue = toNumber(product.finalPrice ?? product.basePrice ?? product.price, 0);
  const provider = product.provider && typeof product.provider === "object" ? product.provider : null;
  const providerProduct = product.providerProduct && typeof product.providerProduct === "object" ? product.providerProduct : null;
  const isProviderLinked = Boolean(product.provider || product.providerProduct || product.isLinked || product.currentProviderName || product.currentProviderProductName);

  return {
    ...product,
    id,
    _id: product._id ?? id,
    category: categoryId,
    createdAt: product.createdAt || null,
    displayOrder: toNumber(product.displayOrder, index + 1),
    executionType: product.executionType || "manual",
    extraFields: getProductFields(product),
    finalPrice: priceValue,
    finalPriceLabel: formatCurrency(priceValue, "USD", "ar-EG-u-nu-latn"),
    image: resolveBackendAssetUrl(product.image) || "/logo.png",
    isActive,
    isProviderLinked,
    linkType: isProviderLinked ? "automatic" : "manual",
    mainCategoryId: hasSubCategory ? parentId : categoryId,
    max: toNumber(product.maxQty ?? product.max, 1),
    maxQty: toNumber(product.maxQty ?? product.max, 1),
    min: toNumber(product.minQty ?? product.min, 1),
    minQty: toNumber(product.minQty ?? product.min, 1),
    name: product.name || "Untitled product",
    nameAr: product.name || product.nameAr || "Untitled product",
    nameEn: product.nameEn || product.name || "Untitled product",
    originalPrice: toNumber(product.providerPrice ?? product.basePrice ?? product.price, priceValue),
    paused: !isActive,
    providerId: toId(product.provider),
    providerName: provider?.name || product.currentProviderName || "",
    providerProductActive: providerProduct?.isActive === undefined ? null : providerProduct.isActive !== false,
    providerProductExternalId: providerProduct?.externalProductId || "",
    providerProductId: toId(product.providerProduct),
    providerProductLastSyncedAt: providerProduct?.lastSyncedAt || null,
    providerProductMaxQty: providerProduct?.maxQty ?? null,
    providerProductMinQty: providerProduct?.minQty ?? null,
    providerProductName: providerProduct?.translatedName || providerProduct?.rawName || product.currentProviderProductName || "",
    syncPriceWithProvider: product.syncPriceWithProvider !== false,
    pricingMode: product.pricingMode || (isProviderLinked ? "sync" : "manual"),
    status: "available",
    subCategoryId: hasSubCategory ? categoryId : "",
    supplierPrice: toNumber(product.providerPrice, 0),
    visible: isActive,
  };
}

async function uploadAdminProductImage(token, file) {
  if (!isFileLike(file)) return "";

  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest("/upload/products", {
    body: formData,
    token,
  });

  return response.data?.path || "";
}

async function buildProductPayload(token, values = {}) {
  const uploadedImage = await uploadAdminProductImage(token, values.imageFile);
  const image = uploadedImage || values.imagePath || values.image || "";
  const minQty = Math.max(1, toNumber(values.minQty ?? values.min, 1));
  const maxQty = Math.max(minQty, toNumber(values.maxQty ?? values.max, minQty));
  const priceValue = values.basePrice ?? values.finalPrice ?? values.price ?? values.originalPrice;
  const fields = normalizeExtraFields(values.extraFields);
  const isActive = values.isActive ?? (values.visible !== false && values.paused !== true && values.status !== "unavailable");

  return compactObject({
    basePrice: String(Math.max(0, toNumber(priceValue, 0))),
    category: values.subCategoryId || values.mainCategoryId || values.category,
    description: values.description,
    displayOrder: toNumber(values.displayOrder, 0),
    dynamicFields: fields.map((field) => ({
      isActive: field.isActive,
      label: field.label,
      max: field.max,
      min: field.min,
      name: field.key,
      options: field.options,
      required: field.required,
      type: field.type,
    })),
    image: /^data:/i.test(image) ? undefined : image,
    isActive,
    maxQty,
    minQty,
    name: values.nameAr || values.name || values.nameEn,
    orderFields: fields.map((field) => ({
      id: field.id,
      isActive: field.isActive,
      key: field.key,
      label: field.label,
      max: field.max,
      min: field.min,
      options: field.options,
      placeholder: field.placeholder || null,
      required: field.required,
      sortOrder: field.sortOrder,
      type: field.type,
    })),
  });
}

function getProductFromResponse(response = {}) {
  return response.data?.product || response.data || {};
}

export async function getAdminProducts(token, query = {}, categoryLookup = new Map()) {
  const response = await apiRequest("/admin/products", {
    query: compactObject({
      page: query.page || 1,
      limit: query.limit || 200,
    }),
    token,
  });
  const products = asArray(response.data).map((product, index) => normalizeAdminProduct(product, index, categoryLookup));

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page || 1,
      limit: query.limit || 200,
      total: products.length,
    }),
    products,
  };
}

export async function getAdminProduct(token, id, categoryLookup = new Map()) {
  const response = await apiRequest(`/products/${id}`, { token });
  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export async function createAdminProduct(token, values = {}, categoryLookup = new Map()) {
  const payload = await buildProductPayload(token, values);
  const response = await apiRequest("/admin/products", {
    body: payload,
    token,
  });

  const createdProduct = getProductFromResponse(response);
  const createdId = getItemId(createdProduct);

  if (createdId && Array.isArray(payload.dynamicFields) && payload.dynamicFields.length) {
    const dynamicResponse = await apiRequest(`/admin/products/${createdId}`, {
      body: { dynamicFields: payload.dynamicFields },
      method: "PATCH",
      token,
    });

    return {
      message: dynamicResponse.message || response.message,
      product: normalizeAdminProduct(getProductFromResponse(dynamicResponse), 0, categoryLookup),
    };
  }

  return {
    message: response.message,
    product: normalizeAdminProduct(createdProduct, 0, categoryLookup),
  };
}

export async function updateAdminProduct(token, id, values = {}, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${id}`, {
    body: await buildProductPayload(token, values),
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export async function toggleAdminProduct(token, id, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${id}/toggle`, {
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export async function deleteAdminProduct(token, id, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${id}`, {
    method: "DELETE",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export function normalizeProductProviderOption(provider = {}) {
  const id = getItemId(provider);
  const supportedFeatures = Array.isArray(provider.supportedFeatures)
    ? provider.supportedFeatures.map((feature) => String(feature || "").trim()).filter(Boolean)
    : [];
  const credentialConfigured = Boolean(provider.credentialConfigured || provider.credentialsConfigured || provider.hasCredential);

  return {
    id,
    _id: provider._id ?? id,
    authType: String(provider.authType || "NONE").toUpperCase(),
    code: provider.code || provider.slug || id,
    credentialConfigured,
    credentialsConfigured: credentialConfigured,
    hasCredential: credentialConfigured,
    isActive: provider.isActive !== false,
    name: provider.name || "Provider",
    slug: provider.slug || "",
    supportedFeatures,
  };
}

export function normalizeProductProviderProductOption(product = {}) {
  const id = getItemId(product);
  const currency = String(product.currency || DEFAULT_CURRENCY).toUpperCase();
  const rawPrice = product.price ?? product.providerPrice ?? null;
  const externalProductId = product.externalProductId || product.externalId || "";

  return {
    id,
    _id: product._id ?? id,
    category: product.category || product.categoryLabel || "",
    categoryLabel: product.categoryLabel || product.category || "",
    currency,
    externalId: externalProductId,
    externalProductId,
    isActive: product.isActive !== false,
    maxQty: product.maxQty ?? null,
    minQty: product.minQty ?? null,
    name: product.name || "Provider product",
    price: rawPrice === null ? null : toNumber(rawPrice, 0),
    priceLabel: rawPrice === null ? "" : formatCurrency(rawPrice, currency, "ar-EG-u-nu-latn"),
    providerProductId: product.providerProductId || id,
    providerName: product.providerName || "",
  };
}

export async function getAdminProductProviderOptions(token) {
  const response = await apiRequest("/admin/product-provider-options", { token });
  const providers = asArray(response.data?.providers ?? response.data).map(normalizeProductProviderOption);

  return {
    message: response.message,
    providers,
  };
}

export async function getAdminProductProviderProductOptions(token, providerId, query = {}) {
  const response = await apiRequest(`/admin/product-provider-options/${providerId}/products`, {
    query: compactObject({
      page: query.page || 1,
      limit: query.limit || 600,
      includeInactive: query.includeInactive,
      search: query.search,
    }),
    token,
  });
  const products = asArray(response.data).map(normalizeProductProviderProductOption);

  return {
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page || 1,
      limit: query.limit || 600,
      total: products.length,
    }),
    products,
  };
}

export async function linkAdminProductProvider(token, productId, payload = {}, categoryLookup = new Map()) {
  const requestedMode = String(payload.mode || "").toLowerCase();
  const response = await apiRequest(`/admin/products/${productId}/provider-link`, {
    body: compactObject({
      fulfillmentMode: requestedMode === "manual" ? "MANUAL" : payload.fulfillmentMode || "AUTO",
      mode: payload.mode || "automatic",
      providerId: payload.providerId,
      providerProductId: payload.providerProductId,
      syncLimits: payload.syncLimits,
      syncName: payload.syncName,
      syncPrice: payload.syncPrice,
    }),
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export async function unlinkAdminProductProvider(token, productId, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${productId}/provider-link`, {
    body: { fulfillmentMode: "MANUAL" },
    method: "PATCH",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export async function syncAdminProductProvider(token, productId, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${productId}/provider-sync`, {
    method: "POST",
    token,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export const getProviderLinkOptions = getAdminProductProviderOptions;
export const getProviderProducts = getAdminProductProviderProductOptions;
export const linkProductToProvider = linkAdminProductProvider;
export const unlinkProductProvider = unlinkAdminProductProvider;
export const syncProductWithProvider = syncAdminProductProvider;
