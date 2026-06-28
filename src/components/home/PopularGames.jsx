import { motion } from "framer-motion";
import { popularGames } from "../../data/homeContent";
import SectionHeading from "./SectionHeading";

export default function PopularGames({ onViewAll }) {
  return (
    <section id="popular-games">
      <SectionHeading title="الألعاب الشائعة" onAction={onViewAll} />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {popularGames.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.article
              key={game.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              whileHover={{ y: -8 }}
              className="group min-w-[154px] overflow-hidden rounded-[24px] border border-sky-100 bg-white/[0.86] shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur-xl transition hover:border-[#C4B5FD] hover:shadow-[0_18px_45px_rgba(168,85,247,0.14)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)] dark:hover:border-[#A855F7]/55 dark:hover:bg-[#1A2335] dark:hover:shadow-[0_0_20px_rgba(139,92,246,0.20)] sm:min-w-[190px]"
            >
              <div className={`relative grid h-40 place-items-center overflow-hidden bg-gradient-to-br ${game.cover} sm:h-48`}>
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),transparent_35%,rgba(5,8,22,0.48))]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050816]/88 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl">
                  {game.tag}
                </span>
                <Icon className="relative z-10 h-16 w-16 text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.38)] transition group-hover:scale-110 sm:h-20 sm:w-20" />
              </div>
              <div className="p-4">
                <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{game.name}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-[#A78BFA]">{game.price}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
