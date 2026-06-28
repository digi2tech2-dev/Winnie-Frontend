import { ImagePlus } from "lucide-react";

export default function BasicProductInfo({ value, onChange, mainCategories, subCategories }) {
  const availableSubs = subCategories.filter((item) => item.parentId === value.mainCategoryId);

  const readImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <Section title="المعلومات الأساسية" description="بيانات المنتج التي تظهر للعميل في المتجر">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم المنتج بالعربي">
          <input value={value.nameAr} onChange={(event) => onChange("nameAr", event.target.value)} className={inputClassName} placeholder="مثال: ببجي موبايل — 660 شدة" />
        </Field>
        <Field label="اسم المنتج بالإنجليزي">
          <input dir="ltr" value={value.nameEn} onChange={(event) => onChange("nameEn", event.target.value)} className={`${inputClassName} text-left`} placeholder="Product name in English" />
        </Field>
      </div>

      <Field label="وصف المنتج" className="mt-3">
        <textarea value={value.description} onChange={(event) => onChange("description", event.target.value)} className={`${inputClassName} min-h-[96px] resize-none py-3 leading-6`} placeholder="اكتب وصفًا مختصرًا وواضحًا للعميل" />
      </Field>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="القسم الرئيسي">
          <select value={value.mainCategoryId} onChange={(event) => { onChange("mainCategoryId", event.target.value); onChange("subCategoryId", ""); }} className={inputClassName}>
            <option value="">اختر القسم</option>
            {mainCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="القسم الفرعي">
          <select value={value.subCategoryId} onChange={(event) => onChange("subCategoryId", event.target.value)} className={inputClassName} disabled={!value.mainCategoryId}>
            <option value="">بدون قسم فرعي</option>
            {availableSubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="ترتيب العرض" className="mt-3">
        <input type="number" min="1" value={value.displayOrder} onChange={(event) => onChange("displayOrder", event.target.value)} className={inputClassName} />
      </Field>

      <div className="mt-3">
        <span className="mb-1.5 block text-[10px] font-black text-slate-600 dark:text-slate-300">صورة المنتج</span>
        <div className="grid grid-cols-[104px_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50/65 p-2.5 dark:border-white/10 dark:bg-[#0B1220]">
          <span className="grid h-[96px] place-items-center overflow-hidden rounded-2xl border border-dashed border-violet-200 bg-white dark:border-violet-400/20 dark:bg-[#111827]">
            {value.image ? <img src={value.image} alt="معاينة المنتج" className="h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-violet-400" />}
          </span>
          <label className="flex cursor-pointer flex-col justify-center rounded-xl px-2 transition hover:bg-white dark:hover:bg-white/[0.04]">
            <span className="text-xs font-black text-slate-800 dark:text-white">اختيار صورة</span>
            <span className="mt-1 text-[9px] font-bold leading-5 text-slate-400">ستظهر المعاينة فور الاختيار وتُحفظ مع المنتج عند الضغط على حفظ.</span>
            <span className="mt-2 inline-flex h-8 w-fit items-center rounded-xl bg-violet-500/10 px-3 text-[9px] font-black text-violet-700 dark:text-violet-300">استعراض الملفات</span>
            <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0])} className="sr-only" />
          </label>
        </div>
      </div>
    </Section>
  );
}

export function Section({ title, description, children }) {
  return <section className="rounded-[22px] border border-slate-200/80 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.035)] sm:p-4 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-none"><h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>{description && <p className="mt-1 text-[9px] font-bold leading-5 text-slate-400">{description}</p>}<div className="mt-4">{children}</div></section>;
}

export function Field({ label, className = "", children }) {
  return <label className={`block min-w-0 ${className}`}><span className="mb-1.5 block text-[10px] font-black text-slate-600 dark:text-slate-300">{label}</span>{children}</label>;
}

export const inputClassName = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/75 px-3 text-xs font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0B1220] dark:text-white dark:focus:bg-[#0D1324]";
