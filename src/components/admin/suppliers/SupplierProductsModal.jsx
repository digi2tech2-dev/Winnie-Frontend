import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Boxes, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

export default function SupplierProductsModal({
  actionKey = "",
  error = "",
  loading = false,
  onClose,
  onPageChange,
  onSearch,
  onSync,
  pagination,
  products,
  supplier,
}) {
  const [query, setQuery] = useState("");

  if (!supplier) return null;

  const syncBusy = actionKey === `${supplier.id}:sync`;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && !syncBusy && onClose()}
    >
      <section className="flex max-h-[90dvh] w-full max-w-[760px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <Boxes className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">منتجات {supplier.name}</h2>
            <p className="text-[8px] font-bold text-slate-400">
              {(pagination?.total ?? products.length).toLocaleString("ar-EG-u-nu-latn")} منتجًا للمورد من الخادم
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSync(supplier)}
            disabled={syncBusy || loading || !supplier.active}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-violet-600 px-3 text-[9px] font-black text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncBusy ? "animate-spin" : ""}`} />
            مزامنة
          </button>
          <button type="button" onClick={onClose} disabled={syncBusy} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query);
          }}
          className="flex gap-2 border-b border-slate-100 p-3 dark:border-white/[0.07]"
        >
          <label className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث في منتجات المورد المحفوظة"
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
            />
          </label>
          <button type="submit" disabled={loading} className="h-10 rounded-2xl bg-slate-900 px-4 text-[10px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
            بحث
          </button>
        </form>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-xs font-black text-slate-400">جارٍ تحميل منتجات المورد...</p>
          ) : products.length ? (
            products.map((product) => (
              <article key={product.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220] sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <h3 className="truncate text-[11px] font-black dark:text-white">{product.name}</h3>
                  <p dir="ltr" className="mt-1 text-right text-[9px] font-bold text-slate-400">
                    {product.externalProductId || product.id}
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-300">
                    الكمية {product.minQty} - {product.maxQty} | آخر مزامنة {product.lastSyncedAtLabel}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <strong dir="ltr" className="text-[11px] text-violet-600 dark:text-violet-300">{product.priceLabel}</strong>
                  <ConnectionStatusBadge status={product.active ? "connected" : "failed"} />
                </div>
              </article>
            ))
          ) : (
            <p className="py-8 text-center text-xs font-black text-slate-400">لم يتم العثور على منتجات للمورد.</p>
          )}
        </div>

        {pagination?.pages > 1 && (
          <footer className="flex items-center justify-between border-t border-slate-100 p-3 dark:border-white/[0.07]">
            <button type="button" disabled={loading || pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
              <ChevronRight className="h-3.5 w-3.5" />
              السابق
            </button>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button type="button" disabled={loading || pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[9px] font-black text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
              التالي
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}
