import { Bot, Hash, Layers3, Pause, Pencil, Play, Trash2, UserRound } from "lucide-react";
import StatusBadge from "./StatusBadge";

const currency = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function ProductCard({ product, mainCategory, subCategory, provider, onEdit, onDelete, onTogglePause, actionBusy = false }) {
  const displayStatus = product.paused ? "paused" : product.status;
  const unavailable = product.status === "unavailable";

  return (
    <article className={`group relative overflow-hidden rounded-[24px] border bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.09)] ${unavailable ? "border-rose-200/90 dark:border-rose-400/20" : "border-slate-200/90 hover:border-violet-200 dark:border-white/[0.08] dark:hover:border-violet-400/30"}`}>
      <div className="relative h-36 overflow-hidden">
        <img src={product.image || "/logo.png"} alt={product.nameAr} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${unavailable ? "grayscale-[35%] opacity-65" : ""}`} />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/5 to-transparent" />
        <span className="absolute left-2.5 top-2.5"><StatusBadge status={displayStatus} compact /></span>
        {unavailable && <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-rose-600/90 px-3 py-2 text-center text-xs font-black text-white shadow-lg backdrop-blur-sm">غير متوفر</span>}
        <div className="absolute bottom-3 right-3 left-3">
          <h3 className="line-clamp-1 text-sm font-black text-white">{product.nameAr}</h3>
          <p className="mt-0.5 truncate text-[9px] font-bold text-white/70">{product.nameEn}</p>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-400">المزود</p>
            <p className="mt-0.5 truncate text-[11px] font-black text-slate-700 dark:text-slate-200">{provider?.name || "بدون مزود"}</p>
          </div>
          <p dir="ltr" className={`shrink-0 text-right text-lg font-black text-violet-700 dark:text-violet-300 ${unavailable ? "line-through decoration-rose-500 decoration-2 opacity-60" : ""}`}>{currency.format(product.finalPrice)}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Meta icon={Layers3} label="القسم الرئيسي" value={mainCategory?.name || "—"} />
          <Meta icon={Layers3} label="القسم الفرعي" value={subCategory?.name || "بدون"} />
          <Meta icon={Hash} label="ترتيب العرض" value={product.displayOrder.toLocaleString("ar-EG")} />
          <Meta icon={product.linkType === "automatic" ? Bot : UserRound} label="نوع الربط" value={product.linkType === "automatic" ? "آلي" : "يدوي"} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button type="button" onClick={() => onEdit(product)} disabled={actionBusy} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-sky-500/10 text-[9px] font-black text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-300"><Pencil className="h-3.5 w-3.5" />تعديل</button>
          <button type="button" onClick={() => onDelete(product)} disabled={actionBusy} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-rose-500/10 text-[9px] font-black text-rose-700 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"><Trash2 className="h-3.5 w-3.5" />حذف</button>
          <button type="button" onClick={() => onTogglePause(product)} disabled={actionBusy} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-orange-500/10 px-1 text-[8px] font-black text-orange-700 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-orange-300">
            {product.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{product.paused ? "استئناف" : "إيقاف مؤقت"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Meta({ icon: Icon, label, value }) {
  return <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-2 dark:border-white/[0.06] dark:bg-[#0B1220]/70"><p className="flex items-center gap-1 text-[8px] font-black text-slate-400"><Icon className="h-3 w-3" />{label}</p><p className="mt-1 truncate text-[10px] font-black text-slate-700 dark:text-slate-200">{value}</p></div>;
}
