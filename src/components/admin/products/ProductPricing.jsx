import { Bot, Check, DollarSign, RefreshCw, Search, UserRound, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Field, inputClassName, Section } from "./BasicProductInfo";

const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function ProductPricing({ value, onChange, onPatch, providers, supplierProducts }) {
  const [query, setQuery] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const selectedSupplierProduct = supplierProducts.find((item) => item.id === value.providerProductId);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!value.providerId) return [];
    return supplierProducts.filter((item) => item.providerId === value.providerId && (!normalized || `${item.name} ${item.id}`.toLowerCase().includes(normalized)));
  }, [query, supplierProducts, value.providerId]);

  const setType = (type) => onPatch({ linkType: type, providerId: type === "manual" ? "winnie-manual" : "", providerProductId: "" });

  const chooseSupplierProduct = (item) => {
    onPatch({
      providerProductId: item.id,
      supplierPrice: item.price,
      supplierMin: item.min,
      supplierMax: item.max,
      originalPrice: item.price,
      min: item.min,
      max: item.max,
      finalPrice: Number((item.price * 1.15).toFixed(2)),
      profitMargin: 15,
    });
  };

  const syncPrice = () => {
    if (!selectedSupplierProduct) return;
    onPatch({ supplierPrice: selectedSupplierProduct.price, originalPrice: selectedSupplierProduct.price, finalPrice: Number((selectedSupplierProduct.price * 1.15).toFixed(2)), profitMargin: 15 });
  };

  const syncLimits = () => {
    if (!selectedSupplierProduct) return;
    onPatch({ supplierMin: selectedSupplierProduct.min, supplierMax: selectedSupplierProduct.max, min: selectedSupplierProduct.min, max: selectedSupplierProduct.max });
  };

  return (
    <Section title="الكمية والتسعير" description="اختر طريقة تنفيذ المنتج وحدد حدود الطلب والسعر النهائي">
      <div className="grid grid-cols-2 gap-2.5">
        <TypeButton active={value.linkType === "manual"} icon={UserRound} title="ربط يدوي" description="تنفيذ ومراجعة يدوية" onClick={() => setType("manual")} />
        <TypeButton active={value.linkType === "automatic"} icon={Bot} title="ربط آلي" description="متصل بمنتج المورد" onClick={() => setType("automatic")} />
      </div>

      {value.linkType === "manual" ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField label="الحد الأدنى للطلب" value={value.min} onChange={(next) => onChange("min", next)} />
          <NumberField label="الحد الأقصى للطلب" value={value.max} onChange={(next) => onChange("max", next)} />
          <NumberField label="السعر الأصلي" value={value.originalPrice} onChange={(next) => onChange("originalPrice", next)} step="0.01" />
          <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => onChange("finalPrice", next)} step="0.01" />
          <p className="col-span-2 rounded-xl bg-sky-50 px-3 py-2 text-[9px] font-bold leading-5 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">السعر الأصلي هو تكلفة المنتج قبل هامش الربح، والسعر النهائي هو ما يراه العميل.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Field label="اختر المورد">
            <select value={value.providerId} onChange={(event) => onPatch({ providerId: event.target.value, providerProductId: "" })} className={inputClassName}>
              <option value="">اختر المورد</option>
              {providers.filter((item) => item.id !== "winnie-manual").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>

          <label className="relative block">
            <span className="mb-1.5 block text-[10px] font-black text-slate-600 dark:text-slate-300">بحث داخل منتجات المورد</span>
            <Search className="pointer-events-none absolute bottom-3.5 right-3.5 h-4 w-4 text-violet-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pe-10`} placeholder="اسم المنتج أو ID المورد" disabled={!value.providerId} />
          </label>

          {value.providerId && (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-2 dark:border-white/10 dark:bg-[#0B1220]">
              {results.length ? results.map((item) => {
                const selected = item.id === value.providerProductId;
                return (
                  <button key={item.id} type="button" onClick={() => chooseSupplierProduct(item)} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition ${selected ? "border-violet-300 bg-violet-50 dark:border-violet-400/35 dark:bg-violet-500/10" : "border-transparent bg-white hover:border-slate-200 dark:bg-white/[0.04] dark:hover:border-white/10"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${selected ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-white/[0.06]"}`}>{selected ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-black text-slate-800 dark:text-white">{item.name}</span><span dir="ltr" className="mt-0.5 block text-right text-[9px] font-bold text-slate-400">{item.id}</span></span>
                    <span dir="ltr" className="text-[10px] font-black text-violet-700 dark:text-violet-300">{money.format(item.price)}</span>
                  </button>
                );
              }) : <p className="py-5 text-center text-[10px] font-bold text-slate-400">لا توجد نتائج مطابقة</p>}
            </div>
          )}

          {value.providerProductId && (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/55 p-3 dark:border-emerald-400/15 dark:bg-emerald-400/[0.06]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <SupplierValue label="سعر المورد" value={money.format(value.supplierPrice)} />
                <SupplierValue label="الحد الأدنى" value={value.supplierMin} />
                <SupplierValue label="الحد الأقصى" value={value.supplierMax} />
                <SupplierValue label="ID المورد" value={value.providerProductId} ltr />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={syncPrice} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-[9px] font-black text-white"><RefreshCw className="h-3.5 w-3.5" />مزامنة السعر</button>
                <button type="button" onClick={syncLimits} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-sky-600 text-[9px] font-black text-white"><RefreshCw className="h-3.5 w-3.5" />مزامنة الحدود</button>
              </div>
            </div>
          )}

          <button type="button" onClick={() => setManualOverride((current) => !current)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/60 text-[10px] font-black text-violet-700 transition hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/[0.07] dark:text-violet-300">
            <WandSparkles className="h-4 w-4" />{manualOverride ? "إخفاء السعر اليدوي" : "إضافة سعر يدوي"}
          </button>

          {manualOverride && (
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-violet-200/70 bg-violet-50/50 p-3 dark:border-violet-400/15 dark:bg-violet-500/[0.05]">
              <NumberField label="الحد الأدنى" value={value.min} onChange={(next) => onChange("min", next)} />
              <NumberField label="الحد الأقصى" value={value.max} onChange={(next) => onChange("max", next)} />
              <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => onChange("finalPrice", next)} step="0.01" />
              <NumberField label="هامش الربح %" value={value.profitMargin} onChange={(next) => onChange("profitMargin", next)} step="0.01" />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function TypeButton({ active, icon: Icon, title, description, onClick }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-3 text-right transition ${active ? "border-violet-300 bg-violet-50 shadow-[0_8px_22px_rgba(124,58,237,0.10)] dark:border-violet-400/35 dark:bg-violet-500/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#0B1220]"}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-violet-500 text-white" : "bg-white text-slate-400 dark:bg-white/[0.06]"}`}><Icon className="h-4 w-4" /></span><strong className="mt-2 block text-[11px] text-slate-800 dark:text-white">{title}</strong><span className="mt-0.5 block text-[8px] font-bold text-slate-400">{description}</span></button>;
}

function NumberField({ label, value, onChange, step = "1" }) {
  return <Field label={label}><input type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} /></Field>;
}

function SupplierValue({ label, value, ltr }) {
  return <div className="rounded-xl bg-white/80 p-2 dark:bg-white/[0.05]"><p className="text-[8px] font-black text-slate-400">{label}</p><p dir={ltr ? "ltr" : undefined} className={`mt-1 truncate text-[10px] font-black text-emerald-700 dark:text-emerald-300 ${ltr ? "text-right" : ""}`}>{value}</p></div>;
}
