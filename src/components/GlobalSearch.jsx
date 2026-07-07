import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { iconMap } from "./icons";

export default function GlobalSearch({
  value,
  onChange,
  results,
  onNavigate,
  placeholder,
  compact = false,
}) {
  const { t } = useTranslation("common");
  const open = value.trim().length > 0;
  const resolvedPlaceholder = placeholder || t("search.placeholder");

  return (
    <div className="relative w-full">
      <label className="relative block">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B5CF6]/55 dark:text-[#7C8598]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-sky-100 bg-white/[0.82] pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#C4B5FD] focus:ring-4 focus:ring-sky-100 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0D1324] dark:text-white dark:placeholder:text-[#8A94A7] dark:focus:border-[#8B5CF6]/70 dark:focus:ring-[#8B5CF6]/15"
          placeholder={compact ? t("search.compactPlaceholder") : resolvedPlaceholder}
        />
      </label>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-0 right-0 top-[calc(100%+10px)] z-[95] rounded-[24px] border border-sky-100 bg-white/[0.96] p-2 text-slate-900 shadow-[0_22px_60px_rgba(14,165,233,0.16)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(10,15,29,0.95)] dark:text-white dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]"
          >
            {results.length ? (
              <div className="max-h-80 overflow-y-auto">
                {results.map((item) => {
                  const Icon = iconMap[item.icon] || iconMap.Search;
                  return (
                    <button
                      key={`${item.kind}-${item.name}`}
                      type="button"
                      onClick={() => onNavigate(item.target)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-sky-50 dark:hover:bg-[#1A2335]"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${item.tone || "from-royal to-pulse"} text-white`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">{item.name}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-[#8A94A7]">
                          {item.meta}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-500 dark:text-[#8A94A7]">
                {t("search.noQuickResults")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
