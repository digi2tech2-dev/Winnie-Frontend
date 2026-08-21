import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Link2, Loader2, RefreshCw, Search, X } from "lucide-react";

export default function ProductProviderLinkModal({
  error = "",
  linkState,
  loadingProducts = false,
  loadingProviders = false,
  onCatalogChange,
  onClose,
  onProviderChange,
  onSearchProducts,
  onSubmit,
  onUpdate,
  saving = false,
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [linkState.catalogKey, linkState.providerId]);

  if (!linkState.open || !linkState.product) return null;

  const selectedProvider = linkState.providers.find((provider) => provider.id === linkState.providerId);
  const selectedCatalog = linkState.catalogs?.find((catalog) => catalog.key === linkState.catalogKey);
  const selectedProduct = linkState.providerProducts.find((product) => product.id === linkState.providerProductId);
  const canSearchOffers = Boolean(linkState.providerId && (!linkState.fazerCards || linkState.catalogKey));

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[4px] sm:items-center sm:p-4 dark:bg-[#02040C]/80">
      <section role="dialog" aria-modal="true" aria-labelledby="provider-link-title" className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[24px] border border-white/70 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.34)] sm:rounded-[24px] dark:border-white/10 dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Link2 className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="provider-link-title" className="text-sm font-black text-slate-950 dark:text-white">ربط المنتج بعرض المورد</h2>
            <p className="truncate text-[9px] font-bold text-slate-400">{linkState.product.nameAr || linkState.product.name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="المورد" step="1">
              <select value={linkState.providerId} onChange={(event) => onProviderChange(event.target.value)} disabled={loadingProviders || saving} className={fieldClassName}>
                <option value="">{loadingProviders ? "جارٍ التحميل..." : "اختر المورد"}</option>
                {linkState.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
              </select>
            </SelectField>

            {linkState.fazerCards ? (
              <SelectField label="الكتالوج" step="2">
                <select value={linkState.catalogKey} onChange={(event) => onCatalogChange(event.target.value)} disabled={!linkState.providerId || loadingProducts || saving} className={fieldClassName}>
                  <option value="">اختر Catalog مستردًا</option>
                  {(linkState.catalogs || []).map((catalog) => <option key={catalog.key} value={catalog.key}>{catalog.name}</option>)}
                </select>
              </SelectField>
            ) : (
              <SelectField label="نوع الربط" step="2"><div className={`${fieldClassName} flex items-center text-slate-500`}>منتج المورد</div></SelectField>
            )}

            <SelectField label={linkState.fazerCards ? "العرض" : "منتج المورد"} step="3">
              <select value={linkState.providerProductId} onChange={(event) => onUpdate({ providerProductId: event.target.value })} disabled={!canSearchOffers || loadingProducts || saving} className={fieldClassName}>
                <option value="">{loadingProducts ? "جارٍ تحميل العروض..." : linkState.fazerCards ? "اختر Offer" : "اختر المنتج"}</option>
                {linkState.providerProducts.map((product) => <option key={product.id} value={product.id}>{product.offerName || product.name}</option>)}
              </select>
            </SelectField>
          </div>

          {linkState.fazerCards && !linkState.catalogs?.length && linkState.providerId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-bold leading-5 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              لم تسترد أي Catalog بعد. افتح صفحة FazerCards من إدارة الموردين، وابحث عن الكتالوج المطلوب ثم استرده.
            </div>
          )}

          {canSearchOffers && (
            <form onSubmit={(event) => { event.preventDefault(); onSearchProducts(search); }} className="flex gap-2">
              <label className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} disabled={loadingProducts || saving} placeholder={linkState.fazerCards ? "بحث داخل عروض الكتالوج" : "بحث في منتجات المورد"} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pe-9 ps-3 text-xs font-bold outline-none focus:border-violet-300 disabled:opacity-60 dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
              </label>
              <button type="submit" disabled={loadingProducts || saving} className="inline-flex h-10 items-center gap-1 rounded-xl bg-slate-900 px-4 text-[10px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {loadingProducts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} بحث
              </button>
            </form>
          )}

          {selectedProduct ? (
            <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-[#0B1220]">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div className="min-w-0"><strong className="block truncate text-[11px] font-black text-slate-900 dark:text-white">{selectedProduct.offerName || selectedProduct.name}</strong><span className="text-[8px] font-bold text-slate-400">{selectedCatalog?.name || selectedProvider?.name}</span></div>
              </header>
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-y divide-slate-100 sm:grid-cols-5 dark:divide-white/10">
                <ProviderDatum label="Provider Price" value={selectedProduct.priceLabel || "—"} ltr />
                <ProviderDatum label="Minimum Quantity" value={selectedProduct.minQty ?? "—"} />
                <ProviderDatum label="Maximum Quantity" value={selectedProduct.maxQty ?? "—"} />
                <ProviderDatum label="Provider Offer ID" value={selectedProduct.offerId || selectedProduct.externalProductId || selectedProduct.id} ltr />
                <ProviderDatum label="Sync Status" value={selectedProduct.lastSyncedAt ? "متزامن" : "جاهز للربط"} tone="success" />
              </div>
            </section>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-400 dark:bg-[#0B1220]">
              {loadingProducts ? "جارٍ تحميل البيانات..." : linkState.fazerCards && !linkState.catalogKey ? "اختر الكتالوج أولًا لعرض Offers الخاصة به." : "اختر العرض لعرض السعر والحدود وحالة المزامنة."}
            </div>
          )}

          <p className="text-[8px] font-bold leading-4 text-slate-400">سيستخدم الربط منطق مزامنة السعر وحدود Min/Max الحالي دون إنشاء منتج متجر جديد.</p>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-white">إلغاء</button>
          <button type="button" onClick={onSubmit} disabled={saving || !linkState.providerId || !linkState.providerProductId} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-[10px] font-black text-white disabled:opacity-50">
            {saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? "جارٍ الربط..." : "ربط المنتج"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function SelectField({ children, label, step }) {
  return <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black text-slate-500"><b className="grid h-4 w-4 place-items-center rounded-full bg-violet-100 text-[8px] text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">{step}</b>{label}</span>{children}</label>;
}

function ProviderDatum({ label, ltr = false, tone = "default", value }) {
  return <div className="min-w-0 p-3"><span className="block text-[7px] font-black uppercase tracking-wide text-slate-400">{label}</span><strong dir={ltr ? "ltr" : undefined} className={`mt-1 block truncate text-[9px] font-black ${tone === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-800 dark:text-white"}`} title={String(value)}>{value}</strong></div>;
}

const fieldClassName = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black outline-none focus:border-violet-300 disabled:opacity-60 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
