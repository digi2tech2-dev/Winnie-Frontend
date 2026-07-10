import { AlertTriangle, Bot, CheckCircle2, Link2, RefreshCw, Search, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatSupplierPrice } from "../../../api/adminProducts";
import { Field, inputClassName, Section } from "./BasicProductInfo";

const emptyProviderLink = {
  error: "",
  loadingProducts: false,
  loadingProviders: false,
  providerProducts: [],
  providers: [],
};

export default function ProductPricing({
  onChange,
  onLinkModeChange,
  onPatch,
  onProductSearch,
  onProviderChange,
  onProviderProductSelect,
  providerLink = emptyProviderLink,
  value,
}) {
  const automatic = value.linkType === "automatic";
  const selectedProvider = providerLink.providers.find((provider) => provider.id === value.providerId);
  const selectedProduct = providerLink.providerProducts.find((product) => product.id === value.providerProductId)
    || getCurrentProductSummary(value);
  const searchValue = value.providerProductSearch || "";
  const providerProductCount = providerLink.pagination?.total ?? providerLink.providerProducts.length;
  const searchTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  const updateProductSearch = (nextValue) => {
    onPatch({ providerProductSearch: nextValue });
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.providerId) onProductSearch(nextValue);
    }, 450);
  };

  return (
    <Section title="الكمية والتسعير" description="حدد حدود الطلب والسعر الأساسي، واختر طريقة تنفيذ المنتج.">
      <div className="flex flex-col">
      <div className="order-1 grid grid-cols-2 gap-2.5 sm:gap-3">
        <TypeButton active={!automatic} tone="manual" icon={UserRound} title="ربط يدوي" description="منتج يدوي من لوحة الإدارة" onClick={() => onLinkModeChange("manual")} />
        <TypeButton active={automatic} tone="automatic" icon={Bot} title="ربط آلي" description="تنفيذ الطلبات عبر مورد" onClick={() => onLinkModeChange("automatic")} />
      </div>

      <div className="order-3 mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4">
        <NumberField label="الحد الأدنى للطلب" value={value.min} onChange={(next) => onChange("min", next)} min="1" />
        <NumberField label="الحد الأقصى للطلب" value={value.max} onChange={(next) => onChange("max", next)} min="1" />
        <NumberField label="السعر الأصلي" value={value.originalPrice} onChange={(next) => onChange("originalPrice", next)} step="any" />
        <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => onChange("finalPrice", next)} step="any" />
        <NumberField className="col-span-2" label="نسبة الخصم %" value={value.discountPercentage} onChange={(next) => onChange("discountPercentage", next)} min="0" max="100" step="1" />
      </div>

      {automatic && (
        <div className="order-2 mt-4 space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/[0.08] p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-black text-slate-900 dark:text-white">إعداد الربط الآلي</h4>
              <p className="mt-0.5 text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">سيتم تنفيذ الطلبات تلقائيًا من خلال المورد المختار.</p>
              <p className="text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">بيانات توثيق المورد لا تظهر هنا.</p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1.5 text-[9px] font-black text-sky-300">
              {providerLink.loadingProducts ? "جارٍ التحميل" : `${providerProductCount.toLocaleString("ar-EG-u-nu-latn")} منتج`}
            </span>
          </div>

          {providerLink.error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{providerLink.error}</span>
            </div>
          )}

          <Field label="المورد">
            <select
              value={value.providerId || ""}
              onChange={(event) => onProviderChange(event.target.value)}
              disabled={providerLink.loadingProviders}
              className={inputClassName}
            >
              <option value="">{providerLink.loadingProviders ? "جاري تحميل الموردين..." : "اختر المورد"}</option>
              {providerLink.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}{provider.code ? ` (${provider.code})` : ""}
                </option>
              ))}
            </select>
          </Field>

          {!providerLink.loadingProviders && !providerLink.providers.length && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">لا توجد موردين نشطين متاحين للربط.</p>
          )}

          {selectedProvider && selectedProvider.credentialConfigured === false && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">تنبيه: هذا المورد لا يظهر كبيانات توثيق مكتملة.</p>
          )}

          <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-l from-cyan-500/[0.08] to-blue-500/[0.06] p-2.5 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[10px] font-black text-cyan-200">البحث في منتجات المورد</span>
              <span className="text-[8px] font-bold text-slate-500">يبحث تلقائيًا أثناء الكتابة</span>
            </div>
            <label className="relative block min-w-0">
              <span className="pointer-events-none absolute left-1 top-1 grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                {providerLink.loadingProducts ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </span>
              <input
                value={searchValue}
                onChange={(event) => updateProductSearch(event.target.value)}
                disabled={!value.providerId}
                placeholder="اكتب اسم المنتج أو المعرّف..."
                className="h-11 w-full rounded-xl border border-cyan-400/20 bg-[#040c1e] py-0 pl-12 pr-3 text-[11px] font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/10"
              />
            </label>
          </div>

          {!providerLink.loadingProducts && value.providerId && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#071126] px-3 py-2 text-[9px] font-bold text-slate-400">
              <span>{searchValue ? "نتائج البحث في منتجات المورد" : "منتجات المورد المتاحة"}</span>
              <strong className="text-sky-300">{providerProductCount.toLocaleString("ar-EG-u-nu-latn")} منتج</strong>
            </div>
          )}

          <div className="grid max-h-60 gap-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/70 p-2 dark:border-white/10 dark:bg-[#0B1220]/60">
            {!value.providerId ? (
              <EmptyProviderMessage text="اختر موردًا لتحميل المنتجات." />
            ) : providerLink.loadingProducts ? (
              <EmptyProviderMessage spinning text="جاري تحميل منتجات المورد..." />
            ) : providerLink.providerProducts.length ? (
              providerLink.providerProducts.map((product) => (
                <ProviderProductButton
                  key={product.id}
                  product={product}
                  selected={product.id === value.providerProductId}
                  onClick={() => onProviderProductSelect(product)}
                />
              ))
            ) : (
              <EmptyProviderMessage text={searchValue ? "لا توجد منتجات مطابقة للبحث." : "لم تتم مزامنة منتجات لهذا المورد بعد."} />
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <p className="flex items-center gap-1.5 font-black">
                <CheckCircle2 className="h-4 w-4" />
                {selectedProduct.name}
              </p>
              <div className="mt-2 grid gap-1 sm:grid-cols-3">
                <SummaryItem label="المعرف الخارجي" value={selectedProduct.externalProductId || "-"} />
                <SummaryItem label="الكمية" value={`${selectedProduct.minQty ?? "-"} - ${selectedProduct.maxQty ?? "-"}`} />
                <SummaryItem label="السعر" value={selectedProduct.priceLabel || "-"} />
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <CheckboxField checked={Boolean(value.syncPriceFromProvider)} label="مزامنة السعر من المورد" onChange={(checked) => {
              const supplierPrice = checked ? getExactSupplierPrice(selectedProduct) : "";
              onPatch({
                syncPriceFromProvider: checked,
                ...(supplierPrice ? {
                  supplierPrice,
                  originalPrice: supplierPrice,
                  finalPrice: supplierPrice,
                  basePrice: supplierPrice,
                } : {}),
              });
            }} />
            <CheckboxField checked={Boolean(value.syncLimitsFromProvider)} label="مزامنة حدود الطلب" onChange={(checked) => onPatch({
              syncLimitsFromProvider: checked,
              ...(checked && selectedProduct ? {
                min: selectedProduct.minQty ?? value.min,
                max: selectedProduct.maxQty ?? value.max,
              } : {}),
            })} />
            <CheckboxField checked={Boolean(value.syncNameFromProvider)} label="مزامنة اسم المنتج" onChange={(checked) => onPatch({ syncNameFromProvider: checked })} />
          </div>
        </div>
      )}
      </div>
    </Section>
  );
}

