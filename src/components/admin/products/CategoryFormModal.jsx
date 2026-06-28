import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Save, X } from "lucide-react";

const emptyMain = { name: "", image: "", displayOrder: 1, visible: true };
const emptySub = { name: "", image: "", parentId: "", displayOrder: 1 };

export default function CategoryFormModal({ open, type, category, mainCategories, onClose, onSave }) {
  if (!open) return null;
  return createPortal(
    <CategoryFormContent key={`${type}-${category?.id || "new"}`} type={type} category={category} mainCategories={mainCategories} onClose={onClose} onSave={onSave} />,
    document.body,
  );
}

function CategoryFormContent({ type, category, mainCategories, onClose, onSave }) {
  const isMain = type === "main";
  const [form, setForm] = useState({ ...(isMain ? emptyMain : emptySub), ...category });
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const readImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("اكتب اسم القسم أولًا.");
      return;
    }
    if (!isMain && !form.parentId) {
      setError("اختر القسم الرئيسي التابع له.");
      return;
    }
    onSave({ ...form, name: form.name.trim(), displayOrder: Math.max(1, Number(form.displayOrder) || 1), image: form.image || "/logo.png" });
  };

  const title = category ? `تعديل ${isMain ? "القسم" : "القسم الفرعي"}` : `إضافة ${isMain ? "قسم" : "قسم فرعي"}`;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="category-form-title" className="w-full max-w-[520px] overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.30)] sm:rounded-[28px] dark:border-white/10 dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-white/[0.08]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300"><ImagePlus className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="category-form-title" className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">سيظهر التغيير فور الحفظ</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:bg-white/[0.06] dark:text-slate-300"><X className="h-4.5 w-4.5" /></button>
        </header>

        <form onSubmit={submit} className="max-h-[78dvh] overflow-y-auto p-4">
          <label className="block">
            <span className={labelClassName}>اسم {isMain ? "القسم" : "القسم الفرعي"}</span>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClassName} placeholder={isMain ? "مثال: الألعاب" : "مثال: PUBG Mobile"} autoFocus />
          </label>

          <div className="mt-3 grid grid-cols-[88px_1fr] gap-3">
            <span className="grid h-[88px] place-items-center overflow-hidden rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 dark:border-violet-400/20 dark:bg-violet-500/[0.06]">
              {form.image ? <img src={form.image} alt="معاينة الصورة" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-violet-400" />}
            </span>
            <label className="flex cursor-pointer flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 transition hover:border-violet-300 dark:border-white/10 dark:bg-[#0B1220]">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">صورة القسم</span>
              <span className="mt-1 text-[9px] font-bold text-slate-400">PNG أو JPG — تظهر المعاينة فورًا</span>
              <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0])} className="sr-only" />
            </label>
          </div>

          {!isMain && (
            <label className="mt-3 block">
              <span className={labelClassName}>القسم الرئيسي</span>
              <select value={form.parentId} onChange={(event) => update("parentId", event.target.value)} className={inputClassName}>
                <option value="">اختر القسم الرئيسي</option>
                {mainCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}

          <label className="mt-3 block">
            <span className={labelClassName}>ترتيب العرض</span>
            <input type="number" min="1" value={form.displayOrder} onChange={(event) => update("displayOrder", event.target.value)} className={inputClassName} />
          </label>

          {isMain && (
            <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#0B1220]">
              <span>
                <span className="block text-xs font-black text-slate-800 dark:text-white">إظهار في الصفحة الرئيسية</span>
                <span className="mt-0.5 block text-[9px] font-bold text-slate-400">يمكن إبقاء القسم مخفيًا حتى يكتمل</span>
              </span>
              <select value={form.visible ? "yes" : "no"} onChange={(event) => update("visible", event.target.value === "yes")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black dark:border-white/10 dark:bg-[#111827] dark:text-white">
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </label>
          )}

          {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]">إلغاء</button>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)]"><Save className="h-4 w-4" />حفظ</button>
          </div>
        </form>
      </section>
    </div>
  );
}

const labelClassName = "mb-1.5 block text-[10px] font-black text-slate-600 dark:text-slate-300";
const inputClassName = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/75 px-3 text-xs font-black text-slate-950 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white";
