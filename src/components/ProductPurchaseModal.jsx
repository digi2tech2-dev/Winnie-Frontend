import { motion } from "framer-motion";
import { Hash, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { iconMap } from "./icons";

export default function ProductPurchaseModal({ product, category, onClose, onConfirm, requireAccountId = true }) {
  const ProductIcon = typeof product.icon === "function" ? product.icon : iconMap[product.icon] || iconMap.ShoppingBag;
  const packages = Array.isArray(product.packages) ? product.packages : [];
  const [quantity, setQuantity] = useState(1);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
  const selectedPackage = packages[selectedPackageIndex] || null;
  const displayPrice = selectedPackage?.price || product.newPrice || product.price || "حسب الباقة";
  const priceInfo = extractPriceInfo(displayPrice);
  const totalLabel = priceInfo ? formatTotalPrice(priceInfo, quantity) : `${quantity} × ${displayPrice}`;
  const tone = product.tone || product.cover || "from-[#7C3AED] via-[#2563EB] to-[#111827]";
  const categoryLabel = typeof category === "string" ? category : category?.title || "طلب جديد";

  const updateQuantity = (nextQuantity) => {
    const safeQuantity = Number.parseInt(nextQuantity, 10);
    setQuantity(Number.isFinite(safeQuantity) ? Math.min(999, Math.max(1, safeQuantity)) : 1);
  };

  const submitPurchase = (event) => {
    event.preventDefault();

    const safeAccountId = accountId.trim();
    if (requireAccountId && !safeAccountId) {
      setError("من فضلك اكتب الأيدي أو رقم الحساب قبل تأكيد الطلب.");
      return;
    }

    setError("");
    onConfirm({ product, quantity, accountId: safeAccountId, selectedPackage, totalLabel });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/60 px-3 backdrop-blur-sm sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/16 text-white backdrop-blur transition hover:bg-white/24"
              aria-label="إغلاق نافذة الشراء"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="سعر الوحدة" value={displayPrice} />
            <InfoBox label="الإجمالي" value={totalLabel} strong />
          </div>

          {packages.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">اختار الباقة</span>
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

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">الأيدي / رقم الحساب</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 transition focus-within:border-[#A855F7]/70 focus-within:ring-4 focus-within:ring-[#EDE9FE] dark:border-[#2B3650] dark:bg-[#0B1220] dark:focus-within:border-[#A855F7]/80 dark:focus-within:ring-[#8B5CF6]/20">
              <Hash className="h-5 w-5 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" />
              <input
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value);
                  setError("");
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-[#7F8AA0]"
                placeholder="اكتب ID اللاعب أو الحساب"
              />
            </div>
          </label>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">الكمية</span>
            <div dir="ltr" className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#2B3650] dark:bg-[#0B1220]">
              <button
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
                className="grid h-full w-12 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:bg-[#172033] dark:hover:text-[#C084FC]"
                aria-label="تقليل الكمية"
                title="تقليل"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(event) => updateQuantity(event.target.value)}
                className="h-full min-w-0 flex-1 border-x border-slate-200 bg-transparent text-center text-lg font-black text-slate-950 outline-none dark:border-[#2B3650] dark:text-white"
              />
              <button
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
                className="grid h-full w-12 place-items-center text-slate-500 transition hover:bg-slate-50 hover:text-[#7C3AED] dark:text-[#AAB6CC] dark:hover:bg-[#172033] dark:hover:text-[#C084FC]"
                aria-label="زيادة الكمية"
                title="زيادة"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/12 px-3 py-2 text-xs font-bold leading-5 text-amber-800 dark:text-amber-300">
              {error}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-[#2B3650] dark:bg-[#0B1220] dark:text-[#C4C9D4] dark:hover:bg-[#172033]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#38BDF8)] text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(124,58,237,0.32)]"
            >
              <ShoppingCart className="h-4 w-4" />
              شراء الآن
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

function extractPriceInfo(price) {
  const value = String(price);
  const dollarMatch = value.match(/(?:\$\s*([\d.]+)|([\d.]+)\s*\$)/);

  if (dollarMatch) {
    return { amount: Number.parseFloat(dollarMatch[1] || dollarMatch[2]), prefix: "$", suffix: "" };
  }

  const riyalMatch = value.match(/(?:ر\.?س\.?\s*([\d.]+)|([\d.]+)\s*ر\.?س\.?)/i);

  if (riyalMatch) {
    return {
      amount: Number.parseFloat(riyalMatch[1] || riyalMatch[2]),
      prefix: "$",
      suffix: "",
    };
  }

  return null;
}

function formatTotalPrice({ amount, prefix, suffix }, quantity) {
  return `${prefix}${(amount * quantity).toFixed(2)}${suffix}`;
}
