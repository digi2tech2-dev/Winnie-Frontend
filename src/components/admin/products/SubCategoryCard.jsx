import { Eye, EyeOff, Layers3, Pencil, Trash2 } from "lucide-react";

export default function SubCategoryCard({ category, parentName, onEdit, onDelete }) {
  return (
    <article className="flex min-h-24 items-center gap-3.5 rounded-[20px] border border-slate-200/90 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-sky-200 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_16px_rgba(139,92,246,0.08)]">
      <img src={category.image} alt={category.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-black text-slate-950 dark:text-white">{category.name}</h4>
        <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-bold text-slate-500 dark:text-[#9AA7BD]">
          <Layers3 className="h-3 w-3 shrink-0 text-sky-500" />
          {parentName || "قسم غير محدد"}
        </p>
        <p className="mt-2 flex items-center gap-2 text-[10px] font-black text-slate-400">
          <span>ترتيب {category.displayOrder.toLocaleString("ar-EG-u-nu-latn")}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${category.isActive !== false ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
            {category.isActive !== false ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
            {category.isActive !== false ? "ظاهر" : "مخفي"}
          </span>
        </p>
      </div>
      <div className="grid gap-1.5">
        <button type="button" onClick={() => onEdit(category)} className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300" aria-label={`تعديل ${category.name}`}><Pencil className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => onDelete(category)} className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300" aria-label={`حذف ${category.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}
