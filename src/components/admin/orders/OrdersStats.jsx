import { CheckCircle2, ClipboardList, LoaderCircle, ShieldCheck } from "lucide-react";

const statConfig = [
  {
    key: "total",
    label: "إجمالي الطلبات",
    icon: ClipboardList,
    card: "border-violet-200/80 bg-gradient-to-br from-white to-violet-50/80 dark:border-violet-400/15 dark:from-[#111827] dark:to-violet-950/20",
    iconClass: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
    accent: "bg-violet-500",
  },
  {
    key: "processing",
    label: "قيد التنفيذ",
    icon: LoaderCircle,
    card: "border-orange-200/80 bg-gradient-to-br from-white to-orange-50/80 dark:border-orange-400/15 dark:from-[#111827] dark:to-orange-950/20",
    iconClass: "bg-orange-500/12 text-orange-600 dark:text-orange-300",
    accent: "bg-orange-500",
  },
  {
    key: "manual",
    label: "مراجعة يدوية",
    icon: ShieldCheck,
    card: "border-sky-200/80 bg-gradient-to-br from-white to-sky-50/80 dark:border-sky-400/15 dark:from-[#111827] dark:to-sky-950/20",
    iconClass: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    accent: "bg-sky-500",
  },
  {
    key: "completed",
    label: "مكتملة",
    icon: CheckCircle2,
    card: "border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/80 dark:border-emerald-400/15 dark:from-[#111827] dark:to-emerald-950/20",
    iconClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    accent: "bg-emerald-500",
  },
];

export default function OrdersStats({ orders }) {
  const values = {
    total: orders.length,
    processing: orders.filter((order) => order.status === "processing").length,
    manual: orders.filter((order) => order.status === "manual_review").length,
    completed: orders.filter((order) => order.status === "completed").length,
  };

  return (
    <section aria-label="إحصائيات الطلبات" className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {statConfig.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.key}
            className={`relative min-h-[112px] overflow-hidden rounded-[20px] border p-3 shadow-[0_12px_30px_rgba(15,23,42,0.055)] sm:min-h-[128px] sm:rounded-[24px] sm:p-4 dark:shadow-[0_0_20px_rgba(139,92,246,0.10)] ${item.card}`}
          >
            <span className={`absolute inset-y-3 right-0 w-1 rounded-l-full ${item.accent}`} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] sm:h-11 sm:w-11 sm:rounded-2xl ${item.iconClass}`}>
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </span>
              <span className="h-2 w-2 rounded-full bg-current opacity-20" />
            </div>
            <strong dir="ltr" className="mt-2 block text-right text-2xl font-black leading-none text-slate-950 sm:mt-3 sm:text-3xl dark:text-white">
              {values[item.key].toLocaleString("ar-EG")}
            </strong>
            <p className="mt-1.5 text-[11px] font-black text-slate-500 sm:text-xs dark:text-[#9AA7BD]">{item.label}</p>
          </article>
        );
      })}
    </section>
  );
}
