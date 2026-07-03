import { AlertTriangle, Bot, CheckCircle2, Link2, RefreshCw, Search, UserRound } from "lucide-react";
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

  return (
    <Section title="الكمية والتسعير" description="حدد حدود الطلب والسعر الأساسي، واختر طريقة تنفيذ المنتج.">
      <div className="grid grid-cols-2 gap-2.5">
        <TypeButton active={!automatic} icon={UserRound} title="ربط يدوي" description="منتج يدوي من لوحة الإدارة" onClick={() => onLinkModeChange("manual")} />
        <TypeButton active={automatic} icon={Bot} title="ربط آلي" description="تنفيذ الطلبات عبر مورد" onClick={() => onLinkModeChange("automatic")} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField label="الحد الأدنى للطلب" value={value.min} onChange={(next) => onChange("min", next)} min="1" />
        <NumberField label="الحد الأقصى للطلب" value={value.max} onChange={(next) => onChange("max", next)} min="1" />
        <NumberField label="السعر الأصلي" value={value.originalPrice} onChange={(next) => onChange("originalPrice", next)} step="0.01" />
        <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => onChange("finalPrice", next)} step="0.01" />
      </div>

      {automatic && (
        <div className="mt-4 space-y-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-400/20 dark:bg-sky-500/10">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-black text-slate-900 dark:text-white">إعداد الربط الآلي</h4>
              <p className="mt-0.5 text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">سيتم تنفيذ الطلبات تلقائيًا من خلال المورد المختار.</p>
              <p className="text-[9px] font-bold leading-5 text-slate-500 dark:text-slate-300">بيانات توثيق المورد لا تظهر هنا.</p>
            </div>
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

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onProductSearch(searchValue);
            }}
          >
            <label className="relative min-w-0 flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600 dark:text-sky-300" />
              <input
                value={searchValue}
                onChange={(event) => onPatch({ providerProductSearch: event.target.value })}
                disabled={!value.providerId || providerLink.loadingProducts}
                placeholder="ابحث في منتجات المورد"
                className={`${inputClassName} pe-9`}
              />
            </label>
            <button
              type="submit"
              disabled={!value.providerId || providerLink.loadingProducts}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-[10px] font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-white dark:text-slate-950"
            >
              {providerLink.loadingProducts ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              بحث
            </button>
          </form>

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
            <CheckboxField checked={Boolean(value.syncPriceFromProvider)} label="مزامنة السعر من المورد" onChange={(checked) => onPatch({ syncPriceFromProvider: checked })} />
            <CheckboxField checked={Boolean(value.syncLimitsFromProvider)} label="مزامنة حدود الطلب" onChange={(checked) => onPatch({ syncLimitsFromProvider: checked })} />
            <CheckboxField checked={Boolean(value.syncNameFromProvider)} label="مزامنة اسم المنتج" onChange={(checked) => onPatch({ syncNameFromProvider: checked })} />
          </div>
        </div>
      )}
    </Section>
  );
}

function TypeButton({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-right transition ${active ? "border-violet-300 bg-violet-50 shadow-[0_8px_22px_rgba(124,58,237,0.10)] dark:border-violet-400/35 dark:bg-violet-500/10" : "border-slate-200 bg-slate-50 hover:border-violet-200 dark:border-white/10 dark:bg-[#0B1220]"}`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-violet-500 text-white" : "bg-white text-slate-400 dark:bg-white/[0.06]"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <strong className="mt-2 block text-[11px] text-slate-800 dark:text-white">{title}</strong>
      <span className="mt-0.5 block text-[8px] font-bold text-slate-400">{description}</span>
    </button>
  );
}

function NumberField({ label, value, onChange, min = "0", step = "1" }) {
  return (
    <Field label={label}>
      <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} />
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

  return {
    id: value.providerProductId,
    externalProductId: value.providerProductExternalId || "",
    maxQty: value.providerProductMaxQty ?? null,
    minQty: value.providerProductMinQty ?? null,
    name: value.providerProductName,
    priceLabel: "",
  };
}
