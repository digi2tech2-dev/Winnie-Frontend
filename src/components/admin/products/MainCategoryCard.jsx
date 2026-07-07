import { Eye, EyeOff, Hash, Pencil, Trash2 } from "lucide-react";

export default function MainCategoryCard({ category, onEdit, onDelete }) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_38px_rgba(124,58,237,0.10)] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_18px_rgba(139,92,246,0.09)] dark:hover:border-violet-400/30">
      <div className="relative h-36 overflow-hidden sm:h-40">
        <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md ${category.visible ? "bg-emerald-500/75" : "bg-slate-700/75"}`}>
          {category.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {category.visible ? "ظاهر" : "مخفي"}
        </span>
        <h3 className="absolute bottom-4 right-4 left-4 truncate text-lg font-black text-white">{category.name}</h3>
      </div>
      <div className="flex items-center gap-2 p-3.5">
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-[#9AA7BD]">
          <Hash className="h-3.5 w-3.5 text-violet-500" />
          ترتيب العرض: {category.displayOrder.toLocaleString("ar-EG-u-nu-latn")}
        </span>
        <button type="button" onClick={() => onEdit(category)} className="grid h-9 w-9 place-items-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-300" aria-label={`تعديل ${category.name}`} title="تعديل">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onDelete(category)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/15 dark:bg-rose-400/10 dark:text-rose-300" aria-label={`حذف ${category.name}`} title="حذف">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
