import { CheckCircle2, CircleOff, PauseCircle } from "lucide-react";
import { productStatusLabels } from "../../../data/adminProducts";

const styles = {
  available: {
    icon: CheckCircle2,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  unavailable: {
    icon: CircleOff,
    className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  },
  paused: {
    icon: PauseCircle,
    className: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
  },
};

export default function StatusBadge({ status, compact = false }) {
  const style = styles[status] || styles.unavailable;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-black ${style.className} ${compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px]"}`}>
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {productStatusLabels[status] || status}
    </span>
  );
}
