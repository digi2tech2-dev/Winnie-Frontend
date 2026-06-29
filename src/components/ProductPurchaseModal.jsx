import { motion } from "framer-motion";
import { Hash, Loader2, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { iconMap } from "./icons";

export default function ProductPurchaseModal({
  product,
  category,
  onClose,
  onConfirm,
  requireAccountId = true,
  submitError = "",
  submitting = false,
}) {
  const ProductIcon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const packages = Array.isArray(product.packages) ? product.packages : [];
  const minQty = Math.max(1, Number(product.minQty) || 1);
  const maxQty = Math.max(minQty, Number(product.maxQty) || 999);
  const activeFields = getProductOrderFields(product);
  const hasBackendFields = activeFields.length > 0;
  const [quantity, setQuantity] = useState(minQty);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [fieldValues, setFieldValues] = useState(() => getInitialFieldValues(activeFields));
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const selectedPackage = packages[selectedPackageIndex] || null;
  const displayPrice = selectedPackage?.price || product.displayPriceLabel || product.newPrice || product.price || "Priced by backend";
  const priceInfo = extractPriceInfo(displayPrice);
  const totalLabel = priceInfo ? formatTotalPrice(priceInfo, quantity) : `${quantity} x ${displayPrice}`;
  const tone = product.tone || product.cover || "from-[#7C3AED] via-[#2563EB] to-[#111827]";
  const categoryLabel = typeof category === "string" ? category : category?.title || category?.name || "New order";
  const displayError = error || submitError;

  const updateQuantity = (nextQuantity) => {
    const safeQuantity = Number.parseInt(nextQuantity, 10);
    setQuantity(Number.isFinite(safeQuantity) ? Math.min(maxQty, Math.max(minQty, safeQuantity)) : minQty);
  };

  const updateFieldValue = (fieldKey, value) => {
    setFieldValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
    setError("");
  };

  const validateBackendFields = () => {
    const missingField = activeFields.find((field) => {
      if (field.required === false) return false;
      const value = fieldValues[field.key];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingField) {
      return `${missingField.label} is required.`;
    }

    return "";
  };

  const submitPurchase = (event) => {
    event.preventDefault();
    if (submitting) return;

    const fieldError = hasBackendFields ? validateBackendFields() : "";
    if (fieldError) {
      setError(fieldError);
      return;
    }

    const safeAccountId = accountId.trim();
    if (!hasBackendFields && requireAccountId && !safeAccountId) {
      setError("Enter the account or player id before confirming the order.");
      return;
    }

    setError("");
    onConfirm({
      product,
      quantity,
      accountId: safeAccountId,
      orderFieldsValues: hasBackendFields ? fieldValues : {},
      selectedPackage,
      totalLabel,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/60 px-3 backdrop-blur-sm sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      onClick={submitting ? undefined : onClose}
    >
      <motion.form
        onSubmit={submitPurchase}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.97 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[28px] border border-sky-100 bg-white text-right text-slate-950 shadow-[0_28px_90px_rgba(14,165,233,0.22)] dark:border-[#2B3650] dark:bg-[#111827] dark:text-white dark:shadow-[0_0_34px_rgba(139,92,246,0.22)]"
      >
        <div className={`relative overflow-hidden bg-gradient-to-br ${tone} p-4 text-white`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.32),transparent_30%),linear-gradient(180deg,transparent,rgba(2,6,23,0.32))]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/18 shadow-[0_16px_34px_rgba(2,6,23,0.22)] backdrop-blur-md">
                <ProductIcon className="h-8 w-8 drop-shadow-[0_10px_18px_rgba(2,6,23,0.30)]" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-white/72">{categoryLabel}</p>
                <h2 className="mt-1 truncate text-xl font-black">{product.name}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/16 text-white backdrop-blur transition hover:bg-white/24 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close purchase modal"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Unit price" value={displayPrice} />
            <InfoBox label="Total" value={totalLabel} strong />
          </div>

          {packages.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">Package</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {packages.map((item, index) => {
                  const selected = index === selectedPackageIndex;

                  return (
                    <button
                      key={`${item.name}-${item.price}`}
                      type="button"
                      onClick={() => setSelectedPackageIndex(index)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-3 text-right transition ${
                        selected
                          ? "border-[#8B5CF6] bg-[#F5F3FF] shadow-[0_12px_28px_rgba(139,92,246,0.14)] dark:border-[#A855F7] dark:bg-[#24133D]"
                          : "border-slate-200 bg-white hover:border-[#C4B5FD] hover:bg-slate-50 dark:border-[#2B3650] dark:bg-[#0B1220] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#172033]"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{item.name}</span>
                          {item.description && (
                            <span className="mt-1 block text-[11px] font-bold text-slate-500 dark:text-[#AAB6CC]">
                              {item.description}
                            </span>
                          )}
                        </span>
                        <span dir="ltr" className={`shrink-0 text-sm font-black ${selected ? "text-[#7C3AED] dark:text-[#C084FC]" : "text-slate-500 dark:text-[#AAB6CC]"}`}>
                          {item.price}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasBackendFields ? (
            <div className="mt-4 grid gap-3">
              {activeFields.map((field) => (
                <OrderFieldInput
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key] ?? ""}
                  onChange={(value) => updateFieldValue(field.key, value)}
                />
              ))}
            </div>
          ) : requireAccountId ? (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">Account / player id</span>
              <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 transition focus-within:border-[#A855F7]/70 focus-within:ring-4 focus-within:ring-[#EDE9FE] dark:border-[#2B3650] dark:bg-[#0B1220] dark:focus-within:border-[#A855F7]/80 dark:focus-within:ring-[#8B5CF6]/20">
                <Hash className="h-5 w-5 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
                <input
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setError("");
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]"
                  placeholder="Account or player id"
                />
              </div>
            </label>
          ) : null}

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">Quantity</span>
            <div dir="ltr" className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#2B3650] dark:bg-[#0B1220]">
              <button
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
                disabled={submitting || quantity <= minQty}
                className="grid h-full w-12 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-45 dark:text-[#AAB6CC] dark:hover:bg-[#172033] dark:hover:text-[#C084FC]"
                aria-label="Decrease quantity"
                title="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={minQty}
                max={maxQty}
                value={quantity}
                onChange={(event) => updateQuantity(event.target.value)}
                className="h-full min-w-0 flex-1 border-x border-slate-200 bg-transparent text-center text-lg font-black text-slate-950 outline-none dark:border-[#2B3650] dark:text-white"
              />
              <button
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
                disabled={submitting || quantity >= maxQty}
                className="grid h-full w-12 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-45 dark:text-[#AAB6CC] dark:hover:bg-[#172033] dark:hover:text-[#C084FC]"
                aria-label="Increase quantity"
                title="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {displayError && (
            <p className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold leading-5 text-amber-800 dark:text-amber-300">
              {displayError}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2B3650] dark:bg-[#0B1220] dark:text-[#C4C9D4] dark:hover:bg-[#172033]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(124,58,237,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {submitting ? "Creating order..." : "Buy now"}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function InfoBox({ label, value, strong = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-[#2B3650] dark:bg-[#0B1220]">
      <p className="text-[11px] font-bold text-slate-500 dark:text-[#AAB6CC]">{label}</p>
      <p dir="ltr" className={`mt-1 truncate text-right font-black ${strong ? "text-lg text-[#7C3AED] dark:text-[#C084FC]" : "text-sm text-slate-950 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function getProductOrderFields(product = {}) {
  const dynamicFields = Array.isArray(product.dynamicFields)
    ? product.dynamicFields.map((field) => ({
        key: String(field.name || "").trim(),
        label: field.label || field.name || "Order field",
        max: field.max,
        min: field.min,
        options: Array.isArray(field.options) ? field.options : [],
        placeholder: field.placeholder || "",
        required: field.required !== false,
        type: field.type || "text",
        isActive: field.isActive !== false,
      }))
    : [];

  const orderFields = Array.isArray(product.orderFields)
    ? product.orderFields.map((field) => ({
        key: String(field.key || "").trim(),
        label: field.label || field.key || "Order field",
        max: field.max,
        min: field.min,
        options: Array.isArray(field.options) ? field.options : [],
        placeholder: field.placeholder || "",
        required: field.required !== false,
        type: field.type || "text",
        isActive: field.isActive !== false,
      }))
    : [];

  const source = dynamicFields.some((field) => field.isActive && field.key) ? dynamicFields : orderFields;
  return source.filter((field) => field.isActive && field.key);
}

function getInitialFieldValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}

function OrderFieldInput({ field, onChange, value }) {
  const inputClassName = "min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]";
  const label = `${field.label}${field.required ? " *" : ""}`;

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#A855F7]/70 focus:ring-4 focus:ring-[#EDE9FE] dark:border-[#2B3650] dark:bg-[#0B1220] dark:text-white dark:focus:border-[#A855F7]/80 dark:focus:ring-[#8B5CF6]/20"
        >
          <option value="">Select...</option>
          {field.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">{label}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="min-h-[92px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#A855F7]/70 focus:ring-4 focus:ring-[#EDE9FE] dark:border-[#2B3650] dark:bg-[#0B1220] dark:text-white dark:placeholder:text-[#7F8AA0] dark:focus:border-[#A855F7]/80 dark:focus:ring-[#8B5CF6]/20"
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 transition focus-within:border-[#A855F7]/70 focus-within:ring-4 focus-within:ring-[#EDE9FE] dark:border-[#2B3650] dark:bg-[#0B1220] dark:focus-within:border-[#A855F7]/80 dark:focus-within:ring-[#8B5CF6]/20">
        <Hash className="h-5 w-5 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
        <input
          type={getInputType(field.type)}
          min={field.min ?? undefined}
          max={field.max ?? undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClassName}
          placeholder={field.placeholder}
        />
      </div>
    </label>
  );
}

function getInputType(type) {
  if (["email", "number", "tel", "url", "date"].includes(type)) return type;
  return "text";
}

function extractPriceInfo(price) {
  const value = String(price);
  const dollarMatch = value.match(/(?:\$\s*([\d.]+)|([\d.]+)\s*\$)/);

  if (dollarMatch) {
    return { amount: Number.parseFloat(dollarMatch[1] || dollarMatch[2]), prefix: "$", suffix: "" };
  }

  const numberMatch = value.match(/([\d.]+)/);
  if (numberMatch) {
    return { amount: Number.parseFloat(numberMatch[1]), prefix: "", suffix: "" };
  }

  return null;
}

function formatTotalPrice({ amount, prefix, suffix }, quantity) {
  return `${prefix}${(amount * quantity).toFixed(2)}${suffix}`;
}
