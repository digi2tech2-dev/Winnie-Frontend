import { motion } from "framer-motion";
import { iconMap } from "./icons";

export default function MetricCard({ item, index = 0 }) {
  const Icon = iconMap[item.icon] || iconMap.Activity;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-[18px] bg-gradient-to-br from-[#FBCFE8] via-[#E0F2FE] to-[#DDD6FE] p-px shadow-[0_14px_34px_rgba(14,165,233,0.10)] dark:from-[#8B5CF6]/75 dark:via-[#A855F7]/45 dark:to-[#0D1324] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)]"
    >
      <div className="relative overflow-hidden rounded-[17px] bg-[#EFFBFF] p-3.5 dark:bg-[#111827] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-100 bg-white text-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.10)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0D1324] dark:text-[#A855F7] dark:shadow-[0_0_18px_rgba(139,92,246,0.18)]">
            <Icon className="h-5 w-5" />
          </span>
          {item.trend && (
            <span className="rounded-full bg-[#F5F3FF] px-2.5 py-1 text-xs font-black text-[#8B5CF6] dark:bg-[#8B5CF6]/16 dark:text-[#E9D5FF]">
              {item.trend}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-[#8A94A7]">{item.label}</p>
        <p className="mt-0.5 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
        <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-[#F9A8D4] via-[#C4B5FD] to-[#7DD3FC] dark:from-[#7C3AED] dark:to-[#A855F7] dark:shadow-[0_0_14px_rgba(139,92,246,0.32)]" />
      </div>
    </motion.article>
  );
}
