import { motion } from "framer-motion";
import { quickCategories } from "../../data/homeContent";

export default function QuickCategories({ onSelect }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_18px_60px_rgba(5,8,22,0.35)] backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:p-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {quickCategories.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.title}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.06 + index * 0.04 }}
              whileHover={{ y: -6, scale: 1.025 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect?.(item.title)}
              className="group flex min-h-[108px] flex-col items-center justify-center gap-3 rounded-[24px] border border-transparent px-2 text-center transition hover:border-white/14 hover:bg-white/[0.045] dark:hover:border-[#A855F7]/45 dark:hover:bg-[#1A2335]"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${item.tone} ${item.glow} transition group-hover:scale-105 sm:h-16 sm:w-16`}>
                <Icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
              </span>
              <span className="text-[11px] font-bold leading-tight text-white sm:text-base">{item.title}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
