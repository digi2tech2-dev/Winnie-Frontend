import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { iconMap } from "./icons";
import { productGroups } from "../data/catalog";

export default function HeaderSearchOverlay({ open, onClose, onNavigate, onProductSelect, mode = "public" }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const products = useMemo(
    () =>
      Object.entries(productGroups).flatMap(([groupId, group]) =>
        group.products.map((product) => ({
          ...product,
          groupId,
          groupTitle: group.title,
          searchText: `${product.name} ${product.price} ${group.title}`.toLowerCase(),
        })),
      ),
    [],
  );

  const shownProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return products.slice(0, 12);
    }

    return products.filter((product) => product.searchText.includes(normalized)).slice(0, 16);
  }, [products, query]);

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 80);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleProductClick = (product) => {
    if (onProductSelect) {
      onProductSelect(product);
      onClose();
      return;
    }

    const target = mode === "customer" ? "/customer/dashboard#best-selling" : `/categories/${product.groupId}`;
    onNavigate(target);
    onClose();
  };

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-slate-950/52 px-4 py-6 backdrop-blur-md dark:bg-[#050816]/76 sm:px-6"
          onClick={onClose}
        >
          <motion.div
            dir="rtl"
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto mt-[76px] max-w-[980px] overflow-hidden rounded-[28px] border border-white/75 bg-white/95 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(10,15,29,0.96)] dark:text-white dark:shadow-[0_0_46px_rgba(139,92,246,0.30)]"
            role="dialog"
            aria-modal="true"
            aria-label="البحث في المنتجات"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-sky-100/90 p-3 dark:border-white/10 sm:p-4">
              <div className="flex items-center gap-2">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B5CF6]" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن لعبة أو تطبيق أو خدمة..."
                    className="h-14 w-full rounded-2xl border border-sky-100 bg-[#F8FCFF] pl-4 pr-12 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#A855F7]/70 focus:ring-4 focus:ring-[#EDE9FE] dark:border-white/10 dark:bg-[#0D1324] dark:text-white dark:placeholder:text-[#8A94A7] dark:focus:border-[#8B5CF6]/70 dark:focus:ring-[#8B5CF6]/18"
                  />
                </label>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-white text-slate-500 transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] hover:text-[#7C3AED] dark:border-white/10 dark:bg-[#111827] dark:text-[#C4C9D4] dark:hover:border-[#A855F7]/60 dark:hover:bg-[#1A2335] dark:hover:text-white"
                  aria-label="إغلاق البحث"
                  title="إغلاق"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[min(64vh,620px)] overflow-y-auto p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-black sm:text-lg">
                  {query.trim() ? "نتائج البحث" : "منتجات مقترحة"}
                </h2>
                <span className="text-xs font-black text-[#8B5CF6] dark:text-[#C084FC]">
                  {shownProducts.length} منتج
                </span>
              </div>

              {shownProducts.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {shownProducts.map((product) => (
                    <SearchProductCard
                      key={`${product.groupId}-${product.name}`}
                      product={product}
                      onClick={() => handleProductClick(product)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 p-6 text-center dark:border-white/10 dark:bg-[#0D1324]">
                  <div>
                    <ShoppingBag className="mx-auto h-10 w-10 text-[#8B5CF6]" />
                    <p className="mt-3 text-sm font-black">لا توجد منتجات مطابقة.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
}

function SearchProductCard({ product, onClick }) {
  const Icon = iconMap[product.icon] || iconMap.ShoppingBag;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 overflow-hidden rounded-2xl border border-sky-100 bg-white text-right shadow-[0_14px_34px_rgba(14,165,233,0.10)] transition hover:-translate-y-1 hover:border-[#C4B5FD] hover:shadow-[0_18px_44px_rgba(124,58,237,0.16)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.14)] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335]"
    >
      <span className={`relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br ${product.tone}`}>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.38),transparent_32%),linear-gradient(180deg,transparent,rgba(2,6,23,0.34))]" />
        <Icon className="relative h-10 w-10 text-white drop-shadow-xl transition group-hover:scale-110 sm:h-12 sm:w-12" />
      </span>
      <span className="block p-3">
        <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{product.name}</span>
        <span className="mt-1 block truncate text-xs font-bold text-slate-500 dark:text-[#8A94A7]">{product.groupTitle}</span>
        <span dir="ltr" className="mt-2 block text-sm font-black text-[#8B5CF6] dark:text-[#C084FC]">{product.price}</span>
      </span>
    </button>
  );
}
