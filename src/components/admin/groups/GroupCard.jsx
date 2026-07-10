import { Pencil, Trash2, UserRound } from "lucide-react";

export default function GroupCard({ group, labels, locale, memberCount, onEdit, onDelete }) {
  const isActive = group.isActive !== false;
  const percentage = Number(group.percentage ?? group.markup ?? 0);

  return (
    <article className="relative overflow-hidden rounded-[23px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.09)]">
      <span className="absolute inset-y-4 right-0 w-1 rounded-l-full bg-gradient-to-b from-violet-500 to-blue-500" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400">{labels.groupLabel}</p>
          <h2 className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{group.name}</h2>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-slate-400/20 bg-slate-400/10 text-slate-600 dark:text-slate-300"}`}>
          {isActive ? labels.active : labels.inactive}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-violet-50 p-3 dark:bg-violet-500/[0.08]">
          <p className="text-[8px] font-black text-violet-500">{labels.markupPercentage}</p>
          <strong dir="ltr" className="mt-1 block text-right text-xl font-black text-violet-700 dark:text-violet-300">
            {percentage.toLocaleString("en-US", { maximumFractionDigits: 4 })}%
          </strong>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-500/[0.08]">
          <p className="text-[8px] font-black text-sky-500">{labels.currentMembers}</p>
          <strong className="mt-1 flex items-center gap-1 text-xl font-black text-sky-700 dark:text-sky-300">
            <UserRound className="h-4 w-4" />
            {Number(memberCount || 0).toLocaleString(locale)}
          </strong>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onEdit(group)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 text-[9px] font-black text-sky-700 dark:text-sky-300">
          <Pencil className="h-3.5 w-3.5" />
          {labels.edit}
        </button>
        <button type="button" onClick={() => onDelete(group)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 text-[9px] font-black text-rose-700 dark:text-rose-300">
          <Trash2 className="h-3.5 w-3.5" />
          {labels.delete}
        </button>
      </div>
    </article>
  );
}
