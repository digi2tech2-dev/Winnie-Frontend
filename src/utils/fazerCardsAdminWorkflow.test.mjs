import test from "node:test";
import assert from "node:assert/strict";
import { getFazerCardsProductSavePlan } from "./fazerCardsAdminWorkflow.js";

const existingFazerProduct = {
  id: "product-test-1",
  providerCode: "FAZER_CARDS",
  providerProductId: "provider-product-test-1",
  providerExecutionEnabled: true,
  providerExecutionMode: "AUTO_PROVIDER",
  providerExecutionBlocked: false,
  providerBlockReason: "",
};

test("existing FazerCards edits preserve the mapping and skip the generic relink flow", () => {
  const plan = getFazerCardsProductSavePlan({
    existingProduct: existingFazerProduct,
    values: {
      linkType: "automatic",
      providerCode: "FAZER_CARDS",
      providerProductId: "provider-product-test-1",
      nameAr: "اسم جديد",
      providerExecutionEnabled: true,
      providerExecutionMode: "AUTO_PROVIDER",
      providerExecutionBlocked: false,
      providerBlockReason: "",
    },
  });

  assert.equal(plan.requiresLaunchOps, false);
  assert.equal(plan.useGenericProviderLink, false);
  assert.equal(plan.useSpecializedLaunch, false);
  assert.equal(plan.ordinaryValues.providerExecutionEnabled, undefined);
  assert.equal(plan.ordinaryValues.nameAr, "اسم جديد");
});

test("FazerCards execution changes are delegated to specialized launch", () => {
  const plan = getFazerCardsProductSavePlan({
    existingProduct: existingFazerProduct,
    values: {
      linkType: "automatic",
      providerCode: "FAZER_CARDS",
      providerProductId: "provider-product-test-1",
      providerExecutionEnabled: false,
      providerExecutionMode: "MANUAL_FULFILLMENT",
      providerExecutionBlocked: false,
      providerBlockReason: "",
    },
  });

  assert.equal(plan.requiresLaunchOps, false);
  assert.equal(plan.useGenericProviderLink, false);
  assert.equal(plan.useSpecializedLaunch, true);
});

test("new or remapped FazerCards offers require the supported import/launch workflow", () => {
  const remap = getFazerCardsProductSavePlan({
    existingProduct: existingFazerProduct,
    values: {
      linkType: "automatic",
      providerCode: "FAZER_CARDS",
      providerProductId: "provider-product-test-2",
    },
  });
  const newProduct = getFazerCardsProductSavePlan({
    values: {
      linkType: "automatic",
      providerCode: "FAZER_CARDS",
      providerProductId: "provider-product-test-3",
    },
  });

  assert.equal(remap.requiresLaunchOps, true);
  assert.equal(newProduct.requiresLaunchOps, true);
});

test("other providers retain the generic provider-link workflow", () => {
  const plan = getFazerCardsProductSavePlan({
    existingProduct: { providerCode: "XENA", providerProductId: "xena-old" },
    values: { linkType: "automatic", providerCode: "XENA", providerProductId: "xena-new" },
  });

  assert.equal(plan.requiresLaunchOps, false);
  assert.equal(plan.useGenericProviderLink, true);
});
