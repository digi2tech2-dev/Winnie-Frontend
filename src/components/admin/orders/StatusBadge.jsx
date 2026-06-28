import { CheckCircle2, Clock3, LoaderCircle, ShieldAlert, XCircle } from "lucide-react";
import { orderStatusMeta } from "../../../data/adminOrders";

const statusStyles = {
  completed: {
    icon: CheckCircle2,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  incomplete: {
    icon: XCircle,
    className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  processing: {
    icon: LoaderCircle,
    className: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
    dotClassName: "bg-orange-500",
  },
  pending: {
    icon: Clock3,
    className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  rejected: {
    icon: XCircle,
    className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  manual_review: {
    icon: ShieldAlert,
    className: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
    dotClassName: "bg-sky-500",
  },
};

export default function StatusBadge({ status, compact = false, showIcon = true }) {
  const style = statusStyles[status] || statusStyles.pending;
  const Icon = style.icon;
  const label = orderStatusMeta[status]?.label || status;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border font-black ${style.className} ${
        compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"
      }`}
    >
      {showIcon ? <Icon className={`shrink-0 ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} /> : <i className={`h-1.5 w-1.5 rounded-full ${style.dotClassName}`} />}
      <span className="truncate">{label}</span>
    </span>
  );
}
