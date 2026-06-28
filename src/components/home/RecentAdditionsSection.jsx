import { motion } from "framer-motion";
import { recentAdditions } from "../../data/homeContent";

export default function RecentAdditionsSection({ onSelect }) {
  return (
    <section id="recent-additions" className="recent-additions-section">
      <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
        <h2 className="relative pr-3 text-lg font-black tracking-normal text-slate-950 dark:text-white sm:text-xl">
          <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          المضافة حديثاً
        </h2>
      </div>

      <div className="-mx-1 grid grid-cols-4 gap-x-0 gap-y-5 sm:mx-0 sm:gap-x-4 sm:gap-y-7">
        {recentAdditions.map((item, index) => (
          <RecentAdditionItem
            key={item.id}
            item={item}
            index={index}
            onSelect={() => onSelect?.(item)}
          />
        ))}
      </div>
    </section>
  );
}

function RecentAdditionItem({ item, index, onSelect }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.28, delay: index * 0.035 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className="group flex min-w-0 flex-col items-center text-center outline-none"
    >
      <span className="relative grid h-[112px] w-full max-w-[92px] place-items-center sm:h-[148px] sm:max-w-[134px]">
        <span className={`absolute bottom-0 h-[90px] w-[86px] rounded-t-[18px] bg-gradient-to-b ${item.tone} shadow-[0_18px_32px_rgba(14,165,233,0.20)] transition group-hover:shadow-[0_22px_42px_rgba(124,58,237,0.22)] sm:h-[118px] sm:w-[112px] sm:rounded-t-[24px]`} />
        <span className="absolute bottom-4 h-[68px] w-[86px] rounded-t-[20px] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.24)_0_2px,transparent_3px)] bg-[length:12px_12px] opacity-35 sm:h-[94px] sm:w-[112px] sm:rounded-t-[25px] sm:bg-[length:15px_15px]" />
        <span className={`relative mb-6 grid h-[60px] w-[60px] place-items-center rounded-[19px] border border-white/65 bg-gradient-to-br ${item.appTone} text-white shadow-[0_14px_26px_rgba(15,23,42,0.24)] transition group-hover:-translate-y-1 group-hover:scale-105 sm:mb-7 sm:h-[82px] sm:w-[82px] sm:rounded-[24px]`}>
          <span className="absolute inset-1 rounded-[15px] bg-white/10 sm:rounded-[20px]" />
          <Icon className="relative h-8 w-8 drop-shadow-[0_6px_12px_rgba(15,23,42,0.24)] sm:h-11 sm:w-11" />
        </span>
        <span dir="ltr" className="absolute bottom-2 max-w-[78px] text-center text-[9.5px] font-black leading-[11px] text-white drop-shadow-[0_2px_6px_rgba(15,23,42,0.35)] sm:max-w-[104px] sm:text-[12px] sm:leading-[14px]">
          {item.brand}
        </span>
      </span>

      <span className="mt-1.5 block min-h-[48px] max-w-[104px] text-[13px] font-black leading-5 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] sm:min-h-[58px] sm:max-w-[160px] sm:text-lg sm:leading-6">
        {item.name}
      </span>
    </motion.button>
  );
}
