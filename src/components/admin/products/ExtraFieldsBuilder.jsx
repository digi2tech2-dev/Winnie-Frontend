import { useMemo, useState } from "react";
import { AlertTriangle, Braces, Plus, Trash2 } from "lucide-react";
import { inputClassName, Section } from "./BasicProductInfo";

const fieldPresets = [
  { key: "player_id", label: "معرّف اللاعب", type: "text", required: true },
  { key: "username", label: "اسم المستخدم", type: "text", required: true },
  { key: "account_id", label: "معرّف الحساب", type: "text", required: true },
  { key: "profile_link", label: "رابط الملف الشخصي", type: "url", required: true },
  { key: "phone_number", label: "رقم الهاتف", type: "tel", required: true },
  { key: "email", label: "البريد الإلكتروني", type: "email", required: true },
];

export default function ExtraFieldsBuilder({ fields = [], onChange }) {
  const [presetMessage, setPresetMessage] = useState("");
  const existingKeys = useMemo(() => new Set(fields.map((field) => normalizeFieldKey(field.key || field.label)).filter(Boolean)), [fields]);
  const addField = () => {
    setPresetMessage("");
    onChange([...fields, buildField()]);
  };
  const addPreset = (preset) => {
    if (existingKeys.has(preset.key)) {
      setPresetMessage("هذا الحقل موجود بالفعل.");
      return;
    }

    setPresetMessage("");
    onChange([...fields, buildField(preset)]);
  };
  const updateField = (id, key, value) => onChange(fields.map((field) => field.id === id ? { ...field, [key]: value } : field));
  const removeField = (id) => onChange(fields.filter((field) => field.id !== id));

  return (
    <Section title="الحقول الإضافية" description="أنشئ البيانات التي سيطلبها المنتج من العميل قبل الشراء">
      <button type="button" onClick={addField} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/50 bg-violet-500/10 text-[11px] font-black text-violet-200 transition hover:border-violet-300 hover:bg-violet-500/15"><Plus className="h-4 w-4" />إضافة حقل جديد</button>

      <div className="mt-4 rounded-2xl border border-[#203664] bg-[#071126] p-4">
        <p className="text-[10px] font-bold leading-5 text-slate-500 dark:text-slate-300">
          استخدم هذه الحقول عندما يجب على العميل إدخال معرّف اللعبة أو اسم مستخدم الحساب أو رقم الهاتف أو رابط الملف الشخصي قبل الشراء.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {fieldPresets.map((preset) => {
            const exists = existingKeys.has(preset.key);
            return (
              <button
                key={preset.key}
                type="button"
                disabled={exists}
                onClick={() => addPreset(preset)}
                title={exists ? "هذا الحقل موجود بالفعل." : `إضافة ${preset.label}`}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-2 py-2 text-[9px] font-black text-violet-300 transition hover:border-violet-400/40 hover:bg-violet-500/[0.14] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-600"
              >
                <Plus className="h-3.5 w-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>
        {presetMessage && (
          <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[9px] font-black text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
            {presetMessage}
          </p>
        )}
      </div>

      {fields.length === 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-[10px] font-black leading-5">
            لا يحتوي هذا المنتج على حقول إدخال للعميل، ولن يُطلب منه معرّف لاعب أو اسم مستخدم أو هاتف أو رابط.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {fields.length ? fields.map((field, index) => (
          <article key={field.id} className="rounded-2xl border border-[#254174] bg-[#071126] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)] sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300"><Braces className="h-3.5 w-3.5" /></span>
              <strong className="min-w-0 flex-1 text-[10px] text-slate-700 dark:text-white">الحقل {index + 1}</strong>
              <button
                type="button"
                role="switch"
                aria-checked={field.active !== false}
                onClick={() => updateField(field.id, "active", field.active === false)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[8px] font-black transition ${field.active !== false ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}
              >
                <span className={`h-2 w-2 rounded-full ${field.active !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                {field.active !== false ? "ظاهر" : "مخفي"}
              </button>
              <button type="button" onClick={() => removeField(field.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-300" aria-label="حذف الحقل"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SmallField label="عنوان الحقل"><input value={field.label} onChange={(event) => updateField(field.id, "label", event.target.value)} className={inputClassName} placeholder="مثال: معرف اللاعب" /></SmallField>
              <SmallField label="الاسم البرمجي"><input dir="ltr" value={field.key} onChange={(event) => updateField(field.id, "key", event.target.value)} className={`${inputClassName} text-left`} placeholder="يُولد تلقائيًا" /></SmallField>
              <SmallField label="النص الإرشادي"><input value={field.placeholder} onChange={(event) => updateField(field.id, "placeholder", event.target.value)} className={inputClassName} placeholder="النص داخل الحقل" /></SmallField>
              <SmallField label="نوع الحقل"><select value={field.type} onChange={(event) => updateField(field.id, "type", event.target.value)} className={inputClassName}><option value="text">نص</option><option value="number">رقم</option><option value="email">بريد إلكتروني</option><option value="tel">هاتف</option><option value="url">رابط</option><option value="date">تاريخ</option><option value="select">اختيار</option><option value="textarea">ملاحظات</option></select></SmallField>
              <SmallField label="هل الحقل إجباري؟"><select value={field.required ? "yes" : "no"} onChange={(event) => updateField(field.id, "required", event.target.value === "yes")} className={inputClassName}><option value="yes">نعم</option><option value="no">لا</option></select></SmallField>
              <SmallField label="ظهور الحقل"><select value={field.active === false ? "hidden" : "visible"} onChange={(event) => updateField(field.id, "active", event.target.value === "visible")} className={inputClassName}><option value="visible">مفعّل ويظهر للعميل</option><option value="hidden">غير مفعّل ومخفي</option></select></SmallField>
            </div>
            {field.type === "select" && (
              <SmallField label="خيارات الاختيار" className="mt-2.5">
                <textarea value={field.optionsText || (Array.isArray(field.options) ? field.options.join("\n") : "")} onChange={(event) => updateField(field.id, "optionsText", event.target.value)} className={`${inputClassName} min-h-[78px] resize-none py-3 leading-5`} placeholder="اكتب كل خيار في سطر منفصل" />
              </SmallField>
            )}
            {field.type === "number" && (
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <SmallField label="أقل قيمة"><input type="number" value={field.min ?? ""} onChange={(event) => updateField(field.id, "min", event.target.value)} className={inputClassName} /></SmallField>
                <SmallField label="أكبر قيمة"><input type="number" value={field.max ?? ""} onChange={(event) => updateField(field.id, "max", event.target.value)} className={inputClassName} /></SmallField>
              </div>
            )}
          </article>
        )) : <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center dark:border-white/10"><Braces className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" /><p className="mt-2 text-[10px] font-bold text-slate-400">لا توجد حقول إضافية لهذا المنتج</p></div>}
      </div>
    </Section>
  );
}

function buildField(preset = {}) {
  return {
    id: `fld-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    active: true,
    key: preset.key || "",
    label: preset.label || "",
    max: "",
    min: "",
    optionsText: "",
    placeholder: "",
    required: preset.required ?? false,
    type: preset.type || "text",
  };
}

function normalizeFieldKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "");
}

function SmallField({ label, className = "", children }) {
  return <label className={`min-w-0 ${className}`}><span className="mb-2 block text-[10px] font-black text-slate-300">{label}</span>{children}</label>;
}
