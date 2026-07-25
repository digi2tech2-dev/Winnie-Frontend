export const XENA_PROVIDER_CODE = "xena-recharge";
export const XENA_EXTERNAL_PRODUCT_ID = "xena-dynamic-recharge";
export const XENA_TARGET_FIELD_KEY = "target_uid";

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
  const fieldMatch = orderFields.some((field) =>
    normalizeText(field.key || field.name) === XENA_TARGET_FIELD_KEY,
  );

  return providerProductMatch || (providerMatch && fieldMatch);
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
