import { Bot, UserRound } from "lucide-react";
import { Field, inputClassName, Section } from "./BasicProductInfo";

export default function ProductPricing({ value, onChange, onPatch }) {
  const setManual = () => onPatch({ linkType: "manual", providerId: "", providerProductId: "" });

  return (
    <Section title="الكمية والتسعير" description="حدد حدود الطلب والسعر الأساسي للمنتج اليدوي داخل الكتالوج">
      <div className="grid grid-cols-2 gap-2.5">
        <TypeButton active={value.linkType !== "automatic"} icon={UserRound} title="ربط يدوي" description="منتج يدوي من لوحة الإدارة" onClick={setManual} />
        <TypeButton active={value.linkType === "automatic"} disabled icon={Bot} title="ربط آلي" description="مرحلة الموردين اللاحقة" onClick={setManual} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField label="الحد الأدنى للطلب" value={value.min} onChange={(next) => onChange("min", next)} min="1" />
        <NumberField label="الحد الأقصى للطلب" value={value.max} onChange={(next) => onChange("max", next)} min="1" />
        <NumberField label="السعر الأصلي" value={value.originalPrice} onChange={(next) => onChange("originalPrice", next)} step="0.01" />
        <NumberField label="السعر النهائي" value={value.finalPrice} onChange={(next) => onChange("finalPrice", next)} step="0.01" />
      </div>
    </Section>
  );
}

function TypeButton({ active, disabled = false, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`rounded-2xl border p-3 text-right transition disabled:cursor-not-allowed disabled:opacity-55 ${active ? "border-violet-300 bg-violet-50 shadow-[0_8px_22px_rgba(124,58,237,0.10)] dark:border-violet-400/35 dark:bg-violet-500/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#0B1220]"}`}
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
