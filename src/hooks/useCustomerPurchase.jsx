import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, WalletCards, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

function buildReceipt({ category, order, purchase, t }) {
  const submittedFields = buildSubmittedFieldList(purchase.product, purchase.orderFieldsValues);
  const fallbackAccount = purchase.accountId
    ? [{ label: t("success.account"), value: purchase.accountId }]
    : [];

  return {
    accountId: purchase.accountId || "",
    category,
    categoryLabel: typeof category === "string" ? category : category?.title || category?.name || t("home:showcase.catalog", { defaultValue: "Catalog" }),
    createdAt: order.dateTimeLabel,
    order,
    orderId: order.displayId || order.id,
    orderRecordId: order.id,
    product: purchase.product,
    productName: order.productName && order.productName !== "Order item" ? order.productName : purchase.product?.name || t("listing.title"),
    quantity: order.quantity || purchase.quantity,
    status: order.status,
    statusLabel: order.statusLabel,
    submittedFields: submittedFields.length ? submittedFields : fallbackAccount,
    totalLabel: order.price || purchase.totalLabel,
  };
}

function isInsufficientFundsError(error = {}) {
  const code = String(error.code || error.payload?.code || "").toUpperCase();
  const message = String(error.userMessage || error.message || error.payload?.message || "").toLowerCase();

  const hasEnglishAmounts = /required\s*:/.test(message) && /available\s*:/.test(message);
  const hasArabicAmounts = /المطلوب\s*:/.test(message) && /المتاح\s*:/.test(message);

  return code.includes("INSUFFICIENT")
    || message.includes("insufficient funds")
    || message.includes("insufficient balance")
    || message.includes("الرصيد غير كاف")
    || hasEnglishAmounts
    || hasArabicAmounts;
}

function pickAmount(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;

    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        return String(value);
      }
    }
  }

  return "";
}

function getInsufficientFundsAmounts(error = {}) {
  const sources = [error.payload?.details, error.details, error.payload, error];
  const message = String(error.userMessage || error.message || error.payload?.message || "");
  const required = pickAmount(sources, ["required", "requiredAmount", "amountRequired", "needed"]);
  const available = pickAmount(sources, ["available", "availableBalance", "balance", "walletBalance"]);

  if (required && available) {
    return { required, available };
  }

  const match = message.match(/(?:required|المطلوب)\s*:\s*([^,،]+)[,،]\s*(?:available|المتاح)\s*:\s*([^,،]+)/i);
  if (!match) return { required, available };

  return {
    required: required || match[1].trim(),
    available: available || match[2].trim(),
  };
}

