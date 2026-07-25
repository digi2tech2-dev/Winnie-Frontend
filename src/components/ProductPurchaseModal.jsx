import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleUserRound,
  Loader2,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { verifyProductTarget } from "../api/catalog";
import { createCustomerOrderQuote } from "../api/orders";
import {
  isXenaProduct,
  normalizeXenaTargetUid,
  validateXenaTargetUid,
  XENA_TARGET_FIELD_KEY,
} from "../utils/xena";
import "./ProductPurchaseModal.css";

export default function ProductPurchaseModal({
  product,
  onClose,
  onConfirm,
  onInsufficientFunds,
  requireAccountId = true,
  submitError = "",
  submitting = false,
  token = "",
}) {
  const { t, i18n } = useTranslation("products");
  const { user } = useAuth();
  const isArabic = i18n.language?.startsWith("ar");
  const orderFields = getProductOrderFields(product);
  const packages = Array.isArray(product.packages) ? product.packages : [];
  const minQuantity = Math.max(1, Number(product.minQty) || 1);
  const maxQuantity = Math.max(minQuantity, Number(product.maxQty) || 999);
  const productId = product?._id || product?.id || product?.productId;
  const xenaProduct = isXenaProduct(product);
  const [quantity, setQuantity] = useState(minQuantity);
  const [accountId, setAccountId] = useState("");
  const [fieldValues, setFieldValues] = useState(() => createInitialFieldValues(orderFields));
  const [xenaVerification, setXenaVerification] = useState({
    error: "",
    loading: false,
    targetUid: "",
    user: null,
    valid: false,
  });
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const [localError, setLocalError] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const modalRef = useRef(null);
  const modalScale = useViewportFitScale(modalRef, 10, 0.45);

  const selectedPackage = packages[selectedPackageIndex] || null;
  const numericQuantity = Number(quantity);
  const quoteForQuantity = quote && Number(quote.quantity) === numericQuantity ? quote : null;
  const localEstimate = calculateLocalEstimate(product, numericQuantity, user);
  const displayTotal = quoteForQuantity?.displayTotal
    || (quoteForQuantity ? formatCurrencyAmount(quoteForQuantity.chargedAmount ?? quoteForQuantity.payableAmount, quoteForQuantity.currency) : "")
    || (localEstimate ? formatCurrencyAmount(localEstimate.amount, localEstimate.currency) : "")
    || (quoteLoading ? t("common:states.loading", { defaultValue: "Loading..." }) : "");
  const totalLabel = quoteForQuantity
    ? t("purchase.total")
    : t("purchase.estimatedTotal", { defaultValue: isArabic ? "الإجمالي التقديري" : "Estimated total" });
  const walletBalance = Number(user?.walletBalance ?? quote?.walletBalance ?? 0);
  const balanceLabel = formatPlainAmount(walletBalance);
  const quantityWarning = getQuantityWarning(numericQuantity, minQuantity, maxQuantity, isArabic, t);
  const xenaTargetUid = normalizeXenaTargetUid(fieldValues[XENA_TARGET_FIELD_KEY]);
  const xenaVerified = !xenaProduct || (
    xenaVerification.valid
    && xenaVerification.targetUid === xenaTargetUid
    && Boolean(xenaTargetUid)
  );
  const displayError = localError || xenaVerification.error || submitError || quantityWarning || quoteError;
  const isQuantityWarning = Boolean(quantityWarning) && displayError === quantityWarning;
  const hasOrderFields = orderFields.length > 0;
  const showFallbackAccountInput = !hasOrderFields;
  const productTitle = product.name || (isArabic ? "المنتج" : "Product");
  const productImage = getProductImage(product);
  const missingRequiredField = orderFields.some(
    (field) => field.required !== false && !String(fieldValues[field.key] ?? "").trim(),
  );
  const missingFallbackAccount = !hasOrderFields && requireAccountId && !accountId.trim();
  const isQuantityWithinBounds = Number.isInteger(numericQuantity)
    && numericQuantity >= minQuantity
    && numericQuantity <= maxQuantity;
  const quoteAllowsSubmit = Boolean(quoteForQuantity)
    && quoteForQuantity.isQuantityValid !== false
    && (quoteForQuantity.canSubmit !== false || quoteForQuantity.hasEnoughBalance === false);
  const confirmDisabled = submitting
    || quoteLoading
    || xenaVerification.loading
    || Boolean(quoteError)
    || !quoteAllowsSubmit
    || !isQuantityWithinBounds
    || missingRequiredField
    || missingFallbackAccount
    || (xenaProduct && !xenaVerified);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const numericQuantity = Number(quantity);

    if (!token || !productId || !Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteError("");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      setQuoteError("");

      createCustomerOrderQuote(token, {
        productId,
        quantity: numericQuantity,
        values: {},
      }, { signal: controller.signal })
        .then((nextQuote) => {
          setQuote(nextQuote);
        })
        .catch((error) => {
          if (error.name === "AbortError" || error.code === "REQUEST_CANCELLED") return;
          setQuote(null);
          setQuoteError(error.userMessage || t("purchase.quoteFailed", { defaultValue: "Could not calculate the final price. Please try again." }));
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productId, quantity, t, token]);

  useEffect(() => {
    setXenaVerification({
      error: "",
      loading: false,
      targetUid: "",
      user: null,
      valid: false,
    });
  }, [productId]);

  useEffect(() => {
    if (!xenaProduct) return;
    setXenaVerification((current) => {
      if (!current.targetUid && !current.error) return current;
      if (current.valid && current.targetUid === xenaTargetUid) return current;
      return {
        error: "",
        loading: false,
        targetUid: "",
        user: null,
        valid: false,
      };
    });
  }, [xenaProduct, xenaTargetUid]);

  const changeQuantity = (value) => {
    setQuantity(String(value).replace(/[^\d]/g, ""));
    setLocalError("");
  };

  const changeOrderField = (key, value) => {
    setFieldValues((current) => ({ ...current, [key]: value }));
    setLocalError("");
  };

  const verifyXenaTarget = async () => {
    if (!xenaProduct || xenaVerification.loading) return;
    const validation = validateXenaTargetUid(xenaTargetUid);

    if (!validation.valid) {
      setXenaVerification({
        error: validation.message,
        loading: false,
        targetUid: "",
        user: null,
        valid: false,
      });
      return;
    }

    setXenaVerification((current) => ({ ...current, error: "", loading: true }));
    try {
      const result = await verifyProductTarget(token, productId, validation.targetUid);

      if (!result.valid) {
        setXenaVerification({
          error: getXenaCustomerErrorMessage({ code: "XENA_TARGET_INVALID" }, isArabic),
          loading: false,
          targetUid: "",
          user: null,
          valid: false,
        });
        return;
      }

      setXenaVerification({
        error: "",
        loading: false,
        targetUid: result.targetUid || validation.targetUid,
        user: result.user,
        valid: true,
      });
    } catch (error) {
      setXenaVerification({
        error: getXenaCustomerErrorMessage(error, isArabic),
        loading: false,
        targetUid: "",
        user: null,
        valid: false,
      });
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (submitting || quoteLoading) return;

    const numericQuantity = Number(quantity);
    if (!Number.isInteger(numericQuantity) || numericQuantity < minQuantity || numericQuantity > maxQuantity) {
      setLocalError(getQuantityWarning(numericQuantity, minQuantity, maxQuantity, isArabic, t));
      return;
    }

    const missingField = orderFields.find(
      (field) => field.required !== false && !String(fieldValues[field.key] ?? "").trim(),
    );

    if (missingField) {
      setLocalError(t("purchase.requiredField", { label: getOrderFieldLabel(missingField, isArabic) }));
      return;
    }

    if (xenaProduct) {
      const validation = validateXenaTargetUid(xenaTargetUid);
      if (!validation.valid) {
        setLocalError(validation.message);
        return;
      }
      if (!xenaVerified) {
        setLocalError("Verify Xena ID before confirming.");
        return;
      }
    }

    const cleanAccountId = accountId.trim();
    if (!hasOrderFields && requireAccountId && !cleanAccountId) {
      setLocalError(t("purchase.accountRequired"));
      return;
    }

    if (!quoteForQuantity || quoteError || quoteForQuantity.isQuantityValid === false) {
      setLocalError(t("purchase.quoteFailed", { defaultValue: "Could not calculate the final price. Please try again." }));
      return;
    }

    if (quoteForQuantity.hasEnoughBalance === false) {
      if (typeof onInsufficientFunds === "function") {
        setLocalError("");
        onInsufficientFunds(quoteForQuantity);
      } else {
        setLocalError(t("purchase.insufficientFunds"));
      }
      return;
    }

    setLocalError("");
    const submittedFieldValues = hasOrderFields ? { ...fieldValues } : {};
    if (xenaProduct) {
      submittedFieldValues[XENA_TARGET_FIELD_KEY] = xenaTargetUid;
    }

    onConfirm({
      product,
      quantity: numericQuantity,
      accountId: cleanAccountId,
      orderFieldsValues: submittedFieldValues,
      selectedPackage,
      totalLabel: displayTotal,
      quote: quoteForQuantity,
    });
  };

  const modal = (
    <motion.div
      className="buy-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
      onClick={submitting ? undefined : onClose}
    >
      <motion.form
        ref={modalRef}
        className="buy-modal"
        style={{ "--buy-modal-scale": modalScale }}
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="buy-modal__aura buy-modal__aura--pink" aria-hidden="true" />
        <span className="buy-modal__aura buy-modal__aura--cyan" aria-hidden="true" />
        <span className="buy-modal__spark buy-modal__spark--one" aria-hidden="true" />
        <span className="buy-modal__spark buy-modal__spark--two" aria-hidden="true" />
        <header className="buy-modal__header">
          <button
            className="buy-modal__close"
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={t("purchase.closeAria")}
          >
            <X />
          </button>

          <h2 id="purchase-modal-title" className="buy-modal__title" dir={isArabic ? "rtl" : "ltr"}>
            <span dir="auto" title={productTitle}>{productTitle}</span>
            <Zap aria-hidden="true" />
          </h2>

          <span className="buy-modal__status" aria-hidden="true">
            <span className="buy-modal__status-dot" />
            <span>{isArabic ? "متاح" : "Available"}</span>
            <Zap />
          </span>
        </header>

        <section className="buy-hero" dir={isArabic ? "rtl" : "ltr"}>
          <div className="buy-balance-card">
            <span>{isArabic ? "رصيدك الحالي" : "Current balance"}</span>
            <strong dir="ltr">
              <span className="buy-w-coin">W</span>
              {balanceLabel}
            </strong>
          </div>

          <div className="buy-hero__image-wrap" aria-hidden="true">
            <img className="buy-hero__image" src={productImage} alt="" />
          </div>
        </section>

        <section className="buy-summary" dir={isArabic ? "rtl" : "ltr"}>
          <div className="buy-summary__item buy-summary__item--quantity">
            <span>{isArabic ? "الكمية" : "Quantity"}</span>
            <div className="buy-quantity" dir="ltr">
              <span className="buy-w-coin">W</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatQuantityInput(quantity)}
                onChange={(event) => changeQuantity(event.target.value)}
                aria-label={t("purchase.quantity")}
              />
            </div>
          </div>

          <div className="buy-summary__item buy-summary__item--total">
            <span>{totalLabel}</span>
            <strong dir="ltr">{displayTotal}</strong>
          </div>
        </section>

        <div className="buy-quantity-limits" dir={isArabic ? "rtl" : "ltr"}>
          <span className="buy-quantity-limits__item">
            <ArrowDown aria-hidden="true" />
            <span>{t("purchase.minimumChargeValue")}</span>
            <strong dir="ltr">{formatQuantityInput(minQuantity)}</strong>
          </span>
          <span className="buy-quantity-limits__divider" aria-hidden="true" />
          <span className="buy-quantity-limits__item">
            <ArrowUp aria-hidden="true" />
            <span>{t("purchase.maximumQuantityValue")}</span>
            <strong dir="ltr">{formatQuantityInput(maxQuantity)}</strong>
          </span>
        </div>

        {packages.length > 1 && (
          <div className="buy-packages" aria-label={t("purchase.package")}>
            {packages.map((item, index) => (
              <button
                key={`${item.name}-${item.price}`}
                type="button"
                className={index === selectedPackageIndex ? "is-selected" : ""}
                onClick={() => setSelectedPackageIndex(index)}
              >
                <strong>{item.name}</strong>
                <span>{item.price}</span>
              </button>
            ))}
          </div>
        )}

        <div className="buy-fields">
          {hasOrderFields ? orderFields.map((field) => (
            <PurchaseRow
              key={field.key}
              icon={CircleUserRound}
              label={getOrderFieldLabel(field, isArabic)}
            >
              {xenaProduct && field.key === XENA_TARGET_FIELD_KEY ? (
                <XenaTargetInput
                  field={field}
                  isArabic={isArabic}
                  onChange={(value) => changeOrderField(field.key, value)}
                  onVerify={verifyXenaTarget}
                  value={fieldValues[field.key] ?? ""}
                  verification={xenaVerification}
                />
              ) : (
                <DynamicOrderInput
                  field={field}
                  value={fieldValues[field.key] ?? ""}
                  onChange={(value) => changeOrderField(field.key, value)}
                />
              )}
            </PurchaseRow>
          )) : showFallbackAccountInput ? (
            <PurchaseRow icon={CircleUserRound} label={t("purchase.accountPlayerId")}>
              <input
                className="buy-account-input"
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value);
                  setLocalError("");
                }}
                placeholder={t("purchase.accountPlaceholder")}
              />
            </PurchaseRow>
          ) : null}
        </div>

        {displayError && (
          <p
            className={`buy-modal__error${isQuantityWarning ? " buy-modal__error--quantity-warning" : ""}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {isQuantityWarning && <AlertTriangle className="buy-modal__error-icon" aria-hidden="true" />}
            <span>{displayError}</span>
          </p>
        )}

        <div className="buy-actions">
          <button className="buy-actions__submit" type="submit" disabled={confirmDisabled}>
            <span>{submitting ? t("purchase.creatingOrder") : quoteLoading ? t("common:states.loading", { defaultValue: "Loading..." }) : isArabic ? "تأكيد الشحن" : "Confirm charge"}</span>
            {submitting ? <Loader2 className="is-spinning" /> : <Zap />}
          </button>
        </div>

        <p className="buy-modal__secure">
          <ShieldCheck />
          <span>{isArabic ? "عملية آمنة وسريعة 100%" : "100% secure and fast process"}</span>
        </p>
      </motion.form>
    </motion.div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

function PurchaseRow({ children, icon: Icon, label }) {
  return (
    <div className="buy-row" dir="rtl">
      <span className="buy-row__icon" aria-hidden="true"><Icon /></span>
      <span className="buy-row__label">{label}</span>
      <div className="buy-row__content">{children}</div>
    </div>
  );
}

function DynamicOrderInput({ field, value, onChange }) {
  const { t } = useTranslation("products");

  if (field.type === "select") {
    return (
      <select className="buy-dynamic-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t("purchase.select")}</option>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className="buy-dynamic-input buy-dynamic-input--textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        rows={2}
      />
    );
  }

  return (
    <input
      className="buy-dynamic-input"
      type={getInputType(field.type)}
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function XenaTargetInput({ field, isArabic, onChange, onVerify, value, verification }) {
  const normalizedValue = normalizeXenaTargetUid(value);
  const verified = verification.valid && verification.targetUid === normalizedValue && Boolean(normalizedValue);
  const user = verification.user || {};

  return (
    <div className="buy-xena-field">
      <div className="buy-xena-field__control">
        <input
          className="buy-dynamic-input buy-xena-field__input"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder || "001234"}
          dir="ltr"
        />
        <button
          type="button"
          className={`buy-xena-field__verify${verified ? " is-verified" : ""}`}
          onClick={onVerify}
          disabled={verification.loading || !normalizedValue}
        >
          {verification.loading ? <Loader2 className="is-spinning" /> : verified ? <CheckCircle2 /> : <Search />}
          <span>{verified ? (isArabic ? "Verified" : "Verified") : (isArabic ? "Verify" : "Verify")}</span>
        </button>
      </div>
      {verified && (
        <div className="buy-xena-field__result" dir={isArabic ? "rtl" : "ltr"}>
          {user.avatar && <img src={user.avatar} alt="" />}
          <div>
            <strong dir="ltr">{verification.targetUid}</strong>
            {(user.nickname || user.country) && (
              <span>{[user.nickname, user.country].filter(Boolean).join(" - ")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getProductOrderFields(product = {}) {
  const normalize = (field, keyProperty) => ({
    key: String(field[keyProperty] || "").trim(),
    label: field.label || field[keyProperty] || "Order field",
    type: field.type || "text",
    placeholder: field.placeholder || "",
    options: Array.isArray(field.options) ? field.options : [],
    required: field.required !== false,
    isActive: field.isActive !== false,
    min: field.min,
    max: field.max,
  });

  const dynamicFields = Array.isArray(product.dynamicFields)
    ? product.dynamicFields.map((field) => normalize(field, "name"))
    : [];
  const orderFields = Array.isArray(product.orderFields)
    ? product.orderFields.map((field) => normalize(field, "key"))
    : [];
  const source = dynamicFields.some((field) => field.isActive && field.key) ? dynamicFields : orderFields;

  return source.filter((field) => field.isActive && field.key);
}

function createInitialFieldValues(fields) {
  return fields.reduce((values, field) => ({ ...values, [field.key]: "" }), {});
}

function getOrderFieldLabel(field, isArabic) {
  const label = String(field?.label || "").trim();
  return isArabic && /^player\s*id$/i.test(label) ? "ايدي المستخدم" : label;
}

function getInputType(type) {
  return ["email", "number", "tel", "url", "date"].includes(type) ? type : "text";
}

function getProductImage(product = {}) {
  return product.image
    || product.imageUrl
    || product.imageURL
    || product.thumbnail
    || product.coverImage
    || product.productImage
    || "/winnie-wallet-charge-hero.png";
}

function getQuantityWarning(quantity, minQuantity, maxQuantity, isArabic, t) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return t("purchase.quantityGreaterThanZero", {
      defaultValue: isArabic ? "أدخل كمية أكبر من 0" : "Enter a quantity greater than 0",
    });
  }

  if (quantity < minQuantity) {
    const formattedMin = formatQuantityInput(minQuantity);
    return t("purchase.minimumQuantity", {
      minQty: formattedMin,
      defaultValue: isArabic
        ? `الحد الأدنى للطلب هو ${formattedMin}`
        : `Minimum quantity is ${formattedMin}`,
    });
  }

  if (quantity > maxQuantity) {
    const formattedMax = formatQuantityInput(maxQuantity);
    return t("purchase.maximumQuantity", {
      maxQty: formattedMax,
      defaultValue: isArabic
        ? `الحد الأقصى للطلب هو ${formattedMax}`
        : `Maximum quantity is ${formattedMax}`,
    });
  }

  return "";
}

function calculateLocalEstimate(product = {}, quantity, user = {}) {
  if (!Number.isInteger(quantity) || quantity <= 0) return null;

  const unitPriceUsd = firstPositiveNumber(
    product.customerUnitPriceUsd,
    product.unitPriceUsd,
    product.finalPriceUsd,
    product.finalPrice,
  );
  if (!unitPriceUsd) return null;

  const currency = String(
    product.displayCurrency
      || product.customerCurrency
      || product.currency
      || user?.currency
      || "USD",
  ).toUpperCase();
  const totalUsd = unitPriceUsd * quantity;
  const rate = currency === "USD" ? 1 : getLocalEstimateRate(product);

  if (!Number.isFinite(rate) || rate <= 0) return null;

  return {
    amount: totalUsd * rate,
    currency,
  };
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function getLocalEstimateRate(product = {}) {
  const explicitRate = firstPositiveNumber(
    product.rateSnapshot,
    product.rate,
    product.displayRate,
    product.currencyRate,
    product.exchangeRate,
  );
  if (explicitRate) return explicitRate;

  const minTotalCustomerCurrency = Number(product.minTotalCustomerCurrency);
  const minTotalUsd = Number(product.minTotalUsd);
  if (
    Number.isFinite(minTotalCustomerCurrency)
    && minTotalCustomerCurrency > 0
    && Number.isFinite(minTotalUsd)
    && minTotalUsd > 0
  ) {
    return minTotalCustomerCurrency / minTotalUsd;
  }

  return null;
}

function calculateTotal(price, quantity) {
  const text = String(price);
  const dollarMatch = text.match(/(?:\$\s*([\d.]+)|([\d.]+)\s*\$)/);
  if (dollarMatch) {
    const amount = Number.parseFloat(dollarMatch[1] || dollarMatch[2]);
    return `$ ${formatAmount(amount * quantity)}`;
  }

  const numberMatch = text.match(/([\d.]+)/);
  if (numberMatch) return formatAmount(Number.parseFloat(numberMatch[1]) * quantity);
  return `${quantity} x ${text}`;
}

function formatPurchaseTotalLabel(total) {
  const text = String(total || "").trim();
  if (!text) return text;
  if (/^[A-Z]{2,4}\s+/i.test(text) || /[$€£]/.test(text)) return text;
  if (!/^\d[\d,.]*$/.test(text)) return text;
  return `EGP ${text}`;
}

function formatQuantityInput(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPlainAmount(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatCurrencyAmount(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatAmount(value) {
  return formatPlainAmount(value);
}

function getXenaCustomerErrorMessage(error = {}) {
  const code = String(error.code || error.payload?.code || "").toUpperCase();
  const map = {
    XENA_CONNECTION_REQUIRED: "Service is temporarily unavailable.",
    XENA_MALFORMED_RESPONSE: "Verification is temporarily unavailable.",
    XENA_PROVIDER_AUTH_FAILED: "Service is temporarily unavailable.",
    XENA_RATE_LIMITED: "Please try again later.",
    XENA_REAUTHENTICATION_REQUIRED: "Service is temporarily unavailable.",
    XENA_TARGET_INVALID: "Xena ID is invalid.",
    XENA_VERIFICATION_UNAVAILABLE: "Verification is temporarily unavailable.",
  };

  return map[code] || error.userMessage || "Verification is temporarily unavailable.";
}

function useViewportFitScale(ref, margin = 10, minScale = 0.45) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let frameId = 0;

    const fit = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const viewportWidth = viewport?.width || window.innerWidth;
        const viewportHeight = viewport?.height || window.innerHeight;
        const availableWidth = Math.max(260, viewportWidth - margin * 2);
        const availableHeight = Math.max(320, viewportHeight - margin * 2);
        const width = element.scrollWidth || element.offsetWidth || 1;
        const height = element.scrollHeight || element.offsetHeight || 1;
        const nextScale = Math.min(1, availableWidth / width, availableHeight / height);

        setScale(Number(Math.max(minScale, nextScale).toFixed(3)));
      });
    };

    fit();

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(element);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
    };
  }, [margin, minScale, ref]);

  return scale;
}
