import { isFazerCardsProvider } from "./fazerCardsCatalogs.js";

const safeTrim = (value) => String(value ?? "").trim();

/**
 * Keeps the generic Product Management save flow from accidentally using the
 * generic provider-link endpoint for FazerCards. This helper is UI-only; the
 * backend remains the authority for launch/readiness validation.
 */
export function getFazerCardsProductSavePlan({ existingProduct = null, values = {} } = {}) {
  const editing = Boolean(existingProduct);
  const existingFazerCards = editing && isFazerCardsProvider({
    providerCode: existingProduct?.providerCode,
    name: existingProduct?.providerName,
  });
  const selectedFazerCards = values.linkType === "automatic" && isFazerCardsProvider({ providerCode: values.providerCode });
  const providerProductChanged = safeTrim(values.providerProductId) !== safeTrim(existingProduct?.providerProductId);
  const requiresLaunchOps = (existingFazerCards && providerProductChanged)
    || (selectedFazerCards && (!editing || !existingFazerCards));
  const executionChanged = existingFazerCards && (
    Boolean(values.providerExecutionEnabled) !== Boolean(existingProduct?.providerExecutionEnabled)
    || (values.providerExecutionMode || "MANUAL_FULFILLMENT") !== (existingProduct?.providerExecutionMode || "MANUAL_FULFILLMENT")
    || Boolean(values.providerExecutionBlocked) !== Boolean(existingProduct?.providerExecutionBlocked)
    || safeTrim(values.providerBlockReason) !== safeTrim(existingProduct?.providerBlockReason)
  );
  const ordinaryValues = existingFazerCards
    ? Object.fromEntries(Object.entries(values).filter(([key]) => ![
        "providerExecutionEnabled",
        "providerExecutionMode",
        "providerExecutionBlocked",
        "providerBlockReason",
      ].includes(key)))
    : values;

  return {
    editing,
    existingFazerCards,
    selectedFazerCards,
    providerProductChanged,
    requiresLaunchOps,
    executionChanged,
    ordinaryValues,
    useGenericProviderLink: !existingFazerCards && !selectedFazerCards,
    useSpecializedLaunch: existingFazerCards && executionChanged,
  };
}