function TypeButton({ active, icon: Icon, title, description, onClick, tone }) {
  const activeTone = tone === "manual"
    ? "border-sky-400/60 bg-sky-500/15 shadow-[0_0_22px_rgba(14,165,233,0.15)]"
    : "border-fuchsia-400/60 bg-violet-500/15 shadow-[0_0_22px_rgba(168,85,247,0.16)]";
  const iconTone = tone === "manual" ? "from-sky-500 to-blue-600" : "from-violet-500 to-fuchsia-600";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-right transition sm:gap-3 sm:rounded-2xl sm:p-4 ${active ? activeTone : "border-[#203664] bg-[#071126] hover:border-violet-400/40"}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${active ? `bg-gradient-to-br ${iconTone} text-white` : "bg-white/[0.06] text-slate-400"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[10px] text-white sm:text-xs">{title}</strong>
        <span className="mt-0.5 block truncate text-[8px] font-bold text-slate-400 sm:mt-1 sm:text-[9px]">{description}</span>
      </span>
    </button>
  );
}

function NumberField({ className = "", label, value, onChange, min = "0", max, step = "1" }) {
  return (
    <Field label={label} className={className}>
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} />
    </Field>
  );
}

function ProviderProductButton({ onClick, product, selected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-2.5 text-right transition ${selected ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-500/10" : "border-slate-200 bg-white hover:border-violet-200 dark:border-white/10 dark:bg-[#111827]"}`}
    >
      <strong className="block truncate text-[11px] font-black text-slate-900 dark:text-white">{product.name}</strong>
      <span className="mt-1 block truncate text-[9px] font-bold text-slate-500 dark:text-slate-400">
        {product.externalProductId || "بدون معرف خارجي"} | {product.minQty ?? "-"} - {product.maxQty ?? "-"}{product.priceLabel ? ` | ${product.priceLabel}` : ""}
      </span>
    </button>
  );
}

function CheckboxField({ checked, label, onChange }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-200">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-violet-600" />
      <span>{label}</span>
    </label>
  );
}

function EmptyProviderMessage({ spinning = false, text }) {
  return (
    <p className="flex min-h-20 items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 dark:bg-[#111827]">
      {spinning && <RefreshCw className="h-4 w-4 animate-spin" />}
      {text}
    </p>
  );
}

function SummaryItem({ label, value }) {
  return (
    <span className="rounded-xl bg-white/70 px-2 py-1.5 dark:bg-white/[0.06]">
      <span className="block text-[8px] text-emerald-700/70 dark:text-emerald-100/70">{label}</span>
      <span className="mt-0.5 block truncate font-black">{value}</span>
    </span>
  );
}

function getCurrentProductSummary(value) {
  if (!value.providerProductId || !value.providerProductName) return null;

  const supplierPrice = value.supplierPrice || value.providerPrice || value.rawPrice || "";

  return {
    id: value.providerProductId,
    externalProductId: value.providerProductExternalId || "",
    maxQty: value.providerProductMaxQty ?? null,
    minQty: value.providerProductMinQty ?? null,
    name: value.providerProductName,
    priceLabel: supplierPrice ? formatSupplierPrice(supplierPrice) : "",
    rawPrice: supplierPrice,
    supplierPrice,
  };
}

function getExactSupplierPrice(providerProduct) {
  return String(
    providerProduct?.supplierPrice
    ?? providerProduct?.rawPrice
    ?? providerProduct?.price
    ?? "",
  ).trim();
}
