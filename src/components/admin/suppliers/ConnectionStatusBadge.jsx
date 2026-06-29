import { CircleCheck, CircleX, LoaderCircle, Wifi } from "lucide-react";

const statusMap = {
  active: [CircleCheck, "Active", "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  connected: [CircleCheck, "Connected", "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  failed: [CircleX, "Failed", "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"],
  inactive: [CircleX, "Inactive", "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"],
  testing: [LoaderCircle, "Testing", "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300"],
  unknown: [Wifi, "Not tested", "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300"],
};

export default function ConnectionStatusBadge({ status = "unknown" }) {
  const [Icon, label, className] = statusMap[status] || statusMap.unknown;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black ${className}`}>
      <Icon className={`h-3 w-3 ${status === "testing" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}
