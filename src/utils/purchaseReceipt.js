export function createPurchaseReceipt({ product, quantity, accountId, selectedPackage, totalLabel }, category) {
  const categoryLabel = typeof category === "string" ? category : category?.title || "طلب شحن";
  const orderId = `WF-${Date.now().toString().slice(-6)}`;
  const packageLabel = selectedPackage?.name || "بدون باقة محددة";
  const unitPrice = selectedPackage?.price || product.displayPriceLabel || product.price || "حسب الباقة";

  return {
    orderId,
    product,
    category,
    categoryLabel,
    productName: product.name,
    packageLabel,
    unitPrice,
    quantity,
    accountId,
    totalLabel,
    createdAt: new Date().toLocaleString("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}
