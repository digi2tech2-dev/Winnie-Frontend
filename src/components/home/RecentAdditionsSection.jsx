import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { iconMap } from "../icons";
import recentAdditionsBanner from "../../../photo/اسلايد4.jpg";

const maxRecentItems = 8;

function getTimestamp(item) {
  const value = item?.createdAt || item?.created_at || item?.publishedAt || item?.updatedAt;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export default function RecentAdditionsSection({ items = [], onSelect }) {
  const { t } = useTranslation("home");
  const recentItems = useMemo(
    () => {
      const activeItems = items.filter((item) => item?.isActive !== false);
      const datedItems = activeItems
        .map((item) => ({ item, timestamp: getTimestamp(item) }))
        .filter(({ timestamp }) => timestamp)
        .sort((left, right) => right.timestamp - left.timestamp)
        .map(({ item }) => item);

      return (datedItems.length ? datedItems : activeItems).slice(0, maxRecentItems);
    },
    [items],
  );

  if (!recentItems.length) return null;

  return (
    <section id="recent-additions" className="recent-additions-section">
      <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
        <h2 className="relative pr-3 text-lg font-black tracking-normal text-slate-950 dark:text-white sm:text-xl">
          <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#38BDF8,#7C3AED)]" />
          {t("showcase.recentlyAdded")}
        </h2>
      </div>

      <div className="-mx-1 grid grid-cols-4 gap-x-0 gap-y-5 sm:mx-0 sm:gap-x-4 sm:gap-y-7">
        {recentItems.map((item, index) => (
          <RecentAdditionItem
            key={item.id || item._id || item.slug || item.name}
            item={item}
            index={index}
            onSelect={() => onSelect?.(item)}
          />
        ))}
      </div>

      <div className="mx-auto mt-6 w-[92%] max-w-[820px] overflow-hidden rounded-[16px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.14)] sm:mt-8 sm:w-[86%]">
        <img
          src={recentAdditionsBanner}
          alt={t("showcase.recentlyAdded")}
          className="h-auto w-full object-cover"
          loading="lazy"
        />
      </div>
    </section>
  );
}

function RecentAdditionItem({ item, index, onSelect }) {
  const Icon = typeof item.icon === "function" ? item.icon : iconMap[item.icon] || iconMap.ShoppingBag;
  const tone = item.tone || item.cover || "from-[#7C3AED] via-[#2563EB] to-[#111827]";

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
        <span className={`absolute bottom-0 h-[90px] w-[86px] rounded-t-[18px] bg-gradient-to-b ${tone} shadow-[0_18px_32px_rgba(14,165,233,0.20)] transition group-hover:shadow-[0_22px_42px_rgba(124,58,237,0.22)] sm:h-[118px] sm:w-[112px] sm:rounded-t-[24px]`} />
        <span className="absolute bottom-4 h-[68px] w-[86px] rounded-t-[20px] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.24)_0_2px,transparent_3px)] bg-[length:12px_12px] opacity-35 sm:h-[94px] sm:w-[112px] sm:rounded-t-[25px] sm:bg-[length:15px_15px]" />
        <span className={`relative mb-6 grid h-[60px] w-[60px] place-items-center rounded-[19px] border border-white/65 bg-gradient-to-br ${tone} text-white shadow-[0_14px_26px_rgba(15,23,42,0.24)] transition group-hover:-translate-y-1 group-hover:scale-105 sm:mb-7 sm:h-[82px] sm:w-[82px] sm:rounded-[24px]`}>
          <span className="absolute inset-1 rounded-[15px] bg-white/10 sm:rounded-[20px]" />
          {item.image ? (
            <img src={item.image} alt="" className="relative h-10 w-10 rounded-2xl object-cover sm:h-14 sm:w-14" loading="lazy" />
          ) : (
            <Icon className="relative h-8 w-8 drop-shadow-[0_6px_12px_rgba(15,23,42,0.24)] sm:h-11 sm:w-11" />
          )}
        </span>
      </span>

      <span className="mt-1.5 block min-h-[48px] max-w-[104px] text-[13px] font-black leading-5 text-slate-950 transition group-hover:text-[#7C3AED] dark:text-white dark:group-hover:text-[#C084FC] sm:min-h-[58px] sm:max-w-[160px] sm:text-lg sm:leading-6">
        {item.name || item.title}
      </span>
    </motion.button>
  );
}
