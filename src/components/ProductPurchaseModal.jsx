import { motion } from "framer-motion";
import {
  CircleUserRound,
  Loader2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "./ProductPurchaseModal.css";

export default function ProductPurchaseModal({
  product,
  onClose,
  onConfirm,
  requireAccountId = true,
  submitError = "",
  submitting = false,
}) {
  const { t, i18n } = useTranslation("products");
  const { user } = useAuth();
  const isArabic = i18n.language?.startsWith("ar");
  const orderFields = getProductOrderFields(product);
  const packages = Array.isArray(product.packages) ? product.packages : [];
  const minQuantity = Math.max(1, Number(product.minQty) || 1);
  const maxQuantity = Math.max(minQuantity, Number(product.maxQty) || 999);
  const [quantity, setQuantity] = useState(minQuantity);
  const [accountId, setAccountId] = useState("");
  const [fieldValues, setFieldValues] = useState(() => createInitialFieldValues(orderFields));
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const [localError, setLocalError] = useState("");
  const modalRef = useRef(null);
  const modalScale = useViewportFitScale(modalRef, 10, 0.45);

  const selectedPackage = packages[selectedPackageIndex] || null;
  const unitPrice = selectedPackage?.price || product.displayPriceLabel || product.price || t("purchase.pricedByBackend");
  const total = calculateTotal(unitPrice, quantity);
  const displayTotal = formatPurchaseTotalLabel(total);
  const walletBalance = Number(user?.walletBalance ?? 245.5);
  const balanceLabel = formatPlainAmount(walletBalance);
  const displayError = localError || submitError;
  const hasOrderFields = orderFields.length > 0;
  const showFallbackAccountInput = !hasOrderFields;
  const productTitle = product.name || (isArabic ? "المنتج" : "Product");
  const productImage = getProductImage(product);

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

  const changeQuantity = (value) => {
    setQuantity(String(value).replace(/[^\d]/g, ""));
    setLocalError("");
  };

  const changeOrderField = (key, value) => {
    setFieldValues((current) => ({ ...current, [key]: value }));
    setLocalError("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (submitting) return;

    const numericQuantity = Number(quantity);
    if (!Number.isInteger(numericQuantity) || numericQuantity < minQuantity || numericQuantity > maxQuantity) {
      setLocalError(isArabic
        ? `أدخل كمية صحيحة من ${minQuantity} إلى ${maxQuantity}.`
        : `Enter a valid quantity from ${minQuantity} to ${maxQuantity}.`);
      return;
    }

    const missingField = orderFields.find(
      (field) => field.required !== false && !String(fieldValues[field.key] ?? "").trim(),
    );

    if (missingField) {
      setLocalError(t("purchase.requiredField", { label: getOrderFieldLabel(missingField, isArabic) }));
      return;
    }

    const cleanAccountId = accountId.trim();
    if (!hasOrderFields && requireAccountId && !cleanAccountId) {
      setLocalError(t("purchase.accountRequired"));
      return;
    }

    setLocalError("");
    onConfirm({
      product,
      quantity: numericQuantity,
      accountId: cleanAccountId,
      orderFieldsValues: hasOrderFields ? fieldValues : {},
      selectedPackage,
      totalLabel: displayTotal,
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
            <span>{isArabic ? "الإجمالي" : "Total"}</span>
            <strong dir="ltr">{displayTotal}</strong>
          </div>
        </section>

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
              <DynamicOrderInput
                field={field}
                value={fieldValues[field.key] ?? ""}
                onChange={(value) => changeOrderField(field.key, value)}
              />
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

        {displayError && <p className="buy-modal__error">{displayError}</p>}

        <div className="buy-actions">
          <button className="buy-actions__submit" type="submit" disabled={submitting}>
            <span>{submitting ? t("purchase.creatingOrder") : isArabic ? "تأكيد الشحن" : "Confirm charge"}</span>
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

function formatAmount(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
