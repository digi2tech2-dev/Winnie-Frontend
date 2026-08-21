import { apiRequest } from "./client";
import {
  DEFAULT_CURRENCY,
  asArray,
  compactObject,
  formatCurrency,
  findPaginationMetadata,
  getItemId,
  normalizePagination,
  resolveBackendAssetUrl,
  toNumber,
} from "./adapters";

const FIELD_TYPES = new Set(["text", "textarea", "number", "select", "url", "email", "tel", "date"]);
const PRODUCT_SYNC_PREFERENCES_PREFIX = "winnie-admin-product-sync:";
const PRODUCT_AVAILABILITY_PREFERENCES_PREFIX = "winnie-admin-product-availability:";
const safeTrim = (value) => String(value ?? "").trim();
const optionalTrim = (value) => {
  const trimmed = safeTrim(value);
  return trimmed || undefined;
};

function isFileLike(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function toId(value) {
  if (!value) return "";
  if (typeof value === "object") return getItemId(value);
  return String(value);
}

function sanitizeFieldKey(value, fallback) {
  const normalized = safeTrim(value)
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

export function toDecimalString(value) {
  if (value === "" || value === null || value === undefined) return "";
  return safeTrim(value);
}

export function formatSupplierPrice(value, currency = DEFAULT_CURRENCY) {
  const text = toDecimalString(value);
  if (!text) return "—";
  return `${String(currency || DEFAULT_CURRENCY).toUpperCase()} ${text}`;
}

function firstNonEmpty(...values) {
  return values.find((value) => value !== undefined && value !== null && safeTrim(value) !== "");
}

function firstBoolean(...values) {
  return values.find((value) => typeof value === "boolean");
}

function getProductSyncPreferences(productId) {
  if (!productId || typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(`${PRODUCT_SYNC_PREFERENCES_PREFIX}${productId}`);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setProductSyncPreferences(productId, preferences = {}) {
  if (!productId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(`${PRODUCT_SYNC_PREFERENCES_PREFIX}${productId}`, JSON.stringify({
      syncLimits: Boolean(preferences.syncLimits),
      syncName: Boolean(preferences.syncName),
      syncPrice: Boolean(preferences.syncPrice),
    }));
  } catch {
    // Backend persistence remains the source of truth when storage is unavailable.
  }
}

function clearProductSyncPreferences(productId) {
  if (!productId || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(`${PRODUCT_SYNC_PREFERENCES_PREFIX}${productId}`);
  } catch {
    // Ignore unavailable browser storage.
  }
}

function getProductAvailabilityPreferences(productId) {
  if (!productId || typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(`${PRODUCT_AVAILABILITY_PREFERENCES_PREFIX}${productId}`);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setProductAvailabilityPreferences(productId, values = {}) {
  if (!productId || typeof window === "undefined") return;

  const status = normalizeStatusValue(values.status);
  if (!["available", "unavailable"].includes(status)) return;

  try {
    window.localStorage.setItem(`${PRODUCT_AVAILABILITY_PREFERENCES_PREFIX}${productId}`, JSON.stringify({
      paused: Boolean(firstBoolean(values.paused, values.isPaused)),
      status,
    }));
  } catch {
    // The backend-compatible flags still keep the product behavior correct.
  }
}

function clearProductAvailabilityPreferences(productId) {
  if (!productId || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(`${PRODUCT_AVAILABILITY_PREFERENCES_PREFIX}${productId}`);
  } catch {
    // Ignore unavailable browser storage.
  }
}

function toPayloadId(value) {
  const id = toId(value);
  return /^[a-f0-9]{24}$/i.test(id) ? id : undefined;
}

function toPayloadImage(value) {
  if (typeof value !== "string") return undefined;
  const image = safeTrim(value);
  if (!image || /^data:/i.test(image)) return undefined;
  return image;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function normalizeStatusValue(value) {
  return safeTrim(value).toLowerCase();
}

function mapStatusToIsActive(value) {
  const status = normalizeStatusValue(value);

  if (["available", "active", "متوفر"].includes(status)) return true;
  // "Unavailable" must remain an active catalog record. Pausing it below
  // prevents purchases, while visibleInStore independently controls hiding.
  if (["unavailable", "غير متوفر"].includes(status)) return true;
  if (["inactive", "disabled"].includes(status)) return false;

  return undefined;
}

function normalizeCustomerVisibilityStatus(product = {}, fallback = {}) {
  const source = product.customerVisibilityStatus && typeof product.customerVisibilityStatus === "object"
    ? product.customerVisibilityStatus
    : null;

  if (source) {
    return {
      visibleToCustomer: source.visibleToCustomer === true,
      reasons: asArray(source.reasons).map((reason) => String(reason || "").trim()).filter(Boolean),
    };
  }

  const status = normalizeStatusValue(fallback.status ?? product.status);
  const providerCode = safeTrim(product.providerCode || product.provider?.providerCode || product.provider?.code || product.provider?.slug)
    .toUpperCase()
    .replace(/-/g, "_");
  const isFazerCards = providerCode === "FAZER_CARDS" || providerCode === "FAZERCARDS";
  const reasons = [];
  if (fallback.isActive !== true) reasons.push("isActive=false");
  if (fallback.visibleInStore === false) reasons.push("visibleInStore=false");
  if (isFazerCards && status !== "available") reasons.push(`status=${status || "missing"}`);
  if (isFazerCards && fallback.customerPurchaseEnabled !== true) reasons.push("customerPurchaseEnabled=false");
  if (fallback.isPaused === true) reasons.push("isPaused=true");
  if (fallback.isAvailableForApi === false) reasons.push("isAvailableForApi=false");

  return {
    visibleToCustomer: reasons.length === 0,
    reasons,
  };
}

function normalizeExtraFields(fields = []) {
  return asArray(fields)
    .map((field, index) => {
      const label = safeTrim(field.label) || `Field ${index + 1}`;
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

function buildOrderFields(fields = []) {
  return normalizeExtraFields(fields).map((field) => ({
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
  }));
}

function buildDynamicFields(fields = []) {
  return normalizeExtraFields(fields).map((field) => ({
    isActive: field.isActive,
    label: field.label,
    max: field.max,
    min: field.min,
    name: field.key,
    options: field.options,
    required: field.required,
    type: field.type,
  }));
}

function getEditableFieldsSource(form = {}) {
  if (Array.isArray(form.extraFields)) return form.extraFields;
  if (Array.isArray(form.orderFields)) return form.orderFields;
  if (Array.isArray(form.dynamicFields)) return form.dynamicFields;
  return undefined;
}

function stableStringify(value) {
  return JSON.stringify(value ?? null);
}

function hasChanged(nextValue, previousValue) {
  return stableStringify(nextValue) !== stableStringify(previousValue);
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
  const visibleInStore = product.visibleInStore !== false;
  const backendIsPaused = product.isPaused === true || product.paused === true;
  const backendStatus = String(product.status || "").toLowerCase();
  const productStatus = !isActive || backendStatus === "unavailable"
    ? "unavailable"
    : "available";
  const isPaused = backendIsPaused;
  const priceValue = toDecimalString(firstNonEmpty(product.finalPrice, product.basePrice, product.price, 0));
  const provider = product.provider && typeof product.provider === "object" ? product.provider : null;
  const providerProduct = product.providerProduct && typeof product.providerProduct === "object" ? product.providerProduct : null;
  const providerSettings = [
    product.providerLink,
    product.providerSettings,
    product.providerSync,
    product.syncSettings,
  ].find((value) => value && typeof value === "object") || {};
  const savedSyncPreferences = getProductSyncPreferences(id);
  const pricingMode = String(product.pricingMode || "").toLowerCase();
  const syncPriceFromProvider = firstBoolean(
    product.syncPriceFromProvider,
    product.syncPriceWithProvider,
    product.syncPrice,
    providerSettings.syncPrice,
    providerProduct?.syncPrice,
    savedSyncPreferences.syncPrice,
    pricingMode === "sync" ? true : pricingMode === "manual" ? false : undefined,
  ) ?? false;
  const syncLimitsFromProvider = firstBoolean(
    product.syncLimitsFromProvider,
    product.syncLimits,
    providerSettings.syncLimits,
    providerProduct?.syncLimits,
    savedSyncPreferences.syncLimits,
  ) ?? false;
  const syncNameFromProvider = firstBoolean(
    product.syncNameFromProvider,
    product.syncName,
    providerSettings.syncName,
    providerProduct?.syncName,
    savedSyncPreferences.syncName,
  ) ?? false;
  const isProviderLinked = Boolean(
    product.provider
    || product.providerId
    || product.providerProduct
    || product.providerProductId
    || product.isLinked
    || product.currentProviderName
    || product.currentProviderProductName
    || String(product.fulfillmentMode || product.executionType || "").toUpperCase() === "AUTO",
  );
  const supplierPrice = toDecimalString(
    firstNonEmpty(
      product.providerPrice,
      product.supplierPrice,
      product.providerCostPrice,
      product.costPrice,
      providerProduct?.costPrice,
      providerProduct?.supplierPrice,
      providerProduct?.rawPrice,
      providerProduct?.price,
      product.rawPrice,
    ),
  );
  const familyKey = safeTrim(product.familyKey || providerProduct?.familyKey);
  const fulfillmentMode = safeTrim(product.fulfillmentMode || providerProduct?.fulfillmentMode);
  const providerCategory = safeTrim(product.providerCategory || providerProduct?.category);
  const providerCategoryName = safeTrim(product.providerCategoryName || providerProduct?.categoryName || providerCategory);
  const providerOfferId = safeTrim(product.providerOfferId || providerProduct?.offerId);
  const providerOfferName = safeTrim(product.providerOfferName || providerProduct?.offerName);
  const providerRegion = safeTrim(product.providerRegion || providerProduct?.region);
  const providerPlatform = safeTrim(product.providerPlatform || providerProduct?.platform);
  const providerStock = firstNonEmpty(product.providerStock, providerProduct?.stock);
  const providerBlockReason = safeTrim(product.providerBlockReason || providerProduct?.blockReason);
  const providerExecutionBlocked = firstBoolean(product.providerExecutionBlocked, providerProduct?.executionBlocked);
  const customerPurchaseEnabled = product.customerPurchaseEnabled === undefined ? true : product.customerPurchaseEnabled === true;
  const customerVisibilityStatus = normalizeCustomerVisibilityStatus(product, {
    customerPurchaseEnabled,
    isActive,
    isAvailableForApi: product.isAvailableForApi,
    isPaused,
    status: productStatus,
    visibleInStore,
  });

  return {
    ...product,
    id,
    _id: product._id ?? id,
    category: categoryId,
    createdAt: product.createdAt || null,
    displayOrder: toNumber(product.displayOrder, index + 1),
    discountPercentage: Math.min(100, Math.max(0, toNumber(product.discountPercentage ?? product.discountPercent, 0))),
    executionType: product.executionType || "manual",
    extraFields: getProductFields(product),
    finalPrice: priceValue,
    finalPriceLabel: formatCurrency(priceValue, "USD", "ar-EG-u-nu-latn"),
    image: resolveBackendAssetUrl(product.image) || "/logo.png",
    isActive,
    isPaused,
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
    originalPrice: toDecimalString(firstNonEmpty(product.originalPrice, product.providerPrice, product.basePrice, product.price, priceValue)),
    paused: isPaused,
    providerId: toId(product.provider) || toId(product.providerId),
    providerCode: safeTrim(product.providerCode || provider?.providerCode || provider?.code || provider?.slug),
    customerPurchaseEnabled,
    customerVisibilityStatus,
    visibleToCustomer: customerVisibilityStatus.visibleToCustomer,
    visibilityReasons: customerVisibilityStatus.reasons,
    providerExecutionEnabled: product.providerExecutionEnabled === undefined ? undefined : product.providerExecutionEnabled === true,
    providerExecutionMode: product.providerExecutionMode || "MANUAL_FULFILLMENT",
    providerExecutionBlocked: providerExecutionBlocked === undefined ? false : providerExecutionBlocked === true,
    providerBlockReason,
    familyKey,
    fulfillmentMode,
    providerCategory,
    providerCategoryName,
    providerOfferId,
    providerOfferName,
    providerRegion,
    providerPlatform,
    providerStock: providerStock === undefined ? null : providerStock,
    providerProductBlockReason: providerProduct?.blockReason || "",
    providerName: provider?.name || product.currentProviderName || "",
    providerProductActive: providerProduct?.isActive === undefined ? null : providerProduct.isActive !== false,
    providerProductExternalId: providerProduct?.externalProductId || product.providerProductExternalId || product.externalProductId || "",
    providerProductFamilyKey: providerProduct?.familyKey || familyKey,
    providerProductFulfillmentMode: providerProduct?.fulfillmentMode || fulfillmentMode,
    providerProductId: toId(product.providerProduct) || toId(product.providerProductId),
    providerProductLastSyncedAt: providerProduct?.lastSyncedAt || null,
    providerProductMaxQty: providerProduct?.maxQty ?? product.providerProductMaxQty ?? null,
    providerProductMinQty: providerProduct?.minQty ?? product.providerProductMinQty ?? null,
    providerProductName: providerProduct?.translatedName || providerProduct?.rawName || providerProduct?.name || product.providerProductName || product.currentProviderProductName || "",
    providerProductRequiredFields: asArray(providerProduct?.requiredFields || product.requiredFields),
    providerProductSupportLevel: providerProduct?.supportLevel || "",
    syncLimits: syncLimitsFromProvider,
    syncLimitsFromProvider,
    syncName: syncNameFromProvider,
    syncNameFromProvider,
    syncPrice: syncPriceFromProvider,
    syncPriceFromProvider,
    syncPriceWithProvider: syncPriceFromProvider,
    pricingMode: product.pricingMode || (syncPriceFromProvider ? "sync" : "manual"),
    status: productStatus,
    subCategoryId: hasSubCategory ? categoryId : "",
    supplierPrice,
    supplierPriceLabel: formatSupplierPrice(supplierPrice),
    visible: visibleInStore,
    visibleInStore,
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

export function buildAdminProductPayload(form = {}, options = {}) {
  const {
    includeDynamicFields = true,
    includeOrderFields = true,
    includePaused = true,
    includeVisibility = true,
  } = options;
  const hasStatus = hasOwn(form, "status");
  const isActive = hasStatus
    ? mapStatusToIsActive(form.status)
    : typeof form.isActive === "boolean"
      ? form.isActive
      : undefined;
  const visibleInStore = typeof form.visibleInStore === "boolean"
    ? form.visibleInStore
    : typeof form.visible === "boolean"
      ? form.visible
      : undefined;
  const requestedIsPaused = typeof form.isPaused === "boolean"
    ? form.isPaused
    : typeof form.paused === "boolean"
      ? form.paused
      : undefined;
  const isUnavailable = hasStatus && ["unavailable", "غير متوفر"].includes(normalizeStatusValue(form.status));
  const isPaused = isUnavailable ? true : requestedIsPaused;
  const category = firstNonEmpty(
    toPayloadId(form.subCategoryId),
    toPayloadId(form.mainCategoryId),
    toPayloadId(form.category),
    toPayloadId(form.categoryId),
  );
  // The admin form edits finalPrice/min/max. Prefer those canonical form values
  // over the API aliases that may still contain the product's previous values.
  const priceValue = firstNonEmpty(form.finalPrice, form.basePrice, form.price);
  const minQty = firstNonEmpty(form.min, form.minQty);
  const maxQty = firstNonEmpty(form.max, form.maxQty);
  // extraFields is the live value edited in the admin form. The spread product
  // object may still contain an old orderFields array, so it must not win here.
  const fieldsSource = getEditableFieldsSource(form);
  const orderFields = includeOrderFields && fieldsSource !== undefined ? buildOrderFields(fieldsSource) : undefined;
  const dynamicFields = includeDynamicFields && fieldsSource !== undefined ? buildDynamicFields(fieldsSource) : undefined;
  const image = toPayloadImage(form.image);
  const linkType = String(form.linkType || "").toLowerCase();
  const syncPriceWithProvider = typeof form.syncPriceFromProvider === "boolean"
    ? form.syncPriceFromProvider
    : typeof form.syncPriceWithProvider === "boolean"
      ? form.syncPriceWithProvider
      : undefined;
  const pricingMode = typeof syncPriceWithProvider === "boolean"
    ? syncPriceWithProvider ? "sync" : "manual"
    : form.pricingMode || (linkType === "automatic" ? "sync" : linkType === "manual" ? "manual" : undefined);

  return compactObject({
    name: optionalTrim(firstNonEmpty(form.nameAr, form.name, form.nameEn, form.title)),
    nameEn: optionalTrim(form.nameEn),
    description: optionalTrim(form.description),
    category,
    image,
    basePrice: priceValue === undefined ? undefined : toDecimalString(priceValue),
    finalPrice: priceValue === undefined ? undefined : toDecimalString(priceValue),
    originalPrice: form.originalPrice === undefined ? undefined : toDecimalString(form.originalPrice),
    discountPercentage: form.discountPercentage === undefined ? undefined : Math.min(100, Math.max(0, toNumber(form.discountPercentage, 0))),
    profitMargin: form.profitMargin === undefined ? undefined : toNumber(form.profitMargin, 0),
    supplierPrice: form.supplierPrice === undefined ? undefined : toDecimalString(form.supplierPrice),
    minQty: minQty === undefined ? undefined : Math.max(1, toNumber(minQty, 1)),
    maxQty: maxQty === undefined ? undefined : Math.max(Math.max(1, toNumber(minQty, 1)), toNumber(maxQty, Math.max(1, toNumber(minQty, 1)))),
    displayOrder: form.displayOrder === undefined ? undefined : toNumber(form.displayOrder, 0),
    pricingMode,
    syncPriceWithProvider,
    customerPurchaseEnabled: hasOwn(form, "customerPurchaseEnabled") ? Boolean(form.customerPurchaseEnabled) : undefined,
    providerExecutionEnabled: hasOwn(form, "providerExecutionEnabled") ? Boolean(form.providerExecutionEnabled) : undefined,
    providerExecutionMode: form.providerExecutionMode || undefined,
    providerExecutionBlocked: hasOwn(form, "providerExecutionBlocked") ? Boolean(form.providerExecutionBlocked) : undefined,
    providerBlockReason: hasOwn(form, "providerBlockReason") ? optionalTrim(form.providerBlockReason) : undefined,
    familyKey: hasOwn(form, "familyKey") ? optionalTrim(form.familyKey) : undefined,
    fulfillmentMode: hasOwn(form, "fulfillmentMode") ? optionalTrim(form.fulfillmentMode) : undefined,
    isActive,
    visibleInStore: includeVisibility ? visibleInStore : undefined,
    isPaused: includePaused ? isPaused : undefined,
    orderFields,
    dynamicFields,
  });
}

export function buildAdminProductUpdatePayload(form = {}, previousProduct = null) {
  const hasStatus = hasOwn(form, "status");
  const mappedIsActive = hasStatus
    ? mapStatusToIsActive(form.status)
    : typeof form.isActive === "boolean"
      ? form.isActive
      : undefined;

  const nextPayload = buildAdminProductPayload(form, {
    includeDynamicFields: false,
    includeOrderFields: true,
    includePaused: true,
    includeVisibility: true,
  });

  if (!previousProduct) {
    if (hasStatus && typeof mappedIsActive === "boolean") nextPayload.isActive = mappedIsActive;
    if (["unavailable", "غير متوفر"].includes(normalizeStatusValue(form.status))) nextPayload.isPaused = true;
    return nextPayload;
  }

  const previousPayload = buildAdminProductPayload(previousProduct, {
    includeDynamicFields: false,
    includeOrderFields: true,
    includePaused: true,
    includeVisibility: true,
  });

  const diffPayload = Object.entries(nextPayload).reduce((payload, [key, value]) => {
    if (hasChanged(value, previousPayload[key])) payload[key] = value;
    return payload;
  }, {});

  if (hasStatus && typeof mappedIsActive === "boolean") diffPayload.isActive = mappedIsActive;
  if (["unavailable", "غير متوفر"].includes(normalizeStatusValue(form.status))) diffPayload.isPaused = true;

  return diffPayload;
}

async function buildProductPayload(token, values = {}) {
  const uploadedImage = await uploadAdminProductImage(token, values.imageFile);
  const image = uploadedImage || values.imagePath || values.image || "";
  return buildAdminProductPayload({ ...values, image });
}

function getProductFromResponse(response = {}) {
  return response.data?.product || response.data || {};
}

export async function getAdminProducts(token, query = {}, categoryLookup = new Map()) {
  const response = await apiRequest("/admin/products", {
    query: compactObject({
      page: query.page || 1,
      limit: query.limit || 15,
      search: query.search,
      category: query.category,
      status: query.status,
      linkType: query.linkType,
      sort: query.sort,
    }),
    token,
  });
  const products = asArray(response.data).map((product, index) => normalizeAdminProduct(product, index, categoryLookup));

  return {
    message: response.message,
    pagination: normalizePagination(findPaginationMetadata(response.raw) || response.pagination, {
      page: query.page || 1,
      limit: query.limit || 15,
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
  setProductAvailabilityPreferences(createdId, values);

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

export async function updateAdminProduct(token, id, values = {}, categoryLookup = new Map(), previousProduct = null) {
  const payload = await buildProductPayload(token, values);
  const updatePayload = previousProduct
    ? buildAdminProductUpdatePayload({ ...values, image: payload.image }, previousProduct)
    : buildAdminProductUpdatePayload(payload);
  const fieldsSource = getEditableFieldsSource(values);

  if (fieldsSource !== undefined && updatePayload.orderFields !== undefined) {
    updatePayload.dynamicFields = buildDynamicFields(fieldsSource);
  }

  if (import.meta.env.DEV) {
    const hasStatus = hasOwn(values, "status");
    const mappedIsActive = hasStatus
      ? mapStatusToIsActive(values.status)
      : typeof values.isActive === "boolean"
        ? values.isActive
        : undefined;

    if (hasStatus) {
      console.warn("[admin.products.status.debug]", {
        formStatus: values.status,
        formIsActive: values.isActive,
        originalIsActive: previousProduct?.isActive,
        mappedIsActive,
        payloadIsActive: updatePayload.isActive,
      });
    }

    console.warn("[admin.products.update.payload]", updatePayload);
  }

  const response = await apiRequest(`/admin/products/${id}`, {
    body: updatePayload,
    method: "PATCH",
    token,
  });
  setProductAvailabilityPreferences(id, values);

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
  clearProductAvailabilityPreferences(id);

  return {
    message: response.message,
    product: normalizeAdminProduct(getProductFromResponse(response), 0, categoryLookup),
  };
}

export function normalizeProductProviderOption(provider = {}) {
  const id = getItemId(provider);
  const supportedFeatures = Array.isArray(provider.supportedFeatures)
    ? provider.supportedFeatures.map((feature) => safeTrim(feature)).filter(Boolean)
    : [];
  const credentialConfigured = Boolean(provider.credentialConfigured || provider.credentialsConfigured || provider.hasCredential);

  return {
    id,
    _id: provider._id ?? id,
    authType: String(provider.authType || "NONE").toUpperCase(),
    code: safeTrim(provider.code || provider.slug || id),
    providerCode: safeTrim(provider.providerCode || provider.code || provider.slug || id),
    credentialConfigured,
    credentialsConfigured: credentialConfigured,
    hasCredential: credentialConfigured,
    isActive: provider.isActive !== false,
    name: safeTrim(provider.name) || "Provider",
    slug: safeTrim(provider.slug),
    supportedFeatures,
  };
}

export function normalizeProductProviderProductOption(product = {}) {
  const id = getItemId(product);
  const currency = String(product.currency || DEFAULT_CURRENCY).toUpperCase();
  const rawPrice = firstNonEmpty(product.costPrice, product.rawPrice, product.supplierPrice, product.price, product.providerPrice);
  const externalProductId = safeTrim(product.externalProductId || product.externalId);

  return {
    id,
    _id: product._id ?? id,
    category: safeTrim(product.category || product.categoryLabel),
    categoryLabel: safeTrim(product.categoryLabel || product.category),
    categoryName: safeTrim(product.categoryName || product.categoryLabel || product.category),
    currency,
    blockReason: safeTrim(product.blockReason),
    executionBlocked: product.executionBlocked === true,
    externalId: externalProductId,
    externalProductId,
    familyKey: safeTrim(product.familyKey),
    fulfillmentMode: safeTrim(product.fulfillmentMode),
    isActive: product.isActive !== false,
    isBlocked: product.isBlocked === true,
    isSupported: product.isSupported === true,
    lastSyncedAt: product.lastSyncedAt || null,
    maxQty: product.maxQty ?? null,
    minQty: product.minQty ?? null,
    name: safeTrim(product.name) || "Provider product",
    offerId: safeTrim(product.offerId),
    offerName: safeTrim(product.offerName),
    platform: safeTrim(product.platform),
    rawPrice: toDecimalString(rawPrice),
    region: safeTrim(product.region),
    requiredFields: asArray(product.requiredFields),
    stock: product.stock ?? null,
    supportLevel: safeTrim(product.supportLevel),
    supplierPrice: toDecimalString(rawPrice),
    price: toDecimalString(rawPrice),
    priceLabel: formatSupplierPrice(rawPrice, currency),
    providerProductId: safeTrim(product.providerProductId || id),
    providerName: safeTrim(product.providerName),
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
      providerId: optionalTrim(payload.providerId),
      providerProductId: optionalTrim(payload.providerProductId),
      externalProductId: optionalTrim(payload.externalProductId),
      syncLimits: payload.syncLimits,
      syncName: payload.syncName,
      syncPrice: payload.syncPrice,
    }),
    method: "PATCH",
    token,
  });
  setProductSyncPreferences(productId, {
    syncLimits: payload.syncLimits,
    syncName: payload.syncName,
    syncPrice: payload.syncPrice,
  });

  return {
    message: response.message,
    product: normalizeAdminProduct({
      ...getProductFromResponse(response),
      syncLimits: firstBoolean(getProductFromResponse(response).syncLimits, payload.syncLimits),
      syncName: firstBoolean(getProductFromResponse(response).syncName, payload.syncName),
      syncPrice: firstBoolean(getProductFromResponse(response).syncPrice, payload.syncPrice),
    }, 0, categoryLookup),
  };
}

export async function unlinkAdminProductProvider(token, productId, categoryLookup = new Map()) {
  const response = await apiRequest(`/admin/products/${productId}/provider-link`, {
    body: { fulfillmentMode: "MANUAL" },
    method: "PATCH",
    token,
  });
  clearProductSyncPreferences(productId);

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
