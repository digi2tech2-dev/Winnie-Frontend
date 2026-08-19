import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, Loader2, X } from "lucide-react";
import { getFazerCardsImportPreview, importFazerCardsProviderProduct } from "../../../api/adminProviders";

const initialForm = {
  categoryId: "",
  currency: "USD",
  description: "",
  markupType: "percentage",
  markupValue: 0,
  name: "",
  sellPrice: "",
  syncAvailabilityFromProvider: true,
  syncNameFromProvider: false,
  syncPriceFromProvider: true,
  updateExisting: false,
};

export default function FazerCardsImportModal({ onClose, onImported, product, token }) {
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState(null);

  const open = Boolean(product);
  const title = product?.name || "منتج FazerCards";

  useEffect(() => {
    let active = true;
    if (!open || !token || !product?.id) return undefined;

    setError("");
    setForm({
      ...initialForm,
      currency: product.currency || "USD",
      name: product.name || "",
      sellPrice: "",
    });
    setLoading(true);
    setPreview(null);
    setSavedProduct(null);

    getFazerCardsImportPreview(token, product.id)
      .then((result) => {
        if (!active) return;
        const nextPreview = result.preview || {};
        setPreview(nextPreview);
        setForm((current) => ({
          ...current,
          currency: nextPreview.currency || current.currency,
          markupType: nextPreview.defaultMarkupType || current.markupType,
          markupValue: nextPreview.defaultMarkupValue ?? current.markupValue,
          name: nextPreview.suggestedProductName || current.name,
          syncPriceFromProvider: nextPreview.autoPriceSyncAvailable !== false,
        }));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.userMessage || "تعذر تحميل معاينة الاستيراد.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, product, token]);

  const fields = useMemo(() => preview?.suggestedOrderFields?.length
    ? preview.suggestedOrderFields
    : product?.requiredFields || [], [preview, product]);
  const autoPriceAvailable = preview?.autoPriceSyncAvailable !== false && Boolean(preview?.calculatedLocalPrice || preview?.costPrice || product?.costPrice);
  const manualPriceOverride = String(form.sellPrice || "").trim() !== "";
  const displayedLocalPrice = manualPriceOverride ? form.sellPrice : preview?.calculatedLocalPrice;

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event) => {
    event?.preventDefault?.();
    if (!token || !product?.id || saving) return;

    setSaving(true);
    setError("");
    try {
      const result = await importFazerCardsProviderProduct(token, product.id, {
        ...form,
        syncPriceFromProvider: manualPriceOverride ? false : form.syncPriceFromProvider,
      });
      setSavedProduct(result.product);
      onImported?.(result);
    } catch (requestError) {
      setError(requestError.userMessage || "تعذر استيراد منتج FazerCards.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[145] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}
    >
      <section className="flex max-h-[90dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[26px] bg-white sm:rounded-[26px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <Download className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">استيراد عرض FazerCards</h2>
            <p dir="ltr" className="truncate text-left text-[9px] font-bold text-slate-400">{title}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/[0.07]">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={save} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs font-black text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ تحميل المعاينة
            </div>
          ) : (
            <>
              <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-[10px] font-bold text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
                <div className="flex justify-between gap-3">
                  <span>الفئة / نمط التنفيذ</span>
                  <strong dir="ltr">{preview?.familyKey || product.familyKey || "UNKNOWN"} / {preview?.fulfillmentMode || product.fulfillmentMode || "UNKNOWN"}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>سعر التكلفة</span>
                  <strong dir="ltr">{preview?.costPrice || product.costPrice} {preview?.currency || product.currency}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Calculated sale price</span>
                  <strong dir="ltr">{displayedLocalPrice || "manual required"} {preview?.currency || product.currency}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>المخزون</span>
                  <strong dir="ltr">{preview?.stock ?? product.stockLabel ?? "غير معروف"}</strong>
                </div>
                {(preview?.region || preview?.platform || product.region || product.platform) && (
                  <div className="flex justify-between gap-3">
                    <span>المنطقة / المنصة</span>
                    <strong dir="ltr">{[preview?.platform || product.platform, preview?.region || product.region].filter(Boolean).join(" / ")}</strong>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span>المعرّف الخارجي</span>
                  <strong dir="ltr" className="truncate">{preview?.externalProductId || product.externalProductId}</strong>
                </div>
                <p className="text-[9px] text-amber-600 dark:text-amber-300">
                  {preview?.warning || "سيتم استيراد المنتج كمسودة غير مفعّلة ولن يكون ظاهرًا للعملاء."}
                </p>
                {(preview?.blockReason || product.blockReason) && (
                  <p className="text-[9px] text-rose-600 dark:text-rose-300">
                    سبب الحظر: {preview?.blockReason || product.blockReason}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-[10px] font-black text-slate-500 dark:text-slate-300">
                  اسم المنتج
                  <input value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={2} maxLength={200} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
                </label>
                <label className="grid gap-1 text-[10px] font-black text-slate-500 dark:text-slate-300">
                  سعر البيع
                  <input type="number" min="0.000001" step="0.000001" value={form.sellPrice} onChange={(event) => update("sellPrice", event.target.value)} placeholder={autoPriceAvailable ? "Optional manual override" : "Required when provider price is missing"} required={!autoPriceAvailable} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
                  <span className="text-[8px] font-bold text-slate-400">
                    {manualPriceOverride ? "Manual override will be used." : autoPriceAvailable ? "Leave empty to auto-sync from FazerCards price." : "Enter a manual price to import this product."}
                  </span>
                </label>
                <label className="grid gap-1 text-[10px] font-black text-slate-500 dark:text-slate-300">
                  العملة
                  <input value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} maxLength={3} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
                </label>
                <label className="grid gap-1 text-[10px] font-black text-slate-500 dark:text-slate-300">
                  القسم الداخلي
                  <input value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
                </label>
              </div>

              <label className="grid gap-1 text-[10px] font-black text-slate-500 dark:text-slate-300">
                الوصف
                <textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none dark:border-white/10 dark:bg-[#0B1220] dark:text-white" />
              </label>

              <div className="grid gap-2 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-300">الحقول المطلوبة للطلب</p>
                {fields.length ? fields.map((field) => (
                  <div key={field.key || field.id || field.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-bold dark:bg-[#0B1220]">
                    <span className="text-slate-700 dark:text-slate-200">{field.label || field.key}</span>
                    <span dir="ltr" className="text-slate-400">{field.key || field.id} / {field.type || "text"}</span>
                  </div>
                )) : (
                  <p className="text-[10px] font-bold text-slate-400">لا توجد حقول مطلوبة من العميل لهذا العنصر.</p>
                )}
              </div>

              <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
                <label className="flex items-center justify-between gap-3 text-[10px] font-black text-slate-600 dark:text-slate-300">
                  مزامنة بيانات التوفر
                  <input type="checkbox" checked={form.syncAvailabilityFromProvider} onChange={(event) => update("syncAvailabilityFromProvider", event.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-3 text-[10px] font-black text-slate-600 dark:text-slate-300">
                  مزامنة بيانات الاسم
                  <input type="checkbox" checked={form.syncNameFromProvider} onChange={(event) => update("syncNameFromProvider", event.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-3 text-[10px] font-black text-slate-600 dark:text-slate-300">
                  مزامنة بيانات السعر
                  <input type="checkbox" checked={form.syncPriceFromProvider && !manualPriceOverride} disabled={manualPriceOverride || !autoPriceAvailable} onChange={(event) => update("syncPriceFromProvider", event.target.checked)} />
                </label>
                {product?.imported && (
                  <label className="flex items-center justify-between gap-3 text-[10px] font-black text-slate-600 dark:text-slate-300">
                    تحديث الاستيراد الموجود
                    <input type="checkbox" checked={form.updateExisting} onChange={(event) => update("updateExisting", event.target.checked)} />
                  </label>
                )}
              </div>

              {savedProduct && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> تم الاستيراد كمسودة غير مفعّلة.</span>
                  <a href="/admin/tools/products" className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[9px] font-black text-white">
                    <ExternalLink className="h-3.5 w-3.5" />
                    المنتجات
                  </a>
                </div>
              )}
            </>
          )}
        </form>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 p-3 dark:border-white/[0.07]">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-xl border border-slate-200 px-4 text-[10px] font-black text-slate-600 disabled:opacity-60 dark:border-white/10 dark:text-slate-300">
            إغلاق
          </button>
          <button type="button" onClick={save} disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-[10px] font-black text-white disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            حفظ كمسودة غير مفعّلة
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
