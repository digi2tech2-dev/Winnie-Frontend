import { ArrowLeft, CircleUserRound, Clock3, Hash, Package, UserRound } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order, onDetails }) {
  return (
    <article className="admin-order-card group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.065)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_20px_44px_rgba(124,58,237,0.11)] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.10)] dark:hover:border-[#A855F7]/35 dark:hover:bg-[#151E2D] sm:p-5">
      <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-violet-500 via-sky-500 to-emerald-400" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 pr-1">
        <div className="min-w-0">
          <p dir="ltr" className="inline-flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-300"><Hash className="h-3 w-3" />{order.displayId}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400"><Clock3 className="h-3.5 w-3.5" />{order.createdAtLabel}</p>
        </div>
        <StatusBadge status={order.status} compact />
      </div>

      <div className="admin-order-product mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-white/[0.07] dark:bg-[#0B1220]/80">
        <img src={order.productImage} alt="" className="h-14 w-14 shrink-0 rounded-[14px] object-cover shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-black leading-5 text-slate-800 sm:text-sm dark:text-slate-100">{order.product}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400">
            <Package className="h-3 w-3" />
              {order.executionType === "automatic" ? "تنفيذ تلقائي" : "تنفيذ يدوي"} · {order.quantity.toLocaleString("ar-EG-u-nu-latn")}×
            </p>
            <p dir="ltr" className="shrink-0 text-right text-lg font-black text-[#7C3AED] dark:text-[#C084FC]">{order.priceLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.025]">
          <p className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-[#7C8598]"><UserRound className="h-3 w-3" />العميل</p>
          <p title={order.username} className="mt-1 truncate text-[11px] font-black text-slate-700 dark:text-slate-200">{order.username || "-"}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.025]">
          <p className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-[#7C8598]"><CircleUserRound className="h-3 w-3" />القيمة المُدخلة</p>
          <p dir="ltr" title={order.playerId} className="mt-1 truncate text-right text-[11px] font-black text-slate-700 dark:text-slate-200">{order.playerId || "-"}</p>
        </div>
      </div>

      <p className="mt-2 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">المورد: <span className="text-slate-700 dark:text-slate-200">{order.supplier || "-"}</span></p>

      <button
        type="button"
        onClick={() => onDetails(order.id)}
        className="admin-order-details-button mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-xs font-black text-[#7C3AED] transition hover:border-violet-300 hover:bg-violet-100 group-hover:shadow-[0_8px_22px_rgba(124,58,237,0.10)] dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-[#C084FC] dark:hover:bg-violet-500/15"
      >
        فتح الطلب وإدارته
        <ArrowLeft className="h-4 w-4" />
      </button>
    </article>
  );
}
