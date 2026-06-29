import { AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildCustomerOrderPayload, createCustomerOrder } from "../api/orders";
import ProductPurchaseModal from "../components/ProductPurchaseModal";
import PurchaseSuccessModal from "../components/PurchaseSuccessModal";
import { useToast } from "../components/ToastProvider";

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPurchaseFields(product = {}) {
  const dynamicFields = Array.isArray(product.dynamicFields)
    ? product.dynamicFields.map((field) => ({
        key: field.name,
        label: field.label || field.name,
        isActive: field.isActive !== false,
      }))
    : [];

  const orderFields = Array.isArray(product.orderFields)
    ? product.orderFields.map((field) => ({
        key: field.key,
        label: field.label || field.key,
        isActive: field.isActive !== false,
      }))
    : [];

  return [...dynamicFields, ...orderFields].filter((field) => field.isActive && field.key);
}

function buildSubmittedFieldList(product, values = {}) {
  const fields = getPurchaseFields(product);
  const labelByKey = new Map(fields.map((field) => [field.key, field.label]));

  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ({
      label: labelByKey.get(key) || key,
      value,
    }));
}

function buildReceipt({ category, order, purchase }) {
  const submittedFields = buildSubmittedFieldList(purchase.product, purchase.orderFieldsValues);
  const fallbackAccount = purchase.accountId
    ? [{ label: "Account", value: purchase.accountId }]
    : [];

  return {
    accountId: purchase.accountId || "",
    category,
    categoryLabel: typeof category === "string" ? category : category?.title || category?.name || "Catalog",
    createdAt: order.dateTimeLabel,
    order,
    orderId: order.displayId || order.id,
    orderRecordId: order.id,
    product: purchase.product,
    productName: order.productName && order.productName !== "Order item" ? order.productName : purchase.product?.name || "Order item",
    quantity: order.quantity || purchase.quantity,
    status: order.status,
    statusLabel: order.statusLabel,
    submittedFields: submittedFields.length ? submittedFields : fallbackAccount,
    totalLabel: order.price || purchase.totalLabel,
  };
}

export function useCustomerPurchase({ basePath = "/customer", onSuccess, token } = {}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseReceipt, setPurchaseReceipt] = useState(null);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const isCustomerArea = basePath === "/customer";

  const openPurchase = useCallback((product, category = null) => {
    if (!isCustomerArea) {
      showToast({
        type: "info",
        title: "Customer action only",
        message: "Order creation is connected only in the customer area.",
      });
      return;
    }

    if (!token) {
      navigate("/login", { state: { from: `${basePath}/dashboard` } });
      return;
    }

    setPurchaseError("");
    setPurchaseItem({ product, category });
  }, [basePath, isCustomerArea, navigate, showToast, token]);

  const closePurchase = useCallback(() => {
    if (purchaseSubmitting) return;
    setPurchaseItem(null);
    setPurchaseError("");
  }, [purchaseSubmitting]);

  const submitPurchase = useCallback(async (purchase) => {
    if (purchaseSubmitting) return;

    const payload = buildCustomerOrderPayload(purchase);
    if (!payload.productId) {
      setPurchaseError("This product is missing a backend product id.");
      return;
    }

    setPurchaseSubmitting(true);
    setPurchaseError("");

    try {
      const result = await createCustomerOrder(token, payload, {
        idempotencyKey: makeIdempotencyKey(),
      });
      const receipt = buildReceipt({
        category: purchaseItem?.category,
        order: result.order,
        purchase,
      });

      setPurchaseItem(null);
      setPurchaseReceipt(receipt);
      await onSuccess?.(result.order);

      showToast({
        type: "success",
        title: "Order created",
        message: `${receipt.orderId} - ${receipt.statusLabel}`,
      });
    } catch (error) {
      setPurchaseError(error.userMessage || "Order could not be created.");
    } finally {
      setPurchaseSubmitting(false);
    }
  }, [onSuccess, purchaseItem?.category, purchaseSubmitting, showToast, token]);

  const purchaseModals = useMemo(() => (
    <AnimatePresence>
      {purchaseItem && (
        <ProductPurchaseModal
          product={purchaseItem.product}
          category={purchaseItem.category}
          onClose={closePurchase}
          onConfirm={submitPurchase}
          requireAccountId={false}
          submitError={purchaseError}
          submitting={purchaseSubmitting}
        />
      )}
      {purchaseReceipt && (
        <PurchaseSuccessModal
          receipt={purchaseReceipt}
          onClose={() => setPurchaseReceipt(null)}
          onViewOrder={() => {
            setPurchaseReceipt(null);
            navigate(`${basePath}/order/${purchaseReceipt.orderRecordId}`);
          }}
        />
      )}
    </AnimatePresence>
  ), [basePath, closePurchase, navigate, purchaseError, purchaseItem, purchaseReceipt, purchaseSubmitting, submitPurchase]);

  return {
    openPurchase,
    purchaseModals,
  };
}
