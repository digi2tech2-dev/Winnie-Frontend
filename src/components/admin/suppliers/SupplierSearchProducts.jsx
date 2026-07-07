import { AlertTriangle, Search } from "lucide-react";
import { useState } from "react";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

export default function SupplierSearchProducts({
  error = "",
  loading = false,
  onSearch,
  pagination,
  products,
  searched = false,
}) {
  const [query, setQuery] = useState("");

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <h2 className="text-sm font-black dark:text-white">البحث في منتجات الموردين</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query);
        }}
        className="mt-3 flex gap-2"
      >
        <label className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="اسم منتج المورد أو اسمه المترجم"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-black outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
          />
        </label>
        <button type="submit" disabled={loading} className="h-11 rounded-2xl bg-violet-600 px-4 text-[10px] font-black text-white disabled:opacity-60">
          {loading ? "جارٍ البحث..." : "بحث"}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {searched && (
        <div className="mt-3 space-y-2">
          {products.length ? (
            products.map((product) => (
              <article key={product.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-[#0B1220]">
                <div className="min-w-0">
                  <h3 className="truncate text-[10px] font-black dark:text-white">{product.name}</h3>
                  <p className="mt-0.5 text-[8px] font-bold text-slate-400">{product.providerName || "المورد"} - {product.externalProductId || product.id}</p>
                  <p className="mt-1 text-[8px] font-bold text-slate-500 dark:text-slate-300">الكمية {product.minQty} - {product.maxQty}</p>
                </div>
                <div className="text-left">
                  <strong dir="ltr" className="text-[11px] text-violet-700 dark:text-violet-300">{product.priceLabel}</strong>
                  <div className="mt-1"><ConnectionStatusBadge status={product.active ? "connected" : "failed"} /></div>
                </div>
              </article>
            ))
          ) : (
            <p className="py-5 text-center text-[9px] font-bold text-slate-400">لا توجد منتجات موردين مطابقة.</p>
          )}
          {pagination?.total > products.length && (
            <p className="text-center text-[9px] font-bold text-slate-400">
              يتم عرض {products.length.toLocaleString("ar-EG-u-nu-latn")} من أصل {pagination.total.toLocaleString("ar-EG-u-nu-latn")} نتيجة مطابقة من الخادم.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
