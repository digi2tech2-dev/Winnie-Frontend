export const XENA_PROVIDER_CODE = "xena-recharge";
export const XENA_EXTERNAL_PRODUCT_ID = "xena-dynamic-recharge";
export const XENA_TARGET_FIELD_KEY = "target_uid";
export const XENA_LEGACY_TARGET_FIELD_KEY = "account_id";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function providerSignals(provider = {}) {
  return [
    provider.slug,
    provider.code,
    provider.name,
    provider.displayName,
    provider.providerCode,
  ].map(normalizeText);
}

export function isXenaProvider(provider = {}) {
  return providerSignals(provider).some((value) =>
    value === XENA_PROVIDER_CODE || value === "xena recharge",
  );
}

export function isXenaProduct(product = {}) {
  const provider = product.provider && typeof product.provider === "object" ? product.provider : {};
  const providerProduct = product.providerProduct && typeof product.providerProduct === "object"
    ? product.providerProduct
    : {};
  const orderFields = [
    ...(Array.isArray(product.orderFields) ? product.orderFields : []),
    ...(Array.isArray(product.dynamicFields) ? product.dynamicFields : []),
  ];

  const providerMatch = isXenaProvider(provider)
    || isXenaProvider(product)
    || normalizeText(product.providerCode) === XENA_PROVIDER_CODE
    || normalizeText(product.providerSlug) === XENA_PROVIDER_CODE
    || normalizeText(product.providerName) === "xena recharge";
  const providerProductMatch = normalizeText(product.providerProductExternalId) === XENA_EXTERNAL_PRODUCT_ID
    || normalizeText(providerProduct.externalProductId) === XENA_EXTERNAL_PRODUCT_ID
    || normalizeText(product.externalProductId) === XENA_EXTERNAL_PRODUCT_ID;
  const targetFieldMatch = orderFields.some((field) =>
    normalizeText(field.key || field.name) === XENA_TARGET_FIELD_KEY,
  );
  const legacyFieldMatch = orderFields.some((field) =>
    normalizeText(field.key || field.name) === XENA_LEGACY_TARGET_FIELD_KEY,
  );

  return providerProductMatch || (providerMatch && (targetFieldMatch || legacyFieldMatch)) || targetFieldMatch;
}

export function isXenaTargetFieldKey(key) {
  const normalized = normalizeText(key);
  return normalized === XENA_TARGET_FIELD_KEY || normalized === XENA_LEGACY_TARGET_FIELD_KEY;
}

export function getXenaTargetFieldKey(fields = []) {
  const targetField = fields.find((field) => normalizeText(field?.key || field?.name) === XENA_TARGET_FIELD_KEY);
  if (targetField) return String(targetField.key || targetField.name || XENA_TARGET_FIELD_KEY);

  const legacyField = fields.find((field) => normalizeText(field?.key || field?.name) === XENA_LEGACY_TARGET_FIELD_KEY);
  return legacyField ? String(legacyField.key || legacyField.name || XENA_LEGACY_TARGET_FIELD_KEY) : XENA_TARGET_FIELD_KEY;
}

export function normalizeXenaTargetUid(value) {
  return String(value ?? "").trim();
}

export function validateXenaTargetUid(value) {
  const targetUid = normalizeXenaTargetUid(value);

  if (!targetUid || !/^\d{1,50}$/.test(targetUid)) {
    return {
      targetUid,
      valid: false,
      message: "Xena ID must contain digits only and be 1 to 50 characters.",
    };
  }

  return { targetUid, valid: true, message: "" };
}
