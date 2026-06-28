import { ArrowLeft, AtSign, CircleUserRound, Hash, Mail, UserRound } from "lucide-react";
import StatusBadge from "./StatusBadge";

const priceFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function OrderCard({ order, onDetails }) {
  const details = [
    { label: "رقم الطلب", value: order.id, icon: Hash, dir: "ltr" },
    { label: "معرف اللاعب", value: order.playerId, icon: CircleUserRound, dir: "ltr" },
    { label: "اسم المستخدم", value: order.username, icon: UserRound },
    { label: "إيميل المستخدم", value: order.userEmail, icon: Mail, dir: "ltr" },
    { label: "معرف المستخدم", value: order.userId, icon: AtSign, dir: "ltr" },
  ];

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.065)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_20px_44px_rgba(124,58,237,0.11)] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.10)] dark:hover:border-[#A855F7]/35 dark:hover:bg-[#151E2D] sm:p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#8B5CF6] via-[#3B82F6] to-[#22C55E] opacity-70" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 dark:text-[#7C8598]">المورد</p>
          <h2 className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base dark:text-white">{order.supplier}</h2>
        </div>
        <StatusBadge status={order.status} compact />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-white/[0.07] dark:bg-[#0B1220]/80">
        <img src={order.productImage} alt="" className="h-14 w-14 shrink-0 rounded-[14px] object-cover shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-black leading-5 text-slate-800 sm:text-sm dark:text-slate-100">{order.product}</p>
          <p dir="ltr" className="mt-1 text-right text-lg font-black text-[#7C3AED] dark:text-[#C084FC]">
            {priceFormatter.format(order.price)}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        {details.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`min-w-0 rounded-xl border border-slate-100 bg-white px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.025] ${index === 3 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <dt className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-[#7C8598]">
                <Icon className="h-3 w-3 shrink-0" />
                {item.label}
              </dt>
              <dd dir={item.dir} title={item.value} className={`mt-1 truncate text-[11px] font-black text-slate-700 dark:text-slate-200 ${item.dir === "ltr" ? "text-right" : ""}`}>
                {item.value}
              </dd>
            </div>
          );
        })}
      </dl>

      <button
        type="button"
        onClick={() => onDetails(order.id)}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-xs font-black text-[#7C3AED] transition hover:border-violet-300 hover:bg-violet-100 group-hover:shadow-[0_8px_22px_rgba(124,58,237,0.10)] dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-[#C084FC] dark:hover:bg-violet-500/15"
      >
        التفاصيل
        <ArrowLeft className="h-4 w-4" />
      </button>
    </article>
  );
}