function parseAmount(value) {
  const normalized = String(value || "")
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
    .replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function getInsufficientFundsDetails(error = {}) {
  const amounts = getInsufficientFundsAmounts(error);
  const requiredAmount = parseAmount(amounts.required);
  const availableAmount = parseAmount(amounts.available);
  const shortfall = requiredAmount !== null && availableAmount !== null
    ? Math.max(0, requiredAmount - availableAmount)
    : null;

  return { ...amounts, shortfall };
}

function buildInsufficientFundsMessage(error, t) {
  const { required, available } = getInsufficientFundsAmounts(error);

  if (required && available) {
    return t("purchase.insufficientFundsWithAmounts", { required, available });
  }

  return t("purchase.insufficientFunds");
}

export function useCustomerPurchase({ basePath = "/customer", onSuccess, token } = {}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation("products");
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [insufficientFundsPrompt, setInsufficientFundsPrompt] = useState(null);
  const [purchaseReceipt, setPurchaseReceipt] = useState(null);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const isCustomerArea = basePath === "/customer" || basePath === "/admin/user";

  const openPurchase = useCallback((product, category = null) => {
    if (!isCustomerArea) {
      showToast({
        type: "info",
        title: t("purchase.customerOnlyTitle"),
        message: t("purchase.customerOnlyMessage"),
      });
      return;
    }

    if (!token) {
      navigate("/login", { state: { from: `${basePath}/dashboard` } });
      return;
    }

    if (product?.isPurchasable === false) {
      showToast({
        type: "info",
        title: t("purchase.productUnavailableTitle", { defaultValue: "Product unavailable" }),
        message: t("purchase.productUnavailableMessage", { defaultValue: "This product is currently unavailable for purchase." }),
      });
      return;
    }

    setPurchaseError("");
    setPurchaseItem({ product, category });
  }, [basePath, isCustomerArea, navigate, showToast, t, token]);

  const closePurchase = useCallback(() => {
    if (purchaseSubmitting) return;
    setInsufficientFundsPrompt(null);
    setPurchaseItem(null);
    setPurchaseError("");
  }, [purchaseSubmitting]);

  const closeInsufficientFundsPrompt = useCallback(() => {
    setInsufficientFundsPrompt(null);
  }, []);

  const goToAddBalance = useCallback(() => {
    const fundingDetails = insufficientFundsPrompt
      ? {
          message: insufficientFundsPrompt.message,
          required: insufficientFundsPrompt.required,
          available: insufficientFundsPrompt.available,
          shortfall: insufficientFundsPrompt.shortfall,
        }
      : null;

    setInsufficientFundsPrompt(null);
    setPurchaseItem(null);
    setPurchaseError("");
    navigate(`${basePath}/wallet`, {
      state: fundingDetails ? { insufficientFunds: fundingDetails } : undefined,
    });
  }, [basePath, insufficientFundsPrompt, navigate]);

  const submitPurchase = useCallback(async (purchase) => {
    if (purchaseSubmitting) return;

    const payload = buildCustomerOrderPayload(purchase);
    if (!payload.productId) {
      setPurchaseError(t("purchase.missingProductId"));
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
        t,
      });

      setPurchaseItem(null);
      setPurchaseReceipt(receipt);
      await onSuccess?.(result.order);

      showToast({
        type: "success",
        title: t("purchase.orderCreated"),
        message: `${receipt.orderId} - ${receipt.statusLabel}`,
      });
    } catch (error) {
      if (isInsufficientFundsError(error)) {
        const details = getInsufficientFundsDetails(error);
        const message = buildInsufficientFundsMessage(error, t);
        setPurchaseError(message);
        setInsufficientFundsPrompt({ message, ...details });
        return;
      }

      setPurchaseError(error.userMessage || t("purchase.orderCreateFailed"));
    } finally {
      setPurchaseSubmitting(false);
    }
  }, [onSuccess, purchaseItem?.category, purchaseSubmitting, showToast, t, token]);

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
      {insufficientFundsPrompt && (
        <InsufficientFundsPrompt
          message={insufficientFundsPrompt.message}
          shortfall={insufficientFundsPrompt.shortfall}
          onCancel={closeInsufficientFundsPrompt}
          onConfirm={goToAddBalance}
          t={t}
        />
      )}
    </AnimatePresence>
  ), [basePath, closeInsufficientFundsPrompt, closePurchase, goToAddBalance, navigate, purchaseError, purchaseItem, purchaseReceipt, purchaseSubmitting, insufficientFundsPrompt, submitPurchase, t]);

  return {
    openPurchase,
    purchaseModals,
  };
}

function InsufficientFundsPrompt({ message, shortfall, onCancel, onConfirm, t }) {
  const modal = (
    <motion.div
      className="fixed inset-0 z-[100100] grid place-items-center bg-slate-950/70 px-4 text-right backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="insufficient-funds-title"
      onClick={onCancel}
    >
      <motion.section
        dir="rtl"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[430px] overflow-hidden rounded-[28px] border border-amber-200/80 bg-white p-5 text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-amber-300/20 dark:bg-[#101827] dark:text-white dark:shadow-[0_0_44px_rgba(245,158,11,0.18)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#F59E0B,#A855F7,#38BDF8)]" />
        <button
          type="button"
          onClick={onCancel}
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
          aria-label={t("purchase.insufficientFundsCancel")}
          title={t("purchase.insufficientFundsCancel")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-600 shadow-[0_18px_36px_rgba(245,158,11,0.18)] dark:bg-amber-400/14 dark:text-amber-300">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 id="insufficient-funds-title" className="mt-4 text-2xl font-black leading-8">
          {t("purchase.insufficientFundsTitle")}
        </h2>
        <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-white/68">
          {message}
        </p>
        {shortfall > 0 && (
          <p className="mt-3 rounded-2xl border border-violet-300/50 bg-violet-50 px-3 py-2 text-sm font-black leading-7 text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200">
            {t("purchase.insufficientFundsShortfall", { amount: formatAmount(shortfall) })}
          </p>
        )}
        <p className="mt-3 rounded-2xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm font-black leading-7 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
          {t("purchase.insufficientFundsConfirmQuestion")}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            {t("purchase.insufficientFundsCancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(124,58,237,0.36)]"
          >
            <WalletCards className="h-4 w-4" />
            {t("purchase.insufficientFundsConfirm")}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
