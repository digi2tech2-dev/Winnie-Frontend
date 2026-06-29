import { Braces, Plus, Trash2 } from "lucide-react";
import { inputClassName, Section } from "./BasicProductInfo";

export default function ExtraFieldsBuilder({ fields, onChange }) {
  const addField = () => onChange([...fields, { id: `fld-${Date.now()}`, label: "", key: "", required: false, placeholder: "", type: "text", active: true, optionsText: "", min: "", max: "" }]);
  const updateField = (id, key, value) => onChange(fields.map((field) => field.id === id ? { ...field, [key]: value } : field));
  const removeField = (id) => onChange(fields.filter((field) => field.id !== id));

  return (
    <Section title="الحقول الإضافية" description="أنشئ البيانات التي سيطلبها المنتج من العميل قبل الشراء">
      <button type="button" onClick={addField} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/60 text-[10px] font-black text-violet-700 transition hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/[0.07] dark:text-violet-300"><Plus className="h-4 w-4" />إضافة حقل</button>

      <div className="mt-3 space-y-3">
        {fields.length ? fields.map((field, index) => (
          <article key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3 dark:border-white/10 dark:bg-[#0B1220]">
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
            <div className="grid grid-cols-2 gap-2.5">
              <SmallField label="عنوان الحقل"><input value={field.label} onChange={(event) => updateField(field.id, "label", event.target.value)} className={inputClassName} placeholder="مثال: معرف اللاعب" /></SmallField>
              <SmallField label="الاسم البرمجي"><input dir="ltr" value={field.key} onChange={(event) => updateField(field.id, "key", event.target.value)} className={`${inputClassName} text-left`} placeholder="يُولد تلقائيًا" /></SmallField>
              <SmallField label="Placeholder"><input value={field.placeholder} onChange={(event) => updateField(field.id, "placeholder", event.target.value)} className={inputClassName} placeholder="النص داخل الحقل" /></SmallField>
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

function SmallField({ label, className = "", children }) {
  return <label className={`min-w-0 ${className}`}><span className="mb-1 block text-[8px] font-black text-slate-500 dark:text-slate-300">{label}</span>{children}</label>;
}
