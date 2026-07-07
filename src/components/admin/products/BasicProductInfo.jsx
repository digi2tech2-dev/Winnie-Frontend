import { ImagePlus } from "lucide-react";

export default function BasicProductInfo({ value, onChange, mainCategories, subCategories }) {
  const availableSubs = subCategories.filter((item) => item.parentId === value.mainCategoryId);

  const readImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange("image", String(reader.result));
    onChange("imageFile", file);
    reader.readAsDataURL(file);
  };

  return (
    <Section title="المعلومات الأساسية" description="بيانات المنتج التي تظهر للعميل في المتجر">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المنتج بالعربي">
          <input value={value.nameAr} onChange={(event) => onChange("nameAr", event.target.value)} className={inputClassName} placeholder="مثال: ببجي موبايل — 660 شدة" />
        </Field>
        <Field label="اسم المنتج بالإنجليزي">
          <input dir="ltr" value={value.nameEn} onChange={(event) => onChange("nameEn", event.target.value)} className={`${inputClassName} text-left`} placeholder="اسم المنتج بالإنجليزية" />
        </Field>
      </div>

      <Field label="وصف المنتج" className="mt-4">
        <textarea value={value.description} onChange={(event) => onChange("description", event.target.value)} className={`${inputClassName} min-h-[110px] resize-none py-3 leading-6`} placeholder="اكتب وصفًا مختصرًا وواضحًا للعميل" />
      </Field>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

      <Field label="ترتيب العرض" className="mt-4">
        <input type="number" min="1" value={value.displayOrder} onChange={(event) => onChange("displayOrder", event.target.value)} className={inputClassName} />
      </Field>

      <div className="mt-4">
        <span className="mb-2 block text-[11px] font-black text-slate-300">صورة المنتج</span>
        <div className="grid grid-cols-[92px_1fr] gap-3 rounded-2xl border border-[#203664] bg-[#071126] p-3 sm:grid-cols-[120px_1fr]">
          <span className="grid h-[92px] place-items-center overflow-hidden rounded-xl border border-dashed border-violet-400/30 bg-[#0b1630] sm:h-[112px]">
            {value.image ? <img src={value.image} alt="معاينة المنتج" className="h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-violet-400" />}
          </span>
          <label className="flex cursor-pointer flex-col justify-center rounded-xl px-2 transition hover:bg-white dark:hover:bg-white/[0.04]">
            <span className="text-xs font-black text-white">اختيار صورة</span>
            <span className="mt-1 text-[9px] font-bold leading-5 text-slate-400">ستظهر المعاينة فور الاختيار وتُحفظ مع المنتج.</span>
            <span className="mt-2 inline-flex h-8 w-fit items-center rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 text-[9px] font-black text-violet-300">استعراض الملفات</span>
            <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0])} className="sr-only" />
          </label>
        </div>
      </div>
    </Section>
  );
}

export function Section({ title, description, children }) {
  return <section className="relative overflow-hidden rounded-[22px] border border-[#1d3262] bg-[linear-gradient(145deg,#0b1630,#081126)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:p-5"><span className="absolute inset-y-5 right-0 w-1 rounded-l-full bg-gradient-to-b from-violet-500 via-blue-500 to-cyan-400" /><div className="border-b border-white/[0.07] pb-4 ps-2"><h3 className="text-base font-black text-white sm:text-lg">{title}</h3>{description && <p className="mt-1.5 text-[10px] font-bold leading-5 text-slate-400 sm:text-[11px]">{description}</p>}</div><div className="mt-5">{children}</div></section>;
}

export function Field({ label, className = "", children }) {
  return <label className={`block min-w-0 ${className}`}><span className="mb-2 block text-[11px] font-black text-slate-300">{label}</span>{children}</label>;
}

export const inputClassName = "h-11 w-full rounded-xl border border-[#243a69] bg-[#050d20] px-3 text-[11px] font-bold text-white outline-none transition placeholder:text-slate-600 hover:border-[#31508e] focus:border-violet-400 focus:bg-[#071127] focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:px-3.5 sm:text-xs";
